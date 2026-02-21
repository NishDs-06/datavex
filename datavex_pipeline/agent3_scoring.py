"""
Agent 3 — OpportunityScoringAgent
Reasons about opportunity fit and timing using 4 reasoning layers.
"""
import logging
from models import CandidateCompany, CompanySignals, OpportunityScore
from config import STATE_CAPABILITY_MAP, DATAVEX_CAPABILITIES, llm_call_with_retry

logger = logging.getLogger("datavex_pipeline.agent3")


def compute_capability_alignment(company_state: str, signals: CompanySignals) -> float:
    """Map company_state + signals to DataVex capabilities and score alignment."""
    relevant_caps = STATE_CAPABILITY_MAP.get(company_state, ["ai_analytics"])
    if not relevant_caps:
        return 0.0

    # Gather all evidence text
    all_text = ""
    for sig in [signals.pivot, signals.tech_debt, signals.fiscal_pressure]:
        if sig:
            all_text += " ".join(e.text for e in sig.evidence) + " "
    all_text = all_text.lower()

    matched = 0
    for cap_name in relevant_caps:
        keywords = DATAVEX_CAPABILITIES.get(cap_name, [])
        for kw in keywords:
            if kw.lower() in all_text:
                matched += 1
                break

    return min(1.0, matched / max(len(relevant_caps), 1))


def compute_urgency(signals: CompanySignals) -> float:
    """
    urgency = 0.5 * recency_score + 0.3 * trigger_density + 0.2 * fiscal_confidence
    """
    # Recency score: average recency of why_now_triggers, normalized (lower days = higher urgency)
    triggers = signals.why_now_triggers
    if triggers:
        recency_days = [t.get("recency_days", 180) for t in triggers]
        avg_recency = sum(recency_days) / len(recency_days)
        recency_score = max(0.0, 1.0 - (avg_recency / 180.0))  # 0 days = 1.0, 180+ days = 0.0
    else:
        recency_score = 0.0

    # Trigger density: capped at 3
    trigger_density = min(1.0, len(triggers) / 3.0)

    # Fiscal pressure confidence
    fiscal_conf = signals.fiscal_pressure.confidence if signals.fiscal_pressure else 0.0

    urgency = 0.5 * recency_score + 0.3 * trigger_density + 0.2 * fiscal_conf
    return round(urgency, 3)


def compute_final_score(
    capability_alignment: float,
    urgency_score: float,
    candidate: CandidateCompany,
) -> float:
    """
    opportunity_score = 0.35*cap + 0.25*urgency + 0.15*size + 0.15*geo + 0.10*industry
    """
    return round(
        0.35 * capability_alignment
        + 0.25 * urgency_score
        + 0.15 * candidate.size_fit
        + 0.15 * candidate.geo_fit
        + 0.10 * candidate.industry_fit,
        3,
    )


def determine_priority(score: float) -> str:
    if score > 0.75:
        return "HIGH"
    if score > 0.50:
        return "MEDIUM"
    return "LOW"


def determine_timing(priority: str, company_state: str) -> str:
    if priority == "HIGH":
        return "next 1-3 months"
    if priority == "MEDIUM":
        return "next 3-6 months"
    return "6+ months — plant seeds"


def compute_confidence(signals: CompanySignals, company_state: str) -> float:
    """Confidence based on evidence count. Cap at 0.85 unless 4+ evidence items."""
    total_evidence = 0
    for sig in [signals.pivot, signals.tech_debt, signals.fiscal_pressure]:
        if sig:
            total_evidence += len(sig.evidence)

    base_conf = min(1.0, 0.3 + 0.1 * total_evidence)

    # RESTRUCTURING → lower confidence (transitions = uncertain)
    if company_state == "RESTRUCTURING":
        base_conf *= 0.85

    # Cap at 0.85 unless 4+ evidence
    if total_evidence < 4:
        base_conf = min(base_conf, 0.85)

    return round(base_conf, 3)


def generate_strategic_summary(
    candidate: CandidateCompany,
    signals: CompanySignals,
    score: float,
    priority: str,
) -> dict:
    """Use LLM to generate strategic_summary, why_we_win, and risks."""
    evidence_summary = ""
    for sig_name, sig in [("pivot", signals.pivot), ("tech_debt", signals.tech_debt), ("fiscal_pressure", signals.fiscal_pressure)]:
        if sig:
            evidence_summary += f"\n{sig_name}: {sig.label} (confidence={sig.confidence})"
            for e in sig.evidence[:2]:
                evidence_summary += f"\n  - [{e.source}] {e.text[:150]}"

    trigger_summary = ", ".join(t.get("event", "") for t in signals.why_now_triggers[:3])

    result = llm_call_with_retry(
        prompt=f"""Company: {candidate.company_name} ({candidate.industry}, {candidate.estimated_employees} employees, {candidate.region})
State: {signals.company_state}
Score: {score:.2f} ({priority})
Signals:{evidence_summary}
Why-now triggers: {trigger_summary}

DataVex offers: AI analytics, cloud DevOps/modernization, digital transformation consulting, data engineering.

Generate:
1. strategic_summary: 2-3 sentences explaining WHY this is a {priority} opportunity. Reference specific signals.
2. why_we_win: 3-4 bullet points — specific reasons DataVex wins this deal, tied to evidence.
3. risks: 2-3 honest risks/blockers for this deal.

Return JSON: {{"strategic_summary": "str", "why_we_win": ["str"], "risks": ["str"]}}""",
        system="You are a B2B sales strategist. Be specific — reference actual company signals. No generic statements."
    )
    return result


def run(candidates: list[CandidateCompany], all_signals: list[CompanySignals]) -> list[OpportunityScore]:
    """Run Agent 3: score each company opportunity."""
    logger.info(f"AGENT 3 — OpportunityScoring: scoring {len(candidates)} companies")
    results = []

    for candidate, signals in zip(candidates, all_signals):
        logger.info(f"  Scoring {candidate.company_name}")

        # Layer 1: Capability alignment
        cap_alignment = compute_capability_alignment(signals.company_state, signals)

        # Layer 2: Urgency
        urgency = compute_urgency(signals)

        # Layer 3: Final score (contradiction resolution is encoded in state)
        opp_score = compute_final_score(cap_alignment, urgency, candidate)

        # Priority & timing
        priority = determine_priority(opp_score)
        timing = determine_timing(priority, signals.company_state)

        # Confidence
        confidence = compute_confidence(signals, signals.company_state)

        # Layer 4: LLM strategic narrative
        narrative = generate_strategic_summary(candidate, signals, opp_score, priority)

        result = OpportunityScore(
            company_name=candidate.company_name,
            opportunity_score=opp_score,
            priority=priority,
            timing_window=timing,
            company_state=signals.company_state,
            capability_alignment=cap_alignment,
            urgency_score=urgency,
            strategic_summary=narrative.get("strategic_summary", ""),
            why_we_win=narrative.get("why_we_win", []),
            risks=narrative.get("risks", []),
            confidence=confidence,
        )
        results.append(result)
        logger.info(f"  {candidate.company_name}: score={opp_score:.3f}, priority={priority}, cap_align={cap_alignment:.2f}, urgency={urgency:.2f}")

    return results

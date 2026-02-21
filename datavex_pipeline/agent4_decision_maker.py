"""
Agent 4 — DecisionMakerAgent
Identifies who to contact and how to approach them.
"""
import logging
from models import (
    CompanySignals, OpportunityScore,
    DecisionMaker, DecisionMakerOutput, PriorityProfile,
)
from config import ROLE_MAP, TRAIT_MAP, llm_call_with_retry

logger = logging.getLogger("datavex_pipeline.agent4")


def select_role(company_state: str) -> str:
    """Map company state to best target persona role."""
    return ROLE_MAP.get(company_state, "VP Engineering")


def extract_psychographic_traits(signals: CompanySignals) -> tuple[list[str], PriorityProfile]:
    """Extract traits from company signals using keyword mapping."""
    all_text = ""
    for sig in [signals.pivot, signals.tech_debt, signals.fiscal_pressure]:
        if sig:
            all_text += " ".join(e.text for e in sig.evidence) + " "
    for t in signals.why_now_triggers:
        all_text += t.get("event", "") + " "
    all_text = all_text.lower()

    # Score each trait dimension
    trait_scores = {}
    for trait_name, trait_info in TRAIT_MAP.items():
        score = sum(1 for kw in trait_info["keywords"] if kw.lower() in all_text)
        trait_scores[trait_name] = score

    # Top 2 traits → primary/secondary focus
    sorted_traits = sorted(trait_scores.items(), key=lambda x: x[1], reverse=True)
    primary = sorted_traits[0][0] if sorted_traits else "innovation"
    secondary = sorted_traits[1][0] if len(sorted_traits) > 1 else "scalability"

    # Behavioral signals
    psych_signals = []
    for trait_name, trait_info in TRAIT_MAP.items():
        if trait_scores.get(trait_name, 0) > 0:
            psych_signals.append(trait_info["profile"])
    if not psych_signals:
        psych_signals = ["data-driven decision maker"]

    # Map to communication style
    style_map = {
        "cost": "ROI-driven",
        "speed": "technical",
        "innovation": "visionary",
        "reliability": "strategic",
    }
    comm_style = style_map.get(primary, "technical")

    # Risk tolerance from state
    risk_tolerance = "medium"
    if signals.company_state in ("GROWTH", "RESTRUCTURING"):
        risk_tolerance = "high"
    elif signals.company_state == "STABLE":
        risk_tolerance = "low"

    # Innovation bias
    innovation_bias = "high" if primary == "innovation" else ("moderate" if trait_scores.get("innovation", 0) > 0 else "low")

    profile = PriorityProfile(
        primary_focus=primary,
        secondary_focus=secondary,
        risk_tolerance=risk_tolerance,
        innovation_bias=innovation_bias,
        communication_style=comm_style,
    )

    return psych_signals[:3], profile


def generate_persona(
    company_name: str,
    role: str,
    signals: CompanySignals,
    opportunity: OpportunityScore,
) -> dict:
    """Use LLM to generate realistic name + bio + messaging angle."""
    evidence_summary = ""
    for sig_name, sig in [("pivot", signals.pivot), ("tech_debt", signals.tech_debt), ("fiscal", signals.fiscal_pressure)]:
        if sig:
            evidence_summary += f"\n{sig_name}: {sig.label}"
            for e in sig.evidence[:2]:
                evidence_summary += f"\n  [{e.source}] {e.text[:120]}"

    result = llm_call_with_retry(
        prompt=f"""Company: {company_name}
State: {signals.company_state}
Target role: {role}
Opportunity priority: {opportunity.priority}
Signals: {evidence_summary}
Why-we-win: {', '.join(opportunity.why_we_win[:2])}

Generate a realistic decision maker persona for the {role} at {company_name}:
1. name: realistic full name appropriate for the company's region
2. messaging_angle: 1 specific sentence combining company pain + DataVex value
3. pain_points_aligned: 3 specific pain points this person cares about (from signals)
4. persona_risks: 2 risks about approaching this person

Return JSON: {{"name": "str", "messaging_angle": "str", "pain_points_aligned": ["str"], "persona_risks": ["str"]}}""",
        system="You are a B2B persona researcher. Generate realistic, specific personas grounded in company evidence."
    )
    return result


def run(
    opportunities: list[OpportunityScore],
    all_signals: list[CompanySignals],
) -> list[DecisionMakerOutput]:
    """Run Agent 4: identify decision makers for each opportunity."""
    logger.info(f"AGENT 4 — DecisionMaker: profiling {len(opportunities)} targets")
    results = []

    for opportunity, signals in zip(opportunities, all_signals):
        logger.info(f"  Profiling {opportunity.company_name}")

        # Step 1: Role selection
        role = select_role(signals.company_state)

        # Step 2: Psychographic profiling
        psych_signals, priority_profile = extract_psychographic_traits(signals)

        # Step 3: LLM persona generation
        persona_data = generate_persona(
            opportunity.company_name, role, signals, opportunity
        )

        # Step 4: Compute confidence
        total_evidence = 0
        for sig in [signals.pivot, signals.tech_debt, signals.fiscal_pressure]:
            if sig:
                total_evidence += len(sig.evidence)
        confidence = min(1.0, 0.3 + 0.1 * total_evidence)
        if total_evidence < 4:
            confidence = min(confidence, 0.85)

        dm = DecisionMaker(
            name=persona_data.get("name", "Unknown"),
            role=role,
            priority_profile=priority_profile,
            psychographic_signals=psych_signals,
            messaging_angle=persona_data.get("messaging_angle", ""),
            pain_points_aligned=persona_data.get("pain_points_aligned", []),
            persona_risks=persona_data.get("persona_risks", []),
            confidence=round(confidence, 3),
        )

        rationale = (
            f"Selected {role} because company state is {signals.company_state}. "
            f"Primary focus: {priority_profile.primary_focus}. "
            f"Communication style: {priority_profile.communication_style}."
        )

        output = DecisionMakerOutput(
            company_name=opportunity.company_name,
            decision_maker=dm,
            role_selection_rationale=rationale,
        )
        results.append(output)
        logger.info(f"  {opportunity.company_name}: DM={dm.name} ({role}), style={priority_profile.communication_style}")

    return results

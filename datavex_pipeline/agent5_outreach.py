"""
Agent 5 — OutreachGenerationAgent
Produces personalized multi-channel outreach with full traceability.
"""
import logging
from models import (
    CompanySignals, OpportunityScore, DecisionMakerOutput, OutreachKit,
)
from config import llm_call_with_retry

logger = logging.getLogger("datavex_pipeline.agent5")


def build_message_strategy(
    signals: CompanySignals,
    opportunity: OpportunityScore,
    dm: DecisionMakerOutput,
) -> dict:
    """Construct strategy dict before calling LLM."""
    # Hook: specific company observation from signals
    hook = ""
    if signals.pivot and signals.pivot.evidence:
        hook = signals.pivot.evidence[0].text[:120]
    elif signals.tech_debt and signals.tech_debt.evidence:
        hook = signals.tech_debt.evidence[0].text[:120]
    elif signals.why_now_triggers:
        hook = signals.why_now_triggers[0].get("event", "")

    # Problem frame
    state_frames = {
        "GROWTH": f"{signals.company_name} is scaling fast but infrastructure may not keep pace",
        "TECH_MODERNIZATION": f"{signals.company_name} is modernizing legacy systems under time pressure",
        "COST_OPTIMIZATION": f"{signals.company_name} is cutting costs while maintaining tech investment",
        "RESTRUCTURING": f"{signals.company_name} is restructuring — the right tools accelerate the transition",
        "STABLE": f"{signals.company_name} has an opportunity to leap ahead of competitors with the right partner",
    }
    problem_frame = state_frames.get(signals.company_state, f"{signals.company_name} faces infrastructure challenges")

    # Value prop
    cap_map = {
        "GROWTH": "AI analytics and data engineering to scale without breaking",
        "TECH_MODERNIZATION": "cloud DevOps and digital transformation to cut migration timelines by 60%",
        "COST_OPTIMIZATION": "infrastructure modernization that pays for itself in 6 months",
        "RESTRUCTURING": "digital transformation consulting to accelerate the transition",
        "STABLE": "AI-powered analytics to unlock next-level growth",
    }
    value_prop = cap_map.get(signals.company_state, "end-to-end data engineering and AI analytics")

    # CTA based on risk tolerance
    risk = dm.decision_maker.priority_profile.risk_tolerance
    cta_map = {
        "high": "Let's set up a 20-minute technical deep dive this week",
        "medium": "Would a 15-minute overview of how we solved this for a similar company be useful?",
        "low": "Happy to share a case study — no commitment, just relevant data",
    }
    cta = cta_map.get(risk, "Worth a quick conversation?")

    return {
        "hook": hook,
        "problem_frame": problem_frame,
        "value_prop": value_prop,
        "credibility_hint": "DataVex has delivered similar transformations for companies at this stage",
        "cta": cta,
    }


def select_tone(dm: DecisionMakerOutput) -> str:
    """Map persona communication_style → outreach tone."""
    style = dm.decision_maker.priority_profile.communication_style
    tone_map = {
        "ROI-driven": "ROI-focused",
        "technical": "technical",
        "visionary": "consultative",
        "strategic": "direct",
    }
    return tone_map.get(style, "consultative")


def generate_outreach(
    company_name: str,
    dm: DecisionMakerOutput,
    strategy: dict,
    signals: CompanySignals,
    opportunity: OpportunityScore,
    tone: str,
) -> dict:
    """Use LLM to generate email, LinkedIn DM, and call opener."""
    # Build evidence references for the prompt
    evidence_refs = []
    for sig_name, sig in [("pivot", signals.pivot), ("tech_debt", signals.tech_debt), ("fiscal", signals.fiscal_pressure)]:
        if sig:
            for e in sig.evidence[:2]:
                evidence_refs.append(f"[{e.source}] {e.text[:100]}")

    evidence_text = "\n".join(evidence_refs[:4])

    result = llm_call_with_retry(
        prompt=f"""Generate personalized outreach for:

Company: {company_name} ({opportunity.company_state})
Decision Maker: {dm.decision_maker.name}, {dm.decision_maker.role}
Tone: {tone}
Priority: {opportunity.priority}

MESSAGE STRATEGY:
- Hook: {strategy['hook']}
- Problem: {strategy['problem_frame']}
- Value: {strategy['value_prop']}
- Credibility: {strategy['credibility_hint']}
- CTA: {strategy['cta']}

EVIDENCE TO REFERENCE (include at least 2 in each message):
{evidence_text}

DM Pain points: {', '.join(dm.decision_maker.pain_points_aligned[:3])}
Messaging angle: {dm.decision_maker.messaging_angle}

CONSTRAINTS:
- email: Subject line + body, MAX 120 words. Must reference 2+ specific evidence items. Address DM by first name.
- linkedin_dm: MAX 60 words. Conversational tone. Reference 1 specific signal.
- call_opener: MAX 2 sentences. Hook + question format.

Return JSON: {{"email": "Subject: ...\\n\\nBody...", "linkedin_dm": "str", "call_opener": "str"}}""",
        system=f"You are a B2B sales copywriter. Tone: {tone}. Be specific and evidence-based. Never be generic."
    )
    return result


def annotate_explainability(
    signals: CompanySignals,
    dm: DecisionMakerOutput,
    opportunity: OpportunityScore,
) -> tuple[list[str], list[str], list[str]]:
    """Trace back signal → message connections and risk adjustments."""
    personalization_notes = []
    why_this_message = []
    risk_adjustments = []

    # Personalization from signals
    if signals.pivot and signals.pivot.evidence:
        e = signals.pivot.evidence[0]
        personalization_notes.append(f"Hook derived from {e.source} signal: '{e.text[:80]}...'")
        why_this_message.append(f"Pivot signal ({signals.pivot.label}) drives problem framing")

    if signals.tech_debt and signals.tech_debt.evidence:
        e = signals.tech_debt.evidence[0]
        personalization_notes.append(f"Tech debt evidence from {e.source}: '{e.text[:80]}...'")
        why_this_message.append(f"Tech debt ({signals.tech_debt.label}) validates DataVex cloud_devops capability")

    if signals.fiscal_pressure and signals.fiscal_pressure.evidence:
        e = signals.fiscal_pressure.evidence[0]
        personalization_notes.append(f"Fiscal signal from {e.source}: '{e.text[:80]}...'")
        why_this_message.append(f"Fiscal pressure ({signals.fiscal_pressure.label}) creates urgency for ROI messaging")

    if not personalization_notes:
        personalization_notes.append("Limited signal data — outreach based on company profile and state")
        why_this_message.append(f"Company state ({signals.company_state}) used as primary framing driver")

    # Risk adjustments from Agent 4
    for risk in dm.decision_maker.persona_risks[:2]:
        if "budget" in risk.lower() or "cost" in risk.lower():
            risk_adjustments.append(f"Risk: {risk} → Softened CTA, emphasized ROI framing")
        elif "technical" in risk.lower():
            risk_adjustments.append(f"Risk: {risk} → Added engineering depth, avoided buzzwords")
        else:
            risk_adjustments.append(f"Risk: {risk} → Adjusted tone to be more consultative")

    if not risk_adjustments:
        risk_adjustments.append("No significant persona risks — standard messaging approach")

    return personalization_notes[:3], why_this_message[:3], risk_adjustments[:3]


def run(
    opportunities: list[OpportunityScore],
    all_signals: list[CompanySignals],
    all_decision_makers: list[DecisionMakerOutput],
) -> list[OutreachKit]:
    """Run Agent 5: generate outreach for each opportunity."""
    logger.info(f"AGENT 5 — OutreachGeneration: drafting for {len(opportunities)} targets")
    results = []

    for opportunity, signals, dm in zip(opportunities, all_signals, all_decision_makers):
        logger.info(f"  Generating outreach for {opportunity.company_name}")

        # Step 1: Build strategy
        strategy = build_message_strategy(signals, opportunity, dm)

        # Step 2: Select tone
        tone = select_tone(dm)

        # Step 3: LLM generation
        outreach_data = generate_outreach(
            opportunity.company_name, dm, strategy, signals, opportunity, tone
        )

        # Step 4: Explainability
        personalization, why_msg, risk_adj = annotate_explainability(signals, dm, opportunity)

        # Confidence
        total_evidence = 0
        for sig in [signals.pivot, signals.tech_debt, signals.fiscal_pressure]:
            if sig:
                total_evidence += len(sig.evidence)
        confidence = min(1.0, 0.3 + 0.1 * total_evidence)
        if total_evidence < 4:
            confidence = min(confidence, 0.85)

        kit = OutreachKit(
            company_name=opportunity.company_name,
            decision_maker_name=dm.decision_maker.name,
            decision_maker_role=dm.decision_maker.role,
            email=outreach_data.get("email", ""),
            linkedin_dm=outreach_data.get("linkedin_dm", ""),
            call_opener=outreach_data.get("call_opener", ""),
            personalization_notes=personalization,
            tone=tone,
            why_this_message=why_msg,
            risk_adjustments=risk_adj,
            confidence=round(confidence, 3),
        )
        results.append(kit)
        logger.info(f"  {opportunity.company_name}: tone={tone}, confidence={confidence:.2f}")

    return results

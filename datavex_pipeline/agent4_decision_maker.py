"""
Agent 4 — DecisionMakerAgent
Identifies REAL decision makers via web search, then profiles them.
Uses DuckDuckGo to find actual people at the company.
"""
import logging
from models import (
    CompanySignals, OpportunityScore,
    DecisionMaker, DecisionMakerOutput, PriorityProfile,
)
from config import ROLE_MAP, TRAIT_MAP, llm_call_with_retry
from scraper import search_decision_makers

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

    trait_scores = {}
    for trait_name, trait_info in TRAIT_MAP.items():
        score = sum(1 for kw in trait_info["keywords"] if kw.lower() in all_text)
        trait_scores[trait_name] = score

    sorted_traits = sorted(trait_scores.items(), key=lambda x: x[1], reverse=True)
    primary = sorted_traits[0][0] if sorted_traits else "innovation"
    secondary = sorted_traits[1][0] if len(sorted_traits) > 1 else "scalability"

    psych_signals = []
    for trait_name, trait_info in TRAIT_MAP.items():
        if trait_scores.get(trait_name, 0) > 0:
            psych_signals.append(trait_info["profile"])
    if not psych_signals:
        psych_signals = ["data-driven decision maker"]

    style_map = {
        "cost": "ROI-driven",
        "speed": "technical",
        "innovation": "visionary",
        "reliability": "strategic",
    }
    comm_style = style_map.get(primary, "technical")

    risk_tolerance = "medium"
    if signals.company_state in ("GROWTH", "RESTRUCTURING"):
        risk_tolerance = "high"
    elif signals.company_state == "STABLE":
        risk_tolerance = "low"

    innovation_bias = "high" if primary == "innovation" else ("moderate" if trait_scores.get("innovation", 0) > 0 else "low")

    profile = PriorityProfile(
        primary_focus=primary,
        secondary_focus=secondary,
        risk_tolerance=risk_tolerance,
        innovation_bias=innovation_bias,
        communication_style=comm_style,
    )

    return psych_signals[:3], profile


def find_real_person(company_name: str, target_role: str) -> dict:
    """
    Search the web for a real person at this company.
    Returns {"name": str, "role": str, "source": str} or fallback.
    """
    people = search_decision_makers(company_name, target_role)

    if people:
        # Use LLM to pick the best match from search results
        people_text = "\n".join(
            f"{i+1}. Name: {p['name']} | Raw title: {p.get('raw_title', '')} | Source: {p.get('source', '')}"
            for i, p in enumerate(people[:5])
        )

        result = llm_call_with_retry(
            prompt=f"""Company: {company_name}
Target role: {target_role}

I searched the web and found these potential contacts:
{people_text}

Pick the BEST match for the role "{target_role}" at "{company_name}".
If none of the names clearly match, return the most likely candidate.

Return JSON: {{"name": "full name of the person", "role": "their actual role/title", "confidence": 0.0-1.0, "source_index": which_result_1_indexed}}
IMPORTANT: Use the ACTUAL name from the search results. Do NOT invent a name.""",
            system="You are selecting the best decision maker match from real web search results. Only use names from the provided results."
        )

        name = result.get("name", people[0]["name"])
        role = result.get("role", target_role)
        confidence = result.get("confidence", 0.5)

        # Clean up the name — remove LinkedIn suffixes
        for suffix in [" | LinkedIn", " - LinkedIn", " on LinkedIn", " – LinkedIn"]:
            name = name.replace(suffix, "")
        name = name.strip(" -|·")

        return {
            "name": name,
            "role": role,
            "confidence": confidence,
            "source": people[0].get("source", "web search"),
            "is_real": True,
        }
    else:
        # No results — use role title as name (honest fallback)
        logger.warning(f"  No real person found for {target_role} at {company_name} — using role title")
        return {
            "name": f"{target_role} (name not found)",
            "role": target_role,
            "confidence": 0.1,
            "source": "fallback — web search returned no results",
            "is_real": False,
        }


def generate_messaging(
    company_name: str,
    dm_name: str,
    role: str,
    signals: CompanySignals,
    opportunity: OpportunityScore,
) -> dict:
    """Use LLM to generate messaging angle and pain points for the REAL person."""
    evidence_summary = ""
    for sig_name, sig in [("pivot", signals.pivot), ("tech_debt", signals.tech_debt), ("fiscal", signals.fiscal_pressure)]:
        if sig:
            evidence_summary += f"\n{sig_name}: {sig.label}"
            for e in sig.evidence[:2]:
                evidence_summary += f"\n  [{e.source}] {e.text[:120]}"

    result = llm_call_with_retry(
        prompt=f"""Company: {company_name}
Decision maker: {dm_name} ({role})
Company state: {signals.company_state}
Opportunity priority: {opportunity.priority}
Signals: {evidence_summary}
Why-we-win: {', '.join(opportunity.why_we_win[:2])}

Generate messaging for {dm_name}:
1. messaging_angle: 1 specific sentence combining company pain + DataVex value
2. pain_points_aligned: 3 specific pain points this {role} cares about (from signals)
3. persona_risks: 2 risks about approaching this person

Return JSON: {{"messaging_angle": "str", "pain_points_aligned": ["str"], "persona_risks": ["str"]}}""",
        system="You are a B2B sales strategist. Generate messaging grounded in real company evidence."
    )
    return result


def run(
    opportunities: list[OpportunityScore],
    all_signals: list[CompanySignals],
) -> list[DecisionMakerOutput]:
    """Run Agent 4: find REAL decision makers and profile them."""
    logger.info(f"AGENT 4 — DecisionMaker: profiling {len(opportunities)} targets")
    results = []

    for opportunity, signals in zip(opportunities, all_signals):
        logger.info(f"  Profiling {opportunity.company_name}")

        # Step 1: Role selection
        role = select_role(signals.company_state)

        # Step 2: SEARCH FOR REAL PERSON
        person = find_real_person(opportunity.company_name, role)
        dm_name = person["name"]
        dm_role = person.get("role", role)

        logger.info(f"  Found: {dm_name} ({dm_role}) [real={person.get('is_real', False)}, source={person.get('source', 'unknown')}]")

        # Step 3: Psychographic profiling
        psych_signals, priority_profile = extract_psychographic_traits(signals)

        # Step 4: Generate messaging for this REAL person
        messaging = generate_messaging(
            opportunity.company_name, dm_name, dm_role, signals, opportunity
        )

        # Step 5: Compute confidence
        total_evidence = 0
        for sig in [signals.pivot, signals.tech_debt, signals.fiscal_pressure]:
            if sig:
                total_evidence += len(sig.evidence)
        base_confidence = min(1.0, 0.3 + 0.1 * total_evidence)
        # Boost confidence if we found a real person
        if person.get("is_real"):
            base_confidence = min(1.0, base_confidence + 0.15)
        else:
            base_confidence = min(base_confidence, 0.4)

        dm = DecisionMaker(
            name=dm_name,
            role=dm_role,
            priority_profile=priority_profile,
            psychographic_signals=psych_signals,
            messaging_angle=messaging.get("messaging_angle", ""),
            pain_points_aligned=messaging.get("pain_points_aligned", []),
            persona_risks=messaging.get("persona_risks", []),
            confidence=round(base_confidence, 3),
        )

        rationale = (
            f"Selected {dm_role} because company state is {signals.company_state}. "
            f"Person found via: {person.get('source', 'unknown')}. "
            f"Primary focus: {priority_profile.primary_focus}. "
            f"Communication style: {priority_profile.communication_style}."
        )

        output = DecisionMakerOutput(
            company_name=opportunity.company_name,
            decision_maker=dm,
            role_selection_rationale=rationale,
        )
        results.append(output)
        logger.info(f"  {opportunity.company_name}: DM={dm_name} ({dm_role}), is_real={person.get('is_real')}, confidence={base_confidence:.2f}")

    return results

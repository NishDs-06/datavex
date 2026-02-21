"""
Agent 1 — TargetDiscoveryAgent
Finds and filters candidate companies using intent parsing, capability matching, and fit scoring.
"""
import logging
from models import CandidateCompany, UserIntent, DealProfile
from config import DATAVEX_CAPABILITIES, llm_call_with_retry
from demo_data import SAMPLE_COMPANIES, DEMO_COMPANIES

logger = logging.getLogger("datavex_pipeline.agent1")


def parse_intent(user_input: str) -> dict:
    """Use LLM to parse raw user text into structured filters."""
    result = llm_call_with_retry(
        prompt=f'Parse this business intent into structured filters:\n\n"{user_input}"\n\nReturn JSON with: {{"industries": [], "tech_focus": [], "regions": [], "size_preference": []}}',
        system="You are a B2B intent parser. Extract industry targets, technology focus areas, geographic regions, and company size preferences (small/mid/large) from the user query."
    )
    return {
        "industries": result.get("industries", []),
        "tech_focus": result.get("tech_focus", []),
        "regions": result.get("regions", []),
        "size_preference": result.get("size_preference", ["small", "mid"]),
    }


def match_capabilities(company_signals: list[str]) -> float:
    """Score how well a company's tech signals match DataVex capabilities."""
    all_keywords = []
    for keywords in DATAVEX_CAPABILITIES.values():
        all_keywords.extend(keywords)

    if not all_keywords:
        return 0.0

    matched = 0
    for signal in company_signals:
        signal_lower = signal.lower()
        for kw in all_keywords:
            if kw.lower() in signal_lower:
                matched += 1
                break

    total_relevant = max(len(company_signals), 1)
    return min(1.0, matched / total_relevant)


def score_fit(company: dict, deal_profile: DealProfile, intent_filters: dict) -> CandidateCompany:
    """Score a company across 4 dimensions and compute initial match score."""
    # Size fit
    preferred = deal_profile.preferred_company_sizes
    size = company["size"]
    size_order = ["small", "mid", "large"]
    if size in preferred:
        size_score = 1.0
    elif size in size_order:
        idx = size_order.index(size)
        one_away = any(
            abs(idx - size_order.index(p)) == 1
            for p in preferred if p in size_order
        )
        size_score = 0.5 if one_away else 0.0
    else:
        size_score = 0.0

    # Geo fit
    geo_score = 1.0 if company["region"] in deal_profile.target_regions else 0.3

    # Capability score — look up demo data for richer signals, fall back to industry keywords
    tech_signals = []
    for demo in DEMO_COMPANIES:
        if demo["company_name"] == company["company_name"]:
            tech_signals = demo.get("tech_signals", [])
            break
    if not tech_signals:
        tech_signals = [company["industry"]]
    capability_score = match_capabilities(tech_signals)

    # Industry fit — check if company's industry matches any intent industry
    industry_fit = 0.0
    company_industry_lower = company["industry"].lower()
    for target_ind in intent_filters.get("industries", []):
        if target_ind.lower() in company_industry_lower or company_industry_lower in target_ind.lower():
            industry_fit = 1.0
            break
    # Also check tech_focus overlap
    if industry_fit == 0.0:
        for tf in intent_filters.get("tech_focus", []):
            for ts in tech_signals:
                if tf.lower() in ts.lower() or ts.lower() in tf.lower():
                    industry_fit = 0.7
                    break
            if industry_fit > 0:
                break

    # Composite score
    initial_score = (
        0.4 * capability_score
        + 0.3 * size_score
        + 0.2 * geo_score
        + 0.1 * industry_fit
    )

    return CandidateCompany(
        company_name=company["company_name"],
        domain=company["domain"],
        industry=company["industry"],
        size=company["size"],
        estimated_employees=company["estimated_employees"],
        region=company["region"],
        capability_score=round(capability_score, 3),
        size_fit=round(size_score, 3),
        geo_fit=round(geo_score, 3),
        industry_fit=round(industry_fit, 3),
        initial_match_score=round(initial_score, 3),
        notes=f"Matched {len(tech_signals)} tech signals. Size: {size}, Region: {company['region']}",
    )


def run(user_intent: UserIntent, deal_profile: DealProfile) -> list[CandidateCompany]:
    """Run Agent 1: parse intent, discover companies, score fit, filter top 3."""
    logger.info(f"AGENT 1 — TargetDiscovery: parsing '{user_intent.raw_text}'")

    # Step 1: Parse intent
    intent_filters = parse_intent(user_intent.raw_text)
    logger.info(f"  Intent parsed: {intent_filters}")

    # Step 2: Score all companies
    candidates = []
    for company in SAMPLE_COMPANIES:
        scored = score_fit(company, deal_profile, intent_filters)
        candidates.append(scored)

    # Step 3: Filter > 0.4 and sort by score (demo companies get tie-breaking priority)
    demo_names = {d["company_name"] for d in DEMO_COMPANIES}
    filtered = [c for c in candidates if c.initial_match_score > 0.4]
    filtered.sort(
        key=lambda c: (c.initial_match_score, 1 if c.company_name in demo_names else 0),
        reverse=True,
    )

    # Step 4: Return top 3
    top = filtered[:3]
    logger.info(f"  Filtered to {len(top)} candidates: {[c.company_name for c in top]}")
    return top

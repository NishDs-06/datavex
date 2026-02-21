import logging

logger = logging.getLogger("datavex_pipeline.agent4")


# ---------------------------------------------------
# STRATEGY LOGIC
# ---------------------------------------------------

def choose_strategy(intent, conversion, deal_size, risk, internal_strength):
    """
    Decide GTM motion based on intent, conversion likelihood and risk
    """

    # high risk → do not aggressively sell
    if risk > 0.5:
        return "AUDIT"

    # strong intent + easy to convert
    if intent > 0.7 and conversion > 0.7:
        return "BUILD_HEAVY"

    # strong intent but harder conversion
    if intent > 0.7 and conversion > 0.4:
        return "CO_BUILD"

    # low intent but expansion opportunity
    if intent < 0.6 and deal_size > 0.7:
        return "PLATFORM"

    return "MONITOR"


# ---------------------------------------------------
# OFFER MAPPING
# ---------------------------------------------------

def map_offer(strategy):
    return {
        "BUILD_HEAVY": "custom AI infra buildout",
        "CO_BUILD": "co-development with internal team",
        "PLATFORM": "data platform integration",
        "AUDIT": "infrastructure audit & optimization",
        "MONITOR": "nurture / thought leadership"
    }.get(strategy, "general advisory")


def map_entry_point(strategy):
    return {
        "BUILD_HEAVY": "full architecture assessment",
        "CO_BUILD": "joint ML pipeline optimization session",
        "PLATFORM": "platform demo + integration workshop",
        "AUDIT": "infra performance audit",
        "MONITOR": "send technical insights / case studies"
    }.get(strategy, "intro call")


# ---------------------------------------------------
# MAIN
# ---------------------------------------------------

def run(scored_opportunities):

    results = []

    for o in scored_opportunities:

        intent = o["intent_score"]
        conversion = o["conversion_score"]
        deal_size = o["deal_size_score"]
        risk = o.get("risk_score", 0.0)

        # NOTE: we don’t have internal_tech_strength here directly,
        # but conversion already encodes capability gap, so it's fine

        strategy = choose_strategy(
            intent,
            conversion,
            deal_size,
            risk,
            internal_strength=None
        )

        offer = map_offer(strategy)
        entry = map_entry_point(strategy)

        results.append({
            "company_name": o["company_name"],
            "priority": o["priority"],
            "strategy": strategy,
            "recommended_offer": offer,
            "entry_point": entry,

            "intent_score": intent,
            "conversion_score": conversion,
            "deal_size_score": deal_size,
            "risk_score": risk
        })

    return results
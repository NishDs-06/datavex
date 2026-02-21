import logging

logger = logging.getLogger("datavex_pipeline.agent5")


# ---------------------------------------------------
# PERSONA SELECTION
# ---------------------------------------------------

def decide_persona(strategy, conversion, deal_size):
    """
    Choose stakeholder based on GTM motion
    """

    if strategy == "BUILD_HEAVY":
        return "CTO / Head of AI"

    if strategy == "CO_BUILD":
        return "VP Engineering / Director ML"

    if strategy == "PLATFORM":
        return "Head of Data Platform"

    if strategy == "AUDIT":
        return "Infra / SRE Lead"

    return "Technical Leader"


# ---------------------------------------------------
# CHANNEL SELECTION
# ---------------------------------------------------

def decide_channel(strategy):
    if strategy in ["BUILD_HEAVY", "CO_BUILD"]:
        return "cold_email"
    if strategy == "PLATFORM":
        return "product_led_email"
    return "linkedin"


# ---------------------------------------------------
# SUBJECT LINE
# ---------------------------------------------------

def build_subject(company, entry_point):
    return f"{company} — quick idea on {entry_point}"


# ---------------------------------------------------
# MESSAGE GENERATION
# ---------------------------------------------------

def build_message(company, persona, entry_point, strategy):
    angle_map = {
        "BUILD_HEAVY": "accelerate delivery and reduce infra burden",
        "CO_BUILD": "augment your internal team to ship faster",
        "PLATFORM": "optimize and extend your existing data platform",
        "AUDIT": "identify infra bottlenecks and cost inefficiencies",
        "MONITOR": "share insights and stay aligned as you scale"
    }

    angle = angle_map.get(strategy, "explore collaboration opportunities")

    return f"""
Hi {persona},

I’ve been following {company}'s recent growth — looks like the team is scaling fast.

We typically help companies at this stage {angle}, especially around areas like {entry_point}.

Would it be useful to start with a quick 20-min conversation to explore where we can support your team?

– Datavex
""".strip()


# ---------------------------------------------------
# MAIN
# ---------------------------------------------------

def run(decisions):

    outputs = []

    for d in decisions:

        strategy = d["strategy"]
        conversion = d["conversion_score"]
        deal_size = d["deal_size_score"]

        persona = decide_persona(strategy, conversion, deal_size)
        channel = decide_channel(strategy)

        subject = build_subject(d["company_name"], d["entry_point"])

        message = build_message(
            d["company_name"],
            persona,
            d["entry_point"],
            strategy
        )

        outputs.append({
            "company_name": d["company_name"],
            "strategy": strategy,
            "persona": persona,
            "channel": channel,
            "subject": subject,
            "message": message,
            "priority": d["priority"],
            "conversion_score": conversion,
            "deal_size_score": deal_size
        })

    return outputs
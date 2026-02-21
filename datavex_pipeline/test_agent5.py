import logging

logger = logging.getLogger("datavex_pipeline.agent5")


# ---------------------------------------------------
# PERSONA SELECTION
# ---------------------------------------------------

def decide_persona(strategy, conversion, deal_size):
    """
    Decide who to contact
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
# MESSAGE ANGLE
# ---------------------------------------------------

def decide_message_angle(strategy):
    return {
        "BUILD_HEAVY": "accelerate roadmap delivery and reduce infra burden",
        "CO_BUILD": "augment internal team to ship faster",
        "PLATFORM": "integrate and optimize your existing data platform",
        "AUDIT": "identify infra bottlenecks and cost inefficiencies",
        "MONITOR": "share insights and stay top-of-mind"
    }.get(strategy, "explore collaboration opportunities")


# ---------------------------------------------------
# EMAIL GENERATOR
# ---------------------------------------------------

def generate_email(company, persona, angle, entry_point):
    return f"""
Hi,

I’ve been following {company}’s recent growth and it’s clear your team is scaling rapidly.

We typically help teams like yours {angle}, especially during high-growth phases where infrastructure and ML pipelines become bottlenecks.

Would it be useful to start with a quick {entry_point} to explore where we can support your team?

Best,
AI Infra Team
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
        angle = decide_message_angle(strategy)

        email = generate_email(
            d["company_name"],
            persona,
            angle,
            d["entry_point"]
        )

        outputs.append({
            "company_name": d["company_name"],
            "strategy": strategy,
            "persona": persona,
            "message_angle": angle,
            "email": email
        })

    return outputs
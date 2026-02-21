import logging

logger = logging.getLogger("datavex_pipeline.agent5")


# ---------------------------------------------------
# Decide persona
# ---------------------------------------------------
def decide_persona(signals):

    for s in signals:
        if "ML" in s or "pipeline" in s:
            return "Head of ML Engineering"

        if "infrastructure" in s.lower():
            return "VP Engineering"

        if "data" in s.lower():
            return "Head of Data Platform"

    return "CTO"


# ---------------------------------------------------
# Decide channel
# ---------------------------------------------------
def decide_channel(motion):

    if motion == "SALES_LED":
        return "cold_email"

    if motion == "PRODUCT_LED":
        return "plg_email"

    return "linkedin"


# ---------------------------------------------------
# Build subject line
# ---------------------------------------------------
def build_subject(company, entry_point):

    return f"{company} — quick idea on {entry_point}"


# ---------------------------------------------------
# Build outreach message
# ---------------------------------------------------
def build_message(company, persona, entry_point, hypothesis, signals):

    signal_line = ", ".join(signals[:2])

    return f"""
Hi {persona},

Noticed that {company} is seeing {signal_line}.

We’ve been helping teams in a similar stage tackle issues around {entry_point}, especially when scaling ML/data infra.

Based on what we’re seeing, there may be an opportunity to support {company} in stabilizing performance and reducing infra load.

Open to a quick 20-min discussion to explore?

– Datavex
""".strip()


# ---------------------------------------------------
# MAIN
# ---------------------------------------------------
def run(decisions):

    outputs = []

    for d in decisions:

        persona = decide_persona(d["summary"].split(","))
        channel = decide_channel(d["recommended_motion"])

        subject = build_subject(d["company_name"], d["entry_point"])

        message = build_message(
            d["company_name"],
            persona,
            d["entry_point"],
            d["deal_hypothesis"],
            d["summary"].split(",")
        )

        outputs.append({
            "company_name": d["company_name"],
            "persona": persona,
            "channel": channel,
            "subject": subject,
            "message": message,
            "priority": d["priority"],
            "score": d["opportunity_score"]
        })

    return outputs
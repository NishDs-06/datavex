import logging

logger = logging.getLogger("datavex_pipeline.agent3")


# ---------------------------------------------------
# PRIORITY CLASSIFICATION
# ---------------------------------------------------

def classify_priority(score):
    if score > 0.75:
        return "HIGH"
    elif score > 0.45:
        return "MEDIUM"
    return "LOW"


# ---------------------------------------------------
# COMPONENT MODELS
# ---------------------------------------------------

def compute_intent(strain_score, pain_score):
    raw = 0.7 * strain_score + 0.3 * pain_score
    intent = raw ** 0.9
    return round(min(intent, 1.0), 3)


def compute_conversion(expansion_score, internal_tech_strength):
    """
    Capability-gap dominant conversion model
    """

    capability_gap = 1 - internal_tech_strength

    raw = (
        0.7 * capability_gap +
        0.3 * expansion_score
    )

    conversion = raw ** 0.9
    return round(min(conversion, 1.0), 3)


def compute_deal_size(candidate):
    base = (
        0.5 * candidate.size_fit +
        0.5 * candidate.industry_fit
    )
    return round(min(base, 1.0), 3)


# ---------------------------------------------------
# MAIN SCORING
# ---------------------------------------------------

def run(candidates, signals):

    signal_map = {s["company_name"]: s for s in signals}
    results = []

    for c in candidates:

        s = signal_map.get(c.company_name)
        if not s:
            continue

        if s.get("fit_type") == "COMPETITOR":
            continue

        expansion = s["expansion_score"]
        strain = s["strain_score"]
        risk = s["risk_score"]
        pain = s["pain_score"]

        intent = compute_intent(strain, pain)
        conversion = compute_conversion(expansion, c.internal_tech_strength)
        deal_size = compute_deal_size(c)

        score = (
            0.4 * intent +
            0.35 * conversion +
            0.25 * deal_size
        )

        # risk penalty
        score = score - 0.25 * risk

        score = round(max(0.0, min(score, 1.0)), 3)

        summary = (
            f"{c.company_name} shows "
            f"{int(intent*100)}% intent, "
            f"{int(conversion*100)}% conversion likelihood, "
            f"and {int(deal_size*100)}% deal size potential."
        )

        results.append({
            "company_name": c.company_name,
            "priority": classify_priority(score),
            "opportunity_score": score,

            "intent_score": intent,
            "conversion_score": conversion,
            "deal_size_score": deal_size,

            "expansion_score": expansion,
            "strain_score": strain,
            "risk_score": risk,

            "summary": summary
        })

    return results
import logging

logger = logging.getLogger("datavex_pipeline.agent4")


def estimate_leadership_tech_depth(company_name: str) -> float:
    name = company_name.lower()

    if "databricks" in name:
        return 0.9
    if "mindsdb" in name:
        return 0.85
    if "fractal" in name:
        return 0.6

    return 0.5


def compute_conversion_friction(buying_style: str, tech_depth: float, size: str) -> float:
    friction = 0.0

    if buying_style == "BUILD_HEAVY":
        friction += 0.4
    elif buying_style == "HYBRID":
        friction += 0.2
    else:
        friction += 0.1

    friction += tech_depth * 0.4

    if size == "large":
        friction += 0.2
    elif size == "mid":
        friction += 0.1

    return min(1.0, friction)


def select_persona(buying_style: str, tech_depth: float):

    if buying_style == "BUILD_HEAVY":
        return "Head of Platform Engineering" if tech_depth > 0.75 else "VP Engineering"

    if buying_style == "HYBRID":
        return "VP Data / AI"

    return "CTO"


def build_messaging(company, tech_depth, friction):

    if tech_depth > 0.8:
        return f"{company} has strong internal engineering — position DataVex as performance acceleration partner."

    if friction > 0.6:
        return f"{company} may resist vendors — lead with low-risk audit."

    return f"{company} can benefit from external support to accelerate scaling."


def run(opportunities, signals, strategies):

    outputs = []

    for opp, sig, strat in zip(opportunities, signals, strategies):

        company = opp["company_name"]
        size = opp.get("size", "mid")

        tech_depth = estimate_leadership_tech_depth(company)

        friction = compute_conversion_friction(
            strat["buying_style"],
            tech_depth,
            size
        )

        persona = select_persona(
            strat["buying_style"],
            tech_depth
        )

        messaging = build_messaging(
            company,
            tech_depth,
            friction
        )

        outputs.append({
            "company_name": company,
            "persona": persona,
            "tech_depth": round(tech_depth, 2),
            "conversion_friction": round(friction, 2),
            "messaging_angle": messaging,
            "confidence": round(0.4 + (1 - friction) * 0.5, 3),
        })

    return outputs
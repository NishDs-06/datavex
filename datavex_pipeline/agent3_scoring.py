import logging

logger = logging.getLogger("datavex_pipeline.agent3")


# ---------------------------------------------------
# MAIN SCORING FUNCTION
# ---------------------------------------------------

def run(candidates, signals):

    # Map signals by company name
    signal_map = {s["company_name"]: s for s in signals}

    results = []

    for c in candidates:

        s = signal_map.get(c.company_name)

        if not s:
            continue

        # Skip competitors
        if s["fit_type"] == "COMPETITOR":
            continue

        # ---------------------------------------------------
        # EXPANSION SCORE (growth intensity)
        # ---------------------------------------------------
        # Based on number of detected signals (hiring, funding, etc.)
        expansion = min(1.0, len(s["signals"]) / 5.0)

        # ---------------------------------------------------
        # STRAIN SCORE (operational pressure)
        # ---------------------------------------------------
        # Derived from expansion + complexity (simple proxy for now)
        strain = min(1.0, expansion * 0.8)

        # ---------------------------------------------------
        # RISK SCORE (currently simple placeholder)
        # ---------------------------------------------------
        risk = 0.0

        # ---------------------------------------------------
        # INTENT SCORE
        # ---------------------------------------------------
        intent = round(0.6 * expansion + 0.4 * strain, 3)

        # ---------------------------------------------------
        # CONVERSION SCORE (capability gap)
        # ---------------------------------------------------
        internal_tech_strength = getattr(c, "internal_tech_strength", 0.3)
        capability_gap = 1.0 - internal_tech_strength

        conversion = round(0.7 * capability_gap + 0.3 * intent, 3)

        # ---------------------------------------------------
        # DEAL SIZE ESTIMATION
        # ---------------------------------------------------
        size_map = {
            "SMALL": 0.5,
            "MID": 0.75,
            "LARGE": 0.95
        }

        deal_size = size_map.get(str(c.size).upper(), 0.75)

        # ---------------------------------------------------
        # FINAL OPPORTUNITY SCORE
        # ---------------------------------------------------
        score = round(0.4 * intent + 0.4 * conversion + 0.2 * deal_size, 3)

        # ---------------------------------------------------
        # PRIORITY CLASSIFICATION
        # ---------------------------------------------------
        if score > 0.75:
            priority = "HIGH"
        elif score > 0.55:
            priority = "MEDIUM"
        else:
            priority = "LOW"

        # ---------------------------------------------------
        # SUMMARY STRING
        # ---------------------------------------------------
        summary = (
            f"{c.company_name} shows {int(intent * 100)}% intent, "
            f"{int(conversion * 100)}% conversion likelihood, and "
            f"{int(deal_size * 100)}% deal size potential."
        )

        # ---------------------------------------------------
        # 🔥 CRITICAL FIX: EXPORT KEY SIGNAL TYPES
        # ---------------------------------------------------
        key_signals = []

        if isinstance(s.get("signals"), list):
            # if signals is a flat list
            key_signals = [sig.get("type") for sig in s["signals"]][:3]

        elif isinstance(s.get("signals"), dict):
            # if signals grouped by source
            for group in s["signals"].values():
                for item in group:
                    if isinstance(item, dict) and "type" in item:
                        key_signals.append(item["type"])
            key_signals = key_signals[:3]

        # ---------------------------------------------------
        # OUTPUT OBJECT
        # ---------------------------------------------------
        results.append({
            "company_name": c.company_name,
            "priority": priority,
            "opportunity_score": score,

            "intent_score": intent,
            "conversion_score": conversion,
            "deal_size_score": deal_size,

            "expansion_score": expansion,
            "strain_score": strain,
            "risk_score": risk,

            "key_signals": key_signals,   # ← THIS FIXES YOUR BUG

            "summary": summary
        })

    return results
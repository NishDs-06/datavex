#!/usr/bin/env python3
"""
DataVex Pipeline — Entry Point
Runs the full 5-agent pipeline against 3 demo companies and prints results.
"""
import sys
import os
import logging
import json

# Add pipeline dir to path so imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from orchestrator import run_pipeline, print_detailed_results

# ── Logging ─────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)


def main():
    print("╔══════════════════════════════════════════════════════════╗")
    print("║                                                        ║")
    print("║   DataVex Partner Discovery Pipeline                   ║")
    print("║   5-Agent B2B Sales Intelligence System                ║")
    print("║                                                        ║")
    print("╚══════════════════════════════════════════════════════════╝")

    # Demo query — targets the 3 hardcoded companies
    user_input = "mid-size fintech and AI SaaS companies in India looking for data engineering and cloud modernization"
    deal_profile = {
        "min_deal_usd": 500_000,
        "max_deal_usd": 10_000_000,
        "target_regions": ["India", "US"],
        "preferred_company_sizes": ["small", "mid"],
    }

    print(f"\n  Query: \"{user_input}\"")
    print(f"  Deal: ${deal_profile['min_deal_usd']:,}–${deal_profile['max_deal_usd']:,}")
    print(f"  Regions: {', '.join(deal_profile['target_regions'])}")
    print(f"  Sizes: {', '.join(deal_profile['preferred_company_sizes'])}")

    # Run pipeline
    results = run_pipeline(user_input, deal_profile)

    if not results:
        print("\n  No opportunities found. Try adjusting your query or deal profile.")
        return

    # Print detailed results
    print_detailed_results(results)

    # Save JSON output
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pipeline_output.json")
    output_data = [r.model_dump() for r in results]
    with open(output_path, "w") as f:
        json.dump(output_data, f, indent=2, default=str)
    print(f"\n  📄 Full JSON output saved to: {output_path}")

    # Print priority summary
    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║  PRIORITY SUMMARY                                      ║")
    print("╚══════════════════════════════════════════════════════════╝")
    for r in sorted(results, key=lambda x: x.opportunity.opportunity_score, reverse=True):
        icon = {"HIGH": "🟢", "MEDIUM": "🟡", "LOW": "🔴"}.get(r.opportunity.priority, "⚪")
        print(f"  {icon} {r.company_name:20s}  {r.opportunity.priority:6s}  score={r.opportunity.opportunity_score:.3f}  DM={r.decision_maker.decision_maker.name}")

    print()


if __name__ == "__main__":
    main()

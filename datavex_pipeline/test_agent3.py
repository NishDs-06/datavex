from agent1_discovery import run as run_agent1
from agent2_signals import run as run_agent2
from agent3_scoring import run as run_agent3

def main():
    candidates = run_agent1("AI infra companies")
    signals = run_agent2(candidates)
    results = run_agent3(candidates, signals)

    print("\nAGENT 3 OUTPUT\n")

    for r in results:
        print(r["company_name"])
        print("Priority:", r["priority"], "| Score:", r["opportunity_score"])
        print("Summary:", r["summary"])
        print("-"*40)

if __name__ == "__main__":
    main()
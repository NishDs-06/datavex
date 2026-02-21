from agent1_discovery import run as run_agent1
from agent2_signals import run as run_agent2

def main():
    candidates = run_agent1("AI infra companies")
    results = run_agent2(candidates)

    print("\nAGENT 2 OUTPUT\n")

    for r in results:
        print(r["company_name"], r["fit_type"], r["company_state"])

if __name__ == "__main__":
    main()
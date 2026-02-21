from agent1_discovery import run as run_agent1
from agent2_signals import run as run_agent2
from agent3_scoring import run as run_agent3
from agent35_strategy import run as run_agent35
from agent4_decision_maker import run as run_agent4


def main():

    candidates = run_agent1("AI infra companies")
    signals = run_agent2(candidates)
    opps = run_agent3(candidates, signals)
    strategies = run_agent35(opps, signals)

    decisions = run_agent4(opps, signals, strategies)

    print("\n==============================")
    print("     AGENT 4 OUTPUT")
print("==============================\n")

for d in decisions:
    print(d["company_name"])
    print("Persona:", d["persona"])
    print("Tech depth:", d["tech_depth"])
    print("Friction:", d["conversion_friction"])
    print("Messaging:", d["messaging_angle"])
    print("Confidence:", d["confidence"])
    print("-" * 40)


if __name__ == "__main__":
    main()
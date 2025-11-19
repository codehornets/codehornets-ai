effenco-agents/
├─ README.md
├─ pyproject.toml           # or requirements.txt if you prefer
├─ effagents/
│  ├─ __init__.py
│  ├─ cli.py                # Typer/Click CLI: `effa ...`
│  ├─ config.py             # paths, env vars, LLM client wrapper
│  ├─ orchestrator.py       # routes commands → agents
│  ├─ agents/
│  │  ├─ base.py
│  │  ├─ triage_agent.py        # Morning Triage Agent
│  │  ├─ code_review_agent.py   # Code Review Agent
│  │  ├─ weekly_report_agent.py # Weekly Reporter Agent
│  │  ├─ spec_refiner_agent.py  # (optional later)
│  │  └─ doc_sync_agent.py      # (optional later)
│  ├─ data_sources/
│  │  ├─ logs.py            # read/parse logs
│  │  ├─ tickets.py         # read tasks (Notion/Jira/GitHub/markdown)
│  │  └─ git_data.py        # commits, PRs, diffs
│  └─ prompts/
│     ├─ triage.md
│     ├─ code_review.md
│     └─ weekly_report.md
└─ logs/
   ├─ daily/                # generated triage summaries
   └─ weekly/               # generated weekly summaries

@AGENTS.md

## Claude Code

- Talk to the developer in Spanish; everything written to the repo stays in English.
- The developer is a web developer (React/TS, FastAPI) new to mobile: explain new mobile concepts briefly (2-3 lines) the first time they appear.
- Ask before big decisions: new libraries, data model changes, anything that costs money.
- Commit only when the developer asks (propose the message). Never push unless asked.
- After implementing an OpenSpec change and before proposing the commit, run the `code-reviewer` subagent with the change name; fix BLOCKER/MAJOR findings, then report the rest to the developer.

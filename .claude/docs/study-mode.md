# Study Mode

A guide for using Claude to deeply understand this codebase — useful for onboarding, code reviews, or getting back up to speed after time away.

---

## What is Study Mode?

Study mode is an intentional way of working with Claude where the goal is **understanding**, not output. Instead of asking Claude to build things, you ask it to teach you. This makes you a better developer and helps you make better decisions when you _do_ start building.

---

## How to Enter Study Mode

Tell Claude:

> "Enter study mode. Don't write any code. I want to understand [topic]. Explain it to me like I'm smart but new to this codebase."

Or be more specific:

> "Walk me through how [feature] works from end to end."

> "Explain the data flow for [action] — what happens on the client, what hits the server, how the database is updated."

> "I don't understand why we're using [X]. Can you explain the decision and what alternatives exist?"

---

## Good Study Mode Prompts

**Architecture tours**
- "Give me a 5-minute tour of this codebase. What are the key folders and what does each one do?"
- "How does data flow from the database to the UI in this app?"
- "Walk me through the [auth / payment / core] flow step by step."

**Deep dives**
- "Explain `[filename]` to me. What does it do and why does it exist?"
- "What does this function do and why is it written this way?"
- "What would break if I deleted `[file]`?"

**Decision archaeology**
- "Why is the project structured this way instead of [alternative]?"
- "What are the trade-offs of [technology choice] vs [alternative]?"

**Debugging understanding**
- "Walk me through what happens when [error] occurs."
- "Why would [symptom] happen? What should I check first?"

---

## Study Mode Rules (for Claude)

When in study mode:
- Do NOT write code or suggest changes unless explicitly asked
- Explain the "why" before the "what"
- Use analogies for complex concepts
- Reference specific files and line numbers so the user can follow along
- Highlight trade-offs and alternatives
- Ask what the user already understands before over-explaining
- If something is unclear in the codebase, say so honestly

---

## After a Study Session

- Ask Claude to summarize key takeaways
- Save anything important to `.claude/docs/`
- Update `.claude/rules/glossary.md` with new terms you learned

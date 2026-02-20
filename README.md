# Claude Starter

A production-ready Claude Code configuration template for any project. Clone this, answer a few questions, and start building with a structured AI-assisted workflow — no coding experience required to get started.

---

## What is Claude Code?

Claude Code is an AI coding assistant that runs in your terminal. You describe what you want to build in plain English, and it writes the code. This template gives Claude everything it needs to work effectively on your project from day one — the right context, the right guardrails, and a repeatable workflow.

---

## What's Included

```
.claude/
├── commands/           Things you can ask Claude to do with /command-name
│   ├── choose-stack            Helps you pick the right technology for your project
│   ├── gather-requirements     Turns your idea into a written feature spec
│   ├── evaluate-spec           Reviews a spec for gaps before building starts
│   ├── implement-spec          Builds a feature from a spec, with your approval
│   ├── commit-push             Saves and pushes your code with a clean commit message
│   ├── security-audit          Scans for security vulnerabilities
│   └── update-erd              Generates a diagram of your database structure
├── docs/               Living project documentation
│   ├── data-model.md           Overview of your data and how it's structured
│   ├── security-audit-report.md  Latest security scan results
│   └── study-mode.md           How to use Claude to learn and understand your codebase
├── plans/              Step-by-step build plans (generated before any code is written)
├── rules/              Standards Claude follows when writing code for your project
│   ├── code-style.md           Formatting and naming conventions
│   ├── git-workflow.md         How code changes are saved and organized
│   ├── glossary.md             Project-specific terms and definitions
│   ├── security.md             Security standards that cannot be skipped
│   └── testing.md              How and what to test
├── skills/             Background knowledge Claude loads automatically
│   ├── explaining-code/        Puts Claude into teaching mode when you ask questions
│   └── frontend-design/        UI and design principles for your project
└── specs/              Written descriptions of every feature
    ├── TEMPLATE.md             Starting point for writing a new spec
    └── complete/               Archive of specs for features that have shipped
CLAUDE.md               The briefing document Claude reads at the start of every session
```

---

## The Workflow

This template is built around one core principle: **describe before you build**. You write down what you want before Claude writes any code. This prevents wasted work, scope creep, and miscommunication.

```
Start here
    │
    ▼
/choose-stack ──────────────────────────────────────────────────────────┐
Claude interviews you about your project and recommends a               │
technology stack. Your CLAUDE.md is updated automatically.              │
    │                                                                   │
    ▼                                                                   │
/gather-requirements ────────────────────────────────────────────────── │
Claude interviews you about a specific feature and writes               │
a spec file to .claude/specs/your-feature.md                           │
    │                                                                   │
    ▼                                                                   │
/evaluate-spec your-feature ─────────────────────────────────────────── │
Claude reviews the spec for gaps, ambiguity, and missing               │
edge cases before a single line of code is written.                    │
    │                                                                   │
    ▼                                                                   │
/implement-spec your-feature ────────────────────────────────────────── │
Claude writes a step-by-step plan and shows it to you.                 │
You approve it. Then Claude builds the feature.                        │
    │                                                                   │
    ▼                                                                   │
/commit-push ───────────────────────────────────────────────────────────┘
Claude reviews what changed, writes a clear commit message,
and pushes to your branch. Repeat for the next feature.
```

---

## Step-by-Step Setup

### Step 1 — Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Or on Mac with Homebrew:
```bash
brew install --cask claude-code
```

### Step 2 — Clone this template

```bash
git clone <your-org>/claude-starter my-project
cd my-project
rm -rf .git
git init
```

### Step 3 — Open Claude Code

```bash
claude
```

Claude reads `CLAUDE.md` automatically when it starts. You'll see a session open in your terminal.

### Step 4 — Run `/choose-stack`

Type `/choose-stack` and press Enter. Claude will ask you a series of questions about your project — what you're building, who it's for, and any existing tools or infrastructure you need to work with. At the end, it recommends a complete technology stack and updates your `CLAUDE.md` automatically.

> You do not need to know anything about technology to answer these questions. Claude is the expert — you just describe what you need.

### Step 5 — Run `/gather-requirements`

Type `/gather-requirements` and press Enter. Claude will interview you about the first feature you want to build and write a spec file. A spec is a plain-English document that describes what the feature does, who uses it, and what "done" looks like.

### Step 6 — Run `/evaluate-spec your-feature`

Replace `your-feature` with the name of the file Claude created. Claude will review it for completeness and flag anything that's missing or unclear before building starts.

### Step 7 — Run `/implement-spec your-feature`

Claude reads the spec, writes a step-by-step plan, and shows it to you before touching any files. Once you approve it, Claude builds the feature task by task.

### Step 8 — Run `/commit-push`

When you're ready to save your work, run `/commit-push`. Claude reviews what changed, writes a proper commit message, and pushes to your branch.

**Repeat Steps 5–8 for every new feature.**

---

## Command Reference

| Command | When to use it |
|---------|---------------|
| `/choose-stack` | At the start of a new project, before any code is written |
| `/gather-requirements` | Any time you want to build a new feature |
| `/evaluate-spec [filename]` | After writing a spec, before implementing it |
| `/implement-spec [filename]` | When a spec is approved and you're ready to build |
| `/commit-push` | When you want to save and push your work |
| `/security-audit` | Before releasing to users, or on a regular schedule |
| `/update-erd` | After any database schema change |

---

## Customizing the Rules

The files in `.claude/rules/` tell Claude how to write code for your project. After your stack is chosen, review each one and fill in any project-specific details:

- **`code-style.md`** — naming conventions, formatting, framework-specific patterns
- **`git-workflow.md`** — branch naming, commit message format
- **`security.md`** — authentication and authorization patterns for your stack
- **`glossary.md`** — add domain-specific terms as they come up
- **`testing.md`** — what to test and how

---

## Tips

- **Keep `CLAUDE.md` under 100 lines.** If it grows too long, Claude starts ignoring rules. Move details into `.claude/rules/` files instead.
- **The plan is your checkpoint.** `/implement-spec` always shows you a plan before writing code. Read it. If something looks wrong, say so before approving.
- **Specs before code, always.** The most common mistake is asking Claude to build something without a spec. Even a rough spec prevents hours of rework.
- **Move specs to `complete/` when done.** This keeps your active specs folder focused on what's still being built.
- **Use study mode to learn.** If you want Claude to explain something rather than build it, see `.claude/docs/study-mode.md`.
- **Update the glossary.** When new terms or concepts come up in your project, add them to `.claude/rules/glossary.md`. Consistent language between you and Claude prevents a lot of confusion.

---

## For Teams

When multiple people work on the same project:

- `CLAUDE.md` and everything in `.claude/` should be committed to the repo — it's shared context for the whole team
- `CLAUDE.local.md` (if you create one) is personal and gitignored — use it for your own preferences
- `.claude/settings.local.json` is also gitignored — use it for personal permission overrides
- Specs in `.claude/specs/` are the source of truth for what's being built — keep them up to date

---

## For Your Presentation

Key talking points:

1. **CLAUDE.md is a briefing document** — everything Claude needs to know about your project, loaded automatically at the start of every session
2. **Rules files keep it lean and modular** — instead of one long file Claude might ignore, rules are broken into focused files that are always current
3. **Skills are automatic context** — Claude loads relevant background knowledge without being asked
4. **Commands are enforced workflows** — not just shortcuts, but processes that ensure specs are written, plans are approved, and code is reviewed before shipping
5. **Spec-first development** — the most important habit for working effectively with AI; describe before you build
6. **The plan is a review gate** — Claude always shows you what it's going to do before it does it; you're always in control

---

Made for teams using [Claude Code](https://claude.ai/code).

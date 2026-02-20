Implement the feature described in a spec file.

If a filename is given, read `.claude/specs/$ARGUMENTS`. If no argument is provided, ask which spec to implement — or offer to run `/gather-requirements` first if no spec exists yet.

## Process

1. **Read** — Read the full spec. Understand it completely before writing any code.
2. **Clarify** — Ask any blocking questions BEFORE touching files. Don't assume.
3. **Plan** — Create a step-by-step implementation plan. Save it to `.claude/plans/$ARGUMENTS`. The plan should list:
   - Files to create or modify
   - Implementation steps in order
   - Any schema changes needed
   - Potential risks or unknowns
4. **Get approval** — Present the plan. Wait for user sign-off before proceeding.
5. **Track** — Use TodoWrite to create a task for each implementation step.
6. **Implement** — Work through tasks one at a time. Mark each complete immediately when done.
7. **Validate** — Run the lint and build commands from CLAUDE.md. Fix all errors before finishing.
8. **Summarize** — Write a brief summary of what was built and note any deviations from spec.

## Rules

- Do not implement anything not in the spec — flag scope creep and ask before proceeding
- If you discover a technical constraint mid-implementation, surface it rather than working around it silently
- Run `/commit-push` at logical checkpoints, not just at the very end
- Follow all rules in `.claude/rules/`
- NEVER commit unless the user explicitly asks

$ARGUMENTS

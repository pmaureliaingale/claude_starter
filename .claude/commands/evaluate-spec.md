Evaluate a feature specification for quality, completeness, and readiness.

If a filename is provided, read it from `.claude/specs/$ARGUMENTS`. Otherwise ask the user to paste the spec.

Analyze across these dimensions:

## Completeness
- Are all user roles and their permissions defined?
- Are all user stories covered end-to-end?
- Are success states AND error/empty states defined?

## Clarity
- Is any requirement ambiguous or open to interpretation?
- Are edge cases handled (empty states, concurrent users, network failures)?
- Are acceptance criteria measurable and testable (not vague)?

## Technical Feasibility
- Any concerns given the current stack in CLAUDE.md?
- Performance implications (large data sets, real-time, heavy computation)?
- Dependencies on infrastructure not yet set up?

## Dependencies
- Does this rely on features not yet built?
- Does it require schema changes? Are they backwards-compatible?

## Security
- Authentication and authorization clearly defined?
- Input validation specified?
- Any sensitive data exposure risks?

## Scope
- Is anything included that should be a separate feature?
- Is anything missing that users would implicitly expect?

---

Output format:
- ✅ Well-defined
- ⚠️ Needs clarification — include the specific question to ask
- ❌ Missing or problematic — include a concrete recommendation

End with a **Readiness Score**: `Ready to implement` / `Needs minor clarification` / `Needs major revision`

$ARGUMENTS

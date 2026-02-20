## Context

- Current git status: !`git status`
- Current diff (staged and unstaged): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your Task

- If there are no changes to commit, say so and stop
- If any file looks like it shouldn't be in the repo (e.g. `.env`, secrets, build artifacts), check with the user before staging
- Stage all appropriate changes
- Write an informative commit message following Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- The message should describe **why**, not just what changed
- Do NOT include "Co-Authored-By" in the commit message
- Push to the current branch

$ARGUMENTS

## Context

- Project stack: See CLAUDE.md
- Files to audit: $ARGUMENTS (defaults to entire project if not specified)

## Checks

### Authentication & Authorization
- [ ] All protected routes verify session/token before doing anything
- [ ] Role-based access enforced **server-side** — never trust the client
- [ ] No sensitive operations accessible without authentication

### Input Validation
- [ ] All user input validated before use (client and server)
- [ ] No SQL injection vectors (use parameterized queries or an ORM)
- [ ] No XSS vectors (check for unsafe HTML rendering)

### API Security
- [ ] HTTP methods restricted appropriately per route
- [ ] No API keys or secrets in client-side code or public config
- [ ] CORS configured correctly for the deployment target

### Data Exposure
- [ ] API responses don't return sensitive fields (passwords, tokens, internal IDs)
- [ ] Error messages don't leak stack traces or internal details in production
- [ ] No PII in logs or error responses

### Secrets & Configuration
- [ ] No hardcoded credentials, tokens, or API keys in source files
- [ ] Secrets stored in environment variables, not committed to the repo
- [ ] `.env` files are gitignored

### Dependencies
- [ ] No packages with known critical CVEs
- [ ] No unused dependencies that expand the attack surface

---

Output format:
- 🔴 **Critical** — must fix before shipping
- 🟡 **Medium** — should fix soon
- 🟢 **Low / Informational** — worth noting
- ✅ **Passed**

Include the specific file path and line number for every finding.

When finished, save the full report to `.claude/docs/security-audit-report-[YYYY-MM-DD].md` and update `.claude/docs/security-audit-report.md` with the latest results.

$ARGUMENTS

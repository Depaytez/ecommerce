# Engineering Standards & Operating Instructions

## 1. Plan Before Acting, Especially When It's Hard to Reverse

- For any change that touches security, auth, payments, database schema, or production
  infrastructure: state what you're about to do and why, then wait for confirmation before
  implementing — don't bundle "here's my plan" and "I already did it" into one message.
- For destructive or hard-to-reverse actions (deleting data, force-push, dropping a table,
  overwriting a file you didn't create): default to a dry-run mode that only reports what _would_
  happen, and require an explicit confirmation flag/step before anything real executes.
- Scope discipline: implement what was asked. Flag adjacent problems you notice, but don't silently
  expand scope — ask, or note it separately, rather than bundling unrequested changes into the same
  change.
- If the user gives a scope decision explicitly (e.g. "skip X for now"), don't quietly re-add X
  later without saying so.

## 2. Verify, Don't Assume — Especially the Thing You're About to Build a Fix Around

- Before writing detection/retry/validation logic for an error, capture the _actual_ shape of the
  failure (status code, response body, exact message) from a real occurrence. Don't guess the
  shape and build logic around the guess — an unverified assumption baked into a fix is how a fix
  silently does nothing.
- When a fix targets an intermittent/hard-to-reproduce issue, add logging as part of the fix itself,
  not as an afterthought. If it fails again, the logs must be able to distinguish "the fix ran and
  wasn't enough" from "the fix never ran at all" — those require opposite next steps.
- Reproduce locally before trusting a theory about "the deployment environment." If something fails
  only in one environment, that's a real data point (rules out purely local causes); if it
  reproduces in both, that rules out environment-specific theories (like a stale credential in one
  place but not the other).
- Before accepting another AI's or a third party's diagnosis, check it against your own evidence.
  Plausible-sounding explanations aren't automatically correct — verify or refute with something
  concrete before agreeing or building on top of it.

## 3. Test Every Change For Real Before Calling It Done

- Run the actual build/type-check/lint — don't infer from reading the code that it will pass.
- For anything user-facing, verify the real behavior: hit real routes, check real HTTP status codes
  (not just "the page loads" — a 404 page can return HTTP 200 and look identical to a person while
  being wrong for crawlers/tooling), query the real database when a live integration is involved.
- Screenshot or otherwise visually confirm UI changes in every relevant state (both themes, mobile
  and desktop, empty/loading/error states) rather than assuming a class name did what it was
  supposed to.
- When fixing a bug, write a minimal reproduction of the _specific_ failure mode (a mocked response,
  a crafted input) and confirm both that it now passes and that it didn't break the adjacent
  "should still fail" case. A fix that can't be shown to reject bad input isn't verified.
- After a fix, re-run the full check (build + tests + route sweep), not just the one thing you
  changed — regressions hide in what you didn't touch.

## 4. Don't Hide or Soften Errors

- Report what actually broke, including when it's your own earlier fix that didn't work. State it
  plainly, then explain what you learned and what changes as a result.
- Don't claim something is "fixed" when you can't verify it — say what's confirmed, what's still
  uncertain, and what evidence would resolve the uncertainty next time it happens.
- If an audit turns up something unrelated to what was asked, report it. Silence on a real problem
  because it wasn't the topic of the question is not acceptable.

## 5. Security Defaults

- Principle of least privilege: every credential/role should be able to do only what it needs.
  Re-verify permissions/roles on every request that matters, not just at initial login — a revoked
  or downgraded permission should take effect immediately, not on next sign-in.
- Never trust client-controlled data for an authorization decision (session cookies must be
  server-verified, not just read; redirect targets from query params must be validated as
  same-origin before use — open redirects are a real, common vulnerability class).
- Rate-limit and spam-protect every public-facing form or endpoint.
- Add standard security headers (X-Content-Type-Options, X-Frame-Options/frame-ancestors,
  Referrer-Policy, Permissions-Policy) by default; treat a full CSP as a deliberate, carefully-tested
  addition, not a rushed one.
- No secrets in source code, ever. Verify env-var files that hold real secrets are actually
  gitignored — don't assume, check with the tooling (`git ls-files`, `git check-ignore -v`).
- When building anything that touches money, identity, or admin access, default to the safer,
  more auditable option even if it's more code (e.g., re-verify a role on every write, not just at
  session start).

## 6. Architecture & Code Quality

- Prefer clear layering (routes → application/use-cases → domain → infrastructure) so a business
  rule doesn't leak into a UI component and a framework detail doesn't leak into domain logic.
- Don't add an abstraction, a dependency, or a config layer before there's a second real use for it.
  Three similar lines beat a premature generic helper.
- Don't add a new dependency for something simple enough to write directly and understand fully —
  but don't refuse a dependency on principle either when it's the right tool; check what's already
  available before deciding either way.
- When you find dead code, an unused parameter, or a leftover debugging artifact during other work,
  remove it — don't leave it because it wasn't the reason you were in the file.
- Keep a single source of truth for anything that could otherwise drift: one config file for
  swappable assets/links, one place that decides mock-vs-real data source, one canonical list of
  environment variables.

## 7. Handling Uncertainty & Third-Party/Business Facts

- Never invent business facts you don't have — legal entity names, tax status, addresses, pricing
  commitments. Use clearly-marked placeholders and say explicitly that a human needs to fill them in
  before the content is authoritative.
- Never fabricate or guess at a URL, a person's likeness/photo, or content attributed to a real
  person or organization without it being explicitly supplied.
- When a third-party dashboard/UI doesn't match your expectation (different button labels, a
  redesigned flow), don't keep asserting stale instructions — ask what's actually on screen and
  adjust, or clearly caveat that your instructions might not match their current UI.
- When you're not certain why something failed, say so, and propose how to find out (add logging,
  reproduce in isolation, check a specific log) rather than presenting a guess as a confirmed
  diagnosis.

## 8. Documentation

- Keep documentation split by audience: technical/developer reference, an operational
  deploy/runbook, and (if there are non-technical users) a plain-language guide with zero jargon.
- Update docs in the same change as the code they describe — a doc that goes stale immediately is
  worse than no doc.
- Maintain a running engineering log of non-obvious decisions and their reasoning (why a fix works,
  why an approach was rejected, what evidence supports a timing/threshold value) — this is what lets
  future work build on real findings instead of re-deriving or re-guessing them.
- Log documentations in `/docs/logs/` for proper documentation of features as a jdoc in `.md` files.

## 9. Communication Style

- Lead with what changed and what's next; skip the narrated thought process.
- When presenting options, give a recommendation and the one real tradeoff — don't dump an
  exhaustive list and ask the user to design the solution themselves.
- When something is genuinely the user's call (a business decision, a legal fact, a choice between
  real tradeoffs), ask directly instead of picking silently or stalling.

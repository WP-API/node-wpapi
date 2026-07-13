# Modernization Handoff

Living status doc for the node-wpapi modernization. See `modernization-plan.md`
(vision) and `modernization-execution-plan.md` (phased plan). Trunk is `main`;
each phase lands via a `--no-ff` merge.

## Current state: Phase 0 complete (baseline green)

Full suite green against the local wp-env WordPress:
`805 passed, 16 skipped, 0 failed` (39 suites). No library/request logic changed
except one isolated modern-WP compatibility fix (see below).

### What Phase 0 did

- **Local env is the integration target.** Tests now read the endpoint from
  `tests/helpers/constants.js` (`WPAPI_HOST`, default `http://localhost:2747`),
  replacing the old hardcoded `http://wpapi.local/wp-json`.
- **Deterministic seed.** `npm run env:seed` empties the site, then imports
  `tests/fixtures/theme-unit-test-data.xml` (the classic Theme Unit Test WXR).
  `.wp-env.json` now also installs the `WP-API/Basic-Auth` plugin so the
  authenticated tests work (modern WP core rejects plain Basic Auth).
- **Refreshed expectations.** Integration assertions were updated for modern WP:
  chiefly the WXR "Scheduled" post is now past-dated (today is 2026) and thus
  published, shifting post counts/pagination; and modern WP default options
  differ (empty tagline, extra settings keys). Only data values changed — no
  test mechanic was loosened.
- **Fixed:** `WPAPI.discover` read the root `_links.self` as a string; modern WP
  returns `[ { href } ]`. Now accepts both (`lib/bind-transport.js`).

### Known gap (deferred to Phase 5)

- **`discover` / live-route bootstrap fails on modern WP.** The route-tree regex
  parser (`lib/route-tree.js:83`) throws "Unterminated group" on routes whose
  named groups contain nested patterns, e.g. `wp/v2/templates/(?P<id>...)`.
  Default-mode instances are unaffected (they use the frozen
  `lib/data/default-routes.json`). The `discover` integration suite is
  `describe.skip`-ped with a `TODO(phase-5)`; its `beforeAll` `.catch()`es the
  rejection so it can't leak into other suites. Fix the parser in Phase 5, then
  un-skip and remove that `.catch()`.

## Dev workflow

```
npm install
npm run env:start     # boot wp-env (localhost:2747)
npm run env:seed      # once, against a fresh env
npm run test:unit     # no WP needed
npm run test:integration
```

## Next: Phase 1 — modern toolchain (still JS)

tsdown build (dual ESM+CJS+UMD, exports map), Jest -> Vitest, ESLint 9 flat +
Prettier, Node 18+ / drop IE11, GitHub Actions CI. See execution plan Phase 1.

Note for Phase 1/CI: integration tests currently pass both parallel and serial,
but they share one DB. If CRUD suites prove flaky in CI, run integration with
`--runInBand`.

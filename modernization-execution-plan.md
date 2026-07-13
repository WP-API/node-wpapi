# node-wpapi Modernization — Execution Plan

## Context

`wpapi` (repo `node-wpapi`) is an isomorphic WordPress REST API client that went dormant after late 2019 (a stalled `2.0.0-alpha.1`). The toolchain has atrophied: webpack 4, Babel 7, ESLint 4, Jest 24, Grunt, a Ruby/Jekyll docs stack, an IE11 target, and dead Travis CI. The bundled route data (`lib/data/default-routes.json`) is frozen at ~WP 4.7/5.0, so modern block-editor routes are missing. The goal: bring the project up to modern standards, migrate to TypeScript, refresh for current WP, and make it an easy upgrade for existing consumers — without sacrificing maintainability.

This plan sequences that work into independently-mergeable phases, each with a regression net, so it can be executed against the `.wp-env.json` local WordPress.

## Locked decisions

- **Bundler:** `tsdown` (Rolldown-based; successor to tsup). Produces dual ESM+CJS, auto `.d.ts`, IIFE/UMD browser bundle, and an auto-generated `exports` map — replaces webpack + Grunt + Babel entirely.
- **Runtime baseline:** Native global `fetch` is the default transport (zero runtime deps). Node 18+ floor. Drop IE11.
- **Superagent: removed entirely.** Drop the `superagent/` directory and the `node-fetch` / `form-data` / `superagent` dependencies.
- **Main export:** Batteries-included — `require('wpapi')` / `import WPAPI from 'wpapi'` works out of the box with fetch bound in. Restores v1.x ergonomics (the alpha's transport-less split is reversed). Keep `wpapi/fetch` as an alias subpath; `wpapi/superagent` becomes a stub that throws a migration message.
- **Precompute:** Build-time pre-parsed route tree — run `route-tree.build` at build time over `default-routes.json`, ship the finished tree/spec so runtime skips parsing. Keep `default-routes.json` human-editable.

## Recommended defaults (second-tier)

- **Test runner:** Jest 24 → **Vitest**. Runs `.ts` with zero config; Jest-compatible globals so the existing test files port mechanically.
- **Lint/format:** ESLint 9 flat config + `typescript-eslint` + Prettier. Prefer `eslint --fix` / `prettier` over manual style edits.
- **CI:** GitHub Actions. Unit + lint on push/PR; integration job spins up `@wordpress/env`.
- **Version target:** finalize the alpha line as **`2.0.0`**.
- **Docs:** deferred. Later phase replaces JSDoc/minami + Jekyll with **TypeDoc** + a simple modern docs site.

## Working conventions (standing)

- `main` is rewrite-trunk. Each incremental phase = a temp branch, merged to `main` with `--no-ff`. Push `main` after each merge; never push other branches without asking.
- Break tests first, then make them pass. Commit granularly, chunked and described for human review.
- Keep `handoff.md` current at each checkpoint.
- Reusable throwaway scripts go in `.scratchpad/` with a brief purpose/usage comment.
- Delegate mechanical conversion to cheaper agents; use **Fable as a review gate** before a feature is considered solved.
- **Never modify GitHub issues** — recommend only.

---

## Phase 0 — Baseline green + local env (regression net)

No behavior change. Establish a trustworthy test baseline first.

- Resolve the env mismatch: integration tests hardcode `http://wpapi.local/wp-json` but `.wp-env.json` serves on `localhost:2747`. Make the endpoint configurable via env var with a `localhost:2747` default; centralize in `tests/helpers/constants.js`.
- `npm run env:start`, then get the existing Jest unit + integration suites green as-is.
- Add `handoff.md` and `.scratchpad/`.

**Verify:** `npm run test:unit` and `npm run test:integration` both pass against wp-env.

## Phase 1 — Modern toolchain (still JS)

Swap infrastructure with no source-language change, so regressions are isolated to tooling.

- Replace webpack + Grunt + Babel with **tsdown**: dual ESM+CJS, UMD/IIFE browser bundle, generated `exports` map. Delete `webpack.config*.js`, `Gruntfile.js`, `build/grunt/`, Babel config.
- Migrate Jest → Vitest; port test files.
- ESLint 9 flat + typescript-eslint + Prettier; run `eslint --fix`/`prettier` to settle style.
- `package.json`: `engines.node >=18`, remove `browserslist`/IE11, add `exports`/`module`/`types`.
- Add `.github/workflows/` CI. Remove `.travis.yml`.

**Verify:** full suite green under Vitest; `npm run build` emits ESM+CJS+UMD+`.d.ts`; CI green.

## Phase 2 — Transport modernization + superagent removal

Behavior-affecting — break tests first.

- Rewrite `fetch/fetch-transport.js` to use global `fetch` (no `node-fetch`/`form-data`/`fs`). Rework `.file()`/uploads (`lib/constructors/wp-request.js`) to native `FormData` + `Blob`/`File`; on Node, read disk files into a `Blob`.
- Make `main` batteries-included: bind the fetch transport in the primary entry (via `lib/bind-transport.js`). Keep `wpapi/fetch` as an alias.
- Remove `superagent/`; replace the `wpapi/superagent` subpath with a stub that throws a clear migration error. Drop `superagent`, `node-fetch`, `form-data` from deps.
- Compat: ensure `require('wpapi')` works out of the box; document callback-removal (alpha already dropped error-first callbacks — promises only).
- Fix `node-wpapi.php` bugs: `wp enqueue scripts` → `wp_enqueue_scripts`, `__FILE` → `__FILE__`.

**Verify:** transport unit tests + integration (posts/media upload, custom-http-transport, autodiscovery) green; `wpapi/superagent` throws the migration message.

## Phase 3 — TypeScript migration (incremental, leaf-up)

`tsconfig` with `allowJs`/`checkJs`, `strict`. Convert in dependency order, each layer its own sub-branch, existing JSDoc as the typing basis:

1. `lib/util/*` (pure leaves)
2. `lib/pagination.js`, `lib/path-part-setter.js`, `lib/mixins/*`
3. `lib/route-tree.js`, `lib/resource-handler-spec.js`, `lib/endpoint-factories.js`, `lib/endpoint-request.js`
4. `lib/constructors/wp-request.js`
5. `wpapi.js`, `lib/bind-transport.js`, `lib/wp-register-route.js`, transport

The dynamic route→method generation produces an open-ended method surface — type pragmatically (generics/index signatures); the precompute step is where richer per-route types can later hang.

**Verify:** `tsc --noEmit` clean; suite green after each layer; shipped `.d.ts` resolve from a scratch consumer import.

## Phase 4 — Build-time route precompute

- Add a build script (extend `build/scripts/`) that runs `route-tree.build` over `default-routes.json` and emits a pre-parsed tree/spec module. `wpapi.js` bootstrap consumes it, skipping runtime parse.
- Benchmark startup before/after with a `.scratchpad/` script.

**Verify:** default-mode init produces identical handlers (route-handler unit tests pass); benchmark shows the parse cost removed.

## Phase 5 — Modern WP routes

- Point `build/scripts/update-default-routes-json.js` at wp-env; regenerate `default-routes.json` for current WP (block-types, blocks, templates, template-parts, global-styles, menus, menu-items, navigation, font-families/faces, patterns, `wp-block-editor/v1`, etc.).
- Add integration tests for a few new resources. Re-run Phase 4 precompute.

**Verify:** new handlers callable (e.g. `wp.blockTypes()`, `wp.templates()`); new integration tests green.

**MILESTONE:** "current baseline functionality, working with modern WP." → docs + issues triage.

## Phase 6 — Docs triage

Replace JSDoc/minami + Jekyll/Grunt/combyne/kramed with TypeDoc + a modern docs site; deploy via GitHub Pages Actions. Scope confirmed after baseline.

## Phase 7 — Issues triage report

Using `gh`, categorize the backlog: closeable (deps/vulns/stale), needs-human-response (support / feature-request / bug), and highest-value-to-action. Report only — never modify issues.

---

## Critical files

- Entry / bootstrap: `wpapi.js`, `lib/bind-transport.js`
- Route pipeline: `lib/route-tree.js`, `lib/endpoint-factories.js`, `lib/resource-handler-spec.js`, `lib/endpoint-request.js`, `lib/path-part-setter.js`, `lib/mixins/*`, `lib/util/*`
- Request core: `lib/constructors/wp-request.js`, `lib/pagination.js`
- Transport: `fetch/`, `superagent/` (to remove), `fetch/fetch-transport.js`
- Data/precompute: `lib/data/default-routes.json`, `build/scripts/update-default-routes-json.js`, `build/scripts/simplify-object.js`
- Config: `package.json`, `webpack.config*.js` (remove), `Gruntfile.js` (remove), `.eslintrc.js`, `.travis.yml` (remove), `.wp-env.json`, `node-wpapi.php`
- Tests: `tests/unit/**`, `tests/integration/**`, `tests/helpers/constants.js`, `fetch/tests/**`

## End-to-end verification

- Local WP via `npm run env:start` (wp-env, `localhost:2747`).
- Per phase: `npm run test:unit` + `npm run test:integration` (Vitest) green; `tsc --noEmit` clean from Phase 3 on.
- Build sanity: `npm run build` emits ESM + CJS + UMD + `.d.ts`; a scratch consumer (`require('wpapi')` and `import`) exercises `wp.posts().get()` against wp-env end-to-end.
- Fable review gate before each phase merge.

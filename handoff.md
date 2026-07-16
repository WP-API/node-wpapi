# Modernization Handoff

Living status doc for the node-wpapi modernization. See `modernization-plan.md`
(vision) and `modernization-execution-plan.md` (phased plan). Trunk is `main`;
each phase lands via a `--no-ff` merge.

## Current state: Phase 3 complete (TypeScript migration)

Every source file (`wpapi.ts`, `lib/**`, `fetch/**`, `superagent/**`) is now
strict-mode TypeScript; `tsc --noEmit` is clean with `strict` + `checkJs` on.
Full suite green: `599 unit + 110 integration passed, 8 skipped` (unchanged
counts; the 8 remain the discover suite, deferred to Phase 5).

### How the migration is shaped

- **CJS-flavored TS (`export =`).** Converted leaf-up in five layers
  (util → pagination/mixins → route pipeline → wp-request → entries), each
  its own commit, preserving CommonJS semantics so the mixed JS/TS graph and
  the tests' `require()` calls kept working throughout. Value imports use
  `import x = require( ... )`; cross-file type-only references use inline
  `type X = import( './types' ).X;` aliases.
- **rolldown trap (critical, still true):** ANY top-level ESM import
  declaration — including `import type ... from` — makes rolldown classify a
  file as ESM and silently compile its `export =` to an empty object in dist.
  No build error; unit tests stay green; only dist breaks. Hence the inline
  type-alias pattern above. See memory `rolldown-esm-classification-trap`.
- **`tests/helpers/ts-require-hook.js`** (Vitest setup): Vitest loads CJS
  source through native require, which can't resolve or execute `.ts`.
  The hook registers a `require.extensions['.ts']` transpiler (using the
  project's own `typescript` package) so extensionless requires resolve to
  `.ts`. Tests themselves stay untouched CJS. Coverage still remaps (v8).
- **Shared types** live in `lib/types.ts` (type-only module):
  WPRequestOptions, HTTPTransport, RouteDefinition, RouteTree(Node/Levels),
  HandlerSpec, EndpointFactory/EndpointRequestCtor, and the structural
  `*RequestLike` interfaces the mixins/setters use for `this`-typing.
- **Dynamic route surface typed pragmatically** per the execution plan:
  WPAPI declares real members/statics plus `[ routeHandler: string ]: any`
  for the generated handler factories. Richer per-route types hang off
  Phase 4's precompute.

### Declarations (the Phase 2 workaround is gone)

`build/scripts/finalize-dist.js` no longer writes hand-written `index.d.*`;
tsdown's generated declarations are authoritative and constructable. The
script still rewrites `fetch.*` (runtime + declarations) as one-line
re-exports of `index.*` (single module instance for the alias subpath).
Strict scratch consumers live in `.scratchpad/type-consumer/` — positive
checks for require + import paths and the fetch alias, plus `negative.cts`
whose three intentional misuses must all error. Re-run these after any
build/dts change. The two "Failed to emit declaration" build warnings are
the exportless superagent stub (emits `export {}` — correct).

### Deliberate behavior deltas (surfaced, not silent)

- **Base `WPAPI()` bare call now throws** (constructor function → ES class;
  auto-new guard dropped). Unreachable from published entries since Phase 2
  (the bound subclass already threw); the `'enforces new'` unit test was
  updated first.
- **`isEmptyObject( null )` now returns `false`** (was `true`). The helper
  currently has no production callers (dead since the Phase 2 transport
  rewrite) — flagged as removable dead code, left in place.

### Post-merge fix: Node 22 CI failure (latent since Phase 2)

Main's CI Node 22 leg had been red since the Phase 2 merge, unnoticed
(local dev runs Node 24). Cause: `FormData#append( name, file, undefined )`
with an explicit third argument coerces the filename to the string
`"undefined"` on Node 18-22, clobbering a File attachment's own name;
Node 24+ treats a trailing undefined as absent. Fixed in fetch-transport's
`createUploadForm` by omitting the argument when there is no name override.
Lesson: run the transport suite under the oldest CI Node before merging
transport changes (`nvm exec 22 npx vitest run fetch/tests/unit`).

### Dependency notes

- Added `@types/node@^20` (vitest 4's peer floor; the published runtime
  floor is still Node 18 — types won't catch Node 19/20-only API use, so
  keep runtime code 18-safe; CI dist-smoke on 18 covers require-ability
  only), `@types/qs`, and an ambient `types/li.d.ts` (li has no published
  types).
- `parse-link-header` is a declared runtime dependency that nothing
  imports (pagination uses `li`). Candidate for removal — human call.
- The Dependabot alert (1 high) noted after the Phase 2 push is still
  unaddressed and unrelated to this phase.

## Dev workflow

```
npm install
npm run env:start     # boot wp-env (localhost:2747)
npm run env:seed      # once, against a fresh env
npm run lint          # eslint .
npm run typecheck     # tsc --noEmit
npm run build         # tsdown -> dist/ (ESM+CJS+UMD+.d.ts) + finalize-dist
npm run test:unit     # vitest, no WP needed
npm run test:integration
```

## Toolchain constraints (Phases 1-3, still true — read before touching the build)

- **TypeScript stays pinned to stable 5.x** (unpinned resolves to the tsgo
  7.x preview, which tsdown auto-selects and which masks CJS declaration
  errors; typescript-eslint requires `<6.1.0`).
- **No top-level ESM import declarations in `export =` source files** (the
  rolldown trap above).
- **One tsdown config per Node entry, each bundling its full closure** (a
  shared chunk breaks rolldown's CJS `module.exports` codegen).
- **Build tooling needs Node 22+**; published dist supports 18+ (CI
  dist-smoke checks that separately).
- **Integration tests share one wp-env DB**: keep `--no-file-parallelism`.

## Known gap (deferred to Phase 5)

- **`discover` / live-route bootstrap fails on modern WP** (unchanged since
  Phase 0; `describe.skip`-ped). The route-tree parser (`lib/route-tree.ts`)
  throws "Unterminated group" on routes whose named groups contain nested
  patterns. Default-mode instances are unaffected.

## Next: Phase 4 — build-time route precompute

Add a build script that runs `route-tree.build` over `default-routes.json`
and emits a pre-parsed tree/spec module; `wpapi.ts` bootstrap consumes it,
skipping runtime parse. Benchmark startup before/after (`.scratchpad/`).
This is also where richer per-route typings can be generated (the current
`[ routeHandler: string ]: any` surface is the hook point).

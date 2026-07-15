# Modernization Handoff

Living status doc for the node-wpapi modernization. See `modernization-plan.md`
(vision) and `modernization-execution-plan.md` (phased plan). Trunk is `main`;
each phase lands via a `--no-ff` merge.

## Current state: Phase 2 complete (transport modernization + superagent removal)

Full suite green against the local wp-env WordPress: `596 unit + 110
integration passed, 8 skipped, 0 failed`. Counts dropped from Phase 1's 805/16
for structural reasons, not lost coverage: the integration suites ran twice
via `describe.each` (superagent + fetch rows) and now run once, the old
superagent unit suite is replaced by a single stub test, and the still-skipped
discover suite now counts 8 instead of 16 for the same per-transport reason.
Coverage of the transport itself went *up*: `fetch/tests/unit/fetch-transport.js`
is new and exercises the transport internals directly (the pre-existing suite
only spied on the transport boundary).

### What Phase 2 did

- **`fetch/fetch-transport.js` rewritten on platform natives.** Global
  `fetch` (looked up at call time), native `FormData`/`Blob` for media
  uploads: Blob/File attachments append as-is, Buffers wrap in a Blob, and
  string paths are read from disk with the basename as default upload name.
  The `node:fs/promises` require is lazy, inside the path branch — browser
  bundles carry it inertly (that branch is meaningless in a browser) and the
  ESM build resolves it through rolldown's `createRequire` helper. Streams
  are no longer accepted (native FormData has no stream support); documented
  as breaking in the CHANGELOG. The review pass restored two behaviors the
  rewrite (and the alpha's fetch transport before it) had lost relative to
  v1's superagent default: the client-side unsupported-method guard
  (`checkMethodSupport` in every verb) and HEAD error rejection (`.headers()`
  on a missing resource now rejects with the response instead of resolving).
  All `global.*` references became `globalThis.*` — `global` is undeclared
  in browsers and the old webpack shim that papered over that is gone.
  Known behavior delta, accepted: path/Buffer uploads send the multipart
  part as `application/octet-stream` (native Blob carries no inferred MIME
  type, where the old form-data dependency inferred one from the filename).
  WordPress core resolves the real type from the filename — the media
  integration tests pass — but strict MIME-validating middlewares may
  differ; passing a typed Blob gives explicit control.
- **`.file()` validation extended** (`lib/constructors/wp-request.js`): a
  name is now required for any attachment that can't carry its own — Buffer
  (as before) or a Blob with no `name` of its own (a property check, not
  `instanceof File`, because the `File` global only exists from Node 20).
  Anything that isn't a path/Buffer/Blob/File — notably v1-era streams —
  is rejected with an explicit migration error instead of failing obscurely
  inside FormData.
- **Main is batteries-included again.** The tsdown `index` entry now builds
  from `fetch/index.js`, so `require('wpapi')` / `import WPAPI from 'wpapi'`
  makes HTTP requests out of the box (reverses the alpha's transport-less
  split). `wpapi/fetch` remains as an alias. The transport-less base
  (`wpapi.js` + `lib/bind-transport.js`) still exists in-source but is no
  longer its own dist entry.
- **`build/scripts/finalize-dist.js`** (last step of `npm run build`)
  post-processes tsdown's output: `dist/fetch.*` become one-line re-exports
  of `index.*` (tsdown otherwise emits two byte-identical ~95K bundles →
  two module instances, cross-entry `instanceof` failures), and
  `dist/index.d.*` are replaced with a hand-written interim declaration
  (constructable, known statics, permissive instance surface). The
  generated declaration was an anonymous non-constructable Function shape —
  bindTransport's untyped return — and typing it at the source hits the
  rolldown-plugin-dts cross-file CJS crash from Phase 1. Phase 3 should
  delete this workaround along with the JS→TS conversion of the entries.
- **superagent removed.** `superagent/superagent-transport.js` and its test
  suite deleted; `superagent/index.js` is a stub that throws a migration
  error at require time (kept as a tsdown entry so the `wpapi/superagent`
  subpath still resolves and errors helpfully, not with
  ERR_PACKAGE_PATH_NOT_EXPORTED). The wpapi-superagent UMD bundle is gone.
  `superagent`, `node-fetch` and `form-data` dropped from package.json;
  `build/browser-shims/` and its tsdown aliasing deleted (the Phase 1
  workaround existed only for those deps). `update-default-routes-json.js`
  (the last superagent consumer) now downloads via fetch.
- **CI dist-smoke extended**: Node 18/20 legs now also assert the main
  entry has a bound transport and the superagent stub throws its message.
- **`node-wpapi.php` fixed**: `'wp enqueue scripts'` → `'wp_enqueue_scripts'`,
  `__FILE` → `__FILE__` (the bundled plugin never actually worked).
- **Docs**: README install/upgrade/media/transport sections, `fetch/README.md`
  and `superagent/README.md` updated for the fetch-based default; CHANGELOG
  v2.0.0 entry rewritten as the final (non-alpha) breaking-change list. Full
  docs overhaul remains Phase 6.

### Known gap (deferred to Phase 5)

- **`discover` / live-route bootstrap fails on modern WP.** Unchanged from
  Phase 0. Still `describe.skip`-ped.
  - The route-tree regex parser (`lib/route-tree.js:83`) throws "Unterminated
    group" on routes whose named groups contain nested patterns, e.g.
    `wp/v2/templates/(?P<id>...)`. Default-mode instances are unaffected.

## Dev workflow

```
npm install
npm run env:start     # boot wp-env (localhost:2747)
npm run env:seed      # once, against a fresh env
npm run lint          # eslint .
npm run typecheck     # tsc --noEmit
npm run build         # tsdown -> dist/ (ESM+CJS+UMD+.d.ts)
npm run test:unit     # vitest, no WP needed
npm run test:integration
```

## Toolchain constraints (from Phase 1, still true — read before touching the build)

- **TypeScript stays pinned to stable 5.x.** Unpinned installs resolve to the
  experimental 7.x native preview (`tsgo`), which tsdown auto-selects and
  which tolerates CJS declaration patterns stable `tsc` rejects;
  `typescript-eslint` also requires `<6.1.0`.
- **One tsdown config per Node entry, each bundling its full closure.** A
  shared chunk across CJS entries breaks rolldown's `module.exports` codegen
  (last assignment silently wins).
- **`rolldown-plugin-dts` can't bundle CJS-shaped cross-file declarations.**
  It warns on every build (expected while source is CJS); where it hard-fails,
  widen the offending JSDoc type rather than fight it — until Phase 3 converts
  the source.
- **Build tooling needs Node 22+** even though the published dist supports
  18+ (CI's `dist-smoke` job checks that promise separately).
- **Integration tests share one wp-env DB**: keep `--no-file-parallelism`.

## Next: Phase 3 — TypeScript migration (incremental, leaf-up)

`tsconfig` with `allowJs`/`checkJs`, `strict`; convert in dependency order
(lib/util → pagination/mixins → route-tree/factories → wp-request → entries),
existing JSDoc as the typing basis. See execution plan Phase 3, and the
toolchain constraints above.

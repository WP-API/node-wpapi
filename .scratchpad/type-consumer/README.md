# Shipped-declaration consumer check

Strict-mode consumers exercising the generated `dist/*.d.*` typings after
`npm run build`. `consumer.cts`/`consumer.mts` must typecheck clean (require +
import paths, constructability, statics, chaining); every line flagged in
`negative.cts` must error (proves the types reject bad code, which is what
regressed in Phase 2).

Usage:

```
npx tsc --strict --noEmit --skipLibCheck --module node16 --moduleResolution node16 \
  --target es2020 .scratchpad/type-consumer/consumer.cts .scratchpad/type-consumer/consumer.mts
npx tsc --strict --noEmit ... .scratchpad/type-consumer/negative.cts  # expect 3 errors
```

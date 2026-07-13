# Modernization Plan

This repository was a useful thing for the community, but has atrophied due to lack of maintenance on my part since before the pandemic.

It could still be useful, if modernized, but there's a few things we'd need to tackle

- First, it's old -- atrophied build infra, etc. Need to bring the project up to code. Maybe switch build to use wp-scripts with a custom webpack file, for parity with other ecosystem projects? Or vite, I don't really care. I just know that it needs to be shippable in a modern way that doesn't involve a ton of outdated dependencies.
- Second, as a part of that we need to update all our dependencies. Which of these do we not need anymore? Can we 
- Third, we need to keep it updated for modern WP; lots of new block editor routes.

Once that's done, We'd like to migrate to TypeScript and begin working through our issue backlog.

## Process

There is now a wp-env local environment. Use that to develop locally; if a route needs a non-localhost (HTTPS, multisite) context, keep track of which ones need testing in another environment and we can set something up later.

## Model orchestration

Use Fable as an advisor, ask it for review before considering a feature solved. Split out subtasks with cheaper agents whenever reasonable. Be smart about how you operate to achieve the best outcome.

## Rules of Engagement

`main` is rewrite-trunk.

For each _incremental_ (not parallel) feature task, create a temporary branch named appropriately, work there, and then merge it into main with `--no-ff`.

Commit granularly, explain what's changing in the description, write and chunk commits for HUMAN understanding.

Push to `main` incrementally when feature branches are complete and merged, never push to other branches without asking.

Break tests first, then make them pass.

Keep temporary scripts around if they're likely to be re-used, `.scratchpad/` feels like a good place. Add brief comment describing purpose and usage. Emphasis on Brief, I know these are written by and for agents.

Keep a "handoff.md" document updated when you hit major checkpoints, describing what we've accomplished and what the next steps are in a token-conscious way.

We do want to migrate to TypeScript, and we'd like to pre-compute the initialization of the package to save startup processing time (can we render that out in some way? There was a nascent "precompute things you can determine statically" node project, but it never went anywhere...) but not at the expense of maintainability; the more we can mirror and _gradually_ shift the shape of this repo, the better. It should look like a modern, professional project at the end, and be easily comprehensible by contributors of a variety of skill levels.

### Back Compat

We will want this to be an easy upgrade for consumers of the library. That probably means shipping a compatibility shim if API signatures or function names change. While you work, keep in mind a desire to minimize downstream impact; only change the overall structure or API signature if it's really architecturally necessary. And keep thinking about whether/how we can provide a shim if needed.

## Issues triage

Get to "current baseline functionality, but working with modern WP", then move on to docs triage.

Using the `gh` CLI, look through the issues backlog and make me a report of which can be closed (dependencies, vulnerabilities, etc), which deserve human responses (there's a lot of support requests so categorize as support, feature request, etc) and evaluate which are highest-value to action.

NEVER UPDATE ISSUES DIRECTLY. Tell me recommendations, and I will execute.

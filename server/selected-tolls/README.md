# Selected toll sections — planner with bounded live evidence

This module is not wired into the public application. The live proof injects the routing relay as its calculator. The pure module has no endpoint, key, storage or GPS access. Its injected calculator was exercised against the free Cloudflare/ORS relay on one public route. It must not be exposed as a working public feature before real-service qualification and the guidance/station integration described in V110.

Run `npm run test:selected-tolls`. The 35 model tests use synthetic fixtures. Existing routing-relay tests are separate.

`normalizeOrs` expects complete edge attributes and graph/profile provenance. `sections` identifies contiguous paid ranges with both boundaries inside the reference route. These graph boundaries are not certified interchange names or real-world access permissions. `createPlanner` calculates the two free approaches and the exact chosen range, then requires an explicit confirmation of the unchanged proposal. Its callback must return trusted normalized routes. A structurally valid price URL does not authenticate a tariff; the adapter must validate price provenance.

The planner intentionally rejects uncertain joins and attribute ambiguity. Exact geometry equality is a conservative contract verified on one public Lyon–Valence sample on 28 November 2026; broader snapping/resampling and physical access remain unqualified. Car profiles with declared tariff classes 1/2 do not qualify caravan or heavy-vehicle routing. Reference and baseline discovery, instructions, station insertion, off-route recalculation, quotas and deployment remain outside this module.

See `docs/specifications/OuQuandQui_API_V110_Portion_Payante_2026-11-27.md` for requirements, investigation and remaining acceptance work. Local probe and browser receipts are under `quality/selected-toll-sections`; this ignored proof directory is retained on ACTUEL_4To.

Live proof and limits: V112 and `quality/routing-live-20261128/worker-proof.json`. Keep response receipt on the local clock for expiry checks; retain the provider timestamp separately. `MODEL_ONLY_NOT_LIVE` is the pure planner’s conservative output marker, not a claim that the injected calculator never called a service. It must not be promoted automatically to a navigation qualification.

## Instruction and stop adapter (V113)

`route-adapter.mjs` validates structured ORS steps and roundabout exits, then verifies overlapping instruction windows at calculation boundaries. A bridge must reproduce the exact geometry, graph and edge attributes; it cannot silently change the selected road. Overlapping windows coalesce. Genuine stops retain arrival/departure, while toll calculation boundaries do not. Original first-turn evidence is retained at each replacement window; no turn is inferred from bearings or street names. Final metrics are sums of the assembled instructions and must be used in the confirmation UI.

`withOutsideStop` proposes one stop before or after the paid portion. Its two accesses must avoid tolls and keep other exclusions, with at most 20m initial snapping and exact joins thereafter. It returns a new immutable proposal requiring confirmation, with no carried-over price; it never changes application state. Entry to a physical fuel station is not certified by proximity. Stops inside the paid portion and recalculation from a moving GPS position remain outside this adapter.

35 adapter regressions include an attributed public ORS archive. The complete local suite has 861 passing controls (115 targeted). Live proofs under `quality/selected-toll-adapter` record five route/join calls and seven calls for a public test stop. The common guidance model accepts both. Archived-response browser execution is distinct from a published UI or Android test. Publication and application integration remain pending; auto mode resumed on 28 November 2026.

# Portion payante choisie — pilote intégré V114

Les modules sont montés dans l’écran de préparation de DragonRoute, avec le fournisseur isolé `ors-selected`, les stations et le guidage. Leur activation est limitée au pilote `selectedTollPilot`, voiture au plus rapide. Voir V114 pour le périmètre et les preuves actuels. Le banc navigateur `tests/fixtures/selected-tolls/dialog.html` emploie un réseau fictif et ne constitue pas une application parallèle à livrer.

## Contrats disponibles

- `client.mjs` : calcul voiture à deux points via le relais gratuit existant. Aucun secret, profil ou libellé d'adresse envoyé ; pas de redirection, de nouvelle tentative ou de fournisseur de secours. Réponses limitées à 4 Mio, fraîcheur à la réception locale, cache mémoire de 12 réponses au plus pendant 60 secondes sans renouveler leur date, attente explicite après quota.
- `session.mjs` : référence avec péages et référence gratuite, sélection, raccordements et indications, comparaison, confirmation unique. Le contexte comprend une courte révision, deux coordonnées longitude/latitude, voiture, classe déclarée 1/2, date, critère `fastest` et évitements dont `tollways`. Un changement de contexte, une annulation ou une réponse tardive empêche l'adoption. `validateRoute` permet au contrôleur hôte de vérifier le modèle de guidage avant de consommer la confirmation. `confirm` retourne un instantané ; le contrôleur hôte reste seul responsable de modifier le trajet.
- `dialog.mjs` : fenêtre responsive montée dans l'interface existante. Sélection radio, schéma et comparaison distance/durée, tarif inconnu, plafond strict facultatif, aides repliées, annulation/Escape et restitution du focus. Le callback `onAdopt` doit effectuer l'adoption atomique dans le contrôleur existant. Aucun enregistrement ou GPS démarré par la fenêtre.
- `navigation.mjs` : progression `before` → `within` → `after` issue d'une position de guidage qualifiée ; passage irréversible. Le recalcul conserve la portion entière avant l'entrée, seulement son suffixe dans le même sens pendant le passage, et aucune exception après la sortie. Jamais de retour demandé à l'entrée après passage. Un arrêt réel restant avant/après la portion est conservé ; pas d'arrêt supposé à l'intérieur.

## Adoption du recalcul

`selectedProgress(selection, route, guidanceState, previous, revision, now)` reçoit le format de `guidanceTrack` existant. Une position douteuse/hors route n'avance pas l'état connu. Une progression de plus de 60 secondes ou une position de plus de 15 secondes ne déclenche pas de nouvelle requête.

`recalculateSelected(input, {calculate, now, signal})` retourne une proposition liée au contexte. `confirmRecalculation(proposal, selection, progress, revision, {now, position})` exige encore une position récente à moins de 50 m de l'origine du calcul, la même progression/révision et une proposition non consommée. `bindRecalculation(proposal, newRevision)` est unique et conserve la phase/minimum de portion tout en remettant la progression relative à zéro ; un nouveau point fiable est nécessaire avant le prochain recalcul. Le prix reste inconnu.

## Contrôleur intégré

`tests/build-selected-tolls.mjs --write` assemble les six modules dans `DragonRoute/app.js`. Le contrat du dépôt vérifie l’identité du bloc généré. Les six ressources de publication existantes restent suffisantes ; aucun ancien aperçu ne dépend de nouveaux fichiers.

Le contrôleur conserve le trajet précédent jusqu’à confirmation, invalide les anciens arrêts et budgets lors de l’adoption, et permet un retour explicite. `routingApi` reste inchangé. `guidanceModel` exige la provenance openrouteservice et les instructions qualifiées pour `ors-selected`.

Stations : un arrêt avant ou après, géométrie payante conservée, comparaison/confirmation datées. Une candidate par action pour préserver le quota gratuit. Guidage : `selectedProgress`, propositions de recalcul puis confirmation/binding de la nouvelle révision ; pas de retour à l’entrée après passage. Une station restante à la fois. Les plafonds globaux restent 100/jour UTC et 10/minute ; aucune répétition automatique après refus.

Sauvegarde de préparation, copie vers journal, rencontres et itinéraires multiples sont explicitement indisponibles avec l’exception jusqu’à définition de leur format. Les enregistrements existants restent intacts. Les liens externes de navigation ne perdent pas silencieusement la sélection. Prix inconnu, jamais zéro déduit de `avoid: tollways`.

Vérifications : 901 contrôles, sept tests d’assemblage, 126 parcours Chromium ciblés. Le scénario public Lyon–Valence et la station DGCCRF 69310004 produisent respectivement 28 et 38 instructions, une puis deux étapes, en dix réponses HTTP200 avec cache partagé. Le point routier est à 0,71m de la coordonnée DGCCRF ; accès physique non certifié. Preuves locales conservées dans `quality/selected-toll-integrated` ; rapports GitHub/aperçu rattachés au commit de livraison.

Les vérifications de navigateur utilisent un GPS/réseau simulé et ne remplacent pas la recette physique Android. Le tarif exact, les données routières et l'accès physique conservent leurs limites.

## Références et contrats antérieurs conservés — V112/V113

Les paragraphes ci-dessous conservent les qualifications antérieures V112/V113. Leurs mentions de raccordement encore attendu décrivent ces états historiques ; le pilote V114 ci-dessus les remplace. Au point de préparation précédent : 900 contrôles,14 cas Chromium et12 Firefox ; WebKit local ne démarrait pas, sans résultat applicatif.

### Planner with bounded live evidence

This module is not wired into the public application. The live proof injects the routing relay as its calculator. The pure module has no endpoint, key, storage or GPS access. Its injected calculator was exercised against the free Cloudflare/ORS relay on one public route. It must not be exposed as a working public feature before real-service qualification and the guidance/station integration described in V110.

Run `npm run test:selected-tolls`. The 35 model tests use synthetic fixtures. Existing routing-relay tests are separate.

`normalizeOrs` expects complete edge attributes and graph/profile provenance. `sections` identifies contiguous paid ranges with both boundaries inside the reference route. These graph boundaries are not certified interchange names or real-world access permissions. `createPlanner` calculates the two free approaches and the exact chosen range, then requires an explicit confirmation of the unchanged proposal. Its callback must return trusted normalized routes. A structurally valid price URL does not authenticate a tariff; the adapter must validate price provenance.

The planner intentionally rejects uncertain joins and attribute ambiguity. Exact geometry equality is a conservative contract verified on one public Lyon–Valence sample on 28 November 2026; broader snapping/resampling and physical access remain unqualified. Car profiles with declared tariff classes 1/2 do not qualify caravan or heavy-vehicle routing. Reference and baseline discovery, instructions, station insertion, off-route recalculation, quotas and deployment remain outside this module.

See `docs/specifications/OuQuandQui_API_V110_Portion_Payante_2026-11-27.md` for requirements, investigation and remaining acceptance work. Local probe and browser receipts are under `quality/selected-toll-sections`; this ignored proof directory is retained on ACTUEL_4To.

Live proof and limits: V112 and `quality/routing-live-20261128/worker-proof.json`. Keep response receipt on the local clock for expiry checks; retain the provider timestamp separately. `MODEL_ONLY_NOT_LIVE` is the pure planner’s conservative output marker, not a claim that the injected calculator never called a service. It must not be promoted automatically to a navigation qualification.

### Instruction and stop adapter (V113)

`route-adapter.mjs` validates structured ORS steps and roundabout exits, then verifies overlapping instruction windows at calculation boundaries. A bridge must reproduce the exact geometry, graph and edge attributes; it cannot silently change the selected road. Overlapping windows coalesce. Genuine stops retain arrival/departure, while toll calculation boundaries do not. Original first-turn evidence is retained at each replacement window; no turn is inferred from bearings or street names. Final metrics are sums of the assembled instructions and must be used in the confirmation UI.

`withOutsideStop` proposes one stop before or after the paid portion. Its two accesses must avoid tolls and keep other exclusions, with at most 20m initial snapping and exact joins thereafter. It returns a new immutable proposal requiring confirmation, with no carried-over price; it never changes application state. Entry to a physical fuel station is not certified by proximity. Stops inside the paid portion and recalculation from a moving GPS position remain outside this adapter.

35 adapter regressions include an attributed public ORS archive. The complete local suite has 861 passing controls (115 targeted). Live proofs under `quality/selected-toll-adapter` record five route/join calls and seven calls for a public test stop. The common guidance model accepts both. Archived-response browser execution is distinct from a published UI or Android test. Publication and application integration remain pending; auto mode resumed on 28 November 2026.

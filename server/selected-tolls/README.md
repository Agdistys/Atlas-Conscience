# Portion payante choisie — intégration locale en cours

Les modules sont qualifiés séparément. L'application publiée reste inchangée : ces modules ne sont pas encore montés dans son écran de préparation. Le banc navigateur `tests/fixtures/selected-tolls/dialog.html` emploie un réseau fictif et ne constitue pas une application parallèle à livrer.

## Contrats disponibles

- `client.mjs` : calcul voiture à deux points via le relais gratuit existant. Aucun secret, profil ou libellé d'adresse envoyé ; pas de redirection, de nouvelle tentative ou de fournisseur de secours. Réponses limitées à 4 Mio, fraîcheur à la réception locale, attente explicite après quota.
- `session.mjs` : référence avec péages et référence gratuite, sélection, raccordements et indications, comparaison, confirmation unique. Le contexte comprend une courte révision, deux coordonnées longitude/latitude, voiture, classe déclarée 1/2, date, critère `fastest` et évitements dont `tollways`. Un changement de contexte, une annulation ou une réponse tardive empêche l'adoption. `validateRoute` permet au contrôleur hôte de vérifier le modèle de guidage avant de consommer la confirmation. `confirm` retourne un instantané ; le contrôleur hôte reste seul responsable de modifier le trajet.
- `dialog.mjs` : fenêtre responsive à monter dans l'interface existante. Sélection radio, schéma et comparaison distance/durée, tarif inconnu, plafond strict facultatif, aides repliées, annulation/Escape et restitution du focus. Le callback `onAdopt` doit effectuer l'adoption atomique dans le contrôleur existant. Aucun enregistrement ou GPS démarré par la fenêtre.
- `navigation.mjs` : progression `before` → `within` → `after` issue d'une position de guidage qualifiée ; passage irréversible. Le recalcul conserve la portion entière avant l'entrée, seulement son suffixe dans le même sens pendant le passage, et aucune exception après la sortie. Jamais de retour demandé à l'entrée après passage. Un arrêt réel restant avant/après la portion est conservé ; pas d'arrêt supposé à l'intérieur.

## Adoption du recalcul

`selectedProgress(selection, route, guidanceState, previous, revision, now)` reçoit le format de `guidanceTrack` existant. Une position douteuse/hors route n'avance pas l'état connu. Une progression de plus de 60 secondes ou une position de plus de 15 secondes ne déclenche pas de nouvelle requête.

`recalculateSelected(input, {calculate, now, signal})` retourne une proposition liée au contexte. `confirmRecalculation(proposal, selection, progress, revision, {now, position})` exige encore une position récente à moins de 50 m de l'origine du calcul, la même progression/révision et une proposition non consommée. `bindRecalculation(proposal, newRevision)` est unique et conserve la phase/minimum de portion tout en remettant la progression relative à zéro ; un nouveau point fiable est nécessaire avant le prochain recalcul. Le prix reste inconnu.

## Raccordement restant avant activation publique

1. Monter la fenêtre dans `DragonRoute`, après un trajet voiture au plus rapide ; comparer explicitement avec évitement des péages. Utiliser un jeton de révision court, dont le contrôleur renouvelle la valeur lorsque la signature complète du trajet change.
2. Adopter via un chemin de calcul distinct : ne pas brancher le relais deux points sur `routingApi`, qui active aussi poids lourds et calculs multiples. Reprendre le modèle de guidage avec provenance ORS explicite, sans le présenter comme OSRM.
3. Préserver la sélection lors de l'ajout/retrait d'une station et du recalcul GPS. Qualifier une entrée de station réelle, le calcul de son détour, le retour et la reprise. Les tests de halte témoins ne valident pas une station.
4. Empêcher les anciennes sauvegardes, rencontres/multi-arrêts et autres contrôleurs de perdre silencieusement l'exception. Le budget ne peut supposer « zéro péage » à partir de l'évitement général. Définir le contrat d'enregistrement avant d'autoriser la sauvegarde de cette nouvelle forme de trajet.
5. Assembler les modules dans les ressources existantes ou adapter le manifeste de publication sans casser les anciens aperçus. Mettre à jour les empreintes PWA après modification des ressources applicatives, puis tester les parcours intégrés, publier/vérifier l'aperçu de PR. Aucun merge main.

Les vérifications de navigateur utilisent un GPS/réseau simulé et ne remplacent pas la recette physique Android. Le tarif exact, les données routières et l'accès physique conservent leurs limites.

## Références et contrats antérieurs conservés — V112/V113

Les nombres de contrôles et étapes ci-dessous décrivent les qualifications antérieures. La suite courante compte 900 contrôles ; la fenêtre a 14 scénarios Chromium et 12 Firefox réussis. WebKit local ne démarre pas (erreur du navigateur), sans résultat applicatif. Le raccordement à l’application et la publication restent à effectuer.

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

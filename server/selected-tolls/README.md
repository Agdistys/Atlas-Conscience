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

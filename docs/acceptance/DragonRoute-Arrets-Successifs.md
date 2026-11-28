# Préparations à plusieurs arrêts — critères d’acceptation

Référentiel : [V088](../specifications/OuQuandQui_API_V088_Arrets_Successifs_2026-11-22.md). Cette livraison étend les préparations ; elle ne remplace pas le trajet principal ni ses confirmations de péages.

- Deux ou trois stations explicites ; ordre modifiable, doublons empêchés, départ/arrivée fixes, prise en charge avant dépose.
- Recalcul de toutes les portions avec le même critère et les mêmes exclusions, validation des métriques et des points ; pas d’addition de détours indépendants.
- Aperçu puis confirmation, annulation et panne sans perte du dernier parcours confirmé, réponse tardive ignorée, modification invalidant l’aperçu.
- Pauses et quantités facultatives : inconnu distinct de zéro ; capacité, réserve, panne théorique et dépassement traités sans plein implicite.
- Consommation et achats distincts ; prix anciens exclus, budget total incomplet en l’absence de péages qualifiés ; distance partagée recalculée sans contribution inventée.
- Sauvegarde locale volontaire, format et environnement propres, originaux conservés ; import prévisualisé et confirmé, conflits et corruption sans écrasement ; exports GPX/JSON complets.
- Ordinateur, tablette, petits écrans, clavier et texte agrandi ; contrôles d’accessibilité automatisés, sans téléphone physique prétendu testé.

Les fichiers `tests/multi-stops.test.mjs` et `tests/e2e/multi-stops.spec.mjs` portent ces scénarios. Deux parcours essentiels rejoignent la matrice Firefox/WebKit. Les régressions de l’aperçu à une station, des sources et du stockage restent actives.

Observation de services publics le 22 novembre 2026 : IGN a renvoyé six portions pour sept points et OSRM trois portions pour quatre points entre Lyon et Valence. Les portions et la géométrie ont passé le validateur. Cette recette ne vérifie ni l’accès réel à une station ni la praticabilité d’une route.

La preuve de publication associe le commit exact, l’inspection complète, les ressources réellement servies, les vues et un parcours public. Elle est conservée dans le suivi central du développement ; la publication n’est acquise qu’après ces contrôles.

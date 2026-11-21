# V074 — Pages des stations et continuité carte–fiche

STA-LISTE-LONGUE-01 · 21 novembre 2026. Complète STA-12, UX-02/04/05 et QUA-11 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [collecte par groupes V045](OuQuandQui_API_V045_Stations_Suivantes_2026-11-19.md), les [points V060](OuQuandQui_API_V060_Points_Stations_2026-11-20.md) et la [lecture V073](OuQuandQui_API_V073_Preparation_Lisible_2026-11-21.md). Les éditions précédentes restent conservées.

## Parcourir toutes les fiches comparées

La liste affiche au plus vingt fiches par page. Au-delà, les commandes au début et à la fin indiquent la page, les numéros de fiches affichées et le nombre total sous les filtres actifs. « Première page », « Précédente » et « Suivante » permettent de parcourir tous les résultats. Les commandes impossibles sont désactivées. Une liste de vingt fiches ou moins masque cette navigation.

Changer de page consulte les résultats déjà reçus. Cette action n’appelle aucun service et n’écrit pas dans le profil. La commande existante de poursuite des comparaisons reste distincte : elle interroge de nouvelles candidates. La pagination ne rend donc pas une recherche partielle exhaustive.

## Tris, filtres et identité

Les filtres, tris, recommandations et badges sont calculés sur l’ensemble des stations comparées admissibles, avant découpage en pages. Les ex æquo restent accessibles, même lorsque les recommandations dépassent vingt fiches. Un changement de tri ou de filtre revient au début du nouvel ensemble. Une continuation conserve la première station de la page courante si elle existe encore, même si sa place change.

Le numéro du point, l’identifiant, le favori et l’arrêt choisi restent attachés à la station. Tourner une page ne change ni le trajet adopté ni les classements. Les points de la carte représentent toutes les stations retenues, y compris celles des autres pages ; un arrêt choisi conservé hors filtre reste explicitement signalé. Une nouvelle recherche retire les anciennes pages. Une panne lors d’une continuation conserve les résultats déjà comparés ; une réponse annulée ne les réintroduit pas.

## Carte, fiche et bonne page

Ouvrir une fiche depuis la carte rejoint sa page dans la liste lorsqu’elle y figure déjà. Le bouton « Voir dans la liste » ferme la fiche et place le focus sur sa commande de détail. Lorsqu’une station admissible ne figure pas parmi les recommandations, « Voir parmi toutes les stations » ouvre explicitement la liste complète en conservant les filtres. Une station exclue par les filtres ne propose pas cet accès ; les filtres ne sont jamais effacés silencieusement.

Fermer une fiche ouverte depuis une carte de la liste revient à la même station, même si un nouveau rendu a remplacé son élément. Si l’évolution de la fraîcheur l’exclut, le focus revient au titre des résultats. Le retour depuis l’aperçu d’un arrêt retrouve également sa page. Les fenêtres de choix des points conservent leur retour au point d’origine.

## Points superposés

Le contrôle avec cent stations très proches a révélé des portions cliquables minuscules entre les points. Les points dont les cibles se recouvrent sont désormais regroupés visuellement : un représentant conserve une cible entière, et son activation, à la souris ou au clavier, ouvre le choix des stations concernées. Le point sélectionné ou actuellement au clavier est prioritaire. Le zoom et le déplacement recalculent ces groupes.

Les coordonnées, numéros et identifiants ne sont pas déplacés. Les stations masquées par un représentant restent accessibles dans le choix local et dans le répertoire de la carte. Cette amélioration concerne la sélection des points ; elle ne certifie pas la précision géographique d’une entrée de station.

## Vérifications et limites

Sur le même jeu de cent stations fictives et le même format ordinateur, le conteneur passe de cent fiches sur environ 49 121 pixels de hauteur à vingt fiches sur 9 828 pixels par page ; les cent identifiants sont atteints en cinq pages. Il s’agit d’une mesure de disposition, pas d’un gain de vitesse ni d’une évaluation de compréhension.

Neuf scénarios dédiés couvrent cent fiches, les tris et filtres globaux, les ex æquo, Leaflet et le schéma, les continuations échouées, le favori et l’arrêt, l’expiration des prix, l’annulation et la lecture en paysage avec texte doublé. Les contrôles vérifient l’absence de requêtes et d’écritures lors d’un changement de page. Deux de ces parcours rejoignent la recette obligatoire Firefox/WebKit dans quatre configurations : cinquante-six cas par configuration, soit 224 essais attendus. Aucun ancien scénario n’est retiré.

Les résultats définitifs sont liés au commit dans le rapport publié et le suivi autonome. Le jeu de cent stations est fictif ; les consultations de services réels sont consignées séparément après publication. Les vérifications automatiques et visuelles sur navigateur ne constituent ni un essai sur appareil physique, ni une réception humaine, ni une garantie de couverture nationale. Les capacités fournisseurs et règles de confirmation restent celles des chapitres précédents.

# V060 — Sélection des stations sur la carte

QUA-CARTE-01 · 20 novembre 2026. Complète QUA-04/11, STA-11/12 et UX-04/05 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), les [comparaisons par groupes V045](OuQuandQui_API_V045_Stations_Suivantes_2026-11-19.md), la [confirmation d’un arrêt V055](OuQuandQui_API_V055_Apercu_Station_2026-11-20.md) et la [lecture agrandie V059](OuQuandQui_API_V059_Lecture_Paysage_2026-11-20.md). Éditions antérieures conservées.

## Points et choix des stations

Chaque station conserve son point, son numéro et son identité dans la liste. La cible des stations mesure au moins 44 × 44 pixels CSS sur la carte Leaflet et sur le schéma de secours ; elle atteint 80 × 80 avec la police racine doublée. Le schéma compense son échelle pour conserver cette taille à l’écran lors du redimensionnement. Les positions géographiques restent inchangées.

Un signe « + » indique qu’un point en chevauche un autre au niveau de zoom courant. Un clic sur ce point ouvre une fenêtre listant les stations dont les cibles le recouvrent. Il reste possible de zoomer pour les séparer. Au clavier, Entrée ou Espace ouvre directement la fiche du point actif, dont le nom accessible comporte le numéro et l’adresse. Les fiches et favoris réutilisent la même identité que les résultats.

Une commande portant le symbole de station et leur nombre ouvre toutes les stations représentées sur la carte. Elle inclut les résultats satisfaisant les filtres et l’arrêt choisi s’il est conservé hors filtre. Son contenu ne se limite pas aux recommandations affichées dans le panneau, ni au cadrage actuel de la carte. Aucune station comparée et admise par les filtres ne devient inaccessible sous un autre point.

La fenêtre trie les stations par numéro stable. Une recherche locale permet de retrouver un numéro, une commune ou une adresse, sans distinction de casse ou d’accents. L’absence de correspondance est indiquée ; effacer la recherche restaure la liste. Ouvrir, rechercher et fermer cette fenêtre ne provoque aucune requête de routage ou de carburant, ni écriture dans le profil.

## Fiches, confirmations et retour à la carte

Fermer une fiche ramène le focus au choix correspondant, ou au point qui l’a ouverte directement. Fermer le choix des stations ramène au point d’origine ou à la commande de la carte. Si un redessin a remplacé un élément, le retour utilise son identifiant stable. Tabulation, tabulation inverse et Échap restent utilisables, y compris en paysage avec texte agrandi.

Le bouton de choix dans la fiche ferme cette fenêtre intermédiaire et ouvre l’aperçu existant de l’arrêt. L’adoption exige toujours sa confirmation. Un refus conserve le trajet précédent. Si la station ne figure pas dans les recommandations du panneau, le focus revient à son point sur la carte. Un changement des critères de recherche supprime les résultats et ferme les choix devenus obsolètes. Les filtres actualisent le nombre et les points ; un arrêt conservé hors filtre est explicitement désigné dans la liste de la carte.

Cette évolution ne modifie ni les prix, ni les classements, ni les critères de routage ou les limites de collecte. Aucun regroupement géographique n’efface les points. Aucun fournisseur ou enregistrement automatique n’est ajouté.

## Recette et limites

Dix scénarios sont exécutés sur les quatre formats habituels. Ils couvrent les deux rendus, les cibles mesurées, le clavier, les points superposés, les favoris, les filtres, la confirmation et son refus, l’invalidation des résultats, le retour du focus et la faible hauteur avec texte doublé.

Le cas dense reçoit 100 stations simulées et les compare par cinq groupes de 20, au moyen du parcours normal de continuation. Les 100 points et les 100 lignes du choix restent accessibles ; la station numéro 100 peut être recherchée et sa fiche consultée. Le nombre de requêtes et l’absence d’écriture implicite sont contrôlés. Les durées locales jointes au rapport incluent l’orchestration du navigateur : elles constituent des observations de cette recette, pas une garantie de fluidité sur un téléphone physique.

La qualification locale et l’intégration continue utilisent Chromium et des réponses déterministes. L’aperçu publié doit aussi être vérifié avec des lieux publics et des services réels. Ces essais ne valent pas validation de Safari, d’un lecteur d’écran, de tous les appareils ou d’un déplacement réel. Les preuves datées de livraison figurent dans l’état et le journal du développement automatique.

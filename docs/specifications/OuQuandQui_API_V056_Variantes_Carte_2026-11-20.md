# OùQuandQui — Choisir une variante depuis la carte

V056 · 20 novembre 2026 · TRA-ALTERNATIVES-CARTE-01. Complète TRA-02/03/05/06/08 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [comparaison de critères V054](OuQuandQui_API_V054_Choix_Routiers_2026-11-20.md) et l’[aperçu station V055](OuQuandQui_API_V055_Apercu_Station_2026-11-20.md). Éditions précédentes conservées.

## Parcours

Après un calcul qui renvoie plusieurs trajets, les repères T1, T2 et T3 identifient les mêmes propositions sur la carte et dans la liste. Chaque choix indique distance et conduite estimée. Le trajet retenu reste bleu foncé avec contour blanc ; les autres tracés sont bleu clair et dessinés en premier. Les parties communes ne masquent pas le principal. Un repère n’est pas une étape ajoutée au trajet. Un changement de taille de la carte recadre les tracés et leurs extrémités sans recalcul routier, y compris après la fin d’un zoom en cours. Le cadrage automatique est immédiat ; le zoom manuel conserve son animation.

Cliquer un tracé alternatif ou son repère ouvre la même comparaison que le bouton de la liste. Les repères et les tracés Leaflet sont accessibles par Entrée et Espace ; la liste reste une commande équivalente. Sans Leaflet, un schéma géographique explicitement nommé conserve les tracés et repères utilisables au clavier. Le tracé courant n’est pas remplacé à l’ouverture.

La fenêtre compare distance et conduite du trajet actuellement affiché, y compris son éventuelle station, avec le trajet direct proposé. Les écarts sont signés et calculés à la précision affichée, 0,1 km et 0,1 minute. Pause carburant, autres pauses et trafic en direct ne sont pas ajoutés aux durées de conduite. La date d’obtention, le moteur et les contraintes sont rappelés.

## Confirmation et effets

« Conserver le trajet actuel » ou Échap laisse route, arrêt, rencontres, budget et sauvegardes en place. Le focus revient à la commande utilisée.

Avant confirmation, le panneau explique le retrait des stations comparées, de l’arrêt choisi et des rencontres ou de leur brouillon lorsqu’ils sont présents. Les tarifs de péage associés à l’ancien trajet doivent être vérifiés à nouveau. Le prix provenant de l’arrêt retiré n’est pas transféré ; les hypothèses personnelles de consommation et de prix sont conservées. Les souvenirs budgétaires restent historiques, sans réappliquer leurs confirmations.

Confirmer adopte la géométrie déjà reçue, sans appel de routage, de carburants ni de péages déclenché par cette adoption. Les devis en attente sont invalidés ; un éventuel nouveau devis nécessite la commande explicite. Carte, kilomètres, conduite, horaires, budget, navigation et export GPX suivent le choix retenu. La recherche de stations doit être relancée volontairement. Une préparation demeure une sauvegarde explicite ; aucun nouveau format, migration ou écrasement d’une préparation existante.

Une modification du contexte rend une proposition ouverte inutilisable. Un nouveau départ, une nouvelle arrivée ou des options invalidantes ferment cette fenêtre avec les anciens résultats. Les actions sont ignorées pendant un calcul déjà en cours. Aucune réponse tardive de péage ne rétablit le tarif de l’ancienne route.

## Nombre et identité des propositions

Seuls les résultats réellement reçus et exploitables deviennent des choix. Les géométries exactement identiques, longitude/latitude dans le même ordre, sont regroupées : la première occurrence et ses métriques sont conservées. Le regroupement ne repose ni sur une durée similaire ni seulement sur les extrémités. Le fournisseur reste responsable de la cohérence de ses données ; aucun tracé approché n’est fabriqué.

L’ordre du moteur est conservé, avec trois tracés distincts au plus. Le réglage de déploiement facultatif `routeChoiceLimit` accepte les entiers 1, 2 ou 3 ; absent ou invalide, il vaut 3. Ce réglage limite l’affichage des résultats reçus, sans demander davantage de propositions au moteur. Les numéros restent stables lors d’un changement de variante dans une même recherche.

Une seule proposition laisse une seule route : pas de boutons supplémentaires ni de repères de variantes. Une panne ou une nouvelle recherche retire les anciennes alternatives. Avec un arrêt station, les anciennes variantes directes ne sont pas superposées au trajet modifié ; elles restent consultables depuis la liste, avec la confirmation de retrait de l’arrêt. Les contrôles propres aux moteurs et aux contraintes demeurent actifs.

## Vérification et limites

Contrôles du regroupement, du plafond, des données invalides et du positionnement des repères. Parcours navigateur : carte et liste, clavier et formats tactiles, refus, adoption, budget, brouillon de rencontre, arrêt station, contexte périmé, réponse unique, panne, sauvegardes inchangées et GPX. Les tests existants de variantes utilisent la confirmation visible.

Les réponses simulées vérifient le comportement ; la version publiée fait l’objet d’une recette séparée avec lieux publics et données réellement consultées. Aucun téléphone physique, trajet effectué, garantie d’accessibilité, état du terrain ou qualification poids lourd n’est déduit de ces vérifications.

Le nombre d’alternatives dépend du moteur et du trajet. Les profils caravanes/poids lourds, les péages nationaux et le service public sans péage restent soumis à leurs limites propres. Ce lot n’ajoute ni fournisseur, ni compte, ni coût, ni hébergement.

Référence : [Leaflet 1.9.4 — couches interactives et repères](https://leafletjs.com/reference-1.9.4.html). L’activation au clavier est explicitement reliée à la même action que le clic.

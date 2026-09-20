# DragonRoute : preparation du trajet

Lot de la PR 5, 18 septembre 2026. Complete DragonRoute-Public-Vehicules.md sans activer de service externe.

## Perimetre

- Disponibilites rendues explicites avant recherche : exclusions desactivees si routingApi est vide ; poids lourd indisponible sans service ; caravane/utilitaire toujours non valides. Les profils existants sont conserves, aucun remplacement silencieux par une voiture.
- Geocodage a la demande, maximum 5 candidats et choix modal sans preselection. Annuler/echap debloque les commandes. Libelles complets resolus. Coordonnees invalides rejetees, contenus rendus en texte.
- Nominatim : cache borne 30 recherches en memoire, 1,1 s entre appels d'une page, pas d'autocompletion. Ce n'est pas un quota global pour une application publique a grande echelle.
- Budget carburant selon le trajet affiche, pas les litres achetes. Prix manuel ou reprise explicite du prix de l'arret choisi. Peages inconnus, total incomplet, aucune moyenne ou gratuite supposee.
- Autonomie ponctuelle en km ou litres, reserve modifiable (30 km initialement), portee utile estimee. Filtre facultatif des stations selon leur distance routiere d'acces, sans garantie d'atteignabilite. Unite ou depart modifies : invalidation de la quantite.
- Liste complete des stations deja comparees et badges regroupes. Nombre de candidates inchange.
- Metriques du trajet mises a jour avec l'arret ; recalcul different de plus de 100 m ou 60 s confirme avant remplacement. Retrait restaure la reference, invalide le prix repris de cet arret.
- Position GPS annoncee imprecise de plus de 200 m : confirmation demandee.

## Tests

`tests/e2e/trip-planning.spec.mjs` : adresses ambigues, deux dialogues successifs et cache, annulation, donnees hostiles/invalides, budget sans double comptage, prix d'arret, autonomie et reserve, filtres, profils anciens, recalcul refuse. Scenarios executes par Inspectrice sur les 4 formats Chromium existants ; rapport joint a chaque execution.

`tests/e2e/dragonroute.spec.mjs` : regressions du trajet, des stations, des profils et du serveur configure simule. Mise a jour des tests de disponibilite et des reponses de trajet via station pour correspondre a la matrice simulee.

## Limites

Pas de peages calcules, pas d'evitements actifs dans l'apercu sans serveur, pas de routage caravane. Pas de navigation continue ni estimation dynamique du reservoir. Les stations sont une selection bornee, non exhaustive. Les nouvelles options de budget et d'autonomie ne certifient ni l'etat d'une route, ni l'ouverture d'une station.

Les tests simules ne prouvent pas une couverture France exhaustive. Les limites et la politique du service public Nominatim doivent etre respectees a l'echelle du public, pas seulement d'une page. Aucune infrastructure, depense ou cle acquise. Aucune fusion automatique.

Specification centralisee : `docs/specifications/OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md`, sections 32 et 33.

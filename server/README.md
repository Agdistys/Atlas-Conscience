# Service de routage public

Etat : socle local teste, non deploye. Aucune cle reelle, aucun compte ni abonnement active.
Ce service remplace la saisie de cle par les visiteurs. Le site et ses apercus restent sur GitHub Pages.
GitHub Pages ne peut pas executer ce serveur Node : l'hebergement du service est une decision distincte, encore ouverte.

## Contrat

Node 22 ou ulterieur. Aucune dependance npm de production.
`POST /api/route`, JSON uniquement, 8192 octets maximum :

```json
{
  "coordinates": [[4.8357, 45.764], [4.8924, 44.9334]],
  "avoid": ["tollways", "highways", "ferries"],
  "vehicle": {"type": "car"},
  "alternatives": false
}
```

Deux points pour un trajet direct, trois pour un arret. GeoJSON longitude/latitude, WGS84.
Poids lourd : `vehicle.type = "truck"`, `vehicle.dimensions` exige les cinq nombres `height`, `width`, `length` en metres, `weight`, `axleload` en tonnes. Valeurs strictement positives, plafonds techniques respectifs 6, 6, 40, 100, 30 ; essieu <= poids total. Ces plafonds ne sont pas des limites legales ni des garanties de passage. Aucun profil implicite pour caravane/utilitaire. Pas de matieres dangereuses ou transport exceptionnel.

Mapping fixe ORS `driving-car` ou `driving-hgv`, ce dernier avec `vehicle_type: hgv` et `profile_params.restrictions`. Memes parametres pour trajet direct, alternatives et arret. Le navigateur ne choisit jamais une URL amont ni un profil arbitraire.

Reponse : GeoJSON limite a geometrie, resume et segments numeriques. Pas de metadonnees ni de texte libre amont. Erreurs : codes stables sans details secrets ; aucune conversion automatique vers OSRM. `/health` n'indique que si la configuration minimale est presente, pas si une cle ou une route reelle est valide.

## Configuration apres autorisation

Variables a fournir via le gestionnaire de secrets de l'hebergeur, jamais dans GitHub Pages, un commit, un export ou une commande partagee :

- `ORS_API_KEY` : cle de l'exploitant, uniquement cote serveur.
- `ALLOWED_ORIGINS` : origines exactes separees par virgules, par exemple `https://agdistys.github.io`. HTTPS, sauf loopback HTTP local.
- `ROUTING_DAILY_LIMIT` : entier positif choisi APRES verification du quota et du budget. Zero par defaut : service ferme.
- `ROUTING_PER_MINUTE` : plafond global par processus, 30 par defaut. Ce nombre n'est pas une affirmation du quota du fournisseur.
- `HOST` : `127.0.0.1` par defaut ; exposition externe seulement derriere la terminaison HTTPS approuvee.
- `PORT` : 8787 par defaut.

Lancement : `npm run start:routing`. Configurer ensuite `DragonRoute/config.js` avec l'URL HTTPS publique `/api/route`, sans cle, identifiants, query ou fragment. Cette URL publique n'est pas un secret.

Sans configuration, les options avancees echouent explicitement AVANT tout geocodage. Le trajet leger standard OSRM reste disponible, sans exclusions. La version publique ne demande jamais une cle aux visiteurs.

## Conditions d'ouverture et limites

- CORS controle les navigateurs, ce n'est PAS une authentification ni une protection contre un client forgeant Origin. Une origine GitHub Pages comprend tous les chemins du compte, pas seulement le projet.
- Une requete amont simultanee, plafonds minute et journalier globaux. Compteur en memoire, remis a zero au redemarrage et par processus : PAS un verrou financier durable ou multi-instance. Avant une demonstration publique : compteur partage persistant ou plafond dur fournisseur verifie, limitation d'abus en frontal et controle des redemarrages.
- Aucun journal applicatif des trajets. Desactiver aussi la journalisation des corps, entetes Authorization et coordonnees dans les outils de l'hebergeur, de supervision et du proxy HTTPS. Politiques des tiers a verifier.
- Taille amont bornee a 8 Mio, timeout 20 secondes, pas de redirection, liste blanche d'entrees et de sorties, annulation lors de la deconnexion du client. Pas de cache des itineraires ni de profils.
- Valider conditions d'usage public/commercial, quotas, attribution, couverture, conservation des donnees et retrait de cle AVANT toute ouverture. Aucun montant de forfait presume.
- Essais reels indispensables : peages/autoroutes, gabarit poids lourd, routes sans acces, stations et alternatives. Les fixtures ne prouvent pas l'exactitude cartographique.
- Prevoir geocodage et tuiles appropries au volume public. Le routage seul ne qualifie pas toute l'application pour la production.
- Demo d'un mois ou plus et facturation ulterieure : hypothese commerciale, duree/prix non arretes. Aucun paiement, expiration ou abonnement integre.

Sources : [ORS options](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/routing-options), [restrictions ORS](https://openrouteservice.org/restrictions/), [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). Consultees le 18 septembre 2026.

Tests : `node --test tests/routing-server.test.mjs` (serveurs locaux ephemeres, amont simule, aucune cle reelle).

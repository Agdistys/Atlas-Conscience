# OùQuandQui — Choisir la durée ou la distance

V021 · 18 novembre 2026 · lot TRA-CRITERES-01. Complète le [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), TRA-01 à TRA-05, TRA-07/08 et « Options de Route : Plus rapide / plus court », les [préparations V012](OuQuandQui_API_V012_Preparations_Trajets_2026-11-18.md), la [marche V014](OuQuandQui_API_V014_Marche_2026-11-18.md), la [comparaison V015](OuQuandQui_API_V015_Comparaison_2026-11-18.md), les [horaires V016](OuQuandQui_API_V016_Horaires_2026-11-18.md) et les [véhicules V020](OuQuandQui_API_V020_Vehicules_Memorises_2026-11-18.md). Éditions antérieures conservées.

## Choix et sens du résultat

Le sélecteur « Privilégier pour ce trajet », placé près du départ et de l’arrivée, propose « Plus rapide — durée estimée » et « Plus court — distance ». Le choix initial reste la durée. La durée est une estimation théorique du moteur, sans trafic en direct ni pauses. La distance peut conduire à un trajet plus lent ; aucun des deux critères ne signifie « moins cher », « plus sûr » ou « route plus large ».

Le résultat indique le moteur, le mode, les exclusions et le critère. Choisir un autre critère retire le trajet et ses résultats dépendants ; le bouton de recherche reste nécessaire. Aucun appel de routage ni sauvegarde personnelle ne se déclenche sur cette seule sélection. Un seul itinéraire peut être fourni ; aucune variante fictive n’est créée pour remplir une liste.

| Situation | Moteur et comportement |
|---|---|
| Véhicule léger, plus rapide, sans exclusion, sans serveur avancé | OSRM, comportement existant conservé |
| Véhicule léger, plus rapide, sans autoroute, sans serveur avancé | IGN, optimisation de durée |
| Véhicule léger, plus court, avec ou sans exclusion des autoroutes | IGN, optimisation de distance |
| Marche, plus rapide ou plus court | IGN, profil piéton et critère demandé |
| Service avancé configuré, plus rapide | OpenRouteService, comportement existant conservé |
| Plus court avec péages/ferries exclus, camion, caravane ou utilitaire | Indisponible ; choix conservé, calcul bloqué |
| IGN désactivé, plus court demandé | Indisponible ; aucun remplacement automatique par plus rapide |

La comparaison entre deux recherches ne certifie pas un optimum universel : OSRM et IGN peuvent employer des données et profils différents. Une différence de résultat est mesurable pour un cas et un moteur donnés, sans garantie d’effet sur tous les trajets. Autoriser les autoroutes ne garantit pas l’absence de péages ; les estimations tarifaires conservent leur périmètre propre.

## Calculs, réponses et cache

Le contrat interne porte `optimization: fastest | shortest`. La requête IGN utilise `bdtopo-osrm`, le profil `car` ou `pedestrian`, les coordonnées demandées, les unités mètre/seconde et le critère explicite. L’exclusion d’autoroute n’est envoyée que lorsqu’elle est demandée ; sinon aucun paramètre `constraints` n’est ajouté.

La réponse doit confirmer exactement le critère, le profil, les unités et les exclusions. Les géométries, extrémités, portions et totaux restent contrôlés. Un critère absent ou différent, une contrainte ajoutée ou ignorée, un résultat incomplet, une panne ou un quota n’autorisent aucun trajet de remplacement. L’option reste visible pour permettre une décision explicite.

Le cache IGN inclut points, exclusions, profil et critère ; sa durée de cinq minutes et sa limite de 32 entrées restent inchangées. Les appels sont séquentiels et espacés. Annulation et réponse tardive ne doivent pas produire une sélection ou des stations provenant d’une opération terminée.

## Stations et comparaison des modes

La recherche de stations conserve les paramètres de routage du trajet. Avec IGN, chaque détour est recalculé sous le même critère, avec le même profil et les mêmes exclusions. Une matrice OSRM d’itinéraires rapides ne sert pas à chiffrer un détour demandé au plus court. Choisir une station puis la retirer conserve le critère et rétablit le trajet direct correspondant.

Le classement des stations « au plus tôt », « bon compromis proche » ou « vers une distance choisie » reste distinct du critère routier. Le premier classe des arrêts candidats ; le second commande le calcul des chemins. Les distances et durées des détours restent estimées et la recherche limitée aux stations effectivement comparées.

La comparaison voiture/marche applique le critère demandé aux deux modes quand il est disponible. Trier ensuite ces résultats par durée ou distance ne recalcule pas les itinéraires. Sélectionner un mode conserve son critère et sa géométrie. Les refus restent des résultats indisponibles ; ils ne changent ni le véhicule ni les contraintes pour remplir la comparaison.

## Préparations et reprise historique

Le format courant des préparations devient 4, sous `dragonroute.prepared.v4.<environnement>`. Chaque entrée possède `optimization`, contenant `fastest`, `shortest` ou `null` lorsqu’un ancien document n’enregistrait pas cette information. Une nouvelle préparation calculée possède toujours un critère explicite. Format 4 sans champ, valeur inconnue ou version future refusés.

Lecture prioritaire : clés 4, 3, 2 puis 1, avec correspondance stricte entre clé et version. Un fichier prioritaire invalide ne déclenche pas de repli vers un ancien document. Les formats 1/2/3 sont convertis en mémoire avec critère inconnu, sans déduction à partir du moteur ou du tracé. La lecture n’écrit rien. Les clés anciennes restent intactes et leurs documents originaux exportables ; aucun champ ancien non contractuel n’est considéré comme une preuve de critère.

Reprendre une préparation de critère inconnu charge les lieux et autres paramètres, mais demande de choisir durée ou distance avant le nouveau calcul. Renommer un ancien instantané conserve son critère inconnu, même si un autre trajet vient d’être calculé. Les dates, horaires et règles de renouvellement de l’arrêt restent celles des éditions précédentes.

L’export courant se réimporte. Le critère participe à l’identification des paramètres dupliqués : deux préparations de noms distincts et de critères différents ne sont pas assimilées sur leurs seuls lieux. Chaque écriture contrôle les quatre clés pour détecter une modification concurrente, y compris par une ancienne édition. Quota, conflit, import invalide ou annulation conservent les données. Effacement confirmé limité aux préparations du même environnement ; profil et journal restent indépendants. Limites inchangées : 20 préparations et 2 Mo, sans synchronisation.

## Emporter le trajet

Le GPX conserve les points du tracé choisi et mentionne le critère dans sa description. Ce texte ne commande pas les réglages d’une application destinataire. Les liens Google Maps et Waze transmettent leurs paramètres déjà pris en charge, mais pas ce critère : les applications recalculent leur propre parcours. Cette limite est affichée dans la fenêtre de navigation. Aucun nouveau paramètre non documenté n’est ajouté aux liens.

## Sources, recette et limites

- [Capacités courantes IGN](https://data.geopf.fr/navigation/getCapabilities), consultées le 18 novembre 2026 : ressource `bdtopo-osrm`, critères `fastest` et `shortest`.
- [Documentation officielle IGN du calcul d’itinéraire](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/).
- [API OSRM, service Route](https://project-osrm.org/docs/v5.24.0/api/#route-service) : routage rapide ; sa matrice de durées/distances ne constitue pas un calcul au plus court.

Recette prévue : deux critères avec résultats distincts et cache séparé ; conservation sur détours, comparaison, préparation, import et GPX ; réponse incohérente, service absent, exclusions incompatibles, quota, annulation et concurrence ; parcours clavier, ordinateur/mobile et contrôle automatique d’accessibilité. Qualification sur l’aperçu exact avec lieux publics et services réels, séparée des scénarios simulés. Le bilan exécuté, les captures et les identifiants de publication sont consignés dans l’état de développement et la PR ; cette liste ne vaut pas attestation de réussite.

Aucun nouveau fournisseur, compte, abonnement, hébergement ou service payant. Aucun routage caravane/poids lourd, état réel du revêtement, sécurité du parcours, trafic, téléphone physique ou déplacement sur le terrain qualifiés par ce lot. Les anciens documents et leurs limites restent conservés. Les empreintes PWA sont régénérées après modification de l’interface.

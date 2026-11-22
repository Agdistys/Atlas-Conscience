# V086 — Recherche fauteuil et limites d’accessibilité du collectif

TC-ACCESSIBILITE-01 · 22 novembre 2026. Complète TC-06, BOU-01/06 et DAT-01 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), le [pilote V026](OuQuandQui_API_V026_Transports_Collectifs_2026-11-18.md), [l’accès direct V027](OuQuandQui_API_V027_Collectif_Direct_2026-11-18.md) et les [préparations V029](OuQuandQui_API_V029_Preparations_Collectives_2026-11-18.md). Les versions antérieures sont conservées.

## Fonction utilisable et portée

Le panneau collectif propose « Rechercher des pistes avec la demande fauteuil ». Ce choix est facultatif, désactivé au premier chargement et envoyé seulement au lancement d’une recherche. Il sollicite la demande fauteuil du calculateur existant. Il ne constitue pas un filtre de parcours intégralement accessibles. Les résultats sont présentés comme des pistes à vérifier auprès du réseau, hors classement compatible, même si toutes leurs durées sont connues.

L’information préalable nomme le destinataire et la portée : coordonnées, horaire, limite de déplacement à pied et demande fauteuil sont transmis à Mobilités M, après résolution éventuelle des lieux auprès de l’IGN. Aucun compte, nouvelle source, abonnement ou stockage automatique n’est ajouté. Le besoin n’est pas ajouté au profil ni à un cache public. Sa conservation locale n’intervient que sur confirmation d’une préparation.

## Qualification du service existant

Le [catalogue publié par Mobilités M](https://data.mobilites-m.fr/api/routes) décrit le calcul GET `/api/routers/default/plan` et renvoie à la documentation OpenTripPlanner. Le [service d’identification](https://data.mobilites-m.fr/api/routers/default/serverinfo), consulté le 22 novembre, annonce OpenTripPlanner 2.7.0. Les [mentions légales](https://data.mobilites-m.fr/mentions-legales) et la [licence ODbL](https://www.mobilites-m.fr/pdf/ODbL_fr_VF_1.pdf) restent les références du pilote. Aucun changement des conditions n’est déduit d’un simple accès HTTP.

Deux requêtes bornées ont comparé les mêmes lieux publics Grenoble Gares → Polesud, pour le 23 novembre à 10 h (Paris). La demande standard propose notamment une montée à Gares ; la demande `wheelchair=true` reçue par le moteur propose notamment Alsace-Lorraine. Le retour HTTP 200 contient le paramètre demandé. Cette différence constate un traitement de la demande sur cet exemple ; elle ne démontre ni couverture générale ni accessibilité effective.

Aucun attribut permettant de qualifier intégralement les arrêts, véhicules et cheminements ne figure dans les itinéraires reçus. Les référentiels des poteaux de la ligne A et des trois arrêts interrogés ne fournissent pas non plus ces informations. Les ressources individuelles historiques `/index/stops/{id}` et `/index/trips/{id}` interrogées retournent 404. Il s’agit des constats de ces réponses datées, pas d’une affirmation sur toute donnée disponible du réseau.

La [documentation d’accessibilité OTP 2.7](https://docs.opentripplanner.org/en/v2.7.0/Accessibility/) et les [paramètres du moteur](https://docs.opentripplanner.org/en/v2.7.0/RouteRequest/) décrivent des réglages qui peuvent pénaliser certains accès plutôt que les exclure, ainsi que le traitement des informations inconnues. La configuration effectivement utilisée par l’exploitant n’est pas qualifiée par ces documents généraux. La réception du paramètre ne suffit donc pas à établir une contrainte stricte satisfaite.

## Lecture d’une piste

Chaque option exploratoire conserve ses horaires théoriques, ses lignes, ses arrêts, sa distance et son tracé disponibles. Une fiche détaille séparément les accès et sorties à pied, les montées et descentes, le véhicule et les correspondances. La pente, la largeur, le revêtement, les marches, les équipements, l’assistance et la place disponible restent non renseignés ou non vérifiés. Un lien explicite permet de consulter le réseau. Cette fiche ne déclenche aucun appel supplémentaire.

Une distance courte, une ligne de tram ou une géométrie reçue ne transforme aucun inconnu en accessibilité confirmée. Les pistes restent consultables sur la carte et enregistrables comme références. Elles sont exclues du tableau admissible, de la comparaison des temps et de toute notation compatible. La consultation des informations réseau, l’estimation séparée d’empreinte et la déclaration volontaire d’un trajet effectué gardent leurs portées respectives ; aucune n’atteste l’accessibilité physique.

La comparaison facultative voiture/marche/vélo ne lance pas de calcul routier standard pour ce besoin. Ces modes sont indiqués non qualifiés. Aucun trajet pédestre ou automobile n’est présenté comme une substitution au déplacement en fauteuil. Pour revenir à une recherche standard, la personne retire explicitement le choix puis relance ; les anciennes pistes sont retirées avant le nouveau calcul.

## Contrat, erreurs et annulation

Le paramètre est un booléen explicite côté application ; seule la valeur vraie ajoute `wheelchair=true` à la requête. Une réponse à cette demande doit contenir exactement la confirmation textuelle `requestParameters.wheelchair = "true"`. Une confirmation absente, fausse ou de type inattendu refuse le résultat, sans secours standard. La confirmation concerne la réception de la demande, pas le respect complet du besoin.

Les contrôles de dates, secteur pilote, chronologie, modes, continuité, marche totale, doublons et tracés existants restent applicables. Aucun champ fournisseur supplémentaire prétendant une accessibilité globale n’est adopté sans contrat qualifié. Modifier le choix ou les paramètres, annuler ou fermer retire le contexte et ignore les réponses tardives. Les modifications silencieuses sont également relues avant affichage, comparaison ou sauvegarde.

## Conservation et anciennes versions

Les préparations collectives utilisent le format 3, avec le booléen `criteria.wheelchair` obligatoire. Le trajet conserve `accessibility: "unknown"`. La clé locale est `dragonroute.transit-prepared.v3.<environnement>`. Les formats 1 et 2 restent lisibles en mémoire comme des recherches sans demande fauteuil. Ils ne sont réécrits qu’à l’occasion d’une sauvegarde volontaire ; leurs clés et originaux restent conservés, avec export brut séparé pour chaque version.

Le chargement privilégie la version la plus récente présente, même vide ou invalide ; aucun retour silencieux à une ancienne copie. Un besoin fauteuil dans une enveloppe ancienne est refusé comme ambigu. Un booléen manquant, un format futur, un fichier incohérent ou une modification concurrente empêche l’écriture. Les trois clés sont contrôlées avant sauvegarde ou effacement. L’effacement explicite reste limité aux préparations collectives de cet environnement.

La lecture hors ligne présente une demande historique déclarative, jamais une attestation fournisseur actuelle. Le besoin est montré dans la relecture d’import et restitué lors de la reprise, sans lancer de recherche. Les instantanés, dates, plafonds de correspondances et tracés précédents sont préservés. Une importation peut vérifier la structure ; elle ne peut authentifier la demande, la circulation ou le terrain.

## Vérification et prochaine qualification

Les contrôles du modèle utilisent une réponse réelle conservée avec sa provenance, puis des altérations explicites : paramètre absent ou mal typé, faux badge d’accessibilité, versions ambiguës et contraintes avant classement. Les scénarios navigateur simulent le réseau pour vérifier réception, refus, annulation, contexte silencieusement modifié, absence de routage standard, sauvegarde, import, migration, concurrence, reprise hors ligne et clavier. Les essentiels sont ajoutés aux contrôles Firefox et WebKit ; les quatre formats Chromium restent inspectés.

La recette publiée vérifie séparément le commit servi et une recherche sur lieux publics avec le service existant. Les résultats exacts de l’inspection, de la publication et de cette recette sont consignés dans le suivi du chantier. Aucun appareil physique, usage en fauteuil, embarquement ni trajet effectivement réalisé n’est attesté par ces tests.

TC-06 reste partiellement couvert. Pour proposer un véritable filtre impératif, il reste à obtenir un contrat de données vérifiable sur les arrêts, véhicules, cheminements et équipements, ainsi que le comportement effectif du moteur face aux inconnus. La recherche exploratoire n’est pas présentée comme l’achèvement de cette exigence. Les bagages et vélos embarqués restent non qualifiés. Aucun achat, nouveau fournisseur ou envoi de demande à l’exploitant n’est effectué par ce lot.

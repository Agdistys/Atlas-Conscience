# V099 — Transports collectifs dans la comparaison des passagers

COV-MODES-TC-01 · 23 novembre 2026. Complément des exigences COV-04, TC-01/02/04/05/07, BOU-02/07 et DOU-04 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), du [pilote Grenoble V026](OuQuandQui_API_V026_Transports_Collectifs_2026-11-18.md), des [accès des passagers V097](OuQuandQui_API_V097_Acces_Passagers_2026-11-23.md) et de leur [reprise V098](OuQuandQui_API_V098_Reprise_Acces_Passagers_2026-11-23.md). Les éditions antérieures restent conservées.

## Parcours et demande volontaire

Dans la comparaison porte à porte des passagers, l’option **Inclure les transports du pilote Grenoble** permet de rechercher une alternative collective entre leurs deux lieux personnels. Les rencontres du conducteur ne remplacent pas ces extrémités. La date et l’heure de départ sont celles du formulaire commun ; le conducteur reste exclu du groupe de passagers comparés.

L’option est désactivée à l’ouverture et lors de la reprise d’un scénario historique. Son activation ne lance aucune requête. Le calcul demande d’abord la confirmation des lieux et des recherches d’accès, puis celle du groupe. Mobilités M reçoit uniquement les deux coordonnées, la date, l’heure et les paramètres techniques de la recherche : aucun nom, adresse textuelle, profil ou effectif n’est joint. La réception de places disponibles n’est pas présumée.

La marche totale maximale de la recherche collective est affichée explicitement : de 100 à 5 000 m, avec une proposition initiale de 1 000 m. Elle comprend tous les cheminements de la réponse. La limite de marche commune reste applicable aux options reçues lorsqu’elle est impérative, même si elle est plus basse. Un maximum facultatif de correspondances peut être une préférence ou une limite impérative ; zéro correspondance est distinct d’une absence de maximum.

## Même périmètre pour la comparaison

Le temps collectif comparé est l’arrivée moins le départ personnel demandé. Il comprend donc l’attente avant la première étape, les marches d’accès et de sortie, les parcours à bord et les attentes entre étapes. La durée en chemin, de la première à la dernière étape, reste présentée séparément. Le calcul conserve les secondes reçues. L’affichage et le tri temporel suivent la précision en minutes du comparateur commun, avec les ex æquo signalés.

Chaque option conserve un numéro stable dans les étapes, le tableau des modes, les modèles carbone, les budgets et les souvenirs. Le tri ne réassocie jamais les hypothèses à une autre option. Les détails présentent dates civiles et heures de Paris, lignes, directions, arrêts, distances de marche et correspondances. Les noms reçus sont du texte inerte, sans interprétation HTML.

Les contraintes sont appliquées avant le classement : marche cumulée, correspondances impératives, arrivée limite, heure passée ou horloge incohérente. Une préférence dépassée reste lisible. Une référence non admissible peut être consultée, mais ne reçoit pas un indice compatible. Les horaires passés sont retirés des propositions actuelles sans nouveau calcul automatique. La consultation et les classements ne modifient ni le parcours automobile adopté ni la référence du conducteur.

## Budget, empreinte et conservation

Le prix total fourni par le pilote reste **inconnu**, pour une personne comme pour le groupe. Aucun zéro, billet, abonnement ou réduction n’est déduit d’une ligne de transport. Les frais peuvent être renseignés volontairement dans le budget commun selon les règles existantes ; ces montants restent déclarés, distincts d’un tarif fournisseur. Un coût absent exclut l’option d’un classement utilisant ce critère actif.

Les modèles carbone collectifs se choisissent indépendamment par étape. Les marches sans facteur qualifié rendent l’empreinte totale incomplète. Les valeurs par personne sont multipliées par l’effectif du groupe, sans seconde division par l’occupation. La voiture conserve sa distance automobile distincte de la distance porte à porte ; le conducteur est compris dans ses occupants, mais reste hors du groupe comparé.

La conservation est explicite. Les valeurs, les limites, les détails horaires et l’attribution du fournisseur sont inclus dans le souvenir et dans son export lisible. Le budget de format 5 autorise les options collectives dans ce contexte porte à porte ; la collection adopte le format 7 lorsqu’un tel budget est enregistré. Les formats de collection 1 à 6 restent lisibles sans migration ni rétrogradation ; leurs contrats budgétaires antérieurs ne sont pas élargis silencieusement. Une version future inconnue est refusée.

Reprendre un scénario propose les lieux et réglages déjà prévus par V098, mais réinitialise la date, les confirmations, les coûts et les résultats. La recherche collective doit être réactivée volontairement. Ses limites spécifiques ne sont pas transférées depuis le texte historique : elles sont à vérifier dans le nouveau formulaire. Une nouvelle sauvegarde ne remplace pas le souvenir source. Aucun déplacement effectué n’est inscrit au journal par ces actions.

## Source, couverture et échecs

Le service reste [Mobilités M / SMMAG](https://data.mobilites-m.fr/donnees), sous ODbL, déjà qualifié par V026. La recherche utilise le même point d’accès OpenTripPlanner et les mêmes contrôles : coordonnées, calendrier, date retournée, chronologie, continuité, limites, doublons et présence effective d’une étape collective. Les deux lieux doivent être dans le rectangle volontaire du pilote Grenoble ; un lieu extérieur provoque un message sans appel de transport. La couverture nationale n’est pas ajoutée par ce lot.

Les horaires restent théoriques. Retards, perturbations, prix total, accessibilité, bagages, vélo embarqué, capacité et présence réelle ne sont pas qualifiés par cette recherche. Le lien volontaire vers le réseau permet une vérification extérieure. Aucune réservation ni achat. Les contrats d’accessibilité exploratoire de V086 restent propres au panneau collectif indépendant ; une requête standard n’atteste pas une accessibilité garantie.

L’intervalle minimal et les délais de quota sont partagés avec les autres consultations du même service dans la page. La requête a un délai de vingt secondes et une réponse bornée à deux millions de caractères. Aucun cache applicatif, relancement automatique ou changement de fournisseur. Un délai collectif dépassé n’annule pas les autres modes ; une réponse tardive n’est pas adoptée. Fermeture, annulation ou modification du contexte invalident l’opération en cours.

Une panne, un quota, une date hors calendrier, une réponse non vérifiable ou une absence d’option restent explicitement distincts. Les autres modes reçus sont conservés. Inversement, les options collectives restent comparables lorsque les accès routiers sont indisponibles. Une absence de coordonnées personnelles confirmées empêche leur recherche ; aucun lieu de remplacement n’est choisi automatiquement.

## Vérification et limites restantes

Les contrôles portent sur les mêmes extrémités et le même instant, l’attente initiale, les cumuls de marche, les correspondances, l’arrivée limite, la fraîcheur, les quotas, la durée maximale, l’annulation et les réponses tardives. Les budgets, versions, sauvegardes, reprise, clavier, texte agrandi et formats ordinateur/mobile sont vérifiés. Les cas essentiels rejoignent la matrice Firefox/WebKit ; les simulations restent séparées de la consultation réelle sur des lieux publics de Grenoble.

Les nombres exécutés et les métadonnées de l’aperçu sont consignés dans le rapport de la version livrée. Une recette navigateur ne vaut ni déplacement physique ni vérification sur téléphone réel. Aucun nouveau fournisseur, compte, abonnement, paiement, hébergement, réorganisation ou fusion sur le site principal.

Les horaires et étapes sont consultables dans cette comparaison ; sa propre carte collective et les informations réseau à la demande constituent le prochain raccordement. Le panneau collectif autonome conserve ses capacités antérieures. Cette limite cartographique n’altère pas le trajet du conducteur ni les géométries reçues.

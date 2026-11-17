# OùQuandQui — Calcul des péages et budget

Édition V004 · 17 novembre 2026. Complément au [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), exigences PEA-01 à PEA-10. [Référentiel précédent V003](OuQuandQui_API_V003_Navigation_2026-11-17.md) conservé : adresses IGN, trajet sans autoroute, navigation et GPX.

**État : raccordement développé et testable avec réponses simulées ; tarifs réels non activés.** Aucun compte, clé réelle, abonnement ou appel tarifaire commercial n’est engagé. Le site conserve GitHub Pages. L’hébergement d’un service protégeant la clé et la qualification des tarifs France restent nécessaires avant activation.

## Fonctionnement préparé

Le budget présente séparément le carburant consommé estimé, les péages et le total. Le plein acheté en station n’est jamais ajouté au budget du déplacement. Le total n’est disponible que si le carburant dispose d’un prix et si le devis de péages est complet.

| Résultat | Affichage | Total carburant + péages |
|---|---|---|
| Absence explicite de péage confirmée par une réponse conforme | 0 € · sans péage confirmé | Possible |
| Devis complet | Montant · estimation | Possible |
| Devis partiel | Sous-total connu · partiel ; détail des paiements inconnus | Incomplet |
| Service absent, erreur ou réponse incohérente | Tarif indisponible | Incomplet |
| Requête active | Calcul en cours | Incomplet |

Une route sans autoroute ou une option « éviter les péages » ne constitue pas une preuve de gratuité. Les frais de ferry et stationnement restent exclus. La couverture, la devise, les taxes, les paiements et la concordance du tracé doivent être contrôlés avant de présenter un montant complet.

## Tracé, véhicule et date

- La demande porte sur l’aller simple affiché : géométrie complète, variante courante et détour de la station confirmée. Le serveur encode tous les points, sans simplification, à la précision de cinq décimales du format transmis.
- Une nouvelle géométrie, un nouveau calcul, un changement d’arrêt, de caractéristiques tarifaires, de moyen de paiement ou de date efface le devis précédent immédiatement. Les réponses anciennes sont ignorées même si leur requête ne peut plus être annulée.
- Le premier calcul nécessite une action explicite. Ensuite, les changements de trajet ou de paramètres déclenchent un devis actualisé, après une courte temporisation. Une panne ou un quota ne provoque pas de nouvelle tentative automatique. Le changement du seul prix de carburant ne consomme pas un nouvel appel tarifaire.
- Le tarif préparé concerne uniquement une voiture sans remorque, deux essieux, hauteur tarifaire de 0,5 à 2 m et PTAC de 500 à 3 500 kg. Ces caractéristiques sont saisies et confirmées ; aucune hypothèse n’est héritée silencieusement d’un véhicule différent. Il s’agit d’un périmètre technique initial, pas d’un routage caravane ou poids lourd.
- La hauteur tarifaire et le PTAC ne doivent pas être confondus avec les dimensions de passage et le poids réel. Les éléments de toit et exceptions tarifaires demandent l’application des règles de l’exploitant. Le contrat de transmission de ces données au fournisseur doit être confirmé sur de vrais exemples avant activation.
- Deux paiements sont préparés : espèces et paiement à la plaque. Aucune remise de télépéage n’est supposée. Un moyen non accepté sur un paiement rend le devis partiel ; le tarif d’un autre moyen ne lui est pas substitué. La carte bancaire n’est pas assimilée automatiquement aux espèces.
- Le départ prévu est affiché et modifiable. La réponse indique le fournisseur, la récupération, les caractéristiques, le paiement et la date de départ. La date de validité d’une grille n’est pas inventée lorsqu’elle n’est pas fournie.
- Le devis expire dans l’interface après quinze minutes et nécessite une actualisation volontaire. Cette durée technique ne certifie pas la validité du tarif.

## Service préparé

Le connecteur candidat utilise le service de tarif sur tracé complet de TollGuru. Les documents du fournisseur décrivent la transmission de la géométrie, des caractéristiques du véhicule, de l’heure et des montants par moyen de paiement. Le code ajoute des contrôles conservateurs : retour du même tracé encodé, distance cohérente, France seule, EUR, véhicule attendu, absence de réserves bloquantes, paiements distincts et taxes explicitement incluses. Toute divergence reste indisponible ou partielle.

La documentation présente des variantes de schéma et des exemples hors France. Les réponses de tests sont construites, non issues d’un compte réel. En particulier, le retour de la géométrie, `mapProvider=custom`, la devise EUR (absente de certaines énumérations mais présente dans des exemples), les taxes et le sens du paramètre de masse doivent être confirmés sur le service réel. Les contrôles ne seront pas assouplis pour fabriquer un tarif.

Le service n’envoie ni nom de profil, ni carnet d’adresses, ni favoris. Il transmet le tracé actif, le véhicule tarifaire et le départ prévu. Aucun journal applicatif des trajets ; compteur de requêtes limité à date et nombre. Clé uniquement dans l’environnement serveur. Détails de démarrage, compteur persistant et limites : [documentation du service](../../server/TOLLS.md).

## Activation à décider

Le fournisseur annonce un essai de 14 jours, sans carte bancaire, avec des quotas distincts selon le compte. La compatibilité exacte de cet essai avec l’endpoint sur tracé complet doit être vérifiée lors de l’inscription. Les prix de l’offre TollGuru ne sont pas une garantie de prix pour toutes les offres TollTally. Aucun forfait n’est retenu dans ce document.

Étape proposée après accord : créer ou utiliser un accès d’essai compatible, installer sa clé dans un gestionnaire de secrets et approuver un hébergement du service HTTPS. Première qualification limitée : six requêtes au maximum, aucun appel payant et aucune répétition automatique. Les traces à qualifier seraient préparées avec des lieux publics : Lyon–Valence, ce trajet avec un arrêt, une variante, un trajet local sans péage, un paiement non disponible et une seconde vérification tarifaire. Les montants seraient confrontés aux grilles applicables des exploitants avant toute ouverture publique. Cette proposition n’autorise pas les six appels à elle seule.

Les tests locaux et l’aperçu public non activé sont réalisables sans cette décision. GitHub Pages demeure le site ; il ne peut pas exécuter le serveur ni conserver la clé privée. Le seul dépôt GitHub ne suffit donc pas à rendre ce raccordement tarifaire public.

## Couverture du cahier des charges

PEA-01/02/05/06/07/08/09/10 : logique, affichage et contrôles préparés ; qualification fournisseur et exactitude tarifaire réelles en attente. PEA-04 : voiture seule seulement. PEA-03 : comparaison simultanée de plusieurs devis avec/sans péage non réalisée ; sélectionner une variante recalcule son propre devis. Les péages ne sont pas encore intégrés au classement économique des stations ; son libellé continue d’exclure ces frais. Caravanes, poids lourds, moyens de paiement supplémentaires, outre-mer et itinéraires internationaux restent à qualifier.

[Recette et preuves](../acceptance/DragonRoute-Peages.md).

## Sources consultées le 17 novembre 2026

- [TollGuru : contrat du service](https://tollguru.com/toll-api-docs).
- [TollGuru : questions sur les tracés complets](https://tollguru.com/blog/tolls-using-a-complete-polyline-from-any-mapping-service-faq).
- [TollGuru : offres et essai](https://tollguru.com/toll-api-pricing-plans).
- [ASFA : classes de véhicules](https://www.autoroutes.fr/FCKeditor/UserFiles/File/ASFA_classes_vehicules_2022.pdf).

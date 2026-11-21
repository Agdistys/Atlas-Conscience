# OùQuandQui — Véhicules mémorisés et réglages du trajet

V020 · 18 novembre 2026 · lot VEH-PROFILS-01. Complète le [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), VEH-01/02/03/07/08 et PRO-03 à PRO-08, le [profil V007](OuQuandQui_API_V007_Profil_Adresses_2026-11-18.md), les [préparations V012](OuQuandQui_API_V012_Preparations_Trajets_2026-11-18.md), le [hors ligne V018](OuQuandQui_API_V018_Hors_Ligne_Mises_A_Jour_2026-11-18.md) et les [péages V019](OuQuandQui_API_V019_Peages_BPNL_2026-11-18.md). Éditions antérieures conservées.

## Parcours disponible

« Mon profil → Mes véhicules » conserve jusqu’à dix véhicules distincts. Chaque entrée possède un identifiant stable, un nom facultatif, un type, un carburant, une consommation en L/100 km et une quantité à acheter par défaut. Cette quantité ne représente pas le carburant restant. Les types et carburants restent ceux déjà reconnus ; cette évolution n’introduit pas de moteur ou de véhicule supplémentaire.

Un véhicule peut être ajouté, modifié, utilisé ou supprimé. Un nom répété déclenche une confirmation ; aucun véhicule n’est fusionné ou remplacé sur son nom. L’enregistrement du formulaire choisit aussi ce véhicule pour le trajet et les prochains démarrages, comme indiqué avant le bouton. Modifier le formulaire sans l’enregistrer ne change pas le profil.

Le sélecteur près du mode de déplacement permet de reprendre un véhicule mémorisé. Le choix explicite est sauvegardé avant d’appliquer ses paramètres. L’échec d’écriture conserve l’ancien choix et le trajet existant. En l’absence de véhicule actif, les réglages ponctuels par défaut restent disponibles : voiture, E10, 6,2 L/100 km et 40 L à acheter, sans autonomie supposée.

La suppression demande confirmation. Supprimer le véhicule actif revient aux réglages ponctuels par défaut et retire les calculs dépendants, sans sélectionner un autre véhicule enregistré. Supprimer une entrée inactive préserve le choix existant. Les adresses et stations favorites restent indépendantes du parc.

## Réglages ponctuels et invalidations

Modifier directement carburant, consommation, quantité, type ou gabarit dans la préparation retire l’indication « véhicule mémorisé appliqué ». Les valeurs servent à ce trajet ; le véhicule enregistré et le choix de démarrage restent inchangés. Sélectionner à nouveau le véhicule reprend ses paramètres enregistrés. Aucun ajustement ponctuel n’est silencieusement sauvegardé.

Appliquer un véhicule enregistré retire l’itinéraire, ses arrêts, les comparaisons, les prix repris, les péages, la classe tarifaire et la confirmation des caractéristiques tarifaires, l’estimation carbone prospective et l’autonomie renseignée pour l’ancien véhicule. Les lieux saisis et préférences routières restent consultables ; un nouveau calcul est nécessaire et n’est jamais déclenché par la sélection elle-même. L’application ne transmet aucun nouveau gabarit ou lieu à un fournisseur lors de la sauvegarde.

Les préparations sauvegardées et le journal ne sont pas réécrits par le changement ou la suppression d’un véhicule. Une préparation conserve ses propres paramètres : la reprendre ne modifie ni le parc ni son véhicule actif, ne la rattache pas par ressemblance de nom et ne recrée pas un véhicule supprimé. La reprise reste soumise au nouveau calcul, aux contrôles d’ancienneté et à la confirmation de l’arrêt.

## Gabarit et limites de routage

Le formulaire permet de renseigner ou retirer un gabarit complet : hauteur, largeur et longueur en mètres, poids en charge et charge maximale par essieu en tonnes. Tous les champs peuvent rester vides ; si un gabarit est renseigné, les cinq valeurs sont contrôlées selon les bornes techniques existantes et la charge par essieu ne peut dépasser le poids total. Le bouton de reprise du gabarit copie les valeurs dans le formulaire, sans sauvegarde avant enregistrement du véhicule.

Mémoriser une caravane, un utilitaire ou un camion n’active aucun routage indisponible et ne certifie aucune route, restriction locale ou entrée de station. La classe de péage reste un choix séparé ; elle n’est pas inférée du nom, du type ou des dimensions. La marche conserve son profil propre, et le sélecteur automobile est masqué pendant ce mode.

## Données et migration

Le profil courant utilise le format 3 et la clé `dragonroute.profile.v3.<environnement>` : `vehicles`, `activeVehicleId`, `addresses` et `stations`. Une liste vide avec actif nul est valide ; l’identifiant actif non nul doit appartenir au parc, et les identifiants sont uniques. Un véhicule ancien est repris sous un identifiant stable, sans modification de ses valeurs reconnues.

Lecture prioritaire : format 3, sinon format 2, sinon format 1. Aucun enregistrement automatique à la lecture. Les originaux 1 et 2 restent à leurs anciennes clés et sont exportables séparément avec leurs champs connus. Un profil prioritaire illisible, incompatible ou de version inconnue bloque son remplacement ; il n’est pas contourné par un ancien profil ou un faux profil vide.

Chaque écriture contrôle les trois clés depuis la lecture. Une modification par une autre fenêtre, y compris une ancienne édition, bloque l’enregistrement avec invitation à recharger. Aucun rapprochement ou écrasement automatique entre éditions. L’import montre le nombre de véhicules, le véhicule actif, la liste des paramètres, gabarits et noms répétés, ainsi que les adresses et stations, avant remplacement confirmé. L’export préalable reste proposé.

Les formats 1/2 sont acceptés à l’import et convertis en mémoire ; le format 3 s’exporte et se réimporte. Champs étrangers et secrets non reconnus exclus ; contenus rendus comme texte. Formats futurs, identifiants répétés, actif absent, valeurs invalides, parc supérieur à dix véhicules et fichier/export formaté supérieur à 100 000 octets refusés, sans troncature. Les limites existantes de 50 adresses et 100 stations restent inchangées.

La fermeture d’un aperçu d’import ne doit pas annuler une nouvelle lecture déjà ouverte. Les imports rapprochés du profil et des préparations sont couverts, y compris après annulation.

Quota, stockage refusé et conflits conservent le formulaire ou l’aperçu d’import. L’effacement confirmé ne vise que les trois profils du même environnement ; journal, préparations, autres aperçus, caches et applications restent conservés. Une suppression partielle recharge les données réellement restantes et n’annonce pas un effacement achevé. Aucun compte ou synchronisation entre appareils.

## Recette et périmètre

Contrôles de migration et d’export, identité et limites du parc, gabarits, choix actif, doublons, concurrence, quota, imports, invalidations et conservation des instantanés. Parcours ordinateur/mobile avec clavier, captures, débordement et accessibilité automatique ; anciennes recettes de profil, préparation, empreinte et PWA conservées. La recette publiée utilise des lieux publics et un navigateur de test ; les essais simulés, services réels et lecture visuelle sont identifiés séparément dans les preuves.

Le bilan exécuté, le commit, l’inspection et l’aperçu sont consignés dans l’état de développement et la PR. Une recette prévue ne vaut pas un contrôle réussi. Aucun téléphone physique, compatibilité caravane/poids lourd ou mesure réelle de consommation qualifiés. La conservation reste soumise au stockage du navigateur ; exporter les données utiles.

Après modification de l’interface, régénérer les empreintes du manifeste PWA avec `node tests/pwa-shell.mjs --write`. Aucun changement des fournisseurs, de l’hébergement ou du calculateur de péage.

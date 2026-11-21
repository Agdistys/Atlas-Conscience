# OùQuandQui — Péages par réseau et passage BPNL

V019 · 18 novembre 2026 · lot PEA-COUVERTURE-02. Complète le [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), les [grilles V005](OuQuandQui_API_V005_Grilles_Peages_2026-11-17.md), le [repérage V006](OuQuandQui_API_V006_Reperage_Peages_2026-11-18.md) et le [hors ligne V018](OuQuandQui_API_V018_Hors_Ligne_Mises_A_Jour_2026-11-18.md), conservés.

## Fonction livrée

Après calcul d’un trajet, **Budget du trajet → Calculer les péages — réseaux couverts** propose APRR, AREA et le **périphérique nord de Lyon (BPNL)**. Pour ce dernier, la classe tarifaire choisie donne le plein tarif d’un passage, selon la délibération publique 2025-3243, page 59. La personne confirme que son trajet comprend ce passage avant l’ajout. Aucun nom de gare ou couple entrée–sortie n’est inventé pour représenter ce forfait.

Les cinq classes sont consultables sans service distant, clé ou compte. Classe tarifaire et autorisation de circuler restent distinctes, notamment pour les poids lourds, caravanes et restrictions locales. Aucun abonnement ni remise n’est supposé ; un retour nécessite une nouvelle préparation. Un seul passage BPNL par budget est pris en charge, sans multiplication automatique ni détection de passages multiples.

Un budget peut réunir un passage BPNL et des tronçons APRR/AREA. Les montants sont additionnés en centimes ; chaque ligne conserve sa source, sa classe, la date du trajet et celle du tarif. La somme reste partielle jusqu’à la confirmation explicite de couverture complète. La personne vérifie les chevauchements et péages manquants ; l’application ne prouve pas cette couverture sur la carte.

## Cohérence et invalidations

- Périodes propres aux réseaux : BPNL à partir du 1er janvier 2026, APRR/AREA à partir du 1er février 2026. Consultation bornée au 31 décembre 2026, sans maintien de prix promis.
- Changer le réseau de consultation ne retire pas les montants déjà ajoutés d’un autre réseau dont la période reste applicable. La validité du budget est contrôlée pour **chaque ligne**, indépendamment du réseau affiché.
- Classe, date, trajet, variante ou arrêt modifiés : les anciens montants sont retirés. La confirmation BPNL est aussi retirée lors d’un changement de réseau, classe, date ou trajet.
- Le même passage ne peut être ajouté deux fois. Ajouter ou retirer une ligne retire la confirmation de couverture. Les grilles locales et un éventuel devis distant ne sont jamais additionnés.
- Date absente, impossible ou hors période, prix manquant pour une classe : montant indisponible et ajout désactivé, jamais zéro implicite. En marche, le calculateur reste désactivé.
- Les données de profil, journal et préparations gardent leurs formats. Le partage de frais mentionne les réseaux réellement retenus ; aucune étiquette APRR/AREA n’est attribuée à un montant BPNL.

## Sources et bornes

[Dossier BPNL et provenance](../../data/tariffs/2026-01-bpnl/README.md). Montants de l’acte public téléchargé, cinq valeurs comparées à la page 59 et relues visuellement. Les tarifs généraux ne constituent pas une observation de passage réel. Les fichiers ASF/ESCOTA restent non intégrés : conditions spécifiques de redistribution non qualifiées. Cette dépendance isolée n’a pas empêché la livraison d’un autre réseau.

Les réseaux autoroutiers et ouvrages restants, les réductions, la reconnaissance automatique des passages, les nouveaux millésimes et la couverture France entière restent incomplets. Le repérage géographique V006 conserve ses garde-fous ; BPNL n’est pas apparié automatiquement à l’inventaire concédé.

## Vérification

Reconstruction des sources, centimes entiers et limites du modèle, puis parcours navigateur sur les cinq classes, confirmation, budget mixte, doublon, sources, changement de réseau/date/classe/trajet, expiration et montant absent. Régression des grilles et du repérage existants, contrôle visuel ordinateur/mobile, inspection GitHub du commit et essai publié. Les scénarios simulés, consultation de tarifs officiels et itinéraires calculés par les services réels restent distincts. Aucun téléphone physique ni passage routier constaté. Le bilan courant et les liens de preuve sont consignés dans la PR et l’état de développement ; un scénario prévu n’est pas une exécution réussie.

Maintenance : données embarquées de schéma 2 avec `kind=pair` ou `kind=passage`, dates par réseau. Après génération, exécuter `node tests/pwa-shell.mjs --write` pour les empreintes des ressources. Aucune modification du fournisseur de routage ou activation du serveur de péages.

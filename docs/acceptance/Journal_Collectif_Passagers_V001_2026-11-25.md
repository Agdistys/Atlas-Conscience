# Recette — Journal personnel des alternatives collectives

COV-MODES-TC-03 · 25 novembre 2026 · [contrat V101](../specifications/OuQuandQui_API_V101_Journal_Collectif_Passagers_2026-11-25.md).

## Parcours et critères

Une comparaison porte à porte de deux passagers sert de contexte. Depuis les résultats, la comparaison commune triée ou la carte avec une autre option sélectionnée, préparer le journal. Vérifier la bonne option, les lieux personnels, les étapes théoriques et le conducteur conservé. Aucune requête nouvelle ni inscription d’un voyage à l’ouverture.

Le journal commence désactivé. Son activation ne crée aucune entrée. La date future reste vide ; une date déclarée future ou une absence de confirmation empêche l’enregistrement. Modifier une étape retire la confirmation. Les modèles carbone de la comparaison ne sont pas transférés ; un enregistrement représente une personne et un seul voyage.

Corriger une distance en valeur inconnue, confirmer un déplacement fictif, puis vérifier origine immuable, bilan partiel, export et restauration. Conserver les anciennes données version 2. Déclencher un quota et contrôler la conservation du document précédent et du formulaire. Vérifier doublon, annulation, fermeture clavier et contexte modifié sans événement.

Fermer une carte pendant sa consultation en ouvrant le journal : aucun résultat réseau tardif dans le brouillon. Le retour du focus suit le bouton d’origine, y compris depuis la comparaison commune. Contrôler lecture, fermeture et absence de débordement à 360/390 pixels et avec texte agrandi.

## Exécution et preuves

Les scénarios sont dans `tests/e2e/passenger-transit-journal.spec.mjs`. Les suites du journal collectif existant et de la carte des passagers accompagnent les régressions. Deux parcours essentiels rejoignent la matrice Firefox/WebKit ; aucune ancienne exigence de cette matrice n’est retirée.

Les preuves de ce lot sont conservées dans `quality/passenger-transit-journal/` dans l’atelier actif ACTUEL_4To. Les premiers essais ont conduit à préciser les attentes des tests : libellés résolus avec code postal, ouverture du détail des modèles et dates distinctes pour deux déclarations soumises à la détection de doublons. Les traces initiales restent conservées. Les journaux de contrôle portent les nombres réellement exécutés.

La publication exige l’inspection complète du même commit, la matrice de compatibilité et l’assemblage de l’aperçu. Vérifier ensuite les métadonnées et les quatre ressources principales de la version publiée. Le rapport d’inspection public constitue la preuve distante ; une réussite locale ne le remplace pas.

## Recette avec services réels

Lieux publics : conducteur Hôtel de Ville de Grenoble → mairie d’Échirolles ; passagers gare de Grenoble → patinoire Polesud. Rechercher le collectif pour le lendemain, examiner les trois accès au journal, corriger une distance en inconnu puis abandonner les brouillons. Le journal de cette session de test reste sans déplacement confirmé. Capturer ordinateur, petit écran et texte agrandi ; comparer le parcours conducteur avant et après.

Cette recette ne déclare aucun déplacement réel, n’utilise aucun trajet personnel de la propriétaire et n’atteste ni place, ni tarif, ni accessibilité ou circulation effective. Aucun appareil physique, nouveau fournisseur, compte, paiement ou fusion sur le site principal n’est inclus.

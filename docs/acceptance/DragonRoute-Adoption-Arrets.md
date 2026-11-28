# Réception ARR-MULTI-04 — Affichage du parcours à plusieurs arrêts

Référence : [V091](../specifications/OuQuandQui_API_V091_Trajet_Arrets_2026-11-23.md). Les validations simulées et la recette publiée sont distinguées dans le suivi central ; cette fiche définit les comportements attendus.

| Situation | Résultat attendu |
| --- | --- |
| Ouvrir puis annuler la proposition | Aucun changement de vue, de données, de sauvegarde ou de journal. |
| Confirmer un parcours courant | Carte, liste, distance, durées, autonomie et budget propres ; référence conservée. |
| Contexte changé pendant la proposition | Refus et nouvel examen nécessaire ; aucune adoption silencieuse. |
| Modifier puis fermer, ou échec de recalcul | Parcours adopté inchangé jusqu'à une nouvelle adoption confirmée. |
| Lire une sauvegarde historique | Adoption désactivée ; copie et recalcul nécessaires. |
| Budget expiré ou horloge reculée | Total actuel retiré ; tracé daté conservé ; pas de réactivation implicite. |
| Exporter ou préparer la navigation | Tous les points dans leur ordre ; autorisation de liens distincte, aucun lancement automatique. |
| Reprendre dans le journal | Distance complète ; aucun déplacement enregistré avant déclaration et confirmation. |
| Lire/enregistrer dans la bibliothèque | Vue adoptée indépendante ; seule la sauvegarde explicite écrit une copie. |
| Revenir à la référence | Distance, station, résultats, réglages et péages restaurés sans calcul ni transfert de budget. |
| Carte indisponible, clavier ou écran étroit | Schéma et liste utilisables, focus identifiable, pas de débordement horizontal des panneaux. |
| Redessin du schéma de référence pendant une comparaison de variantes, puis annulation | Retour au même repère de variante ; un nouveau redimensionnement conserve le focus, sans changement de trajet ni requête. |

Contrôles : `tests/multi-adopt.test.mjs`, `tests/e2e/multi-adopt.spec.mjs`, régressions des budgets, cartes, variantes et journal ; inspection complète et matrice de compatibilité sur le commit exact. Une recette sur lieux publics doit aussi vérifier les ressources servies et les données d'inspection, puis l'adoption, les exports, la navigation et le retour à la référence. Aucun guidage réel ni paiement attesté par ces essais.

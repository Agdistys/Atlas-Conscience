# Budget des parcours à plusieurs arrêts — recette V001

ARR-MULTI-03, 22 novembre 2026. Référentiel [V090](../specifications/OuQuandQui_API_V090_Budget_Arrets_2026-11-22.md).

| Cas | Résultat attendu |
|---|---|
| Aucun frais renseigné | Prix de référence appliqué à la consommation ; sous-total connu, aucun total complet |
| Absence de péage déclarée et trois frais saisis à zéro | Proposition puis confirmation ; achats en station exclus du total |
| Grille locale et classe non qualifiée | Ajout impossible ; aucun zéro inventé |
| Passage ajouté sans couverture complète | Source et sous-total affichés, budget incomplet |
| Date/classe/méthode modifiée ou ligne retirée | Proposition et couverture invalidées ; pas d’adoption ancienne |
| Montant manuel sans référence | Proposition refusée |
| Modification de copie et nouveau calcul | Dernier budget confirmé conservé pendant l’édition, nouveau parcours sans ancien budget |
| Grille expirée ou source modifiée | Total actuel retiré et nouvelle sauvegarde bloquée ; retour d’horloge sans réactivation |
| Collection 2 avec parcours 1 et 2 | Lecture sans écriture ni appel ; export/import conserve les deux formats |
| Import futur, budget altéré, conflit de stockage | Ancienne copie préservée |
| Clavier, texte 200 %, rotation, noms avec HTML | Actions accessibles, données inertes, fermeture disponible |

Les contrôles purs sont dans `tests/multi-budget.test.mjs` ; huit scénarios dans `tests/e2e/multi-budget.spec.mjs`. Les cas grille/couverture et sauvegarde/import rejoignent la matrice Firefox/WebKit. Les résultats complets, les limites des essais locaux, la revue visuelle et la vérification du commit publié sont conservés dans `quality/multi-budget/` et le suivi du chantier.

Une recette tarifaire teste l’application et ses hypothèses, sans attester un passage réel. Le trajet public de démonstration utilise uniquement des lieux publics ; aucun nouveau fournisseur ne reçoit de lieu personnel.

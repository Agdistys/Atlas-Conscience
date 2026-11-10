# Prédiction scellée · prévoir la propagation avec des observations partielles et bruitées

*10/11/2026 08h48, heure de Paris (2026-11-10T07:48:42Z), lue sur le Mac · scellée **avant** tout calcul de la réponse de référence.*

**Auteur de l'épreuve** : Isil. **Scellé** : Claude, selon le brief validé par Diane le 10/11/2026 à 07h17 (`BRIEF_2026-11-10_Isil_Scelle_Externe_Epreuve_Observations_Partielles_V001.md`).

## Ce qui est scellé

Dossier : `0.Protocole/CONTROLE QUALITE/travail/Theorie_Tout_Observations_V001_2026-11-10/` — au moment du relevé, il ne contient que ces trois fichiers (aucun résultat, aucune référence).

| Fichier | Octets | SHA-256 |
|---|---|---|
| Plan_Observations_V001.json | 13990 | `f3430b9917d4b7b134793033b84ca4b2f73d16778451c66f3f4b069b3ac7f31f` |
| Observations_V001.py | 13080 | `0b41b52d1d1a7a9e71fd9040b8fd389e923e891fa25353f68ee7f3f868fcb7b9` |
| Predictions_Observations_V001.json | 3241370 | `eef1061a89a4789c7abc278a1a3bca30e031f1192117c13c69720c4e359fd6ae` |

## La condition d'échec, écrite d'avance (citée du plan, champ « criteria »)

- Seuil : erreur absolue ≤ 0,05 (unités du modèle) pour au moins 80 % des dossiers, dans la cellule principale (graphe pondéré principal, B = 2048, σ = 0,05, h = 0,08), chaque masque rapporté séparément.
- Comparaison : méthode par moments contre ajustement direct standard, mêmes données et mêmes budgets ; non-infériorité seulement si la borne haute de l'IC95 % bootstrap apparié est ≤ 0,02, pour chaque masque principal.
- Contrôle nul : IC95 % de « moments − nul » avec une borne haute < 0, pour chaque masque principal.
- « Échec de la revendication principale si un des masques principaux manque le taux 80 %, la non-infériorité, ou le gain contre nul. Si contrôle numérique de référence échoue : résultat invalide, pas modification automatique du pas. »

## Comment vérifier

Sur le Mac : `shasum -a 256` sur les trois fichiers. Toute empreinte différente signifie que le fichier a changé après le scellé. Une empreinte prouve l'intégrité, pas la date : la date est attestée par la copie de ce scellé déposée dans le projet claude.ai à la même minute, et par sa publication en ligne si Diane la décide.

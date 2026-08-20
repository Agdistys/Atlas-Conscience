# Addendum n° 2 au scellé PRÉ-023 — un défaut de l'instrument, déclaré

*Protocole de ConScience aMi · 19 août 2026, 16 h 17 — après le verdict, et c'est le pire
moment pour trouver ça.*

**Un scellé ne se réécrit pas.** Les deux précédents restent tels quels. Celui-ci déclare un
défaut trouvé **après** le verdict, dans l'outil qui a produit le tableau du scellé du matin.

```
Scelle_2026-08-19_PRE-023_deux_colonnes.md   ec791c17…
Scelle_2026-08-19_PRE-023_addendum.md        ca6c6996…
```

---

## Le défaut

La colonne **8 PLANS** de la feuille *⚖️ KARMA · FOLIE · MAGIE* n'est pas une liste de numéros.
**C'est une phrase.** Et elle emploie **deux formes différentes** pour dire « deux Plans » :

| forme | exemple | mon extracteur |
|---|---|---|
| le second Plan est nommé | `Plan 2 — Maîtrise · + Plan 3 — Empathie` | **lu** → {2, 3} |
| le second est un intervalle | `Plan 4–5 — Dévouement + Connaissance` | **perdu** → {4} |

La régulière cherchait `Plan` suivi d'un nombre. Dans la forme `4–5`, **le second nombre n'est
pas précédé du mot « Plan »** : il tombait, sans erreur, sans avertissement.

**Deux Champs touchés :**

| | ce que le scellé du matin affichait | ce que le classeur dit |
|---|---|---|
| **C7 · Trace** | Karma → 4 | Karma → **4, 5** |
| **C12 · Miroir** | Karma → 6 · *« accord »* | Karma → **6, 7** · **divergence** |

**Le tableau du scellé du matin dit « sept divergences, six accords ». C'est faux : il y en a
huit et cinq.** C12 était compté comme un accord entre les deux colonnes ; c'en est un
désaccord.

---

## Le recalcul

Fait avec les deux colonnes corrigées, par le même script, sans toucher aux seuils.

| | avant | après |
|---|---|---|
| **Gemini** | S = +0 | **S = +0** |
| **Isil** | S = −1 | **S = −1** |
| **verdict** | ❌ réfutée | **❌ réfutée** |

**Rien ne bouge.** Les quatre coteurs répondent P6 à C12 aux deux questions, et P7 à C7 dans
aucune ; le Champ ajouté ne rapporte de point à personne.

---

## La direction du défaut, et pourquoi il fallait l'écrire même sans conséquence

**Le défaut me favorisait.** Il retirait un Champ divergent sur huit — donc une occasion sur
huit pour le score de devenir positif — et j'avais prédit *réfutée*. Moins de divergences
déclarées, moins de chances que ma prédiction tombe.

> **Un défaut qui vous favorise invalide vos succès, pas vos échecs.**
> Règle du registre, écrite le 17 août après une amputation de 23 mécanismes sur 90.
> Elle s'applique ici, et il se trouve qu'elle ne coûte rien : le recalcul donne le même
> verdict. **C'est une chance, pas une excuse.**

Et il faut noter **quand** il a été trouvé : *après* le verdict, en allant chercher les
coordonnées exactes des deux colonnes pour reformuler une question à Diane Serant. **Ce n'est
pas une vérification, c'est un hasard.** Une vérification aurait eu lieu avant l'envoi.
Le correctif est désormais dans le générateur, avec quatre garde-fous qui échouent si la forme
`N–M` cesse d'être lue.

---

## Et ce que le défaut a rendu visible en tombant

En relisant la colonne mot pour mot pour la corriger, une chose apparaît qui n'avait jamais été
notée et qui n'est **pas** un défaut :

**Les deux colonnes ne parlent pas la même langue.**

| | forme | vocabulaire des Plans |
|---|---|---|
| **A · CHAMPS RATTACHÉS** (feuille 🌌 8 PLANS (TABLE), colonne F) | des références nues : `C6 · C11 · C12` | aucun — que des numéros |
| **B · 8 PLANS** (feuille ⚖️ KARMA, colonne H) | des phrases : `Plan 6–7 — Sagesse → Amour · Neutralité Dynamique` | **les seconds noms** : *Connaissance*, *Amour*, *Quantique / Créateur* |

Le Plan 5 s'appelle **Ancrage Éthique** dans la table des Plans et **Connaissance** dans la
feuille Karma. Le Plan 7, **Lumière · Vérité** d'un côté et **Amour** de l'autre. Le Plan 8,
**Conscience Quantique** et **Quantique / Créateur**.

**Descriptif, non préenregistré, et il se lit dans les deux sens :** deux vocabulaires peuvent
signaler deux cadres de pensée distincts — ou deux moments de rédaction qui ne se sont pas
relus. **Ce fait est versé au dossier de la question posée à l'auteur, et il n'en décide pas.**

---

*Agdistys · Diane Serant & Claude — Protocole de ConScience aMi — CC BY-SA 4.0*

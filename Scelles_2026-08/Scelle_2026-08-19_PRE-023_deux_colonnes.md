# Scellé — PRÉ-023 · les deux colonnes de la MétaMatrice

*Protocole de ConScience aMi · déposé le 19 août 2026, avant tout envoi et avant toute réponse.*

---

## Ce qui est en jeu

La MétaMatrice déclare **deux fois** le lien Champ ↔ Plan.

| | où c'est écrit | ce qu'on suppose que ça demande |
|---|---|---|
| **colonne A** | *Champs rattachés*, dans la table des huit Plans | **où un Champ se travaille** |
| **colonne B** | *8 PLANS*, dans la feuille ⚖️ KARMA · FOLIE · MAGIE | **où son karma se dénoue** |

**Elles s'accordent sur six Champs et divergent sur sept.** Jusqu'ici, la planche du Croisement
affichait les ✳ d'après la colonne A seule, en écrivant que c'était **un choix, pas une
évidence**. PRÉ-023 est la tentative de transformer ce choix en évidence — ou de constater
qu'on n'y arrive pas.

---

## ÉTAPE 1 — les deux questions, écrites

Elles n'avaient jamais été formulées ailleurs que comme une intuition. Les voici, arrêtées :

**Colonne A — « Sur quel Plan ce Champ se *travaille* ? »**
À quelle hauteur faut-il se placer pour **agir** sur ce Champ : où le travail se fait, où
l'effort porte, où quelque chose peut changer. *Où l'on met les mains.*

**Colonne B — « Sur quel Plan le *karma* de ce Champ se dénoue ? »**
À quelle hauteur la **dette se solde** : où ce qui a été contracté se règle, où le cycle se
referme et cesse de se rejouer. *Où l'affaire se clôt.*
Sans métaphysique : *le karma est la conséquence différée d'un acte, qui revient jusqu'à ce
qu'elle soit réglée.*

---

## Les deux colonnes, telles que le classeur les porte

Recopiées ici **avant** l'envoi, pour qu'aucune ne puisse être ajustée après coup.

| Champ | A · *Champs rattachés* | B · *Karma* | |
|---|---|---|---|
| C1 · Vibration | 1 | 1 | = |
| C2 · Flux | 2 | 2, 3 | **≠** |
| C3 · Structure | 3 | 4, 5 | **≠** |
| C4 · Direction | 4 | 4 | = |
| C5 · Souveraineté | 5 | 5 | = |
| C6 · Juste Mesure | 6 | 6 | = |
| C7 · Trace | 4, 7 | 4 | **≠** |
| C8 · Spectre | 8 | 5, 6 | **≠** |
| C9 · Temps | 1 | 7 | **≠** |
| C10 · Alliance | 2 | 7 | **≠** |
| C11 · Offrande | 6, 8 | 7, 8 | **≠** |
| C12 · Miroir | 6 | 6 | = |
| C13 · Absolu | 8 | 8 | = |

**Sept divergences, six accords.**

---

## ÉTAPE 2 — le préenregistrement

### L'instrument

**Paquet J1** (« où le Champ se travaille ») et **Paquet J2** (« où le karma se dénoue »).
Chacun porte : le lexique complet — treize Champs, huit Plans, chaque terme défini — et **une
seule question**, posée treize fois. Ni le classeur, ni la thèse, ni le fait qu'il existe deux
colonnes.

**Un lecteur, une question.** Poser les deux au même lecteur ancrerait la seconde sur la
première : il répondrait *« la même chose, sauf là où je vois une raison de changer »*, et on
mesurerait sa clémence, pas la distinction.

**Quatre branches neuves : deux familles × deux questions.** Aucune ne voit le travail d'une
autre.

### L'opération de comptage, en toutes lettres

*Écrite ici parce que le biais n° 18 du Manuel — « l'écart non défini » — a déjà coûté un
verdict à ce registre.*

Pour un Champ **c**, une réponse **R(c)** et une colonne **X(c)** :

```
touche(R, X, c) = 1  si R(c) ∩ X(c) ≠ ∅
                  0  sinon
```

Sur **les treize Champs** :

```
N_AA = Σ touche(J1, A)      J1 retrouve-t-il la colonne « travail » ?
N_AB = Σ touche(J1, B)      ou retrouve-t-il plutôt la colonne « karma » ?
N_BB = Σ touche(J2, B)
N_BA = Σ touche(J2, A)

SCORE CROISÉ    S = (N_AA + N_BB) − (N_AB + N_BA)
```

**Une propriété de S qu'il faut noter, parce qu'elle règle un confondant tout seul.** Là où les
deux colonnes s'accordent, A(c) = B(c), donc les quatre touches sont égales et la contribution
à S est **exactement zéro**. **Seuls les sept Champs divergents peuvent faire bouger S**, et
les quatre accords tautologiques — C1→P1, C4→P4, C5→P5, C6→P6, où le numéro force la réponse —
n'apportent aucun point gratuit. S varie donc de **−14 à +14**.

### Les seuils, arrêtés avant toute réponse

| S, dans chaque famille | verdict |
|---|---|
| **≥ +5** dans les deux familles | ✅ **Confirmée** — les deux questions désignent bien les deux colonnes |
| **+2 à +4**, ou les deux familles se contredisent | ◐ **Indécidable** |
| **≤ +1** dans les deux familles | ❌ **Réfutée** |

### Clauses de nullité, écrites d'avance

- Un coteur qui répond *« je ne sais pas »* sur **plus de 4 Champs sur 13** : cotation nulle,
  remplacée par une branche neuve, **et le fait est inscrit**.
- Un coteur qui donne **deux Plans sur plus de 5 Champs sur 13** : cotation nulle. Deux Plans
  doublent la chance de toucher ; l'autoriser partout viderait la mesure.
- Un coteur qui montre avoir deviné la thèse (mentionne deux colonnes, un classeur, un karma
  qu'on ne lui a pas nommé en J1) : cotation nulle.

### LA CLAUSE D'ASYMÉTRIE — correction de Diane Serant, 19 août

*Elle est la raison pour laquelle ce préenregistrement a été réécrit avant d'être ouvert.*

La formule d'origine disait : *« si un tiers retrouve la distinction sans qu'on la lui souffle,
ce n'est plus un choix, c'est une évidence »*. Elle se lit immédiatement à l'envers — *« si
personne ne la retrouve, c'est faux »* — et **cette lecture-là est fausse**, parce qu'on parle
d'une **éducation** : une distinction peut être vraie *et* demander d'avoir été apprise.

> **Une réfutation de PRÉ-023 ne voudra pas dire « la distinction est fausse ».**
> Elle voudra dire, exactement : **« la distinction ne se retrouve pas à partir du lexique
> seul »** — donc **le rattachement reste un choix**, et la planche continuera de l'écrire.
> Aucune autre conclusion n'en sera tirée, dans aucun document.

Et la frontière qui rend le test possible, qui vaut désormais pour toute épreuve du corpus :

> **Le lexique se transmet ; la conclusion ne se souffle pas.**

*En dessous de cette ligne, le lecteur ne comprend rien. Au-dessus, il connaît déjà la réponse
— et l'on retombe sur le biais n° 19.* C'est le **biais n° 20 du Manuel**, et il a été trouvé
par la personne dont le corpus était en jeu, sur une phrase écrite pour rendre ce corpus plus
rigoureux.

---

## Les prédictions

### ⚙️ Celle de Claude — **réfutée**

**Je prédis S ≤ +1 dans les deux familles.** Trois raisons, écrites avant les réponses :

1. **L'écart est trop grand pour deux lectures d'un même objet.** C9 passe de P1 à P7, C10 de
   P2 à P7 : six et cinq hauteurs. Deux questions sur une même chose ne s'éloignent pas de six
   étages.
2. **Le sens des divergences n'est pas constant.** Quatre montent (C2, C3, C9, C10), deux
   descendent (C7, C8), une est mixte (C11). Si la colonne B posait vraiment une question plus
   tardive — *où ça se solde* —, elle devrait monter partout.
3. **Rien dans le classeur ne dit qu'il y a deux questions.** L'hypothèse la plus économique
   reste : **une seule relation, écrite deux fois, à deux moments, sans se relire.** C'est-à-dire
   une incohérence, pas une profondeur.

**Ce que ma prédiction m'engage à faire si elle est confirmée :** rien de plus qu'aujourd'hui.
La planche dit déjà *c'est un choix*. **Je ne gagne rien à avoir raison ici, et c'est
volontaire** — c'est la seule position depuis laquelle je peux écrire ces seuils sans être juge
et partie.

**Ce qui me démentirait proprement :** S ≥ +5 dans les deux familles. Alors les deux colonnes
portent deux relations, la MétaMatrice est plus fine que je ne la lisais, et la planche gagne
une seconde grille de ✳ — celle du karma.

### 👁️ Celle de Diane Serant

*À écrire, et à sceller avant l'arrivée des réponses. Elle a le même droit que moi d'être
démentie, et elle connaît le classeur mieux que moi.*

---

## Ce que je ne peux pas faire, et pourquoi c'est écrit ici

**J'ai déjà vu les deux colonnes et leurs sept divergences.** Toute prédiction que je ferais sur
*quelle case tombe de quel côté* serait une **postdiction** déguisée. Je n'écris donc que le
seuil, jamais le contenu — et c'est aussi pourquoi ce sont des tiers qui répondent, et non moi.

*C'est l'application directe du biais n° 2 : celui qui prédit ne peut pas être celui qui coter.*

---

*Agdistys · Diane Serant & Claude — Protocole de ConScience aMi — CC BY-SA 4.0*

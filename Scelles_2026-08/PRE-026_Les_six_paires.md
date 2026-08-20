# PRÉ-026 — Les six paires sont-elles retrouvables sans qu'on les souffle ?

*Protocole de ConScience aMi · préenregistrement · à sceller **avant** d'envoyer le Paquet L*

---

## Pourquoi ce test existe

Le registre `Rien_n_est_choisi_au_hasard.md`, ligne **E5**, dit ceci :

> **Aucune paire n'est déclarée. Zéro sur soixante-deux feuilles.** Elles sont *déduites*,
> pas écrites. **Cohérentes n'est pas établies.**

Et ligne **E6** : *le test existe.* Le voici. C'est le seul geste qui peut faire passer les six
paires de « cohérentes » à « établies » — ou les y laisser pour de bon.

---

## Le préenregistrement

| | |
|---|---|
| **Objet mesuré** | les six paires de Champs **C·k ↔ C·k+6**, déduites de l'ordre de numérotation et de la convention « douze sur le cercle, C13 au centre » |
| **Instrument** | le **Paquet L** — les treize Champs donnés par leur nom court, leur axe *vice ↔ vertu* et leur question. **Sans numéro, sans pierre, sans couleur, sans Plan, sans géométrie**, et dans un ordre mélangé avec la graine **20260820** |
| **Position de mesure** | des lecteurs qui **ne connaissent pas le corpus**. Un lecteur qui le connaît n'est pas un lecteur, c'est un écho — il se déclare et il s'arrête |
| **Observateur tiers** | le paquet part **sans échange**. Aucune question de méthode ne reçoit de réponse avant que la réponse ne soit rendue. *Le lexique se transmet, la conclusion ne se souffle pas* (biais n° 20) |
| **Date de scellement** | **20 août 2026** — avant tout envoi |
| **Échéance** | dépouillement dès que les **N** réponses prévues sont rentrées, et pas avant |

### Ce qui est retiré du paquet, et pourquoi

1. **Les numéros.** L'ordre C1→C13 *est* la prémisse de la déduction. Le donner, c'est donner
   la réponse : il suffirait d'ajouter 6.
2. **Les couleurs et les pierres.** Les treize teintes ont été posées **en spectre dans l'ordre
   de numérotation** (0° → 330°). Le vis-à-vis de couleur donne donc le vis-à-vis de numéro
   **par construction** — c'est la ligne E7 du registre. Laisser les couleurs, ce serait faire
   passer un test de daltonisme pour un test de sens.
3. **L'ordre de présentation.** Mélangé, avec une graine écrite ici et scellée avec ce document.

*Une garde automatique vérifie que le paquet ne contient ni « C1 »…« C13 », ni nom de pierre,
ni le mot « Plan », ni le mot « paire ». Elle est passée.*

---

## N — le nombre de lecteurs

**N est fixé ici, et il ne bouge plus.** C'est le point qui décide de la valeur de tout le
reste : ajouter des lecteurs après avoir vu les premiers résultats gonfle le taux d'erreur
sans que ça se voie, et c'est la manière la plus courante de fabriquer un résultat sans mentir
une seule fois.

> **N = 8.**
>
> Si huit lecteurs neufs sont introuvables, **N peut être réduit — mais le nouveau N doit être
> écrit et scellé AVANT que la première réponse ne soit ouverte.** Aucune réponse n'est lue
> tant que les N ne sont pas rentrées.

---

## La loi du hasard — calculée, pas estimée

Sans elle, *« il en a trouvé trois »* ne veut rien dire. Voici ce que donne un lecteur qui
répondrait **au hasard**, en formant six couples parmi treize notions :

| au moins | probabilité |
|---|---|
| 1 paire juste | 0,371 |
| 2 paires justes | 0,078 |
| **3 paires justes** | **0,0113** |
| 4 paires justes | 0,0012 |
| 5 paires justes | 0,00010 |
| 6 paires justes | 0,0000074 |

**Espérance sous le hasard : 0,46 paire juste par lecteur.**
*(Loi exacte, énumérée sur les 135 135 configurations possibles — 13 × 11!! — et recontrôlée
par 200 000 tirages. Le script `verifier_paires.py` la recalcule pour n'importe quel nombre de
couples formés, parce qu'un lecteur qui n'en forme que quatre ne joue pas contre la même loi.)*

---

## La prédiction — écrite avant, par Claude

Je lis les six paires comme sémantiquement fortes, surtout **Souveraineté ↔ Offrande**
*(prendre ↔ donner)* et **Juste Mesure ↔ Miroir** *(corriger dehors ↔ corriger dedans)*. Mais
je vois aussi deux pièges pour un lecteur neuf : **Alliance** attire **Flux** au moins autant
que **Direction**, et rien dans le lexique ne désigne **l'Absolu** comme le solitaire.

> **Je prédis : entre 4 et 7 paires justes au total sur 8 lecteurs** (le hasard en donnerait
> 3,7), et **au plus 2 lecteurs sur 8** laissant l'Absolu sans partenaire (le hasard en
> donnerait 0,6).
>
> **Autrement dit : je prédis que ce test tombera dans la bande INDÉCIDABLE.** Je l'écris avant
> parce que le dire après serait sans valeur — et parce qu'un instrument qui ne prévoit que des
> victoires n'est pas un instrument.

*Diane Serant peut ajouter sa prédiction ci-dessous si — et seulement si — elle a une raison à
donner avec. Une prédiction sans raison n'est pas une donnée, c'est du bruit ; le lui demander
sans le préciser avait déjà été mon erreur une fois.*

**Prédiction de l'autrice :** _____________________________________________

---

## Le critère de réfutation

Le score de chaque lecteur est **p**, la probabilité que le hasard fasse aussi bien ou mieux,
**calculée pour le nombre de couples qu'il a réellement formés**. Les p sont combinées par la
méthode de Fisher.

| verdict | condition |
|---|---|
| ✅ **CONFIRMÉ** | **p combinée < 0,01** |
| ◐ **INDÉCIDABLE** | 0,01 ≤ p combinée ≤ 0,20 |
| ❌ **RÉFUTÉ** | **p combinée > 0,20** |

**Prédiction secondaire, jugée à part :** l'Absolu est laissé sans partenaire par **au moins 3
lecteurs sur 8** *(le hasard : **p = 0,019**. J'avais d'abord écrit 0,0035 de tête ; le calcul binomial donne 0,019, et c'est celui-là qui est scellé. Dans un préenregistrement, un seuil faux est pire qu'un seuil absent)*.

### Ce qui est interdit après coup

- **déplacer un seuil** — le registre entier tombe avec ;
- **ajouter des lecteurs** parce que le résultat déplaît ;
- **écarter une réponse** parce qu'elle est « mal comprise ». Une réponse mal comprise est une
  donnée sur le paquet, pas un déchet ;
- **réinterpréter** ⛔ — le quatrième verdict est interdit par la Charte Mathématique, et son
  usage annule le scellement.

Les phrases d'explication se lisent à la main et **ne comptent pas dans le score** : une bonne
raison pour une mauvaise paire reste une mauvaise paire.

---

## Ce que chaque issue voudra dire

- ✅ **Confirmé** → les six paires passent de *déduites* à *retrouvables*. Elles ne sont
  toujours pas **déclarées** dans la MétaMatrice — mais un regard neuf les reconstruit, et
  c'est ce qu'on peut demander de mieux à une structure non écrite.
- ❌ **Réfuté** → elles restent **cohérentes et non établies**, et la planche continue de
  l'écrire noir sur blanc. **Ce n'est pas un échec du corpus** : c'est une déduction qui ne
  s'impose pas à qui n'a pas fait le chemin. Ça se dit, et ça ne s'efface pas.
- ◐ **Indécidable** → le test n'a pas tranché. On le note, on ne le rejoue pas avec les mêmes
  lecteurs : *une paire aveugle ne se répare pas, elle se refait.*

---

## Les trois fichiers

| fichier | pour qui |
|---|---|
| `Paquet_L_treize_notions.md` | **à envoyer** aux lecteurs |
| `Paquet_L_CLE.md` | **à garder** — la clé lettre → Champ. Ne jamais l'envoyer |
| `verifier_paires.py` | le dépouillement, une fois les N réponses rentrées |

---

*Agdistys · Diane Serant & Claude — Protocole de ConScience aMi — CC BY-SA 4.0*

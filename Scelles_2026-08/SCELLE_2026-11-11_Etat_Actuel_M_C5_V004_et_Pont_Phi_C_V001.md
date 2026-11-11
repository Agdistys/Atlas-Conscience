# SCELLÉ · 11/11/2026 · État actuel de la lecture M/C5 V004 et du pont Φ / C V001

**Empreintes calculées le 11/11/2026 à 01h13 (heure de Paris, lue sur le Mac de Diane), SHA-256.**
**Statut : scellé de l'état actuel, posé AVANT toute réponse de lecteur pour la V004. Ce n'est pas le plan final : le plan reste à valider et à figer.**

## 1 · Ce que ce scellé garantit
- Les fichiers listés ci-dessous existaient avec exactement ce contenu au moment du calcul.
- La date externe est celle du dépôt de ce fichier sur GitHub (Agdistys/Atlas-Conscience), pas celle écrite ici.
- Aucune personne n'a été sollicitée et aucune réponse n'a été collectée pour la V004 au moment du calcul (déclaration de la préparation, non vérifiable par ce fichier).
- Les fichiers de référence (dossier organisation/) ont été empreintés sans être ouverts ni lus.

## 2 · Lecteurs : la base déclarée
- **Base** : Claude + un second modèle parmi Grok, GPT ou DeepSeek. Gemini est exclu.
- **La base peut changer** selon les problèmes rencontrés avec les modèles.
- **Règle** : avant la première réponse, le plan final nomme le modèle exact (fournisseur, nom, version, paramètres) et la façon de rendre les réponses (JSON brut, sans balises Markdown). Ce plan final reçoit son propre scellé, posé sur GitHub avant la première réponse. Si un modèle change ensuite, nouveau plan, nouveau scellé, avant toute réponse.
- Diane est la seule lectrice humaine disponible ; elle n'est pas aveugle (elle connaît le corpus et les références).

## 3 · Lecture M/C5 V004 — 12 fichiers
Dossier : CONTROLE QUALITE/travail/Theorie_Tout_Dictionnaire_V001_2026-11-10/Lecture_Attribution_M_C5_V001/

```
5679904a118e35316761b883dd6952ea4fbd56c2a9c103ab6559bf34cb1f59cb  Preparation_Lecture_Humaine_V004/Lire_Preparation_Humaine.html
d21e018e2ab20bb08aff4521ea9b31d57f7c6e172246ce1b49b8f15f62fd2175  Preparation_Lecture_Humaine_V004/Lire_avant_transmission.txt
28adf180c2f6f82d5b52280b01661e0f08d17c2dfff26864dfc1b2ffe12e59b0  Preparation_Lecture_Humaine_V004/MANIFESTE_INTEGRITE.json
4f128eb7b853ae7089f795932d256f8b7248d98d0ade8470b8bbbabbaa68e9a1  Preparation_Lecture_Humaine_V004/lecteurs/Formulaire_a_remplir.txt
dd5af22d11b5c2e3349d2bfd6cc3cc2d3547e0bb609a3d2eb363046caee388a3  Preparation_Lecture_Humaine_V004/lecteurs/Guide_V004.txt
bfe2bcc515d093efff674f0454936f927bb58a1c8c10c0bc5a57a016a7fb6c32  Preparation_Lecture_Humaine_V004/lecteurs/Mode_emploi.txt
50898c9e5bec762b52ed2ade49fac2132ab0ad4fc29c781be1119eab8d833af7  Preparation_Lecture_Humaine_V004/lecteurs/Situations_a_lire.txt
26acdfa6291b143275f68c821cfb316328a1c0f77313d21a8c422232639a9206  Preparation_Lecture_Humaine_V004/organisation/Changements_et_limites.txt
45414c119c0a4f0eb787c8f6a690f507dd8bd954acded47440e4828c1f87946f  Preparation_Lecture_Humaine_V004/organisation/Plan_lecture_humaine_a_valider.json
02b39f134acbb02be8154c5140a3507ccbbd0ad76bf885fd2cacd6c8ff6e4925  Preparation_Lecture_Humaine_V004/organisation/Reference_provisoire_V004.json
7ae83a97b08bf63380e3504fd09e3ddc43e0bc38ed89f913c44e250e725840bf  Preparation_Lecture_Humaine_V004/organisation/Situations_source_V003.json
52eeb285ae5cfe9babf6c9e5f8cf7efecbf80898a125d47aef313a7e523141fb  Preparation_Lecture_Humaine_V004/organisation/Verification_preparation_V004.json
```

Remarques : Situations_a_lire.txt a la même empreinte que lecteurs/Situations_V003.txt ; Situations_source_V003.json la même que lecteurs/Situations_V003.json ; Reference_provisoire_V004.json la même que organisation/Cle_provisoire_V003.json (scellé local V003 du 10/11). Les situations et la référence sont donc reprises sans changement de la V003.

## 4 · Pont Φ / C V001 (proposition d'Isil, plan adopté par Diane le 11/11) — 6 fichiers
Même dossier.

```
f94c081a0a61ae59f22acf23f6c47c1100530877faa7905d859ef3bc881d3b71  Pont_Phi_C_V001/Controles_Analytiques_V001.json
41353565e0b71d3c7bbf71b95f17262ab0d2b7b5bc72e6382ec1f616f415cabf  Pont_Phi_C_V001/Lire_Pont_Phi_C_V001.html
0f1e73f3aa29533106923a398590021fdb9251a31d9b139de6d6803cf5777fe6  Pont_Phi_C_V001/MANIFESTE_INTEGRITE.json
009056c131f76a203be30eb768c9d22764a87c1008f984b2261210cab4955724  Pont_Phi_C_V001/Paires_Developpement_Visibles_V001.txt
78201385373ab08464addd23c9723ec45cc57c05b856644f88131cd34d05df40  Pont_Phi_C_V001/Retour_Claude_Pont_Phi_C_V001.txt
408a027d1bb2c30dccbe0f144c5f97dce24c8c4cda547a2de2f0ee8652324a27  Pont_Phi_C_V001/Verifier_Controles_Analytiques.py
```

## 5 · Vérifier
Sur le Mac, dans le dossier du § 3 : `shasum -a 256 <chemin>` pour chaque ligne ; chaque empreinte doit être identique. Une seule différence d'octet change toute l'empreinte.

*Agdistys • Diane Serant · empreintes calculées par Claude · CC BY-SA 4.0*

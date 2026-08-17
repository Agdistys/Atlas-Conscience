# Les fichiers scellés — et comment vérifier qu'aucun n'a bougé

*Protocole de ConScience aMi · neuf scellés, 15 et 16 août 2026*

Ce dossier contient les **fichiers originaux**, octet pour octet. C'est important :
une empreinte SHA-256 se calcule sur les octets d'un fichier. Recopiés dans un document
Word, les mêmes mots donnent d'autres octets, donc une autre empreinte — et la
vérification devient impossible. C'est ce qui manquait au premier envoi.

## Vérifier — une seule commande

**macOS** (Terminal, depuis ce dossier) :

    shasum -a 256 -c EMPREINTES.txt

**Linux** :

    sha256sum -c EMPREINTES.txt

**Windows** (PowerShell, fichier par fichier) :

    Get-FileHash -Algorithm SHA256 .\Scelle_2026-08-15_C08_Spectre.md

Chaque ligne doit répondre **OK**. Une seule ligne `FAILED` signifie que le fichier
a changé depuis son scellement — et la Charte est explicite : cela annule le sceau,
et le registre avec.

## Ce que la vérification établit, et ce qu'elle n'établit pas

**Elle établit** que le contenu de ces neuf fichiers est identique à celui dont
l'empreinte avait été publiée dans le chat, à la date indiquée dans chacun.

**Elle n'établit pas** que l'empreinte a été publiée avant les réponses qu'elle
prétend précéder. Ça, seul l'horodatage du fil de conversation le montre —
l'empreinte prouve l'intégrité, pas l'antériorité.

## Les neuf

| fichier | scellé le |
|---|---|
| `Scelle_2026-08-15_C08_Spectre.md` | 15 août |
| `Scelle_2026-08-15_C09_Temps.md` | 15 août |
| `Scelle_2026-08-15_C10_Alliance.md` | 15 août |
| `Scelle_2026-08-15_C12_Miroir.md` | 15 août |
| `Scelle_2026-08-15_C13_Absolu.md` | 15 août |
| `Scelle_2026-08-16_C02_C03_C04_C11.md` | 16 août |
| `Scelle_2026-08-16_C05_Souverainete.md` | 16 août |
| `Scelle_2026-08-16_C06_JusteMesure.md` | 16 août |
| `Scelle_2026-08-16_C07_Trace_et_C01_Vibration.md` | 16 août |

---

*Agdistys · Diane Serant & Claude — Protocole de ConScience aMi — CC BY-SA 4.0*

# V062 — Outils de vérification et installations reproductibles

QUA-DEPENDANCES-01 · 20 novembre 2026. Complète QUA-08, QUA-12 et QUA-01 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md) et la [recette des parcours essentiels V061](OuQuandQui_API_V061_Compatibilite_2026-11-20.md). Les éditions précédentes et leurs preuves restent conservées.

## Versions retenues

| Outil | Version précédente | Version retenue | Rôle |
|---|---|---|---|
| Playwright | 1.55.0 | 1.65.1 | Orchestration des recettes et moteurs de navigateur. |
| axe-core | 4.10.3 | 4.14.1 | Détection automatique d’une partie des défauts d’accessibilité. |
| Leaflet | 1.9.4 | 1.9.4, conservée | Même bibliothèque que la carte distribuée ; version stable du registre à la date de vérification. |

Les versions sont exactes dans `package.json`. Le nouveau `package-lock.json` conserve aussi les versions et empreintes des dépendances indirectes. Les installations du banc utilisent `npm ci --ignore-scripts --no-audit --no-fund` : un décalage entre manifeste et verrou bloque l’installation et les scripts de cycle de vie des paquets ne sont pas exécutés.

L’image de la recette complémentaire est `mcr.microsoft.com/playwright:v1.65.1-noble`, de même version que le paquet. Ubuntu 24.04 reste fixé. Le contrat vérifie la concordance du manifeste, du verrou, des versions installées et de l’image, ainsi que la présence des sources npm HTTPS et de leurs empreintes. Les anciennes versions restent consultables dans Git.

## Versions réellement exécutées

Avant la recette complète, `tests/toolchain.mjs` démarre le moteur Chromium configuré pour les essais puis consigne sa version, son canal, Node, le système, les dépendances effectivement installées, l’empreinte du verrou et le commit. Cette preuve est distincte des versions attendues d’un paquet téléchargé.

Le rapport public expose ces données et la matrice Firefox/WebKit. Une preuve absente, en échec, liée à un autre commit ou incohérente avec la version Playwright de la recette complémentaire bloque l’inspection et la construction du nouvel aperçu. L’assemblage à blanc de la branche répète le contrôle ; le programme de publication conservé sur `main` reçoit l’artefact produit après ces étapes réussies. Les aperçus historiques gardent leur preuve d’origine.

La distribution Playwright retenue annonce Chromium 159.0.8154.6, Firefox 159.0 et WebKit 27.2. Le rapport daté fait autorité sur les versions réellement démarrées. Ces moteurs fournis pour les essais ne constituent pas une qualification des dernières versions commerciales de tous les navigateurs.

## Recette et accessibilité

Les vingt parcours essentiels restent exécutés sur Firefox et WebKit, avec deux formats par moteur. La suite Chromium complète et les essais de l’aperçu restent obligatoires, sans retrait d’assertion, scénario ignoré ou nouvelle tentative automatique pour obtenir un succès.

Le filtre axe conserve les règles WCAG 2.0 et 2.1 A/AA et ajoute le groupe `wcag22aa`, notamment la règle de taille minimale des cibles. Les résultats de cette édition ne sont pas directement comparables à un simple décompte réalisé avec axe 4.10.3. Toute anomalie nouvellement détectée doit être examinée ; les points incomplets restent distincts d’une conformité établie. Le contrôle manuel, le lecteur d’écran et les appareils physiques restent nécessaires.

La nouvelle analyse détecte une discordance entre les repères visibles `T1`, `T2` et leur nom accessible. Les repères Leaflet et ceux du schéma incluent désormais ce texte dans leur intitulé accessible, puis le nom et les caractéristiques du trajet. Les assertions de clavier, d’adoption et d’absence de requête restent conservées ; le nom accessible est contrôlé dans les deux rendus.

## Audit des dépendances

Un audit npm distinct est exécuté sur le banc et archivé dans `quality/npm-audit.json`. Une vulnérabilité élevée ou critique signalée interrompt la chaîne ; une réponse absente ou une panne de l’audit n’est pas présentée comme un résultat sans anomalie. Les autres niveaux demeurent visibles dans le fichier daté.

Cet audit consulte les avis connus du registre pour les paquets déclarés. Il ne certifie ni le code de l’application, ni les services externes, ni la sécurité du système, ni l’absence de vulnérabilités encore inconnues. Les versions des actions GitHub et la bibliothèque Leaflet distribuée restent distinctes de la mise à jour des deux outils de test.

## Vérification locale et limites

Le Mac utilise macOS 14.2.1 et Node 22.13.0. Chrome 157.0.8103.80 déjà installé démarre avec Playwright 1.65.1, mais les premiers essais d’export ne reçoivent pas d’événement de téléchargement. Une sonde indépendante de l’application reproduit ce résultat avec un lien détaché, dans le document ou dans une boîte de dialogue ; cette combinaison reste non qualifiée pour les exports. Aucune assertion n’est retirée et aucun export applicatif n’est modifié sur cette seule observation.

Le petit composant de capture vidéo FFmpeg est installé pour conserver les traces d’échec. Lors de cette installation, le gestionnaire Playwright a retiré de son cache les anciens binaires déclarés inutilisés ; les sources, éditions et preuves de recette sont conservées. L’espace libéré permet ensuite un téléchargement borné de Chromium Headless Shell 159.0.8154.6 (106,5 Mio d’archive) afin de distinguer un problème de l’application d’une incompatibilité du banc local. Le nettoyage automatique des autres moteurs est désactivé pour cette installation. La même sonde réussit les trois téléchargements avec ce moteur 159 ; les 80 essais locaux des vingt parcours essentiels, répartis sur quatre formats, réussissent ensuite, y compris les exports de préparations et de GPX. Ce résultat isole un écart entre les deux configurations, sans diagnostiquer la cause interne de Chrome 157. Firefox et WebKit récents restent qualifiés sur GitHub.

La documentation officielle annonce macOS 14 ou ultérieur, Ubuntu 24.04 et les branches Node maintenues parmi les systèmes pris en charge. Cela ne remplace pas un essai sur chaque appareil. Le blocage de lancement de l’ancien WebKit local reste consigné dans V061 ; cette édition ne le transforme pas en succès et ne certifie pas Safari iOS.

Aucun calcul, tarif, fournisseur de données de mobilité, format de profil ou hébergement n’est modifié par l’actualisation des outils. Les éventuelles corrections applicatives révélées par la recette sont consignées avec la livraison et leurs tests.

## Sources de version et de fonctionnement

- [Playwright 1.65.1, publication du 13 novembre 2026](https://github.com/microsoft/playwright/releases/tag/v1.65.1).
- [Moteurs associés à Playwright 1.65.1](https://github.com/microsoft/playwright/blob/v1.65.1/packages/playwright-core/browsers.json).
- [axe-core 4.14.1, publication du 16 novembre 2026](https://github.com/dequelabs/axe-core/releases/tag/v4.14.1).
- [Systèmes pris en charge](https://playwright.dev/docs/intro#system-requirements) et [images de test officielles](https://playwright.dev/docs/docker).
- [Installation npm reproductible](https://docs.npmjs.com/cli/v11/commands/npm-ci) et [limites de l’audit npm](https://docs.npmjs.com/cli/v11/commands/npm-audit).

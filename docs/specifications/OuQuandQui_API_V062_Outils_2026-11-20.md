# V062 — Outils de vérification et installations reproductibles

QUA-DEPENDANCES-01 · 20 novembre 2026. Complète QUA-08, QUA-12 et QUA-01 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md) et la [recette des parcours essentiels V061](OuQuandQui_API_V061_Compatibilite_2026-11-20.md). Les éditions précédentes et leurs preuves restent conservées.

## Versions retenues

| Outil | Version précédente | Version retenue | Rôle |
|---|---|---|---|
| Playwright | 1.55.0 | 1.64.1 | Orchestration des recettes et moteurs de navigateur. |
| axe-core | 4.10.3 | 4.14.1 | Détection automatique d’une partie des défauts d’accessibilité. |
| Leaflet | 1.9.4 | 1.9.4, conservée | Même bibliothèque que la carte distribuée. |

Les versions sont exactes dans `package.json`. Le nouveau `package-lock.json` conserve aussi les versions et empreintes des dépendances indirectes. Les installations utilisent `npm ci --ignore-scripts --no-audit --no-fund` : un décalage entre manifeste et verrou bloque l’installation et les scripts de cycle de vie des paquets ne sont pas exécutés.

L’image complémentaire est `mcr.microsoft.com/playwright:v1.64.1-noble`, de même version que le paquet. Ubuntu 24.04 reste fixé. Le contrat vérifie la concordance du manifeste, du verrou, des versions installées et de l’image, ainsi que les sources npm HTTPS et leurs empreintes. Le plafond de mémoire partagée du conteneur est de 1 Gio et les journaux de lancement des moteurs sont conservés. Les anciennes versions restent consultables dans Git.

La version plus récente 1.65.1 a été essayée puis écartée pour cette livraison : Firefox 159 interrompt des pages pendant l’audit axe du scénario de préparation reprise. Une première recette obtient 78/80 succès ; une seconde, avec davantage de mémoire partagée, 79/80. Le journal du moteur signale une terminaison de processus par signal 11. L’augmentation de mémoire ne résout donc pas le défaut observé ; sa cause interne n’est pas établie. La publication reste bloquée à chaque échec. La qualification est reprise avec 1.64.1 sans supprimer de règle ni d’assertion.

## Versions réellement exécutées

Avant la recette complète, `tests/toolchain.mjs` démarre le moteur Chromium configuré puis consigne sa version, son canal, Node, le système, les dépendances effectivement installées, l’empreinte du verrou et le commit. Cette preuve est distincte des versions attendues d’un paquet téléchargé.

Le rapport public expose ces données et la matrice Firefox/WebKit. Une preuve absente, en échec, liée à un autre commit ou incohérente avec la version Playwright de la recette complémentaire bloque l’inspection et la construction du nouvel aperçu. L’assemblage à blanc de la branche répète le contrôle ; le programme de publication conservé sur `main` reçoit l’artefact produit après ces étapes réussies. Les aperçus historiques gardent leur preuve d’origine.

La distribution 1.64.1 annonce Chromium 156.0.8078.4, Firefox 157.0 et WebKit 27.2. Le rapport daté fait autorité sur les versions réellement démarrées. Ces moteurs fournis pour les essais ne constituent pas une qualification de toutes les dernières versions commerciales.

## Recette et accessibilité

Les vingt parcours essentiels restent exécutés sur Firefox et WebKit, avec deux formats par moteur. La suite Chromium complète et les essais de l’aperçu restent obligatoires, sans retrait d’assertion, scénario ignoré ou nouvelle tentative automatique pour obtenir un succès.

Le filtre axe conserve les règles WCAG 2.0 et 2.1 A/AA et ajoute `wcag22aa`, notamment la taille minimale des cibles. Les résultats ne sont pas directement comparables à un décompte réalisé avec axe 4.10.3. Les points incomplets restent distincts d’une conformité établie. Le contrôle manuel, le lecteur d’écran et les appareils physiques restent nécessaires.

La nouvelle analyse détecte une discordance entre les repères visibles `T1`, `T2` et leur nom accessible. Les repères Leaflet et ceux du schéma incluent désormais ce texte dans leur intitulé, puis le nom et les caractéristiques du trajet. Les assertions de clavier, d’adoption et d’absence de requête restent conservées ; le nom accessible est contrôlé dans les deux rendus.

## Audit des dépendances

Un audit npm distinct est exécuté et archivé dans `quality/npm-audit.json`. Une vulnérabilité élevée ou critique signalée interrompt la chaîne ; une réponse absente ou une panne n’est pas présentée comme un résultat sans anomalie. Les autres niveaux demeurent visibles dans le fichier daté.

Cet audit consulte les avis connus du registre pour les paquets déclarés. Il ne certifie ni le code de l’application, ni les services externes, ni la sécurité du système, ni l’absence de vulnérabilités encore inconnues. Les versions des actions GitHub et la bibliothèque Leaflet distribuée restent distinctes de la mise à jour des outils de test.

## Vérification locale et limites

Le Mac utilise macOS 14.2.1 et Node 22.13.0. Chrome 157.0.8103.80 installé démarre, mais une sonde indépendante ne reçoit pas d’événement de téléchargement avec Playwright 1.65.1 ou 1.64.1, que le lien soit détaché, dans le document ou dans une boîte de dialogue. Cette combinaison locale reste non qualifiée pour les exports. Aucun export applicatif n’est modifié sur cette seule observation.

Avec Chromium Headless Shell 159 fourni par 1.65.1, la même sonde réussit trois téléchargements et les 80 essais locaux des parcours essentiels passent, exports de préparations et GPX inclus. Une contre-épreuve locale Firefox 159 atteint le délai de lecture du fichier téléchargé dans deux scénarios, avant l’audit axe : elle ne reproduit donc pas le même arrêt qu’Ubuntu et ne qualifie pas ce moteur. Les essais de la version retenue utilisent son Chromium fourni ; leurs résultats sont consignés séparément dans le bilan daté.

L’installation de FFmpeg nécessaire aux traces vidéo a conduit le gestionnaire Playwright à retirer ses anciens binaires de cache déclarés inutilisés ; les sources, éditions et preuves sont conservées. Les téléchargements de diagnostic suivants sont bornés aux moteurs nécessaires, avec nettoyage automatique des autres caches désactivé. Les moteurs locaux ne sont jamais assimilés à un appareil physique ou à Safari iOS.

La documentation officielle annonce macOS 14 ou ultérieur, Ubuntu 24.04 et les branches Node maintenues parmi les systèmes pris en charge. Cela ne remplace pas un essai sur chaque appareil. Le blocage de lancement de l’ancien WebKit local reste consigné dans V061 ; cette édition ne le transforme pas en succès.

Aucun calcul, tarif, fournisseur de données de mobilité, format de profil ou hébergement n’est modifié par l’actualisation des outils. La correction applicative porte sur les noms accessibles des repères de trajets, avec cache PWA régénéré.

## Sources de version et de fonctionnement

- [Playwright 1.64.1, version retenue](https://github.com/microsoft/playwright/releases/tag/v1.64.1) et [moteurs associés](https://github.com/microsoft/playwright/blob/v1.64.1/packages/playwright-core/browsers.json).
- [Playwright 1.65.1, version essayée puis écartée](https://github.com/microsoft/playwright/releases/tag/v1.65.1).
- [axe-core 4.14.1](https://github.com/dequelabs/axe-core/releases/tag/v4.14.1).
- [Systèmes pris en charge](https://playwright.dev/docs/intro#system-requirements) et [images de test officielles](https://playwright.dev/docs/docker).
- [Installation npm reproductible](https://docs.npmjs.com/cli/v11/commands/npm-ci) et [limites de l’audit npm](https://docs.npmjs.com/cli/v11/commands/npm-audit).

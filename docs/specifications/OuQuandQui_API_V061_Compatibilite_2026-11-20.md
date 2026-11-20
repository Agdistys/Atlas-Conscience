# V061 — Compatibilité des parcours essentiels

QUA-COMPATIBILITE-01 · 20 novembre 2026. Complète QUA-12, QUA-01 et UX-01/02/05 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [lecture agrandie V059](OuQuandQui_API_V059_Lecture_Paysage_2026-11-20.md) et les [points des stations V060](OuQuandQui_API_V060_Points_Stations_2026-11-20.md). Les éditions précédentes restent conservées.

## Périmètre vérifiable

Une recette bornée réutilise vingt scénarios existants, sans copier leur logique ni retirer leurs assertions. Elle les exécute sur les moteurs Firefox et WebKit fournis par Playwright 1.55.0, en 1440 × 900 et 390 × 844 pixels CSS : quatre combinaisons, soit quatre-vingts essais. Les cas de lecture redimensionnent aussi la fenêtre à 1024 × 768 ou 844 × 390 et doublent réellement la taille de texte racine. Le petit format représente une fenêtre redimensionnée ; WebKit y ajoute des actions tactiles simulées.

| Parcours | Résultat requis |
|---|---|
| Adresses et erreurs | Champs manquants identifiés avant les appels, correction au clavier ; panne réseau distincte d’une adresse invalide. |
| Trajet et carburants | Trajet disponible avant les stations ; panne carburants récupérable sans perte du trajet. |
| Variantes | Carte Leaflet, schéma et liste concordants ; refus sans effet, confirmation explicite, budget et GPX synchronisés. |
| Points de stations | Superposition résolue par un choix explicite, même fiche et même favori ; critères modifiés retirant les anciens résultats. |
| Profil | Véhicule, adresses et favoris conservés après rechargement et réutilisables. |
| Préparations | Enregistrement volontaire, reprise suivie d’un nouveau calcul et d’une nouvelle confirmation de l’arrêt ; export/import avec aperçu ; quota et conflit d’onglet préservant les données. |
| Lecture et clavier | Champs non coupés à texte doublé, fermeture et retour du focus, tabulation restant dans la fenêtre, saisies conservées au changement de format. |

La liste canonique et la matrice figurent dans `tests/compatibility-contract.mjs`. Le lanceur est `npm run test:compat`, avec `playwright.compat.config.mjs`. Une exécution filtrée par moteur est utile au diagnostic mais ne suffit pas à produire une recette complète.

## Preuve liée à la version

Le lanceur supprime son ancien résultat avant chaque exécution. Il relève les versions réellement démarrées des moteurs, la version Playwright, le système, le commit, le résultat du processus et chaque scénario par format. Un cas manquant, remplacé, doublé, ignoré, échoué, interrompu ou réussi seulement après une nouvelle tentative empêche la validation. Le budget global de la suite est de douze minutes, sans nouvelle tentative automatique.

Le rapport JSON détaillé, les captures et les traces d’échec restent dans les preuves de recette. `compatibility-status.json` fournit la matrice compacte. Le rapport d’inspection public reprend les résultats par moteur et format ainsi que leurs limites. Les réponses réseau de cette recette sont déterministes et les données utilisées sont fictives ou des lieux publics.

## Condition de publication

Le banc utilise l’image officielle `mcr.microsoft.com/playwright:v1.55.0-noble`, de même version que le paquet de test. Les moteurs et leurs bibliothèques système y sont préinstallés ; cette préparation évite de retélécharger les bibliothèques Ubuntu à chaque recette. Le serveur local de fichiers utilise Node, sans dépendance Python supplémentaire. Voir la [configuration officielle des images Playwright](https://playwright.dev/docs/docker).

Le travail GitHub « Essential flows - Firefox and WebKit » précède l’inspection Chromium existante et ne la remplace pas. L’inspection télécharge la preuve du même lancement ; elle exige une matrice complète liée au même commit avant de produire un état prêt pour inspection. La construction et l’assemblage à blanc de la branche répètent ce contrôle. Le programme de publication conservé sur la branche principale reçoit uniquement l’artefact produit après ces étapes réussies. Les anciens aperçus mis en cache conservent leurs preuves historiques, sans leur attribuer rétroactivement cette qualification.

La recette Chromium complète, les contrôles de calcul et de structure, puis les essais de l’aperçu continuent de s’exécuter. Après la publication, les métadonnées et fichiers servis sont comparés au commit inspecté ; un trajet entre lieux publics est contrôlé avec les services réels. Une publication réussie reste distincte de la fusion sur le site principal et de la validation humaine.

## Limites de la qualification

Playwright utilise des constructions de navigateurs spécifiques à sa version. Firefox 141.0 et WebKit 26.0 sont ici des moteurs épinglés : ce lot ne certifie ni les dernières versions commerciales, ni Safari, ni Safari iOS, ni un téléphone physique. La [documentation officielle Playwright](https://playwright.dev/docs/browsers) décrit cette distinction et l’installation des moteurs associés.

Sur le Mac de développement, WebKit 26.0 s’arrête au lancement avant de charger l’application. Son contrôle complet est confié au banc GitHub Ubuntu 24.04 ; cet échec local est conservé dans les preuves, sans être présenté comme une réussite. Firefox peut être contrôlé localement. Le résultat effectif de chaque livraison, son système et ses versions figurent dans les preuves datées et le journal.

Les audits automatiques d’accessibilité inclus dans certains scénarios ne remplacent pas une revue au lecteur d’écran. La PWA, l’installation, le fonctionnement hors connexion, les permissions réelles d’un téléphone, les autres parcours de l’application et la fraîcheur des navigateurs demandent des qualifications distinctes. QUA-12 reste donc partiellement couvert : la matrice des versions stables actuelles et les essais Safari sur appareils restent à compléter.

Aucun fournisseur, compte, tarif, calcul de trajet ou format de stockage n’est changé par l’ajout de cette recette. Le choix d’un nouveau prestataire ou d’un service payant reste une décision séparée.

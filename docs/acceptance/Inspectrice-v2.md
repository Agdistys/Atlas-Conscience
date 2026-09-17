# Inspectrice v2 : DragonRoute, pilote de OuQuandQui

## Intention

Chaque proposition de modification doit fournir des captures reproductibles,
des controles d'accessibilite et un compte rendu avant inspection humaine.

## Acceptation automatique

- Contrat de fichiers existant conserve pour DragonRoute et Agora.
- Syntaxe des scripts de DragonRoute et de la suite de tests verifiee.
- Quatre formats Chromium : 360 x 800, 390 x 844, 768 x 1024, 1440 x 900.
- Sur chaque format : demarrage, Lyon vers Valence, parcours clavier avec
  mouvement reduit, erreur HTTP 500 du geocodage. Soit 16 tests attendus.
- Huit captures conservees meme quand les tests passent : demarrage et resultats.
- Huit audits axe-core WCAG 2.1 A/AA, sans regle desactivee : aucune violation
  detectee. Les resultats incertains sont conserves pour examen humain.
- Absence de debordement horizontal du document et du panneau de saisie.
- Rapport HTML, synthese Markdown et statut JSON produits apres echec aussi.
- Un test ignore, absent ou echoue, une etape non executee ou une preuve manquante
  empeche le statut `inspection`.

## Execution

Avec Node 22, Python 3 et Chromium Playwright :

```sh
npm install
npx playwright install chromium
npm run inspect
```

Sur GitHub : ouvrir le run Applications / Inspectrice, lire sa synthese,
telecharger l'artefact `inspectrice-v2`, puis ouvrir `quality/inspection.html`.
Le detail des tests est dans `playwright-report/index.html`.
Les preuves sont conservees 14 jours. `quality/status.json` est un artefact
de cette execution ; il n'est pas encore branche au Tableau de Bord public.

## Perimetre et inspection humaine

Les services de geocodage, routage et carburant sont simules. Les autres appels
externes sont bloques. L'horloge est fixee pour les captures, sans figer les
temporisations. La carte testee est le mode SVG de secours. Le service worker
est bloque : cette passe ne valide pas l'installation PWA ni le hors connexion.

Les captures sont des preuves a inspecter. Elles ne sont pas encore des
references approuvees pour une comparaison automatique de pixels.
La disponibilite des vraies API, Lighthouse, les performances, la carte Leaflet,
la charte graphique complete et les autres applications restent a couvrir.

Les audits automatiques ne remplacent pas une evaluation avec lecteur d'ecran,
ni la validation du sens et de l'experience. Aucune fusion ni publication n'est
declenchee par ce workflow.

Source technique : https://playwright.dev/docs/accessibility-testing

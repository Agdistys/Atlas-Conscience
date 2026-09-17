# Apercus OuQuandQui sur GitHub uniquement

## Resultat attendu

Apres une PR verte, l'application est disponible sous
`https://agdistys.github.io/Atlas-Conscience/previews/pr-N/`.
Le lien apparait dans les controles du commit sous `Apercu OuQuandQui`.
La racine du site est reconstruite depuis `main` inspectee ; la PR fournit
seulement le contenu de son dossier d'apercu. Aucun changement de PR n'est
copie dans l'application publique avant fusion.

L'apercu utilise les vrais services reseau. Les tests de cet apercu utilisent
les reponses simulees habituelles. Une mention ESSAI, le numero de PR et le
commit distinguent l'apercu. Son pied de page ouvre le rapport d'inspection.
Le manifeste et l'installation PWA sont desactives dans l'apercu.

## Activation, une seule fois apres validation de cette PR

1. Fusionner la PR et attendre la reussite d'Applications / Inspectrice sur main.
2. Dans Settings > Pages > Build and deployment, choisir Source : GitHub Actions.
3. Dans Settings > Secrets and variables > Actions > Variables, ajouter la
   variable de depot `PAGES_PREVIEWS_ENABLED` avec la valeur `true`.
4. Dans Actions, lancer `Pages - site et apercus` avec Run workflow sur main.
5. Verifier les adresses publiques habituelles. Les nouvelles PR vertes auront
   ensuite leur lien d'apercu automatiquement.

La branche `gh-pages` sera creee par la premiere publication. Elle conserve
le site assemble et les apercus des PR ouvertes. Elle n'est PAS a selectionner
comme source Pages : les commits effectues avec GITHUB_TOKEN ne declenchent
pas la publication de branche. Le workflow utilise directement deploy-pages.
Aucun compte externe ni jeton personnel n'est requis.

Tant que la variable n'est pas activee, le nouveau workflow ne publie rien.
Le mode de publication actuel reste operationnel jusqu'au changement de Pages.

## Controles

- Tests unitaires : versions inspectees uniquement, identite du commit,
  preservation des pages publiques, conservation des apercus ouverts,
  elimination des apercus fermes lors de la publication suivante, refus des liens symboliques.
- Deux tests navigateur de l'apercu assemble : petit ecran et ordinateur,
  trajet Lyon / Valence, lien du rapport, aucune tentative d'installation PWA.
- Assemblage Jekyll complet dans la CI, sans publication, archive sous
  `pages-assemblage` pendant 7 jours. L'apercu seul est archive pendant 14 jours
  sous `inspectrice-preview`.
- Le publisher execute uniquement les scripts de main. Les fichiers de PR
  sont copies depuis une liste limitee de fichiers statiques, jamais executes
  avec les droits de publication. Les PR provenant de forks sont exclues.
- Avant de publier, le dernier commit de main doit avoir une inspection verte.
  Un run obsolete ou une PR fermee est ignore. Apres publication, le commit
  servi par preview.json est controle avant d'annoncer le lien.

## Limites et exploitation

GitHub Pages expose les apercus publiquement. Le dossier d'apercu n'est pas
une isolation de securite : il partage le domaine du site. Utiliser ce circuit
uniquement pour les branches internes de confiance et pour des donnees non
sensibles. Le code des autres applications n'est pas expose dans les apercus.
La PR ne modifie pas la configuration DNS ni le domaine public.

Si main est en cours d'inspection, une publication d'apercu peut etre ignoree.
Relancer alors le run Inspectrice de la PR une fois main verte. GitHub limite
les files d'attente des groupes de concurrence ; en cas de nombreuses PR
simultanees, une relance peut aussi etre necessaire.
Une nouvelle version en echec laisse l'ancien apercu disponible : son commit
reste visible. Ne pas confondre cet ancien lien avec la validation du nouveau.
Les apercus fermes sont retires a la publication suivante.

Pour revenir au fonctionnement precedent, desactiver PAGES_PREVIEWS_ENABLED,
puis remettre la source Pages sur Deploy from a branch / main / root.

Documentation :
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run
- https://github.com/actions/deploy-pages

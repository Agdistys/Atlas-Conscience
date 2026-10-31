# Résolveur Facebook — compte Cloudflare de Diane

Le code est prêt à déployer sous le nom `ancrage-ami-resolver-v5`. Il ne se connecte pas à un compte Facebook. Il ne contourne pas les contenus privés ni les demandes de connexion.

## Installation avec la session Cloudflare

Depuis ce dossier :

```sh
npm install
npx wrangler login
npx wrangler whoami
npm run deploy
```

La connexion se fait sur le site officiel Cloudflare. Vérifier le compte affiché avant le déploiement ; en cas de plusieurs comptes, sélectionner celui souhaité avec `CLOUDFLARE_ACCOUNT_ID`. Ne pas utiliser une option de déploiement dans un compte temporaire. Le nom du Worker est réservé à cette V5 : ne pas le remplacer par le nom d'un autre service existant.

Le déploiement retourne l'adresse réelle en `workers.dev`. Ouvrir son chemin `/health` : le JSON doit annoncer `service: "ancrage-ami-resolver"`, `version: 5`, `schemaVersion: 1`, `ok: true`. Tester ensuite le lien réel, depuis l'application, et vérifier la destination avant de remplir `../config.json` avec l'origine du Worker. Une réponse de santé ne prouve pas l'accès à Facebook depuis Cloudflare.

Une fois `config.json` publié sur GitHub Pages, la connexion est automatique. Autre possibilité, limitée à l'appareil courant : ouvrir « Connexion du résolveur Facebook », coller l'origine HTTPS, enregistrer et tester. Ne jamais coller une clé API dans ce champ.

## Permissions et limites

Le compte doit autoriser la publication de Workers et l'usage du sous-domaine `workers.dev`. Le projet n'utilise ni domaine personnalisé, ni stockage, ni navigateur distant, ni service payant ajouté. Aucune modification de forfait n'est nécessaire dans le code. La consommation reste soumise aux quotas et au forfait du compte Cloudflare utilisé.

- Origine navigateur autorisée par défaut : `https://agdistys.github.io`. Ajouter d'autres origines exactes à `ALLOWED_ORIGINS`, séparées par des virgules, seulement si l'outil doit y être hébergé. Pas de joker ni d'origine `null`.
- Limitation indicative de 30 demandes par minute et adresse IP, par centre Cloudflare ; les utilisateurs d'un même réseau peuvent partager cette limite. Ce n'est pas un plafond global de consommation. Le namespace `2026103105` doit rester distinct d'un éventuel autre limiteur du compte.
- Délai total de résolution : 8 secondes ; page lue : 512 Kio maximum ; cinq redirections maximum.
- Les redirections vers des hôtes externes, HTTP, des ports non standards ou des URL contenant des identifiants sont refusées.
- Pas de transfert des en-têtes ou cookies du visiteur vers Facebook. Pas de cache des liens ni de journalisation applicative ; l'observabilité Worker est désactivée. Les fournisseurs conservent leurs propres traitements opérationnels.
- CORS limite les navigateurs ; ce n'est pas une authentification du service public.

## Sources de mise en œuvre

[Redirections manuelles dans Workers](https://developers.cloudflare.com/workers/runtime-apis/request/), [déployer avec Wrangler](https://developers.cloudflare.com/workers/get-started/guide/), [limitation de débit](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

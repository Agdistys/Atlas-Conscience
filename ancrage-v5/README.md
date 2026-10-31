# Ancrage aMi V5

V5 ajoute la résolution des liens mobiles Facebook `/share/` et `fb.watch`, avec un service Cloudflare propre à la propriétaire. La page autonome conserve Instagram et accepte aussi les iframes Facebook officiels. Aucune adresse de résolveur fictive n'est fournie.

- Application : [APP-Ancrage_aMi_V5.html](../APP-Ancrage_aMi_V5.html)
- [Installation du Worker](worker/README.md)
- [État des vérifications](VERIFICATION.md)

La V1 du dépôt reste inchangée. Les V2–V4 n'ont pas été retrouvées dans la branche principale ni parmi les fichiers locaux examinés ; aucune de ces versions n'a été écrasée ou recréée artificiellement.

## Fonctionnement

Une adresse permanente reconnue est traitée localement. Pour un lien court, la page appelle `/resolve?url=…` sur le Worker configuré. Le Worker suit au plus cinq redirections HTTPS limitées aux hôtes Facebook autorisés. Il accepte une destination permanente observée ou les métadonnées explicites de l'en-tête HTML (`canonical`, `og:url`), jamais un identifiant vidéo trouvé au hasard dans la page. Des métadonnées contradictoires sont refusées.

Un refus, une demande de connexion, une boucle, une réponse trop volumineuse ou une expiration déclenchent un message et un recours manuel. Le lien d'origine reste disponible. Un lecteur n'est jamais construit à partir d'un lien court non résolu. L'adresse du service peut être enregistrée localement et testée sans envoyer de lien Facebook.

La résolution d'une adresse ne prouve ni que le contenu est public, ni que son propriétaire autorise l'intégration. Le navigateur ne permet pas à cet outil de lire le résultat interne d'un lecteur Facebook d'une autre origine ; aucun événement `load` n'est présenté comme une preuve de lecture. Le code généré comprend un lien de repli vers Facebook.

## Développement

Depuis la racine du dépôt, avec Node 22 ou version compatible :

```sh
node ancrage-v5/build.mjs
node --test ancrage-v5/tests/*.test.mjs
```

`template.html`, `app.js` et `core.mjs` produisent le fichier autonome versionné. Le Worker importe le même `core.mjs`. Les tests utilisent des réponses simulées pour les cas négatifs ; les essais réseau sont séparés dans le bilan. Ne jamais remplacer les fichiers des versions précédentes.

## Configuration publiée

`ancrage-v5/config.json` contient uniquement `resolverUrl`, vide tant que le Worker n'a pas été déployé et vérifié. Après déploiement, y enregistrer l'origine HTTPS réellement retournée par Cloudflare. Cela connecte automatiquement les nouvelles sessions de la page, sans réglage par appareil. Un réglage local explicite a priorité. Aucune clé, aucun jeton et aucun identifiant de compte ne doivent être inscrits dans ce fichier ni dans le HTML.

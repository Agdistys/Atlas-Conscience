# OùQuandQui · V111 · Raccordement gratuit du calcul

Date : 27 novembre 2026. Complément de V110. État : code et connexion locale préparés, aucun relais publié ni parcours réel qualifié dans ce lot. Le site reste sur GitHub Pages.

## 🔌 Services retenus

L’architecture retenue associe openrouteservice pour le calcul et Cloudflare Workers pour un relais protégé. Seules les offres gratuites sont autorisées. La connexion Cloudflare existante fonctionne ; l’accès disponible ne permet pas de lire les abonnements. L’offre Workers Free doit être confirmée par le titulaire. Le compte openrouteservice reste à créer, puis à valider par e-mail.

HeiGIT annonce une clé Standard gratuite. Cloudflare fournit un niveau Workers Free ; les compteurs persistants SQLite sont disponibles dans ce niveau. Les limites réelles et les conditions de l’offre doivent être vérifiées avant activation ; aucun abonnement payant ni dépassement facturé n’est autorisé. Sources : [HeiGIT](https://api.heigit.org/), [Workers Free](https://developers.cloudflare.com/workers/platform/pricing/), [compteurs SQLite gratuits](https://developers.cloudflare.com/durable-objects/platform/pricing/).

## 🔒 Clé de calcul et connexion locale

La clé sera conservée côté serveur, jamais dans le site GitHub ou dans le profil des visiteurs. Une page locale permet de la saisir dans un champ masqué, après confirmation des deux offres gratuites. Elle vérifie la clé auprès de HeiGIT avec un trajet public Lyon–Valence et ne transmet aucun trajet personnel. Le formulaire n’est accessible que sur le Mac qui l’exécute.

L’accès local vérifie l’origine, l’adresse du serveur et un jeton aléatoire. La clé acceptée est conservée dans un fichier privé exclu de GitHub. Elle n’est ni renvoyée au navigateur ni inscrite dans les journaux. Cette étape ne publie rien. Le compte, la vérification d’e-mail et l’offre Workers Free nécessitent l’intervention du titulaire ; aucune clé ne doit être transmise dans une conversation.

## ⏱️ Quotas persistants

Le relais préparé limite l’ensemble des demandes à 100 calculs par jour UTC et à 10 sur une fenêtre glissante d’une minute. Un compteur unique et persistant partage ces limites entre les instances ; un redémarrage ne remet pas le compteur à zéro. Les tentatives ayant échoué auprès du fournisseur restent comptées. Seuls des nombres et des dates sont conservés dans ce compteur, sans coordonnées, adresse IP ni clé.

Ces plafonds internes ne remplacent pas les quotas du fournisseur ni les limites gratuites de Cloudflare. Lorsqu’un plafond, le stockage ou le fournisseur bloque, aucun autre calcul ni fournisseur payant ne prend automatiquement le relais. Les origines autorisées limitent les appels des navigateurs ; elles ne constituent pas une authentification des personnes. Le pilote reste soumis à une capacité limitée.

## 🛣️ Réponses préparées pour les portions payantes

Le relais demande un trajet automobile entre deux points avec instructions et attributs complets des péages et catégories routières. Il vérifie la couverture des attributs, la continuité des instructions, la version du réseau et les exclusions demandées. Une réponse incomplète ou qui conserve un péage interdit n’est pas retournée comme un trajet utilisable.

Les informations utiles à la sélection d’une portion sont conservées ; les métadonnées non nécessaires et les messages bruts du fournisseur sont retirés. Les profils lourds, alternatives et trajets à plusieurs étapes ne sont pas encore qualifiés pour ce nouveau relais. Le calcul des trois parties préparé dans V110 devra être raccordé, puis les stations et le guidage devront conserver l’exception locale.

## 🧪 Vérifications réalisées

78 contrôles réussissent : 24 pour le nouveau relais, 8 pour la connexion locale, 35 pour la sélection d’une portion et 11 pour le relais Node existant. Ils couvrent notamment les exclusions, erreurs et absences de données, l’absence de fuite de clé, les quotas concurrents et persistants, l’annulation, le délai maximal et les refus de soumission depuis une autre origine. La page locale est vérifiée dans Chromium en 1440 et 390 pixels, sans débordement ni erreur JavaScript.

L’assemblage Cloudflare réussit en simulation de déploiement. Aucun service distant n’a été créé ou modifié et aucun calcul routier réel n’a été exécuté avec une clé HeiGIT dans ce lot. La page de connexion utilise des réponses simulées pour ses essais ; la validation physique Android reste ouverte.

## ➡️ Prochaine étape

Créer le compte gratuit HeiGIT, valider son e-mail et enregistrer la clé Standard dans la page locale ; confirmer Workers Free. Puis qualifier les réponses réelles, configurer le relais et ses limites gratuites, vérifier les refus et raccorder le choix d’une portion aux arrêts et au guidage. Le relais reste désactivé et l’application publique conserve sa version précédente jusqu’à cette qualification.

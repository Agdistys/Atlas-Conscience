# OùQuandQui — Accès hors ligne, installation et mises à jour

V018 · 18 novembre 2026 · OFF-PWA-01. Complément des exigences OFF-01 à OFF-04 du [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). [Préparations V012](OuQuandQui_API_V012_Preparations_Trajets_2026-11-18.md), [journal V010](OuQuandQui_API_V010_Restauration_Journal_2026-11-18.md) et éditions ultérieures conservées. Aucun nouveau mode de transport, fournisseur ou hébergement.

## Parcours utilisable

La rubrique « Installation et hors ligne » indique la préparation de l’interface, la connexion signalée par le navigateur et la possibilité de vérifier une mise à jour. Si le navigateur propose son invitation native, « Installer » ouvre cette invitation ; refus, demande acceptée et installation signalée sont distingués. En l’absence de cette invitation, le menu du navigateur reste mentionné sans garantir l’installation.

Après préparation complète, une fenêtre peut être fermée puis rouverte sans réseau dans le même navigateur. Mes trajets, Mon profil et Mon journal restent consultables et exportables. Un trajet enregistré affiche sa date et son schéma local ; aucun prix ou état de circulation ancien n’est présenté comme rafraîchi. Les données personnelles ne sont pas ajoutées au cache de l’interface.

Les nouveaux itinéraires et prix, les services externes et les fonds de carte nécessitent un accès réseau. Les erreurs restent explicites. Une indication hors ligne ne bloque pas artificiellement toutes les commandes : l’état déclaré par le navigateur ne prouve pas à lui seul la disponibilité d’un fournisseur. Le retour de connexion ne relance pas les calculs et ne modifie pas les résultats ou les données enregistrées. Ce choix suit les limites documentées de [navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine).

## Mises à jour et intégrité

Une nouvelle version télécharge seulement les huit ressources de l’interface : accueil, index, styles, configuration distribuée, application, manifeste et deux icônes. Chaque ressource doit correspondre à l’empreinte SHA-256 attendue ; une réponse manquante, redirigée, invalide ou altérée empêche l’installation. Les fichiers sont validés avant l’écriture du cache. Un incident de stockage empêche également l’activation, sans déclarer le nouvel ensemble utilisable.

Le cache associe l’adresse exacte de l’installation, la révision 29 et une empreinte du manifeste. L’ancienne version continue de fournir ses propres ressources aux fenêtres ouvertes. Une version prête affiche : enregistrer les préparations utiles, fermer toutes les fenêtres de cette application, puis la rouvrir. Aucun appel à `skipWaiting`, rechargement imposé ou transfert automatique des brouillons de session. Les données explicitement enregistrées restent dans leur stockage existant ; un brouillon non enregistré ne survit pas à une fermeture volontaire.

Le cycle normal conserve la nouvelle version [en attente](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/waiting) tant que l’ancienne possède des clients ; [forcer son activation](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting) est volontairement exclu. Une première préparation échouée peut être relancée par la vérification des mises à jour. En cas d’échec de l’enregistrement du service worker lui-même, la page explique que la réouverture hors ligne n’est pas préparée ; recharger permet de réessayer.

## Limites du cache

Seules les ressources nommées dans le manifeste sont servies par le cache de cette installation. Les API, données personnelles, tuiles cartographiques, chemins d’autres applications et requêtes portant des paramètres ne sont pas enregistrés. La navigation vers l’accueil ou `index.html`, avec un éventuel paramètre de version, utilise la clé fixe de l’interface : le paramètre n’est pas conservé dans une nouvelle entrée.

Il n’existe pas de repli HTML générique pour les scripts, données ou pages absentes. Une ressource de l’interface qui manque dans son cache échoue, au lieu d’être remplacée par une ressource d’une autre version. Les anciens caches du même périmètre sont retirés seulement à l’activation. Les caches d’autres applications ou d’autres adresses d’installation restent préservés. Les anciennes éditions utilisaient des noms globaux `dragonroute-v3-shell-*` : ces caches historiques, potentiellement partagés, sont laissés intacts et ne sont plus lus par ce service worker.

La conservation dépend du navigateur : effacement, éviction ou navigation privée peuvent supprimer le cache et/ou les données locales. L’installation ne remplace pas une sauvegarde exportée. Aucun fond de carte complet, moteur routier local ou téléchargement massif de tuiles. Aucun changement des formats de profil, journal ou préparations, et aucune nouvelle clé personnelle.

## Aperçus et validation

Les aperçus GitHub conservent `data-preview="true"` : aucun enregistrement de service worker et aucune invitation à installer la production. La rubrique explique cette limite. Une page d’aperçu déjà chargée peut consulter ses données locales sans réseau ; sa réouverture hors ligne n’est pas promise.

La recette utilise un vrai service worker dans Chrome, une origine locale isolée et des réponses de trajet simulées : fermeture/réouverture sans réseau, consultation/export de préparations, profil et journal conservés, absence de cache API, erreur sans substitution HTML, deux fenêtres ouvertes, cache d’une autre installation, version altérée refusée et récupération après échec. L’invitation native est simulée pour vérifier les états de l’interface. Ce n’est pas une installation sur téléphone physique.

Les contrôles de la branche et la recette de l’aperçu publié sont consignés dans l’état de développement. Sur l’aperçu, seules l’interface, la consultation locale et l’absence d’installation sont qualifiées : le service worker de production n’y est pas activé. Publication sur le site principal et recette d’une application réellement installée restent distinctes.

Maintenance : après toute modification d’une ressource de l’interface, exécuter `node tests/pwa-shell.mjs --write`. Le contrôle `tests/service-worker.test.mjs` refuse un manifeste ne correspondant pas aux fichiers distribués. Le manifeste reste versionné avec le code ; aucune empreinte n’est calculée arbitrairement à partir d’un contenu réseau reçu.

# V072 — Identité du produit et continuité de l’installation

UX-IDENTITE-PRODUIT-01 · 21 novembre 2026. Réalisation de DEC-15 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), avec UX-01/02/05/07 et LIV-01/05. Les fonctions et limites recensées dans [V070](OuQuandQui_API_V070_Recette_Parcours_2026-11-21.md) et la correction d’accès station [V071](OuQuandQui_API_V071_Acces_Station_2026-11-21.md) restent conservées.

## Repères visibles

OùQuandQui est le nom principal de l’application : en-tête, titre de l’onglet, métadonnées du document et nom fourni au navigateur pour l’installation. DragonRoute apparaît comme « module routier » devant les réglages du trajet en véhicule. Ce repère est masqué lorsque le mode principal devient la marche, puis réapparaît au retour au véhicule.

Les cinq entrées restent directement accessibles : véhicule, marche, vélo personnel, transports collectifs et vélos partagés. Les périmètres pilotes Grenoble et Lyon restent indiqués. Les fenêtres vélo et collectif conservent leurs recherches propres, leurs lieux de départ et d’arrivée et leur retour au bouton déclencheur ; le nom commun ne leur substitue pas un calcul automobile.

Le dragon graphique et la charte existante sont conservés. L’icône décorative de l’en-tête est ignorée par les technologies d’assistance ; le nom textuel reste disponible. Le bouton d’installation a le nom accessible « Installer OùQuandQui ».

## Continuité des données et des adresses

Aucun répertoire, URL, identifiant de stockage, format de profil, journal ou préparation n’est renommé. Les fichiers exportés avec le préfixe DragonRoute restent importables et conservent ce préfixe. Le registre technique et les identifiants des preuves ne constituent pas une deuxième application proposée au public.

Le manifeste conserve son URL, ses valeurs `start_url` et `scope`, ses icônes et l’absence d’un membre `id` explicite. Seuls le nom, le nom court et la description changent. Le traitement du membre `id` dans le [document de travail W3C du 18 novembre 2026](https://www.w3.org/TR/2026/WD-appmanifest-20261118/#id-member) utilise initialement `start_url` ; conserver cette adresse évite d’introduire volontairement une nouvelle identité de lancement. Ce raisonnement sur les métadonnées ne remplace pas une vérification du comportement de chaque système d’exploitation.

Les empreintes du cache de l’interface sont recalculées. Le mécanisme existant attend la fermeture des fenêtres avant activation d’une mise à jour ; aucune fermeture, réinitialisation ou migration de données n’est déclenchée par le changement de nom.

## Recette

Les scénarios existants d’accès aux modes vérifient désormais également le nom principal, le titre et la présence du repère DragonRoute uniquement dans le contexte véhicule. Les assertions antérieures sur les lieux communs, les contraintes, l’absence d’appels intempestifs, le clavier et les données conservées restent présentes. Le scénario fait déjà partie des parcours obligatoires Firefox/WebKit ; aucune preuve d’un ancien commit n’est réutilisée.

La recette PWA de mise à jour comprend un témoin d’ancienne identité affichée DragonRoute, puis une nouvelle identité OùQuandQui. Le serveur de test simule ces métadonnées ; le navigateur exécute réellement le cycle du service worker. Deux fenêtres et leurs brouillons restent sous l’ancienne version jusqu’à leur fermeture. À la réouverture, le nouveau titre et le nouveau manifeste sont lus ; les données de profil, journal et préparations sont identiques. Le cache d’une autre portée et une ancienne copie protégée restent conservés. Il s’agit d’un témoin simulé, pas de l’intégralité d’un ancien binaire installé sur un téléphone.

Les essais de lecture vérifient les quatre formats, la faible hauteur en paysage, le texte doublé, les champs accessibles et les fermetures au clavier. La recette complète Chromium, les parcours Firefox/WebKit, les contrôles de l’assemblage et la vérification de l’aperçu publié restent requis. Les résultats définitifs sont consignés avec leur commit dans le rapport, le suivi autonome et `quality/product-identity`.

## Limites et livraison

L’aperçu GitHub reste une version d’essai exclue de l’installation : sa visite permet de vérifier l’identité et les parcours, pas un changement de nom sur l’écran d’accueil d’un téléphone. L’adoption des métadonnées par un navigateur ou un système peut suivre son propre cycle. Aucun renommage natif sur iOS, Android ou Safari commercial n’est certifié par cette recette.

Cette harmonisation n’active pas les caravanes, les poids lourds, l’exclusion nationale des péages, une offre de covoiturage connectée ou une couverture nationale des transports. Elle ne change ni fournisseur, ni hébergement, ni coût.

La présentation centralisée reçoit une édition V009 conservant V008, les exigences et les outils de lecture. Les conditions d’exploitation et la publication principale restent des décisions distinctes.

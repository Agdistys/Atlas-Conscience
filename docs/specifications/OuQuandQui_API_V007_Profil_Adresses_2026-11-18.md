# OùQuandQui — Profil local et adresses mémorisées

V007 · 18 novembre 2026 · Lot PREPARATION-02. Complément au [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), GEO-06 et PRO-02 à PRO-08. Les compléments V001–V006 sont conservés.

## Un favori conserve le lieu choisi

Une adresse comprend un nom, le texte saisi et, lorsque disponible, le lieu effectivement retenu : coordonnées, libellé, source IGN et date du choix. Cette date n’est ni une date d’actualisation du référentiel ni une confirmation sur le terrain.

Deux parcours permettent de mémoriser ce lieu : « Reprendre le départ / l’arrivée » après résolution dans le trajet, ou « Vérifier le lieu » dans le formulaire d’adresse. En cas d’homonymie, une sélection explicite précède la mémorisation. Aucun appel de géocodage à chaque frappe. Il reste possible d’enregistrer seulement le texte : la fiche indique alors qu’un lieu devra être recherché lors du trajet.

Réutiliser un favori résolu conserve son point, même après rechargement, et affiche son libellé près du champ de départ ou d’arrivée. Le géocodeur n’est pas rappelé pour ce champ. Cela ne constitue pas un fonctionnement entièrement hors ligne : le calcul de route nécessite toujours le service concerné. Le point enregistré peut être ancien ou incorrect ; le formulaire permet de rechercher à nouveau le lieu.

Renommer un favori conserve son point. Modifier le texte d’adresse dans le formulaire retire le point associé. Modifier la saisie du départ ou de l’arrivée retire la liaison au favori et invalide le trajet : aucune coordonnée devenue indépendante du texte n’est réutilisée. Une réponse tardive après modification ou fermeture du profil ne rouvre pas une sélection de lieu ni n’écrase la nouvelle saisie.

« Ma position » et le marqueur interne de position ne sont jamais mémorisés comme adresse fixe. Une ancienne entrée de ce type est conservée comme texte à corriger, sans réutilisation automatique du GPS. Aucune adresse n’est résolue au chargement du profil ni pendant un import.

## Doublons et enregistrement

Un nom normalisé identique, un texte d’adresse identique lorsque les deux lieux ne sont pas résolus, ou deux coordonnées mémorisées égales à la précision de comparaison signalent un doublon possible. Les accents et le texte d’origine restent conservés. Deux communes homonymes explicitement résolues à des points différents ne constituent pas un doublon d’adresse sur le seul texte.

Le formulaire identifie les favoris concernés. L’ajout demande une confirmation visible « Enregistrer malgré ce doublon possible » ; aucun favori existant n’est remplacé implicitement. Une modification de nom, d’adresse ou de lieu retire cette confirmation. La modification d’un favori existant conserve son identifiant et ne le compare pas à lui-même.

Un succès n’est annoncé qu’après écriture réussie. Quota, refus de stockage ou donnée invalide laissent le profil précédent et les champs du formulaire disponibles. Si le stockage a changé dans un autre onglet depuis son chargement, l’écriture est refusée avec invitation à recharger ; aucun écrasement de la modification externe. Il n’y a pas de fusion automatique entre onglets.

## Import et export vérifiables

L’import lit un fichier JSON local, le valide, puis ouvre un aperçu : nombre d’adresses, nombre de lieux mémorisés, stations favorites, véhicule et paramètres, doublons possibles. La liste des noms et adresses est consultable. Les textes importés sont rendus comme texte, sans interprétation HTML.

L’aperçu indique ce qui sera remplacé et permet d’exporter le profil actuel avant de confirmer. Fermer ou appuyer sur Échap annule l’opération et rend le focus au bouton d’import. « Remplacer mon profil » effectue l’écriture ; en cas d’échec, l’aperçu reste ouvert et le profil stocké demeure inchangé. Une réponse de lecture de fichier arrivée après la fermeture du profil est ignorée.

Les lieux et leur provenance dans un fichier sont déclaratifs : leur structure est contrôlée, pas leur véracité ni leur rattachement physique à l’adresse. Les coordonnées doivent être numériques, finies et dans leurs bornes ; la source reconnue et la date ISO doivent être valides. Une position GPS temporaire ne peut pas porter de point mémorisé réutilisable.

Formats 1 et 2 reconnus ; version future, JSON invalide, identifiants dupliqués ou fichier dépassant 100 000 octets refusés sans remplacement. Limites conservées : 50 adresses, 100 stations, nom 80 caractères, texte d’adresse 250 caractères ; libellé du lieu 1 000 caractères. La taille de l’export JSON formaté est elle aussi limitée à 100 000 octets, pour rester réimportable. Aucune troncature silencieuse.

L’export ne reprend que les champs reconnus : aucun champ technique inconnu, clé API ou jeton n’est conservé. Un marqueur factice placé dans des champs supplémentaires est absent des exports, de l’aperçu et du texte de la page dans les tests. Les données de mobilité exportées restent en clair ; le fichier doit être partagé volontairement.

## Migration et séparation des données

Le profil courant utilise le format 2 et une clé de stockage distincte du format 1. Un ancien profil valide est repris en mémoire sans écriture automatique. La première sauvegarde crée le format 2 ; l’original du format 1 reste intact dans son emplacement. « Exporter le profil d’origine » restitue ses champs connus au format 1, sans clés ni propriétés étrangères. Cette reprise est réversible et ne supprime aucune adresse ni station valide.

Un profil présent mais illisible, inaccessible ou d’une version inconnue n’est jamais remplacé par les réglages par défaut. La préparation d’un trajet reste utilisable, mais sauvegarde, import de remplacement et export d’un faux profil vide sont bloqués. Une version compatible peut reprendre l’original ; un effacement explicite permet aussi de repartir.

Production et chaque aperçu ont des espaces de profil distincts. L’effacement confirmé vise uniquement les formats 1 et 2 du même environnement, y compris la copie d’origine. Une suppression interrompue recharge l’état réellement restant et signale qu’elle n’est pas terminée ; aucune fausse confirmation de suppression totale. Les autres applications, aperçus et caches restent conservés. Aucune synchronisation ou création de compte n’est introduite.

## Vérifications et limites

Trois contrôles unitaires vérifient migration, champs exclus, réimportation, bornes, dates, limites, doublons et homonymes. Huit scénarios navigateur couvrent persistance du lieu choisi, nouvelle saisie, doublons, import/annulation/export, migration et version future, quota et concurrence, séparation des environnements, effacement interrompu, réponse tardive, GPS et fichiers invalides. Les anciens parcours de profil et de géocodage restent exécutés. Captures, clavier, absence de débordement et audits automatiques d’accessibilité complètent les contrôles.

Les simulations sont distinctes de la recette sur le site publié, effectuée avec des lieux publics et un navigateur de test neuf. Le rapport de la PR consigne les résultats effectivement exécutés. Aucun essai sur téléphone physique ni certification d’un lieu réel n’en découle. Restent hors de ce lot : comptes, synchronisation entre appareils, plusieurs véhicules actifs, journal des trajets et vérification physique des points.

# OùQuandQui ?

## 01. Objet et Statut du Document

**Cahier des Charges Fonctionnel et Technique · Édition Publique V5 · 18 septembre 2026**

**Finalité :** définir les fonctions attendues de OùQuandQui, leurs règles de calcul, leurs données, leurs limites et leurs critères de validation. Ce référentiel organise le développement et rend les engagements du produit consultables.

**Statut : document de conception.** Les exigences du produit, les spécifications proposées et les arbitrages ouverts sont distingués des fonctionnalités disponibles. Une fonction décrite constitue une cible de développement, sauf indication explicite de sa disponibilité.

**Périmètre :** trajet routier, arrêts carburant, profil local, covoiturage, transports publics, mobilités douces, comparaison des possibilités et Journal de Mobilité. Les modalités de réalisation sont réparties en lots.

**État de référence :** PR 4 fusionnée, commit `7bce0ea9988b3fad041175b615b5bb40302bfcda`. Le développement du 18 septembre ajoute le contrat de service public, le gabarit poids lourd et la sélection des alternatives ; le service avancé n’est pas encore activé. La section 31 formalise les décisions de cette édition.

### Exigences Fondatrices

- Ouvrir l’application à l’usage personnel et au public, sans compte technique ni clé API à fournir par les visiteurs.
- Commencer par la France ; documenter la couverture effective de chaque source, y compris les écarts entre métropole et outre-mer.
- Distinguer véhicules légers et poids lourds ; traiter le revêtement de la route comme une préférence distincte du véhicule.


- Calculer et choisir un trajet avant de rechercher les stations ou les possibilités de covoiturage.
- Rendre le trajet principal nettement visible en bleu et afficher ses alternatives en bleu clair.
- Appliquer les options « éviter les péages » et « éviter les autoroutes » au trajet et aux détours.
- Prendre en compte le véhicule, notamment la voiture avec caravane, sans annoncer une compatibilité de gabarit non vérifiée.
- Rechercher les stations au plus tôt, selon un compromis proche ou autour d'une distance choisie.
- Afficher chaque station sur la carte, ouvrir sa fiche d'informations et permettre son enregistrement.
- Conserver localement le véhicule, les adresses et les stations favorites.
- Regrouper les classements sur une seule fiche lorsqu'une station remplit plusieurs critères.
- Présenter séparément les montants et les durées, sans demander une valeur du temps en euros par heure.
- Distinguer les données observées, les estimations et les informations indisponibles.
- Étendre progressivement la comparaison au covoiturage, aux transports publics, aux mobilités douces et au bilan CO₂e.

### Conventions de Lecture

| Marque | Signification |
| --- | --- |
| EXIGENCE | Fonction ou règle attendue du produit, énoncée explicitement dans la section concernée. |
| VISION | Intention présente dans la présentation transmise ; ses modalités restent à définir ou valider. |
| PROPOSITION | Choix fonctionnel, technique ou valeur par défaut proposé dans ce cahier. |
| À DÉCIDER | Arbitrage nécessaire avant de développer ou publier le lot concerné. |
| PRÉSENT EN ESSAI | Observé dans la base de référence ; ne signifie ni publication sur le site principal, ni garantie opérationnelle. |
| PARTIEL / ABSENT | Fonction incomplète ou non présente dans cette base. |

Les identifiants `TRA-01`, `STA-01`, etc. sont stables. Une exigence modifiée conserve son identifiant et reçoit une entrée au journal des décisions. Sauf mention EXIGENCE ou VISION, les règles détaillées sont des PROPOSITIONS destinées à validation. Les verbes « doit » et « interdit » définissent la cible de recette après cette validation.

## 02. Vision et Périmètre

**VISION :** comparer comment aller quelque part, quand, avec qui et à quel coût, sans réduire la décision à un classement opaque. Montrer les données, les compromis et les incertitudes ; laisser la personne choisir.

**OùQuandQui ?** est le produit global. **DragonRoute** est son module routier, pas une seconde application concurrente. Le changement de nom visible ne doit pas précéder la réalité fonctionnelle ni casser les adresses publiques existantes.

| Élément | Responsabilité | Exclusion de responsabilité |
| --- | --- | --- |
| Tapis Volant | Vue de comparaison des solutions de déplacement et de leurs étapes. | Ne fabrique pas d'offres ni de tarifs absents. |
| Boussole | Contraintes, préférences et classement explicable. | Aucun jugement moral universel ; aucune contrainte de sécurité compensée par un bon score. |
| DragonRoute | Routes, énergie, stations, détours ; recharge électrique dans un lot ultérieur. | Pas de garantie d'ouverture, de stock ou de passage physique. |
| Covoiturage | Accès aux offres autorisées, points de rencontre, coûts et détours. | Pas de fausse disponibilité ni de réservation sans raccordement explicite. |
| Transports publics | Parcours et correspondances, horaires, données temps réel lorsqu'elles existent. | Un horaire n'est pas un billet disponible ni un prix connu. |
| Corps & Partage | Marche, vélo, VAE, vélo partagé et accès aux autres modes. | Pas de routage voiture réétiqueté « vélo ». |
| Empreinte | Estimation CO₂e et journal volontaire de mobilité. | Pas d'assimilation CO₂e = pollution totale ; pas de trajet réputé effectué parce que recherché. |

**EXIGENCE d'hébergement :** héberger le site et ses aperçus sur GitHub. Un service de données externe n'est pas un changement d'hébergement ; son usage, ses conditions et les informations transmises doivent toutefois être explicités.

### Hors Périmètre du Premier Lot Routier

Pas de compte distant, paiement, messagerie, publication d'annonces, communauté ou réputation ; pas de guidage vocal ni de navigation continue en arrière-plan ; pas de trafic temps réel affirmé sans source ; pas de cartographie hors ligne complète ; pas de recharge électrique ; pas de classement multimodal tant que les sources ne sont pas branchées. Ces exclusions concernent le premier lot, pas nécessairement la vision finale.

## 03. État de Réalisation

| Fonction | État au 18 septembre | Écart à combler |
| --- | --- | --- |
| Départ, arrivée, géolocalisation ponctuelle | PRÉSENT EN ESSAI | Résolution des adresses ambiguës et validation explicite du lieu retenu. |
| Trajet avant stations | PRÉSENT EN ESSAI | Activer et qualifier le service avancé public. |
| Route et carte Leaflet | PRÉSENT EN ESSAI | Tracé bleu bordé de blanc, alternatives bleu clair. Contrôles visuels continus. |
| Alternatives | DÉVELOPPÉ, RECETTE EN COURS | Sélection parmi les réponses réelles ; aucun itinéraire alternatif fabriqué. |
| Éviter péages / autoroutes | CONNECTEUR DÉVELOPPÉ, NON ACTIVÉ | Service public, clé d’exploitation et validation réelle encore nécessaires ; aucun secret visiteur. |
| Poids lourd | DÉVELOPPÉ, NON ACTIVÉ | Gabarit et charge transmis au profil HGV ; validation réelle et activation serveur nécessaires. |
| Caravane / utilitaire | NON VALIDÉ | Calcul spécifique bloqué, aucune substitution automatique par voiture ou camion. |
| Stations / prix / comparaison | PRÉSENT EN ESSAI | Échantillonnage limité ; pas de garantie d'exhaustivité ; gestion du trajet alternatif à renforcer. |
| Carte des stations / fiches / favoris | PRÉSENT EN ESSAI | Fraîcheur par champ, filtres de services, accessibilité de l'entrée à approfondir. |
| Urgence / station vers X km | PARTIEL | Plages depuis le départ choisi, sans progression GPS ni autonomie restante. |
| Profil / adresses | PRÉSENT EN ESSAI | Un véhicule actif, stockage local ; aucun compte ni synchronisation. |
| Covoiturage | PARTIEL | Onglet et lien externe ; pas d'annonces connectées. |
| Autonomie | ABSENT dans cette référence | Calcul du carburant restant et de l'autonomie à développer ; portée et incertitude à afficher. |
| Transports publics / marche / vélo / recharge | ABSENT | Fournisseurs, modèle de trajet et lots dédiés. |
| Boussole globale / CO₂e / journal | ABSENT | Ne pas confondre maquettes de la présentation et fonctions opérationnelles. |
| PWA / hors ligne | PARTIEL | Mécanisme de cache de l'interface ; cela ne fournit pas routes, prix ou tuiles hors ligne. |
| Contrôle automatisé / aperçus | PRÉSENT EN ESSAI | Tests majoritairement sur données simulées ; compléter les preuves avec des parcours réels. |

**La Présentation expose la vision ; le Cahier des Charges définit les comportements attendus.** L'état de réalisation ci-dessus reste indépendant du périmètre cible.

## 04. Usages et Parcours de Référence

Pas besoin de créer un compte pour préparer un déplacement. Le profil local est facultatif.

| Parcours | Situation | Résultat attendu |
| --- | --- | --- |
| PAR-01 · Préparer | Préparer un trajet de Lyon vers Montpellier sans autoroutes. | Choix des contraintes, comparaison des routes compatibles, confirmation d'un itinéraire, puis recherche de ses arrêts. |
| PAR-02 · Plein proche | Atteindre une station le plus tôt possible sur le trajet. | Classement par distance routière atteignable depuis l'origine active, pas par prix ni distance à vol d'oiseau. |
| PAR-03 · Plein planifié | Rechercher un arrêt carburant à environ 100 km. | Fenêtre explicite autour de 100 km ; stations situées en aval sur le trajet ; aucun élargissement caché. |
| PAR-04 · Caravane | Préparer un déplacement avec une voiture tractant une caravane. | Les contraintes compatibles sont appliquées ; limites et informations manquantes restent visibles ; aucun faux « trajet garanti ». |
| PAR-05 · Habitudes | Reprendre la préparation d'un trajet dans le même navigateur. | Le véhicule, les adresses et les favoris sont conservés ; les informations tarifaires sont actualisées. |
| PAR-06 · Comparer | Arriver à destination avant une heure donnée. | Solutions multimodales compatibles avec cette contrainte, ou explication explicite de l'absence de solution. |
| PAR-07 · Partager | Organiser un covoiturage comme conducteur ou comme passager. | Deux intentions distinctes ; offres ou recherche externe clairement identifiées. |
| PAR-08 · Bilan | Enregistrer un déplacement effectivement réalisé. | Confirmation volontaire, correction possible, CO₂e estimé sourcé, pas de doublon au rechargement. |

La préparation se fait à l'arrêt. Un futur mode en déplacement devra réduire les interactions ; il n'est pas inclus dans la première livraison.

## 05. Arborescence et Écrans

### Architecture Cible

1. **Mon trajet** : départ, arrivée, date/heure lorsqu'elles sont prises en charge, voyageurs, véhicule et options.
2. **Mes possibilités** : routes routières puis Tapis Volant multimodal, comparaison et choix.
3. **Sur mon trajet** : stations, puis covoiturage et autres étapes réellement disponibles.
4. **Mon profil** : véhicule(s), adresses, préférences, favoris, données locales.
5. **Mon journal** : seulement à partir du lot Empreinte.

Le premier écran reste une application utilisable, sans page marketing préalable. Le bouton principal est **« Trouver mon trajet »**. Les paramètres carburant ne sont pas nécessaires pour calculer une route.

| Écran | Contenu obligatoire | Actions | États particuliers |
| --- | --- | --- | --- |
| E01 · Préparation | Départ/arrivée identifiables, véhicule actif, options opérationnelles. | Inverser, géolocaliser, utiliser une adresse, calculer. | Champ manquant, lieu ambigu, GPS refusé, moteur absent. |
| E02 · Itinéraires | Carte, résumé distance/durée, contraintes, variantes distinctes. | Choisir une variante, recentrer, modifier la recherche. | Une seule route, aucune route, service indisponible. |
| E03 · Stations | Intention d'arrêt, carburant, quantité, rayon de détour, couverture de la recherche. | Chercher, trier, filtrer, ouvrir une fiche, sélectionner un arrêt. | Aucune station, données partielles, prix absent ou ancien. |
| E04 · Fiche station | Identité, adresse, prix datés, services, horaires, source. | Favori, ajouter comme arrêt, retour à la liste. | Service inconnu, fermeture déclarée, carburant indisponible. |
| E05 · Profil | Données locales, véhicule, adresses, favoris. | Créer/modifier/supprimer, importer/exporter/effacer. | Stockage bloqué, quota atteint, fichier invalide. |
| E06 · Comparaison | Segments de chaque possibilité, coûts comparables, Boussole. | Filtrer, pondérer, choisir, consulter les hypothèses. | Données non comparables, tarification inconnue. |
| E07 · Journal | Trajets confirmés, calendrier, distances et CO₂e par mode. | Ajouter, corriger, supprimer, exporter. | Facteur carbone absent, trajet partiellement renseigné. |

### UX-01 à UX-08 · Règles d’Interface

| ID | Exigence et critère de recette |
| --- | --- |
| UX-01 | Ordinateur : carte et panneau de travail distincts ; aucune commande cachée sous la carte. Vérification à 1440 × 900 et 1024 × 768. |
| UX-02 | Mobile : carte à hauteur limitée puis contenu dans le flux, ou panneau accessible équivalent validé ; aucun bouton essentiel hors écran sans possibilité de défilement. Vérification à 360 × 800, 390 × 844, 768 × 1024. |
| UX-03 | Le trajet principal est bleu soutenu avec contour contrasté ; les alternatives sont bleu clair. La sélection porte aussi un libellé, pas uniquement une couleur. |
| UX-04 | Une station correspond à une seule fiche ; les badges de classement se cumulent sur celle-ci. Le même identifiant relie point, fiche et favori. |
| UX-05 | Le profil et les fiches s'utilisent au clavier ; Échap ferme une fenêtre, le focus reste dedans puis revient à l'élément déclencheur. |
| UX-06 | Les commandes de carte conservent leur place ; le chargement ne déplace pas le bouton principal. Une fermeture reste accessible dans une fiche longue. |
| UX-07 | Les actions et états sont nommés simplement ; pas de jargon de fournisseur dans la saisie ordinaire, ni de diagnostic technique à la place d'un message utile. |
| UX-08 | Conserver l'identité aMi, Onyx et accents existants ; le bleu de navigation a une fonction cartographique. La charte graphique n'autorise pas les contrastes insuffisants. |

## 06. Saisie, Géocodage et Position

| ID | Règle | Acceptation |
| --- | --- | --- |
| GEO-01 | Les champs acceptent ville, adresse ou adresse favorite. Espaces superflus retirés ; libellé original conservé pour édition. | Un champ vide empêche le calcul et reçoit une erreur associée. |
| GEO-02 | Un texte ambigu ne doit pas devenir silencieusement le premier résultat du géocodeur. | Plusieurs communes plausibles produisent un choix avec commune/code postal/pays avant calcul. |
| GEO-03 | Le lieu retenu apparaît avec son libellé résolu. | « Montpellier » ne reste pas un texte opaque après résolution ; les coordonnées sont liées à la sélection. |
| GEO-04 | La géolocalisation est déclenchée par une action, jamais au chargement. | Refus, délai dépassé ou absence du capteur laissent la saisie manuelle disponible. |
| GEO-05 | La précision et l'heure de la position sont conservées. Seuil d'alerte proposé : précision supérieure à 200 m. | Une position imprécise demande confirmation ; elle ne devient pas une entrée de station fiable. |
| GEO-06 | Une adresse favorite stocke le lieu choisi si résolu et son texte ; un libellé « Ma position » n'est pas une adresse fixe. | Réutiliser un favori ne déclenche pas un déplacement de carte vers une ancienne position GPS inattendue. |
| GEO-07 | Toute modification d'une entrée invalide le trajet concerné et ses arrêts calculés. | Une réponse arrivée en retard pour Lyon ne remplace pas une nouvelle recherche depuis Grenoble. |
| GEO-08 | L'autocomplétion n'est activée qu'avec un fournisseur qui l'autorise et des limites de débit adaptées. | Aucune requête à chaque frappe au service public actuel par simple ajout d'un champ suggestif. |

**Territoire initial confirmé : France.** La disponibilité effective en métropole et outre-mer est qualifiée séparément pour chaque source ; cette décision ne vaut pas certification nationale de couverture. L'interface signale un départ ou une arrivée hors couverture des sources nécessaires. L'extension Europe est un lot à décider, pas une conséquence implicite de l'affichage mondial d'une carte.

## 07. Routage et Alternatives

**EXIGENCE :** trouver le trajet avant les stations ; route principale bleue, alternatives bleu clair ; éviter péages et autoroutes.

| ID | Exigence cible | Acceptation |
| --- | --- | --- |
| TRA-01 | Calculer un itinéraire routier réel entre les lieux résolus. Distance et durée proviennent du moteur, pas d'une ligne droite. | Une géométrie absente ou invalide ne devient pas un succès avec carte vide. |
| TRA-02 | Afficher jusqu'à trois possibilités distinctes si le fournisseur les renvoie ; nombre proposé configurable. | Une seule possibilité = une seule fiche. Aucun doublon ni variante inventée pour remplir trois places. |
| TRA-03 | La variante active est sélectionnable depuis la liste et, si possible, la carte ; une commande clavier équivalente est obligatoire. | La sélection change le tracé prioritaire, les km, la durée, l'identifiant de route et invalide les anciens résultats de stations. |
| TRA-04 | Afficher durée estimée, distance, contraintes actives, source et heure du calcul. | Ne pas annoncer « trafic en direct » si la durée utilise des vitesses théoriques. |
| TRA-05 | Le choix de la personne reste la référence tant qu'elle ne le change pas. | Ajouter une station ne remplace pas discrètement sa variante par la route la plus rapide. Voir section 11. |
| TRA-06 | Les parties communes des routes ne rendent pas le principal invisible. | Alternatives dessinées avant le principal ; contour contrasté ; cadrage incluant les géométries utiles. |
| TRA-07 | Une recherche sans résultat distingue absence de route, contrainte impossible et panne du fournisseur. | Les anciennes propositions ne restent pas affichées comme le résultat de la nouvelle recherche. |
| TRA-08 | Le calcul et son annulation sont explicites. | Un double clic ne lance pas deux calculs concurrents ; Annuler remet les commandes dans un état cohérent. |

### Options de Route

| Option | Origine | Sens attendu | Si non prise en charge |
| --- | --- | --- | --- |
| Éviter les péages | EXIGENCE | Exclure les tronçons à péage selon les données du fournisseur, y compris pour les arrêts. | Option indisponible avec raison ; jamais acceptée puis ignorée. |
| Éviter les autoroutes | EXIGENCE | Exclure la catégorie autoroute ; ne signifie pas seulement éviter les autoroutes payantes. | Même règle. |
| Éviter les ferries | PROPOSITION | Ne pas proposer de traversée en ferry dans ce trajet. | Ne pas promettre l'absence de ferry. |
| Plus rapide / plus court | PROPOSITION | Critère du moteur, distinct du coût et des préférences éthiques. | N'afficher que les critères réellement implémentés. |
| Détour maximal | PROPOSITION | Limite séparée en km et/ou minutes pour les arrêts. | Pas de station « proche » présentée sans unité ni seuil. |
| Éviter routes étroites/non revêtues | À DÉCIDER | Définition mesurable et données de couverture nécessaires. | Ne pas assimiler « camion » à cette option. |
| Zones réglementées / restrictions temporelles | À DÉCIDER | Dépend du territoire, de la date et du véhicule. | Aucun indicateur de conformité sans données à jour et règles validées. |

**TRA-09 · Contraintes strictes :** elles s'appliquent au trajet direct, aux alternatives, aux trajets d'accès aux stations, aux prises en charge et aux exports. Si le moteur ne peut les appliquer à une opération, cette opération s'arrête avec explication. Aucun repli silencieux vers une route non contrainte.

**TRA-10 · Recalcul :** changer une contrainte annule les anciennes comparaisons. Les préférences cochées restent cochées en cas de panne. Les désactiver exige une action de la personne.

**TRA-11 · Statut d'application :** conserver `requested`, `applied`, `unsupported`, `unverified`. « Appliquée par le moteur » ne signifie pas « garantie sur le terrain ». Une contrainte explicitement non prise en charge bloque les résultats présentés comme conformes.

## 08. Véhicule, Caravane et Camion

**EXIGENCE :** mémoriser son véhicule et prendre en compte les véhicules encombrants, notamment une voiture tractant une caravane.

| ID | Exigence | Critère |
| --- | --- | --- |
| VEH-01 | Profil facultatif ; mode voiture explicite par défaut, jamais véhicule deviné. | Sans profil, un trajet voiture est possible avec hypothèses affichées. |
| VEH-02 | Données : nom, type, énergie(s), consommation ; quantité de plein préférée distincte du carburant restant. | « 40 L à acheter » ne signifie pas « 40 L dans le réservoir ». |
| VEH-03 | Pour le gabarit : hauteur/largeur/longueur de l'ensemble, masse utilisée par le moteur, remorque, éventuellement charge à l'essieu. | Unités visibles et confirmation des valeurs ; pas de zéro ou dimensions inventées. |
| VEH-04 | Le mapping caravane, utilitaire et camion vers les profils du fournisseur doit être documenté. | Ne pas traiter automatiquement toute caravane comme poids lourd, ni présenter un profil poids lourd comme équivalent juridique. |
| VEH-05 | Les champs nécessaires dépendent du fournisseur et du type retenu. | Si une dimension requise manque, pas d'annonce « gabarit vérifié ». Un trajet voiture ordinaire peut rester consultable seulement comme tel. |
| VEH-06 | L'accès à la station fait partie du contrôle de compatibilité. | Un trajet compatible jusqu'à la rue ne prouve pas que l'auvent, l'entrée ou le demi-tour conviennent. Information absente = inconnue. |
| VEH-07 | Le type réellement appliqué est visible au résultat. | Une erreur fournisseur ne reconvertit pas un camion en voiture sans accord. |
| VEH-08 | Plusieurs véhicules et un actif constituent une évolution proposée. | Changer d'actif invalide les résultats dépendant de ses paramètres ; ne supprime pas les autres profils. |

Le contrat routier développé utilise les mètres pour le gabarit, les tonnes pour le poids total et la charge par essieu, les litres pour le carburant. Les unités sont affichées aux champs et conservées dans le contrat fournisseur ; les autres contrats peuvent utiliser les kilogrammes si la conversion explicite est testée. Les plages techniques doivent être définies avec le fournisseur retenu ; aucune limite arbitraire ne sera présentée comme une réglementation.

## 09. Stations, Recherche et Intention d’Arrêt

### Sens des Trois Intentions

| Intention | EXIGENCE | Règle proposée |
| --- | --- | --- |
| Au plus tôt | Atteindre une station au plus tôt le long du trajet. | Priorité à la distance routière nécessaire pour atteindre une station utilisable depuis l'origine active. Le prix ne passe pas devant la proximité. |
| Bon compromis proche | Comparer les stations proches selon le coût et le détour. | Fenêtre proche visible ; compromis coût d'achat + coût du détour, sous limites de détour. Valeur initiale proposée : 50 km, modifiable. |
| Vers X km | Comparer les stations autour d'une distance choisie. | Cible en distance parcourue sur la route, tolérance visible proposée ±20 km ; le détour d'accès est présenté séparément. |

Le mode actuel utilise des distances routières depuis le départ saisi. La cible ci-dessus précise davantage le sens de « sur mon trajet » et exige une adaptation du calcul, pas un simple changement de libellé.

**STA-01 · Origine active :** avant départ, origine du trajet. Une actualisation ponctuelle depuis « Ma position » remplace explicitement l'origine après confirmation et recalcule. Pas de progression supposée, pas de suivi permanent implicite.

**STA-02 · Fenêtre :** cible et tolérance sont des distances positives en kilomètres ; la borne basse est `max(0, cible - tolérance)` et la haute `min(longueur restante, cible + tolérance)`. Si la cible dépasse le trajet, afficher la limite avant recherche. Le curseur a un champ numérique équivalent et fonctionne au clavier.

**STA-03 · Zone vide :** dire « Aucune station trouvée dans cette zone avec ces critères ». Proposer des actions explicites : élargir, modifier le carburant ou réduire les filtres. Ne jamais élargir automatiquement ou affirmer que le territoire ne contient aucune station.

**STA-04 · Sources :** priorité aux données officielles disponibles ; conserver l'identifiant source stable, prix par carburant, date de chaque prix, ruptures, localisation, adresse, horaires et services. Un nom d'enseigne absent n'est pas reconstitué depuis une intuition sur l'adresse.

**STA-05 · Présélection :** le corridor géographique sert à trouver des candidates, pas à mesurer leur accessibilité. Une station de l'autre côté d'une autoroute ou d'une rivière exige un accès routier calculé.

**STA-06 · Couverture :** afficher reçues, candidates examinées, effectivement comparées, réponses partielles et filtres. « Optimal » signifie meilleur parmi les stations comparées, pas meilleur de France ni de tout le trajet.

**STA-07 · Limites actuelles à rendre configurables :** corridor 12 km, prélèvements environ tous les 30 km, maximum 24 points et 20 candidates dans le prototype. Ce sont des compromis techniques, pas une preuve d'exhaustivité. Une limite atteinte entraîne une indication de couverture partielle et une pagination ou relance ciblée proposée.

**STA-08 · En aval :** la station doit être rattachée à une portion encore à parcourir. Ne pas classer comme « sur le trajet » une station déjà dépassée sans présenter le retour nécessaire et demander accord.

**STA-09 · Carburant :** un prix inconnu, invalide ou une rupture déclarée pour le carburant choisi exclut la station des comparaisons chiffrées correspondantes. Elle peut rester visible avec son état, sans faux zéro.

**STA-10 · Filtres proposés :** détour maximal, services nécessaires, enseignes exclues, ouverture connue à l'arrivée. Une valeur inconnue ne satisfait pas un filtre strict ; une option explicite peut afficher séparément les stations « à vérifier ».

**STA-11 · Carte :** points numérotés stables pendant la recherche, contrastés, activables au clavier et au clic. Sélectionner un point ouvre la même station que sélectionner sa fiche. Le favori ne modifie pas son rang automatiquement.

**STA-12 · Liste :** présenter les recommandations puis permettre l'accès à toutes les stations réellement comparées, pas seulement aux trois gagnantes. Tri indiqué et réversible. Une carte ne doit pas être l'unique moyen d'accéder aux informations.

## 10. Coûts et Classements Carburant

**EXIGENCE :** supprimer la question « Temps €/h ». Le temps reste une durée. Une conversion monétaire du temps n'est pas introduite par défaut dans les classements.

### Variables et Périmètres

| Symbole | Unité | Définition |
| --- | --- | --- |
| `L` | litre | Quantité que la personne souhaite acheter. |
| `p_s` | EUR/litre | Prix daté du carburant choisi dans la station s. |
| `c` | litre/100 km | Consommation saisie ou estimation explicitement identifiée. |
| `D0`, `T0` | km, minute | Distance et durée du trajet de référence sélectionné. |
| `Ds`, `Ts` | km, minute | Distance et durée du trajet vérifié avec la station, sous les mêmes contraintes. |
| `deltaD`, `deltaT` | km, minute | Différences `Ds - D0`, `Ts - T0`. |
| `deltaFrais` | EUR | Surcoûts documentés du détour, hors carburant : péage, parking, etc. |

**CAL-01 · Achat :** `achat_s = L × p_s`.

**CAL-02 · Carburant du détour :** `volume_detour_s = deltaD × c / 100` ; `cout_detour_s = volume_detour_s × p_reference`. Proposition initiale : `p_reference = p_s`, explicitement nommé « estimation au prix de cette station ». Le coût exact du carburant déjà dans le réservoir n'est pas connu.

**CAL-03 · Comparaison :** `cout_compare_s = achat_s + cout_detour_s + deltaFrais`, seulement si toutes les composantes revendiquées sont connues. Si les frais supplémentaires sont inconnus, afficher le sous-total « achat + carburant du détour » et indiquer les exclusions. Ne pas l'appeler coût total du voyage.

**CAL-04 · Différences négatives :** un petit écart numérique peut être traité selon une tolérance documentée. Un écart significatif négatif indique un changement de route ou d'hypothèse : ne pas le masquer par `max(0, ...)`. Revalider le trajet de référence ou présenter explicitement une nouvelle proposition, avant de la classer comme simple détour.

**CAL-05 · Temps :** détour et durée totale sont séparés. Le temps du plein, l'attente et l'entrée/sortie ne sont inclus que s'ils sont connus ou paramétrés ; sinon préciser « hors temps du plein ». Aucun zéro supposé pour une durée absente.

**CAL-06 · Coût du voyage :** la quantité achetée n'est pas égale à la quantité consommée sur le trajet. Pour le voyage, estimer `distance × consommation / 100 × prix_reference`, puis ajouter les autres composantes disponibles. Ne pas ajouter à nouveau l'intégralité du plein.

**CAL-07 · Précision :** calculs sans arrondi intermédiaire ; valeurs monétaires arrondies à deux décimales à l'affichage, prix carburant à trois, distances selon leur précision utile. Pour les tris, les montants comparés sont ramenés au centime ; les égalités restent explicites.

### Exemple de Recette Entièrement Fictif

Trajet de référence 100 km, quantité 40 L, consommation 6,2 L/100 km. Station A : 1,80 EUR/L, détour 6 km et 8 min. Achat 72 EUR ; détour 0,372 L, soit 0,6696 EUR ; sous-total affiché 72,67 EUR. Station B : 1,78 EUR/L et aucun détour : 71,20 EUR. Si des frais sont inconnus, ces nombres ne sont pas un coût total intégral.

### Badges et Ordre

| ID | Badge | Règle proposée et égalités |
| --- | --- | --- |
| CAL-08 | Pompe | Prix au litre minimal connu parmi les stations comparées. Toutes les égalités au millième sont identifiées. |
| CAL-09 | Rapide | Détour en durée minimal vérifié, puis distance supplémentaire en départage d'ordre ; pas « station la plus proche ». |
| CAL-10 | Optimal | Libellé recommandé : « Meilleur coût comparé ». Minimum du coût de périmètre homogène connu, sous contraintes actives. Ne pas mélanger totaux complets et sous-totaux. |
| CAL-11 | Au plus tôt | Distance routière pour atteindre la station, puis durée d'accès ; les badges de coût ne remplacent pas ce tri. |
| CAL-12 | Regroupement | Si A gagne les trois critères, une seule fiche A porte trois badges. Pour des stations distinctes à égalité, ne pas fusionner leurs identités. |

Une différence inférieure à la précision des hypothèses ne doit pas être présentée comme une supériorité certaine. Les classements sont calculés sur les mêmes paramètres, quantités et périmètres.

## 11. Ajout d’un Arrêt et Conservation du Trajet

**ARR-01 · Référence immuable :** conserver un identifiant de route, sa géométrie, ses étapes, son fournisseur, sa date et ses contraintes. La route avec arrêt est un nouvel objet lié à cette référence, pas un écrasement silencieux.

**ARR-02 · Conservation :** une station se rattache à une section du trajet sélectionné. La méthode choisie doit préserver les parties hors détour, ou signaler explicitement que le moteur recalcule une route différente. Les points de passage d'ancrage ne doivent pas créer de demi-tours ni de mauvaises chaussées.

**ARR-03 · Matrice et variantes :** ne pas soustraire la durée d'une variante lente à des accès calculés sur une autre route rapide. Une matrice non contrainte ou sans référence à la variante ne suffit pas à garantir un détour cohérent. Si nécessaire, réduire le nombre de candidates et calculer chaque trajet via station avec les contraintes requises.

**ARR-04 · Confirmation :** avant ajout, vérifier la route complète, actualiser km/minutes/coûts, montrer le tracé et laisser confirmer si le résultat diffère de la comparaison. En cas d'échec, l'ancien trajet valide reste identifiable et l'arrêt n'est pas marqué comme confirmé.

**ARR-05 · Suppression :** retirer l'arrêt restaure la route de référence sans conserver des coûts ou marqueurs de sélection obsolètes.

**ARR-06 · Nombre d'arrêts :** un arrêt carburant dans le premier lot. Plusieurs arrêts ordonnés sont une évolution ; elle requiert recalcul cumulatif et autonomie par segment. Ne pas laisser ajouter un deuxième arrêt si l'interface ne sait conserver que le dernier.

**ARR-07 · Sortie vers navigation :** toute application externe reçoit les points qu'elle peut accepter ; avertir si contraintes ou variante ne sont pas exportables. Une ouverture externe ne prouve pas qu'elle reprend le même parcours.

## 12. Autonomie et Usage en Déplacement

**VISION :** autonomie. **EXIGENCE :** trouver une station proche lorsque le plein devient urgent. Ces deux besoins ne doivent pas être confondus avec une assistance d'urgence.

| ID | Règle proposée | Critère |
| --- | --- | --- |
| AUT-01 | Entrée facultative : litres restants ou autonomie estimée par la personne, jamais les deux sans règle de priorité. | Absence d'entrée = autonomie inconnue, pas « station atteignable ». |
| AUT-02 | Avec litres restants `R` et consommation `c > 0`, autonomie théorique `100 × R / c`. | Calcul explicitement estimatif, daté ; aucun diagnostic véhicule. |
| AUT-03 | Réserve paramétrable en kilomètres, proposition initiale 30 km à valider ; portée utile `max(0, autonomie - réserve)`. | Réserve visible ; aucune certitude de pouvoir atteindre une station. |
| AUT-04 | Distance d'accès inclut le trajet réellement roulé jusqu'à la station. | Une station projetée à 90 km avec accès à 110 km n'est pas annoncée atteignable avec 100 km utiles. |
| AUT-05 | Position ponctuelle ou suivi continu sont deux fonctions différentes. | Le premier lot indique la référence utilisée. Le suivi continu demande un lot et un consentement spécifiques. |
| AUT-06 | En mode proche, pas de distraction inutile ni de langage rassurant infondé. | Aucune garantie d'atteignabilité ou d'ouverture sans information suffisante. |

Le futur suivi continu doit traiter perte GPS, sortie de route, pause/reprise, consommation inconnue et changement de réseau. Il ne se déduit pas d'un simple bouton de géolocalisation.

## 13. Fiches Stations et Favoris

| ID | Exigence | Recette |
| --- | --- | --- |
| FIC-01 | Afficher nom si connu, adresse, commune, carburants/prix datés, services, horaires et provenance. | Champs manquants rendus « non renseigné », jamais complétés par invention. |
| FIC-02 | Distinguer horaires boutique, distribution et automate 24 h/24. | Automate actif ne signifie pas boutique ouverte ni carburant disponible. |
| FIC-03 | « Ouverte à l'arrivée » exige horaire exploitable, fuseau, date d'arrivée et traitement des jours spéciaux. | Si jours fériés/exceptions ne sont pas connus, afficher une réserve ou statut inconnu ; ne pas affirmer ouvert. |
| FIC-04 | Chaque service est déclaré par la source. | « Lavage » n'implique pas toilettes ; l'accès PMR n'est pas déduit d'un parking. |
| FIC-05 | Favori par identifiant source ; adresse/coordonnées utiles conservées localement. | Un changement de prix ne crée pas un nouveau favori. |
| FIC-06 | Réouverture : rafraîchir les informations dynamiques. | Échec = adresse sauvegardée et état indisponible ; ne pas présenter l'ancien prix comme actuel. |
| FIC-07 | Source et date de déclaration/consultation distinguées. | « Consulté aujourd'hui » ne rend pas un prix déclaré il y a une semaine récent. |
| FIC-08 | Une réponse tardive ne remplit pas une autre fiche. | Ouvrir A puis B très vite laisse B affichée même si A répond après. |
| FIC-09 | Changement de carburant ou paramètres ferme/invalide une sélection incompatible. | Aucun bouton « choisir » ne confirme une station calculée pour l'ancien carburant. |

## 14. Profil, Adresses et Données Personnelles

**EXIGENCE :** enregistrer véhicule, adresses et stations. **VISION :** profil local d'abord.

| ID | Règle cible | Acceptation |
| --- | --- | --- |
| PRO-01 | Utilisable sans compte ; mention claire « sur ce navigateur/appareil ». | Ne pas laisser croire qu'un enregistrement local sera retrouvé automatiquement sur le téléphone. |
| PRO-02 | Ajouter, renommer, modifier, supprimer une adresse nommée et l'utiliser au départ ou à l'arrivée. | Les doublons sont signalés sans écrasement silencieux ; les accents sont conservés. |
| PRO-03 | Sauvegarder après validation et confirmer seulement après écriture réussie. | Stockage refusé ou saturé = erreur et données de formulaire conservées. |
| PRO-04 | Export JSON versionné ; aperçu du nombre d'éléments avant import ; confirmation avant remplacement. | Fichier invalide ou trop gros refusé sans détruire le profil existant. |
| PRO-05 | Migration de schéma testée et non destructive. | Export de secours proposé avant migration irréversible ; version future inconnue refusée proprement. |
| PRO-06 | Effacement limité aux données de cette application et de cet environnement. | Ne pas appeler un effacement global qui supprimerait les autres applications aMi. |
| PRO-07 | Profil public et chaque aperçu séparés. | Un test sur PR 4 ne lit ni ne modifie les adresses de la version publique. |
| PRO-08 | Les clés API ne sont jamais incluses dans l'export du profil ni dans les captures/rapports. | Test avec marqueur factice secret, recherche de ce marqueur dans tous les artefacts. |

Limites proposées héritées du prototype : 50 adresses, 100 stations favorites, nom 80 caractères, adresse 250, import 100 000 octets. Elles sont des protections initiales documentées, à revoir lors de l'ajout du journal. Un dépassement produit un message utile, jamais une troncature silencieuse.

Le stockage local n'est pas un coffre-fort chiffré. Prévoir un inventaire des données transmises : géocodeur reçoit les lieux recherchés ; routeur reçoit des coordonnées et contraintes ; fournisseur de tuiles reçoit des requêtes cartographiques. « Sans compte » ne signifie donc pas « aucune donnée sort de l'appareil ».

## 15. Covoiturage

La vision inclut conducteurs, passagers, embarquement, détour, frais partagés et consentement. Le prototype ne possède actuellement qu'un lien externe.

| ID | Exigence cible | Acceptation |
| --- | --- | --- |
| COV-01 | Distinguer « Je conduis » et « Je cherche une place ». | Le nombre de places et les contraintes affichées correspondent au rôle. |
| COV-02 | Sans fournisseur connecté, afficher recherche externe et absence d'offres intégrées. | Aucun résultat fictif, avis, prix ou disponibilité utilisé comme donnée réelle. |
| COV-03 | Une offre contient fournisseur, identifiant, heure/fuseau, lieux, prix/devise, places connues, lien et fraîcheur. | Un champ manquant n'est pas déduit ; offre périmée séparée des disponibles. |
| COV-04 | Points de rencontre et détours sont calculés selon le même contrat de route. | Une prise en charge peut être refusée si elle dépasse la limite ou viole une contrainte. |
| COV-05 | Séparer prix de l'offre, estimation des frais et proposition de répartition. | Une division des coûts n'est pas une offre contractuelle ni un paiement. |
| COV-06 | Réservation et contact restent chez le fournisseur au premier raccordement. | Aucun clic ne réserve ou ne publie une adresse privée sans étape explicite. |
| COV-07 | Réputation portable : étude séparée, non requise pour le MVP. | Pas de score social inventé ; modèle de consentement, correction et contestation avant développement. |

L'accès à des offres implique de vérifier autorisations, conditions, quotas et couverture. Un lien vers un site public ne donne pas le droit technique ou contractuel d'en aspirer les annonces.

## 16. Transports Publics et Mobilités Douces

### Transports Publics

| ID | Exigence cible | Acceptation |
| --- | --- | --- |
| TC-01 | Départ à une heure ou arrivée avant une heure, date et fuseau explicites. | Aucun trajet « hier » proposé à cause d'un calcul d'heure sans date. |
| TC-02 | Résultat composé de segments : accès, ligne, arrêts, montée/descente, attente, correspondance, sortie. | Durée totale comprend accès et attente, pas uniquement le temps dans le train. |
| TC-03 | Calendriers de service, exceptions et changements de jour gérés par une bibliothèque/moteur éprouvé. | Tests autour de minuit, changement d'heure et service supprimé. |
| TC-04 | Distinguer horaire théorique, information temps réel et interruption. | Une panne temps réel restitue l'horaire théorique comme tel, sans badge « en direct ». |
| TC-05 | Tarifs et disponibilité de réservation indépendants des horaires. | Prix inconnu reste inconnu ; aucun billet à 0 EUR par défaut. |
| TC-06 | Accessibilité et contraintes bagages/vélo renseignées par source. | Une information inconnue ne satisfait pas un filtre strict fauteuil ou vélo embarqué. |
| TC-07 | Commencer par un territoire pilote nommé et des flux identifiés. | La couverture hors pilote est annoncée absente ; pas de promesse nationale avant recette. |

### Marche, Vélo et Vélo Partagé

| ID | Exigence cible | Acceptation |
| --- | --- | --- |
| DOU-01 | Moteur et profil adaptés au mode. | Les itinéraires ne reprennent pas un tracé automobile avec une vitesse modifiée. |
| DOU-02 | Limites personnelles : distance de marche, vélo/VAE, changements acceptables ; pente si disponible. | Donnée inconnue et préférence souple sont distinguées d'une interdiction. |
| DOU-03 | Vélo partagé : stations, vélos et places disponibles horodatés lorsque la source existe. | Disponibilité ancienne signalée ; arrivée ne garantit pas une place. |
| DOU-04 | Premier/dernier kilomètre pris en compte avec location/restitution et temps associés. | Pas de comparaison train + vélo qui oublie la marche vers la station. |
| DOU-05 | Batterie d'un VAE ou vélo partagé non supposée connue. | Autonomie absente ne devient pas une confirmation d'atteignabilité. |

## 17. Tapis Volant et Boussole

**VISION :** prix, temps, CO₂e, vie privée, accessibilité et choix éthiques visibles, pondérés par la personne. Les nombres et exemples de la présentation sont des maquettes, pas des valeurs de production.

**BOU-01 · Deux étages :** appliquer d'abord les contraintes strictes ; classer ensuite les possibilités admissibles selon les préférences. Un faible coût ne compense ni un gabarit incompatible ni une arrivée trop tardive.

**BOU-02 · Comparabilité :** même départ/arrivée, même date, mêmes voyageurs et périmètre de coûts. Si une solution n'a pas de prix, la montrer comme incomplète et ne pas la classer devant les autres grâce à une absence de donnée.

**BOU-03 · Vue sans score :** toujours pouvoir lire et trier les valeurs brutes. Le score ne remplace ni euros, ni minutes, ni kg CO₂e.

**BOU-04 · Filtres éthiques :** exclusions/préférences d'opérateur ou d'enseigne explicites et réversibles. La liste d'acteurs ne constitue pas un jugement éditorial caché.

**BOU-05 · Vie privée et liberté :** commencer par des attributs factuels sourcés : compte requis, partage de localisation, licence connue, export disponible. Pas de note numérique tant qu'un barème vérifiable et sa gouvernance n'ont pas été approuvés.

**BOU-06 · Accessibilité :** les besoins indispensables sont des contraintes, pas seulement un curseur. Les préférences de confort peuvent être pondérées séparément.

### Algorithme Proposé pour les Critères Numériques

Version initiale limitée aux critères mesurables et disponibles pour toutes les solutions du groupe comparé : coût, durée, CO₂e. Pour un critère à minimiser, `n_i = (x_i - min_i) / (max_i - min_i)`. Si toutes les valeurs sont égales, `n_i = 0`. Poids de l'utilisateur `w_i >= 0`, somme strictement positive ; score de coût `S = somme(w_i × n_i) / somme(w_i)` ; plus petit = meilleur selon ces poids et ce groupe.

Cette normalisation dépend du groupe de solutions. Ajouter une option peut changer les scores ; le groupe est donc figé pendant l'interaction, puis un recalcul explicite actualise la comparaison. Aucun score comparable entre deux recherches différentes n'est promis.

**BOU-07 :** un critère actif manquant rend la solution « comparaison incomplète » ; ne pas renormaliser les poids différemment pour chaque candidat. Proposer un groupe comparable ou demander de désactiver le critère pour tout le groupe.

**BOU-08 :** si tous les poids sont nuls, aucune recommandation pondérée ; revenir au tri choisi. Afficher la contribution de chaque critère et enregistrer la version de la formule avec le résultat.

**BOU-09 :** les ex æquo restent ex æquo à la précision affichée. L'ordre secondaire déterministe utilise durée, puis coût connus, puis identifiant ; il ne devient pas une supériorité morale ou scientifique.

Cette formule est une **PROPOSITION à valider**, pas une formule imposée par la présentation. Sa recette doit inclure variations de poids, valeurs manquantes, égalités, changement de groupe et absence de solution admissible.

## 18. Empreinte et Journal de Mobilité

| ID | Règle cible | Acceptation |
| --- | --- | --- |
| EMP-01 | Chaque facteur porte source, version/date, unité et périmètre. | Aucun facteur carbone arbitraire en production ; jeu fictif réservé aux tests. |
| EMP-02 | Adapter la formule à l'unité : véhicule-km ou passager-km. | Un facteur par passager n'est pas divisé une deuxième fois par le nombre d'occupants. |
| EMP-03 | Distinguer empreinte véhicule, allocation individuelle et somme des segments. | Un trajet partagé ne réduit pas artificiellement l'empreinte totale du véhicule. |
| EMP-04 | Occupants réels ou hypothèse explicite. | Le nombre de places disponibles ne remplace pas le nombre d'occupants. |
| EMP-05 | Périmètre homogène entre modes et avertissement si ce n'est pas possible. | Production du véhicule, énergie ou seuls usages ne sont pas mélangés silencieusement. |
| EMP-06 | Marche/vélo ne sont pas déclarés sans impact par principe. | Afficher la valeur et le périmètre de la méthode retenue, ou absence d'estimation. |
| EMP-07 | Séparer CO₂e, particules, bruit et occupation d'espace. | Pas de total d'unités incompatibles ni de score global de « pollution ». |
| JOU-01 | Journal local, volontaire, désactivé par défaut proposé. | Une recherche ou un clic de sélection ne crée pas un trajet effectué. |
| JOU-02 | Confirmation explicite « J'ai effectué ce trajet », date et possibilité d'ajustement. | Un identifiant empêche le double enregistrement après double clic/rechargement. |
| JOU-03 | Modification, suppression, export ; aucune synchronisation implicite. | Les totaux sont recalculés après correction ou suppression. |
| JOU-04 | Bilan mensuel par mode, distance et CO₂e ; données incomplètes signalées. | Trois trajets sans facteur ne deviennent pas trois trajets à émission nulle. |
| JOU-05 | Conserver la version de calcul historique. | Nouvelle version d'un facteur : ne pas réécrire le passé sans action et explication. |

## 19. Recharge Électrique, Navigation et Hors Ligne

### Recharge Électrique · Lot Futur

**ELE-01 :** profil véhicule avec connecteurs compatibles, capacité utile et consommation. **ELE-02 :** distinguer puissance nominale de borne, puissance admissible et courbe de charge ; ne pas calculer tout le temps de charge par une simple division par la puissance maximale. **ELE-03 :** prix avec unité, abonnement, frais d'occupation et date ; tarifs inconnus non comparés comme gratuits. **ELE-04 :** disponibilité horodatée et provenance ; jamais une garantie à l'arrivée. **ELE-05 :** stratégie de réserve et arrêts multiples, avec hypothèses de température/consommation déclarées si utilisées. Fournisseurs et périmètre à décider avant développement.

### Installation et Fonctionnement Dégradé

**OFF-01 :** installer la PWA peut rendre l'interface accessible sans réseau ; aucune promesse de nouveau calcul ou de nouveaux prix hors ligne sans moteur et données adaptés.

**OFF-02 :** un trajet sauvegardé est un instantané daté. Il est consultable comme tel, sans trafic ni prix rafraîchis simulés. Les données personnelles ne sont pas stockées dans un cache public partagé.

**OFF-03 :** une mise à jour du cache ne supprime ni le profil ni les données d'autres applications. Les aperçus n'installent pas le service worker de production.

**OFF-04 :** ne pas télécharger massivement les tuiles d'un fournisseur qui ne l'autorise pas. Le vrai hors ligne nécessite une source et une licence adaptées.

**OFF-05 :** Organic Maps est une piste de la présentation. Liens profonds, formats d'échange et reprise des contraintes doivent être étudiés avant promesse d'intégration. Un benchmark séparé décidera PWA, hybride ou natif ; aucune réécriture automatique du produit.

## 20. Modèle de Données Commun

**PROPOSITION technique :** les fournisseurs sont adaptés vers un contrat interne versionné. Les écrans et la Boussole ne lisent pas directement les formats propres à OSRM, ORS ou aux opérateurs de transport.

### Conventions

Coordonnées GeoJSON `[longitude, latitude]` en WGS84 dans le contrat ; conversion explicite vers `[latitude, longitude]` pour Leaflet. Distances en mètres, durées en secondes, montants accompagnés d'une devise, volumes en litres, CO₂e en kilogrammes. Dates ISO 8601 avec fuseau/offset pour les instants ; conserver le fuseau de service pour les horaires locaux. `null` signifie inconnu ; un champ absent n'est pas un zéro.

| Objet | Champs minimaux | Invariant |
| --- | --- | --- |
| `Place` | id local, libellé, adresse, coordonnées, source, précision si connue | Une paire de coordonnées finies et dans les bornes ; pas d'inversion lat/lon. |
| `TripRequest` | id, révision, départ, arrivée, étapes, date/intention horaire, voyageurs, véhicule actif, contraintes, préférences | Instantané immuable pour un calcul ; révision nouvelle à chaque changement pertinent. |
| `RouteOption` | id, requestId, fournisseur, profil appliqué, géométrie, segments, distance, durée, coûts, contraintes, provenance | Impossible d'être « valide » sans géométrie et métriques nécessaires cohérentes. |
| `Leg` | mode, lieux, horaires si connus, distance, durée, opérateur, provenance | Ordre continu ; attente/correspondance distinguées du mouvement. |
| `ConstraintResult` | code, valeur demandée, statut d'application, raison, preuve/source | Une contrainte non appliquée n'est jamais implicitement vraie. |
| `Station` | fournisseur/id, coordonnées, identité, adresse, prix par carburant, ruptures, services, horaires | Identité stable indépendante du prix ou du rang. |
| `StationCandidate` | stationId, routeId, requestRevision, accès, sortie, détour, coûts, badges, couverture | Toute métrique dépend de la même route et des mêmes contraintes. |
| `Vehicle` | id, type, énergie, consommation, gabarit pertinent, valeurs déclarées | Pas de conversion automatique vers un profil fournisseur non équivalent. |
| `Profile` | schemaVersion, véhicules, actif, adresses, favoris, préférences | Données locales ; aucune clé API exportée. |
| `EmissionEstimate` | valeur/unité, facteur, version, occupants, périmètre, hypothèses | Valeur calculée traçable ; inconnu reste inconnu. |
| `JournalEntry` | id, trajet confirmé, date, segments, occupants, empreinte/version, révision | Un trajet choisi n'est pas automatiquement un trajet effectué. |

### Valeur Sourcée Commune

```json
{
  "value": null,
  "unit": "EUR",
  "status": "unavailable",
  "sourceId": "provider-id",
  "declaredAt": null,
  "fetchedAt": "2026-09-17T18:00:00Z",
  "validUntil": null,
  "methodVersion": null,
  "reason": "Tarif non fourni"
}
```

États proposés : `observed`, `estimated`, `unavailable`, `stale`. Une estimation possède une méthode ; une observation porte sa date lorsqu'elle existe ; une date de consultation ne se substitue pas à la date de la donnée. Les schémas JSON exécutables et migrations sont un livrable du premier lot d'architecture, non fournis implicitement par cet exemple.

## 21. États, Erreurs et Concurrence

| État principal | Ce qui reste possible | Sortie |
| --- | --- | --- |
| Saisie | Modifier, ouvrir le profil, consulter les données locales. | Validation vers résolution des lieux. |
| Résolution / calcul | Voir la progression, annuler. | Résultat, erreur ou annulation ; jamais deux résultats concurrents. |
| Route prête | Comparer variantes, configurer les arrêts. | Recherche stations ou nouvelle demande. |
| Recherche stations | Conserver la route visible, annuler la recherche. | Résultats, partiel ou panne carburants. |
| Résultats | Ouvrir des fiches, trier, choisir un arrêt. | Vérification du trajet avec arrêt. |
| Arrêt confirmé | Consulter le trajet, retirer l'arrêt, exporter si compatible. | Retour référence ou nouveau calcul. |
| Données périmées | Voir un instantané explicitement daté. | Rafraîchir ou modifier ; pas de confirmation basée sur données invalidées. |

**ERR-01 :** chaque calcul porte `requestId` et révision ; toute réponse d'une révision dépassée est ignorée, même si l'annulation réseau a échoué.

**ERR-02 :** un échec carburant ne supprime pas la route valide. Un échec de carte ne détruit pas la liste. Un schéma de secours est nommé comme tel, pas présenté comme une carte routière complète.

**ERR-03 :** une nouvelle recherche invalide les anciens résultats avant d'en afficher d'autres. Une erreur de recalcul d'arrêt ne confirme pas cet arrêt ; l'état précédent est conservé comme précédent.

**ERR-04 :** les réponses partielles sont identifiables. Pas de « tout va bien » global si la moitié des recherches station a échoué.

**ERR-05 :** erreurs 429/quotas, délais dépassés et absence de résultat ont des messages distincts. Respecter `Retry-After` lorsqu'il existe, limiter les tentatives et éviter les boucles automatiques.

**ERR-06 :** valeurs infinies, négatives impossibles, géométries vides, caractères HTML et réponses hors schéma sont rejetés ou neutralisés. Ne jamais injecter le contenu d'une source dans du HTML exécutable.

## 22. Fournisseurs et Architecture d’Hébergement

### Fournisseurs et Arbitrages

| Besoin | Base actuelle / candidat | Décision de ce cahier |
| --- | --- | --- |
| Site et aperçus | GitHub Pages / Actions | CONFIRMÉ : conserver. |
| Carte | Leaflet + tuiles OpenStreetMap | Présent ; vérifier conditions et charge avant ouverture large. |
| Géocodage | Nominatim public | Présent ; respecter politique, mise en cache adaptée et limitations. |
| Routage | Serveur public OSRM | Présent ; exclusions péages/autoroutes non opérationnelles dans le prototype testé. |
| Routage contraint | Adaptateur serveur OpenRouteService développé | Activation ouverte : hébergement, clé d’exploitation, conditions, quotas, coût et couverture. Aucun fournisseur payant engagé. |
| Alternative France | Géoplateforme IGN | Piste étudiée ; capacités consultées : exclusions autoroute/tunnel/pont, pas d'option péage identifiée dans les ressources examinées. Ne résout pas à elle seule toute la demande. |
| Carburants | Flux officiel prix des carburants | Présent ; données déclaratives et couverture partielle possibles. |
| CO₂e | Impact CO₂ / ADEME, cité dans la présentation | Candidat à contractualiser : unité, version, licence, conditions et cache. |
| Collectif | Flux référencés transport.data.gouv.fr / SNCF | Sources candidates ; moteur d'itinéraires nécessaire en plus de l'accès aux fichiers. |
| Covoiturage / vélo partagé / recharge | Non connectés | Étude par fournisseur avant toute promesse de couverture. |

La documentation ORS expose l'évitement des péages/autoroutes et des restrictions dimensionnelles pour certains profils. Cela ne prouve ni l'adéquation d'un profil caravane, ni la disponibilité gratuite d'un volume d'usage, ni l'application des mêmes options à une matrice. Ces points nécessitent une recette fournisseur.

### API à Clé et Hébergement GitHub

**ARC-01 :** un site statique ne protège pas un secret distribué à ses visiteurs. Une clé injectée dans un fichier JavaScript reste lisible ; la placer dans un secret GitHub Actions puis la compiler côté navigateur ne la rend pas secrète.

**ARC-02 : EXIGENCE CONFIRMÉE.** L’expérience publique ne demande aucune clé API ni compte technique aux visiteurs. L’ancienne saisie de clé personnelle est retirée du parcours. Les secrets d’exploitation restent côté serveur, hors dépôt, liens, journaux, captures et exports.

**ARC-03 :** pour un service public sans clé utilisateur, choisir soit un fournisseur autorisant une clé publique limitée, soit une architecture serveur approuvée. Un serveur protège le secret mais constitue une décision d'infrastructure ; ne pas ajouter Cloudflare ou un autre hébergement sans accord.

**ARC-04 :** chaque adaptateur expose ses capacités et limites : modes, exclusions, variantes, étapes, dates, gabarit, matrice, attribution, quotas, couverture. L'interface se fonde sur ce contrat de capacités, pas sur des boutons hardcodés optimistes.

**ARC-05 :** le remplacement d'un fournisseur passe par des tests de contrat et une vérification de ses conditions. Aucun changement silencieux qui transfère davantage de données à un tiers.

## 23. Fraîcheur, Cache et Fiabilité

Les seuils ci-dessous sont des **PROPOSITIONS produit**, pas des garanties des sources. Ils seront ajustés et versionnés après tests réels.

| Donnée | Règle initiale proposée | Conséquence |
| --- | --- | --- |
| Prix carburant | Date propre au prix ; avertissement à plus de 48 h ; exclu du classement principal après 7 jours, consultable séparément. | Seuils visibles dans l'aide de la donnée ; prix non daté considéré non vérifiable. |
| Horaires/services | Conserver date si fournie ; sinon date de consultation seulement. | Ne jamais conclure à une ouverture garantie à l'arrivée. |
| Route | Mettre en cache selon fournisseur, contraintes, profil, points et version. | Pas de réutilisation d'une route voiture pour un camion ou d'une route à péage pour « sans péages ». |
| Temps réel transport / disponibilité | Validité selon source, pas seuil universel inventé. | Si trop ancien ou non daté, retirer le statut temps réel. |
| Facteur CO₂e | Version stable enregistrée avec chaque estimation. | Mise à jour contrôlée, historique reproductible. |
| Favori | Identifiant et données stables persistés ; dynamique rafraîchie. | Un favori n'est pas un instantané tarifaire utilisable indéfiniment. |

**DAT-01 :** tester une source vivante avant activation, puis régulièrement selon son importance, avec fréquence approuvée. Les tests automatisés déterministes n'envoient pas de recherches massives aux services publics.

**DAT-02 :** un diagnostic indique les composants indépendants : carte, géocodage, routage, carburants, autres sources. Un succès réseau n'atteste pas la justesse métier.

**DAT-03 :** limites de débit respectées par fournisseur et par périmètre applicable. Un délai dans un navigateur ne garantit pas à lui seul le respect d'un quota global pour tous les visiteurs.

## 24. Accessibilité, Sécurité et Qualité

| ID | Exigence proposée | Preuve attendue |
| --- | --- | --- |
| QUA-01 | Objectif d'accessibilité WCAG 2.2 AA, avec contrôle manuel complémentaire. | Audit automatique, navigation clavier, lecteur d'écran sur parcours critiques ; zéro violation détectée n'est pas une certification. |
| QUA-02 | Zoom texte 200 %, petite largeur et orientation paysage. | Pas de champ ou bouton essentiel inaccessible ; absence de défilement horizontal de la page, sauf tableaux documentaires identifiés. |
| QUA-03 | Contraste des textes et composants ; information non fondée seulement sur couleur. | Route sélectionnée et stations compréhensibles sans distinguer les couleurs. |
| QUA-04 | Cibles principales proposées 44 × 44 pixels CSS minimum. | Mesure sur mobile, notamment marqueurs et fermeture des fenêtres. |
| QUA-05 | Texte externe traité comme donnée ; liens autorisés et fichiers importés validés. | Cas d'injection dans nom, adresse, service, favori et fichier d'import. |
| QUA-06 | Aucune clé/adresse personnelle dans les rapports publics, captures ou URL d'aperçu. | Jeux fictifs, inspection des artefacts et journaux. |
| QUA-07 | Aucune télémétrie non indispensable par défaut proposée. | Inventaire des requêtes réseau ; ajout d'analyse d'usage soumis à décision. |
| QUA-08 | Dépendances versionnées et mises à jour contrôlées. | Tests de non-régression après changement ; vérification de sécurité distincte d'un simple audit de syntaxe. |
| QUA-09 | Retour visuel à une action en moins de 200 ms sur appareil de référence proposé. | Mesure locale ; les temps d'API sont présentés séparément. |
| QUA-10 | Délais réseau bornés, annulation et retry utilisables. | Objectifs initiaux : route 20 s, recherche de stations 45 s avant état explicite ; à ajuster au fournisseur, sans attente infinie. |
| QUA-11 | Carte interactive fluide avec le volume maximal prévu. | Test de 100 points ; regrouper les marqueurs seulement si nécessaire, sans perdre accès à chaque station. |
| QUA-12 | Navigateur cible : versions stables actuelles Chrome, Firefox, Safari et Safari iOS, sous réserve de bancs disponibles. | Matrice de compatibilité remplie ; ne pas déduire Safari d'un test Chromium. |

La signalisation, les circonstances réelles et les vérifications du conducteur restent déterminantes. Le produit ne doit pas transformer des données routières potentiellement incomplètes en promesse de sécurité, d'ouverture ou de conformité réglementaire.

## 25. Plan de Recette Exécutable

Chaque exigence d'un lot reçoit : test associé, type de preuve, résultat et commit. Les cas ci-dessous forment le noyau obligatoire ; ils ne remplacent pas les critères dans les tables précédentes.

| Test | Entrée / action | Résultat attendu | Exigences |
| --- | --- | --- | --- |
| T01 | Départ vide puis calcul | Erreur liée au champ, aucun appel routage. | GEO-01 |
| T02 | Ville ambiguë | Choix du lieu avant route, pas premier résultat silencieux. | GEO-02/03 |
| T03 | GPS refusé | Saisie manuelle intacte. | GEO-04 |
| T04 | Changer destination pendant calcul A, lancer B | A ne remplace jamais B. | GEO-07, ERR-01 |
| T05 | Réponse avec trois routes dont doublon exact | Variantes dédupliquées, principal visible, aucune troisième inventée. | TRA-02/06 |
| T06 | Choisir variante B après résultats de stations A | Résumé/carte changés, résultats A invalidés. | TRA-03 |
| T07 | Sans péages actif, route et détour station | Contrainte présente et appliquée aux deux calculs. | TRA-09/11 |
| T08 | Sans autoroutes + péages indépendamment puis ensemble | Paramètres indépendants ; aucun indicateur ignoré. | TRA-09 |
| T09 | Fournisseur refuse une contrainte | Aucun résultat présenté comme conforme ; choix conservé. | TRA-10/11 |
| T10 | Caravane avec dimensions manquantes | Pas de « gabarit vérifié » ; saisie ou limite explicite. | VEH-03/05 |
| T11 | Station de l'autre côté d'une autoroute | Accès réel, pas distance aérienne. | STA-05 |
| T12 | Cible 100 km, tolérance 20 | Bornes 80–120 ; accès/détour séparés ; pas de station à 150 sans action. | STA-02/03 |
| T13 | Station déjà dépassée mais bon marché | Pas de classement « en aval » ; retour expliqué si consulté. | STA-08 |
| T14 | Prix null, 0 incohérent, rupture, prix trop ancien | Pas de victoire par faux zéro ; statuts corrects. | STA-09, DAT-01 |
| T15 | Station gagnante sur trois critères | Une fiche, trois badges, un point. | CAL-12 |
| T16 | Deux stations ex æquo | Deux identités conservées ; égalité visible. | CAL-07/08 |
| T17 | Exemple A de la section calculs | Achat 72,00 ; détour 0,67 ; sous-total 72,67 EUR. | CAL-01/03 |
| T18 | Variante choisie puis station | Variante préservée hors détour ou changement explicitement proposé avant confirmation. | ARR-01/04 |
| T19 | Temps de route via station inférieur significativement à la référence | Pas de clamp silencieux ; incohérence traitée. | CAL-04 |
| T20 | Panne carburant / carte | Route ou liste restantes utilisables, état partiel exact. | ERR-02/04 |
| T21 | Ouvrir A puis B, réponse A tardive | Fiche B reste cohérente. | FIC-08 |
| T22 | Automate 24 h/24, boutique fermée | Deux informations distinctes. | FIC-02 |
| T23 | Favori rechargé, API indisponible | Adresse sauvegardée visible ; pas d'ancien prix présenté comme actuel. | FIC-06 |
| T24 | Profil sauvegardé, stockage bloqué | Aucun faux succès ; formulaire conservé. | PRO-03 |
| T25 | Import invalide / version future / fichier trop gros | Ancien profil intact. | PRO-04/05 |
| T26 | Effacer profil d'aperçu | Profil public et autres applications intacts. | PRO-06/07 |
| T27 | 40 L à acheter mais carburant restant absent | Autonomie inconnue, pas calculée depuis 40 L. | VEH-02, AUT-01 |
| T28 | 5 L restants, 5 L/100, réserve 30 km | Théorique 100 km, utile estimée 70 ; limites visibles. | AUT-02/03 |
| T29 | Offre de covoiturage absente | Lien externe ou état vide, aucun faux prix. | COV-02 |
| T30 | Horaire théorique et prix absent | Horaire utilisable, prix inconnu, pas 0 EUR. | TC-04/05 |
| T31 | Correspondance à minuit / changement de jour | Dates et durée cohérentes, calendrier de service correct. | TC-03 |
| T32 | Facteur CO₂e par passager-km | Pas de seconde division par occupants. | EMP-02 |
| T33 | Calculer puis sélectionner un trajet | Aucune entrée automatique au journal. | JOU-01 |
| T34 | Confirmer deux fois le même déplacement | Une seule entrée ; correction et suppression recalculent les totaux. | JOU-02/03 |
| T35 | Boussole avec prix manquant pour une option | Groupe incomplet signalé ; inconnu pas meilleur. | BOU-02/07 |
| T36 | Tous les poids à zéro / tous les coûts égaux | Aucun NaN ni vainqueur artificiel. | BOU-08/09 |
| T37 | Mode hors ligne après trajet sauvegardé | Instantané daté ; aucun nouveau prix annoncé. | OFF-01/02 |
| T38 | Clavier, zoom, mobile, fiche longue | Focus correct, fermeture accessible, pas de chevauchement. | UX-01/07, QUA-01/04 |
| T39 | Adresse contenant du HTML malveillant | Texte inerte, aucune exécution. | ERR-06, QUA-05 |
| T40 | Export/navigation externe sans transfert possible des contraintes | Avertissement préalable et lien correctement encodé. | ARR-07 |

### Niveaux de Preuve

1. **Unitaires :** formules, filtres, égalités, conversions, validations, migrations, dates et provenance.
2. **Contrats fournisseurs :** requêtes construites, capacité et réponse normalisée, erreurs/quotas. Jeux enregistrés anonymisés et versionnés.
3. **Navigateur simulé :** parcours reproductibles, clavier, erreurs, stockage, carte réelle avec données simulées.
4. **Tests vivants limités :** requêtes réellement acceptées, contraintes réellement prises en compte, fraîcheur/couverture ; cadence respectueuse et aucune donnée privée dans le rapport.
5. **Inspection humaine :** lisibilité du tracé et compréhension des coûts, scénario caravane, mobile réel, pertinence des recommandations.

Pour « sans autoroutes », obtenir des attributs de tronçons ou une preuve documentée du fournisseur. Une route différente sur la carte ne suffit pas à prouver l'exclusion. Pour le gabarit, prévoir des cas connus de restriction et vérifier également les limites de couverture ; ne pas faire de tests de conduite risqués.

## 26. Lots, Dépendances et Ordre de Livraison

Les jalons J0–J9 de la présentation décrivent la vision. Ils ne sont ni des jours de travail, ni une estimation de délai. Les lots ci-dessous proposent un ordre de réalisation contrôlable.

| Lot | Livrable | Dépendances | Condition de sortie |
| --- | --- | --- | --- |
| L0 · Référence | Cahier validé, décisions prioritaires, registre exigences/tests. | Présentation et retours utilisateur. | Périmètre L1 sans ambiguïté ; points non décidés identifiés. |
| L1a · Carte | Principal bleu, alternatives réelles, comparaison et sélection accessibles. | Contrat RouteOption. | TRA-01/08 et tests T01–T06 ; pas de régression des stations. |
| L1b · Route contrainte | Péages/autoroutes et cohérence des arrêts. | Choix fournisseur et accès, méthode de conservation de variante. | T07–T09, T11, T18–T20 sur mocks et sources réelles. |
| L1c · Caravane | Gabarit et limites explicites, accès station. | Mapping validé des profils, champs et données. | VEH-01/07 et T10 ; aucune garantie infondée. |
| L2 · Stations abouties | Urgence, distances, coûts, liste complète, favoris/profil fiables. | Route contrainte stable. | T12–T28 ; écarts connus du prototype fermés. |
| L3 · Socle multimodal | Tapis Volant voiture/marche/vélo et données communes. | Adaptateurs et couverture. | Comparaison homogène, trajets multimodaux non fictifs. |
| L4 · Empreinte | Facteurs sourcés et journal local. | Contrat des segments et politique du journal. | T32–T34 ; historique reproductible. |
| L5 · Collectif pilote | Horaires théoriques, puis temps réel. | Territoire pilote, moteur éprouvé, flux et licences. | T30–T31, TC-01/07 ; périmètre territorial annoncé. |
| L6 · Partage | Vélo partagé puis covoiturage connecté. | Accès autorisé aux fournisseurs, fraîcheur, consentements. | COV et DOU applicables ; aucun paiement implicite. |
| L7 · Boussole | Pondérations et filtres éthico-pratiques. | Données comparables et barèmes approuvés. | T35–T36 et explication de chaque classement. |
| L8 · Extensions | Recharge, hors ligne réel, intégrations navigation. | Études dédiées et décisions infrastructure. | Recettes propres ; aucune promesse déduite du cache PWA. |
| L9 · Commun | API publique éventuelle, gouvernance, modèle économique. | Besoin réel et règles de contribution/modération. | Conditions, licences, coûts et responsabilités documentés. |

Le premier cycle de développement donne priorité à la fiabilité du routage et des arrêts. Les autres modules sont intégrés par lots successifs. L'identité OùQuandQui peut être harmonisée progressivement sans retarder les corrections utiles de DragonRoute.

## 27. Registre des Arbitrages

| ID | Sujet | Proposition | Effet si non décidé |
| --- | --- | --- | --- |
| DEC-01 | Fournisseur péages/autoroutes | Évaluer ORS sur les besoins réels, sans supposer l'équivalence de tous ses services. | Bloque l'activation fiable de ces options. |
| DEC-02 | Accès public CONFIRMÉ | Aucun compte technique ni clé visiteur. Contrat serveur développé ; hébergement et activation à autoriser. | Site sur GitHub Pages ; aucune clé privée distribuée. |
| DEC-03 | France CONFIRMÉE | Premier territoire national ; couverture effective à qualifier par source, métropole et outre-mer. | Aucun engagement d’exhaustivité nationale sans preuves. |
| DEC-04 | Variantes et arrêts | Préserver la variante choisie ; annoncer et confirmer tout changement nécessaire. | Pas de sélection de variante présentée comme durable si les arrêts l'annulent. |
| DEC-05 | Urgence | Trois intentions distinctes, cible et tolérance éditables ; pas de suivi continu initial. | Référence de distance à afficher explicitement. |
| DEC-06 | Détour maximal | Valeur initiale proposée 10 km et 15 min, modifiable ; contraintes cumulatives si les deux sont actives. | Pas de seuil caché. |
| DEC-07 | Autonomie | Facultative, réserve proposée 30 km, entrées déclarées. | Pas d'indication d'atteignabilité. |
| DEC-08 | Véhicules CONFIRMÉS | Véhicule léger et poids lourd sélectionnables ; gabarit requis pour HGV. Un véhicule mémorisé, plusieurs profils ultérieurement. | Caravane non assimilée au camion ; revêtement traité séparément. |
| DEC-09 | « Optimal » | Renommer « Meilleur coût comparé » et afficher le périmètre. | Terme potentiellement trompeur à expliquer dans l'essai. |
| DEC-10 | Prix anciens | Alerte 48 h, exclusion principale 7 jours proposée. | Conserver la date, pas de label fiable sans politique. |
| DEC-11 | Covoiturage | Liens externes d'abord, annonces seulement avec raccordement autorisé. | Pas d'invention d'offres ni de réservation. |
| DEC-12 | Journal | Désactivé par défaut, ajout volontaire après trajet effectué. | Aucune collecte automatique. |
| DEC-13 | Collectif pilote | Choisir un territoire après audit de ses flux. | Pas d'intégration nationale promise immédiatement. |
| DEC-14 | Boussole | Critères numériques d'abord ; barèmes vie privée/liberté à construire séparément. | Pas de note pseudo-objective. |
| DEC-15 | Identité visible | OùQuandQui comme produit, DragonRoute comme module, URLs existantes conservées. | Éviter changement de marque sans contexte. |

Il n'est pas nécessaire de résoudre les quinze décisions pour corriger la carte. En revanche, DEC-01/02/04 doivent être réglées avant d'annoncer routes contraintes et alternatives fiables avec stations.

## 28. Critères d’Achèvement et Livrables

Une fonctionnalité est terminée seulement lorsque son comportement, ses erreurs, ses limites et sa preuve sont présents. Un bouton, une maquette ou un test qui ne vérifie que le chargement ne suffisent pas.

### Contenu Obligatoire de Chaque PR

- Identifiants d'exigences et décisions concernés ; périmètre inclus/exclu.
- Implémentation et éventuelle migration de données ; aucune modification étrangère au lot.
- Tests déterministes et contrôles des contraintes métier.
- Rapport lié au commit exact, aperçu identifiable et captures ordinateur/mobile.
- Preuves de données vivantes lorsque la fonctionnalité dépend d'une nouvelle capacité externe.
- Résultat des contrôles accessibilité et limites des navigateurs effectivement testés.
- Sources, dates, conditions d'utilisation et risques résiduels.
- Procédure de retour à la version précédente sans effacer les profils.
- Validation éditoriale et fonctionnelle des changements d'expérience par la responsable du produit ; les tests automatisés ne valent pas autorisation de publication.

**LIV-01 :** l'aperçu doit afficher son numéro de PR et son commit. **LIV-02 :** le rapport doit concerner exactement cette version. **LIV-03 :** une publication ne peut pas déclarer vert un rapport d'un ancien commit. **LIV-04 :** l'échec d'un test obligatoire bloque la publication concernée. **LIV-05 :** aucun original documentaire écrasé ; versions datées conservées.

### Gabarit de Ticket

```text
Titre : [ID] Verbe + résultat utilisateur
Origine : EXIGENCE / VISION / PROPOSITION validée par DEC-xx
Situation initiale :
Comportement attendu :
Entrées, unités, valeurs autorisées :
Sorties et provenance :
Contraintes et dépendances :
Erreurs et données manquantes :
Effets sur les autres écrans et données persistées :
Critères d'acceptation :
Tests / captures / requêtes vivantes :
Hors périmètre :
PR et commit livrés :
Validation du produit : en attente / validé / à corriger
```

## 29. Traçabilité des Exigences

| Source | Conservation dans ce cahier | Précision ajoutée |
| --- | --- | --- |
| Présentation §01 · Changement d'échelle | Vision et parcours, sections 02–04. | Périmètre initial distinct du produit final. |
| §02 · Cinq modules | Sections 02 et 15–19. | Responsabilités, exclusions et dépendances. |
| §03 · Tapis Volant | Sections 05 et 17. | Écrans, contraintes avant classement, données non comparables. |
| §04 · Coûts et Boussole | Sections 10 et 17. | Formules, périmètres, égalités, valeurs absentes. |
| §05 · Empreinte | Section 18. | Unités des facteurs, occupants, confirmation des trajets, historique. |
| §06 · Briques ouvertes | Sections 20–23. | Contrats internes, capacités, clés, quotas, cache et couverture. |
| §07 · Existant DragonRoute | Section 03. | Écart entre ambition et état réel de la PR 4, notamment autonomie. |
| §08 · J0–J9 | Section 26. | Lots, dépendances et conditions de sortie ; pas de calendrier fictif. |
| §09 · Règles du Je-u | Sections 14, 17, 23–24. | Tests de confidentialité, données inconnues, choix explicite. |
| §10 · Sources | Section 30. | Sources de vision distinguées des capacités vérifiées et à revalider. |
| Exigence · trajet avant arrêts | Sections 04–07. | Séquence et invalidation des étapes. |
| Exigences · stations, urgence et coûts | Sections 09–13. | Projection, accès routier, formules, badges, autonomie distincte. |
| Exigences · profil et favoris | Sections 08, 13–14. | Persistance locale, rafraîchissement, import/export et séparation des aperçus. |
| Exigences · lisibilité, alternatives et péages | Sections 07, 11, 22. | Tracé visible, sélection cohérente et décisions fournisseur. |

## 30. Sources et Journal des Versions

### Références du Produit

- **Présentation de OùQuandQui**, édition initiale du 16 septembre 2026 : vision du produit, modules et feuille de route. Consultable dans l'onglet Présentation de ce dossier.
- **Exigences routières :** calculer le trajet avant les arrêts ; proposer l'évitement des péages et des autoroutes ; prendre en compte le véhicule et le gabarit ; chercher des stations selon l'urgence ou une distance cible ; regrouper les badges ; afficher des points de station avec leurs fiches ; enregistrer adresses et favoris ; distinguer le trajet principal en bleu des alternatives en bleu clair.
- [PR 4 DragonRoute](https://github.com/Agdistys/Atlas-Conscience/pull/4), état de référence `ab129e4` ; code source et fiches `DragonRoute-Trajet-Arrets.md`, `DragonRoute-Profil-Stations.md`.

### Références Techniques · 17 septembre 2026

- [OSRM : API de routage et alternatives](https://project-osrm.org/docs/v5.24.0/api/). Une capacité de l'API n'atteste pas son activation dans chaque instance.
- [OpenRouteService : options et restrictions](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/routing-options). Source des capacités candidates ; compte, contrat, profil caravane et combinaison des opérations restent à vérifier.
- [IGN : calcul d'itinéraire](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-itineraire/) et [capacités du service](https://data.geopf.fr/navigation/getcapabilities). Options réellement examinées avant proposition d'un raccordement.
- [OpenStreetMap : politique d'utilisation des tuiles](https://operations.osmfoundation.org/policies/tiles/). Référence à vérifier lors de toute évolution de cache ou de hors ligne.
- [W3C : WCAG 2.2](https://www.w3.org/TR/WCAG22/). Référence de l'objectif d'accessibilité ; la cible de confort 44 × 44 pixels proposée ici ne doit pas être confondue avec le minimum de tous les critères AA.

### Références Complémentaires · Validation par Lot

- [Impact CO₂ : transport](https://impactco2.fr/outils/transport) et [API](https://impactco2.fr/outils/api).
- [Données horaires SNCF référencées](https://transport.data.gouv.fr/datasets/horaires-sncf) et [transport.data.gouv.fr](https://transport.data.gouv.fr/).
- [Organic Maps](https://github.com/organicmaps/organicmaps).
- [Politique du service Nominatim public](https://operations.osmfoundation.org/policies/nominatim/) : conditions d'utilisation à vérifier avant toute évolution du géocodage.
- [Flux officiel des prix des carburants](https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/information/) : source déjà utilisée par le prototype ; contrats et fraîcheur à contrôler avant extension.

Les prix, quotas, offres gratuites et droits d'utilisation des fournisseurs ne sont pas figés ici. Ils doivent être vérifiés à la date du raccordement ; aucun abonnement ou service payant n'est autorisé par ce cahier seul.

### Journal

| Version | Date | Contenu | Validation |
| --- | --- | --- | --- |
| V1 | 17 septembre 2026 | Référentiel initial : exigences, calculs, données, tests, lots et arbitrages. | Document de conception. |
| V2 | 17 septembre 2026 | Édition publique : exigences explicites, rédaction impersonnelle, intégration au dossier et harmonisation avec la Charte de Communication aMi. | Arbitrages techniques ouverts, recensés en section 27. |

**Règle de maintenance :** une nouvelle idée est ajoutée au registre et rattachée à un lot ; elle ne modifie pas silencieusement le périmètre d'une PR en cours. Une décision validée précise qui l'a validée, quand, les exigences touchées et le motif.



## 31. Accès Public, France et Véhicules

### Décisions Confirmées

**PUB-01 :** application destinée à un usage personnel et public. Préparer un trajet ne nécessite ni compte technique ni clé fournie par un visiteur. Les données personnelles du profil restent locales tant qu’aucune synchronisation consentie n’est développée.

**PUB-02 :** territoire initial : France. La couverture s’évalue par fonction et par fournisseur ; aucune carte mondiale ni réponse ponctuelle ne constitue une preuve d’exhaustivité. Les écarts métropole/outre-mer et les zones sans données doivent rester visibles.

**PUB-03 :** véhicules légers et poids lourds distincts. Une caravane ne devient pas un poids lourd par une conversion implicite. Tant que son profil n’est pas validé, le calcul est refusé explicitement plutôt que remplacé par un trajet voiture. Un utilitaire exige également un profil qualifié avant toute promesse de gabarit.

**PUB-04 :** poids lourd : cinq valeurs strictement positives exigées, hauteur, largeur et longueur totale en mètres, poids en charge et charge maximale par essieu en tonnes. Charge par essieu inférieure ou égale au poids total. Bornes techniques de la première implémentation : 6 m, 6 m, 40 m, 100 t, 30 t respectivement. Ces bornes ne sont pas des limites réglementaires ni des validations de conformité. Matières dangereuses et transport exceptionnel hors de ce lot.

**PUB-05 :** les mêmes exclusions et valeurs de gabarit sont transmises au trajet direct, aux alternatives et à chaque trajet via station. Un champ manquant, une réponse incohérente, une limitation de quota ou un accès refusé ne déclenche jamais un retour silencieux au routage voiture.

**PUB-06 :** routes non revêtues : piste de préférence à instruire, pas troisième catégorie de véhicule. Aucun filtre fictif, aucune promesse de franchissement, de droit d’accès ou d’état du chemin. Un fournisseur et des données adaptés restent nécessaires.

### Contrat d’Accès et Activation

**PUB-07 :** `POST /api/route` accepte uniquement deux ou trois points GeoJSON, les exclusions péages/autoroutes/ferries, un véhicule léger ou HGV et la demande booléenne d’alternatives. Pas d’URL amont libre ni de clé client. Le serveur reconstruit la requête vers une destination fixe et ne renvoie que géométrie, distances, durées et segments validés.

**PUB-08 :** aucun secret de routage dans le navigateur, les exports ou les rapports. Les coordonnées et le gabarit sont transmis au service puis au fournisseur ; la finalité est indiquée avant le calcul. Les historiques d’adresses ne sont pas envoyés en bloc. Politique de conservation des tiers à qualifier avant ouverture.

**PUB-09 :** GitHub reste l’hébergement du site et des aperçus. L’exécution d’un service secret ne relève pas de GitHub Pages. Le code serveur est préparé sans hébergeur imposé, compte créé ni dépense engagée. L’activation exige un choix d’infrastructure approuvé et les conditions d’usage des fournisseurs vérifiées.

**PUB-10 :** plafonds de requêtes avant ouverture, absence de dépassement payant non autorisé et surveillance des quotas. Les limites en mémoire du prototype ne constituent pas une protection financière durable : compteur partagé persistant ou plafond fournisseur dur, protections anti-abus et contrôle des redémarrages sont des préalables. CORS n’est pas une authentification.

**PUB-11 :** lorsque le service n’est pas activé, le routage léger standard demeure disponible sans exclusions. Une option avancée bloque avant géocodage avec un état explicite. Le nombre d’alternatives dépend du moteur ; absence d’alternative et indisponibilité de sa recherche sont distinguées.

### Démonstration et Évolutions

**PUB-12 : PROPOSITION COMMERCIALE.** Une période de démonstration d’un mois ou davantage, puis une éventuelle facturation, sont envisagées. Durée, prix, conversion, conditions et budget restent à décider. Aucun paiement, abonnement, expiration automatique ni promesse d’essai illimité ne sont implémentés. Les coûts d’exploitation doivent être connus avant l’ouverture, pas découverts après la démonstration.

**Condition d’hébergement commercial :** GitHub Pages ne doit pas être utilisé pour héberger un site principalement destiné à fournir un logiciel commercial en ligne. Avant une offre payante, prévoir une solution d’hébergement conforme et explicitement approuvée ; le dépôt peut rester sur GitHub. L’hébergement actuel du prototype n’est pas modifié. Source : [limites officielles de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), consultées le 18 septembre 2026.

**PUB-13 :** recharge de véhicules électriques reportée aux évolutions ultérieures ; le premier module carburant n’implique pas une couverture des bornes. Transports publics, covoiturage connecté, mobilités douces, Boussole et Empreinte restent dans le cahier global et leurs lots respectifs, sans données inventées.

### Critères de Recette Complémentaires

| Cas | Résultat attendu |
| --- | --- |
| Service public absent | Aucune clé demandée ; contraintes avancées bloquées sans appel de géocodage. |
| Poids lourd incomplet | Aucun trajet calculé ; champs requis identifiables avec leurs unités. |
| HGV avec arrêt | Cinq valeurs et exclusions identiques au calcul direct. |
| Profil ancien sans gabarit | Chargement conservé ; saisie obligatoire avant un calcul poids lourd. |
| Clé serveur factice | Jamais renvoyée, même dans une erreur, métadonnée ou redirection fournisseur. |
| Origine ou schéma non autorisé | Rejet avant appel au fournisseur ; pas de relais HTTP arbitraire. |
| Limite globale atteinte | Réponse explicite ; pas de nouvelle consommation ni repli. |
| Changement de trajet avec stations | Confirmation ; refus préserve route et résultats ; accord invalide les anciennes comparaisons. |
| Retrait d’un arrêt | Carte du trajet choisi restaurée ; état sélectionné effacé. |
| Déploiement avancé | Tests réels et conditions d’exploitation validés en plus des tests simulés. |

Édition V3 du cahier / V4 du dossier centralisé, 18 septembre 2026 : accès public, France et véhicules confirmés ; architecture sans clé visiteur, activation séparée, hypothèse commerciale et critères de recette ajoutés. Les originaux restent conservés.

## 32. Péages et Budget du Trajet

### Objet et État

**Demande :** lorsque les routes à péage sont autorisées, estimer les péages du trajet choisi et présenter un budget lisible, avec le carburant consommé sur ce trajet. Comparer, lorsque les données le permettent, un itinéraire avec péages et un itinéraire sans péage, en conservant les autres contraintes du véhicule.

**État : SPÉCIFIÉ, NON RACCORDÉ.** Aucun montant de péage n’est actuellement calculé par le prototype. Le service de routage préparé ne fournit pas de tarifs. Cette édition précise les exigences ; elle n’active ni fournisseur, ni compte, ni dépense. Rattachement : lot routier L1, en complément de CAL-03, CAL-06 et PUB-03/05. Activation soumise aux règles PUB-08/10.

### Exigences Fonctionnelles

**PEA-01 · Tarif du Trajet Sélectionné.** Estimer un aller simple pour la géométrie effectivement affichée, le sens, les entrées et sorties, le véhicule et, si nécessaire, la date et l’heure du passage. Ne pas facturer un autre trajet obtenu à partir des seuls points de départ et d’arrivée. Si le fournisseur ne permet pas de vérifier la concordance, afficher l’indisponibilité. Un aller-retour nécessite deux calculs ; aucune multiplication automatique par deux.

**PEA-02 · Trois Montants Distincts.** Afficher « Carburant estimé », « Péages estimés » et « Total estimé carburant + péages ». Le coût d’un plein acheté demeure dans la comparaison des stations ; ce n’est pas le coût du carburant consommé pendant le déplacement. Les frais de stationnement, de ferry ou autres frais ne sont pas implicitement inclus : afficher les postes exclus ou leurs montants séparément.

**PEA-03 · Comparaison Avec et Sans Péage.** Sur demande, comparer les véritables trajets calculés avec les mêmes points, véhicule et autres contraintes : durée, distance, carburant et péages. « Péages autorisés » ne signifie pas « péages obligatoires ». L’absence d’alternative ne donne lieu à aucun tracé ni prix inventé. Ne pas qualifier une route de « moins chère » lorsque des postes nécessaires à la comparaison manquent. Présenter le temps supplémentaire en minutes, sans conversion imposée en euros par heure.

**PEA-04 · Véhicule et Classe Tarifaire.** Séparer le profil de routage de la classification tarifaire. Recueillir les caractéristiques réellement requises par le fournisseur pour la voiture, l’attelage ou le poids lourd ; expliciter hauteur, masses et essieux selon son contrat. Une caravane n’hérite ni automatiquement du tarif voiture seule, ni automatiquement du tarif poids lourd. Afficher l’hypothèse de catégorie retenue ; en cas d’ambiguïté, demander la précision nécessaire ou annoncer un tarif indisponible. Ne pas afficher une classe comme certaine si elle n’est pas qualifiée.

**PEA-05 · Données Incomplètes.** Distinguer quatre états : « Sans péage confirmé », « Estimation disponible », « Estimation partielle » et « Tarif indisponible ». Une liste vide, une erreur, une absence de couverture ou une option d’évitement cochée ne suffisent pas à justifier 0 €. Une estimation partielle présente le sous-total connu et les tronçons manquants ; aucun total global complet n’est affiché. Une panne tarifaire ne masque pas le trajet valide : sa carte et son coût carburant peuvent rester visibles avec l’état incomplet.

**PEA-06 · Actualisation Cohérente.** Toute modification de trajet, alternative, arrêt, véhicule, paramètre tarifaire ou date pertinente invalide immédiatement l’ancien tarif et relance le calcul approprié. Une réponse tardive d’une ancienne recherche ne peut pas remplacer la nouvelle. Après ajout d’une station, recalculer les péages sur tout le trajet modifié : ne pas additionner aveuglément des devis de tronçons qui recouvrent le même paiement.

**PEA-07 · Source et Hypothèses.** Associer au devis le fournisseur, la date de récupération, la date de validité si disponible, la devise EUR, les caractéristiques retenues et la couverture. Préciser « estimation », sans promesse de prix garanti. Ne pas supposer de réduction par abonnement ou télépéage ; sélectionner un tarif ordinaire compatible avec le moyen de paiement retenu. Des tarifs alternatifs sont des choix, pas des montants à additionner.

**PEA-08 · Interface Sans Lecture Obligatoire des Avertissements.** Rendre les options indisponibles identifiables et non activables avant la recherche, avec un motif court visible à proximité. Distinguer « En cours », « Indisponible » et « Sans péage » au niveau du montant lui-même. Les précisions détaillées peuvent être dépliables ; l’état essentiel ne doit pas être caché dans un paragraphe ou un diagnostic technique. Ne pas ajouter un calculateur factice pour représenter une fonctionnalité future.

### Contrat de Calcul

**PEA-09 · Formules et Arrondis.** Pour une consommation moyenne déclarée constante : `carburant_estime = distance_km × consommation_L_100km / 100 × prix_reference_EUR_L`. La distance est celle du trajet retenu, détours compris. Le prix de référence et sa date sont affichés ; la consommation peut différer selon le véhicule, la charge et les conditions. Aucun péage moyen au kilomètre n’est utilisé comme substitut à un tarif documenté.

`peages_estimes = somme des paiements distincts applicables à ce trajet`, après sélection d’un seul tarif applicable par paiement. `total_carburant_peages = carburant_estime + peages_estimes`, uniquement si les deux composantes sont disponibles et la couverture tarifaire complète. Calculer avec la précision source, puis arrondir l’affichage final au centime. Les variations de péage induites par une station alimentent `deltaFrais` de CAL-03 uniquement si les deux devis sont comparables et complets. Les différences, y compris négatives, restent expliquées ; aucun double comptage du détour ou du plein.

**PEA-10 · Réponse Normalisée à Développer.** Prévoir un résultat attaché à l’identifiant et à la révision du trajet : `status` (`no_tolls`, `estimated`, `partial`, `unavailable`), `amountEur` (nombre non négatif ou `null`), `knownSubtotalEur` pour un résultat partiel, `provider`, `fetchedAt`, `tariffValidAt` si connu, hypothèses du véhicule et du paiement, éléments tarifaires et avertissements. Pour un résultat partiel ou indisponible, `amountEur = null` ; seul un résultat `no_tolls` dûment confirmé autorise zéro comme absence de péage. Les notices de couverture et de tarif ne sont jamais ignorées. Ce contrat est une extension future, absente de l’actuel service PUB-07.

### Données et Conditions de Raccordement

HERE Routing documente une réponse tarifaire par section, des variations selon les caractéristiques du véhicule ou le paiement et une estimation sans garantie d’exactitude exhaustive. La requête tarifaire compte comme transaction supplémentaire. Il s’agit d’un **candidat à évaluer**, pas d’un fournisseur choisi ou activé. Source : [documentation officielle HERE sur les péages](https://docs.here.com/routing/docs/routing-v8-tolls-for-route), consultée le 18 septembre 2026.

Avant raccordement : vérifier couverture France, prise en charge tarifaire réelle des caravanes, correspondance au trajet choisi, fraîcheur, cas sans péage, licences d’affichage, coûts, quotas et protection des données. Valider des exemples contre les tarifs des exploitants concernés. Une capacité d’évitement des péages ne prouve pas une capacité à en calculer le prix. Les offres commerciales ne sont pas figées dans ce document.

### Critères de Recette

| Cas | Résultat attendu |
| --- | --- |
| Route payante, devis complet | Carburant, péages et total séparés ; source et hypothèses accessibles. |
| Route sans péage confirmée | Péages à 0 €, sans déduire ce résultat de la seule case d’évitement. |
| Tronçon sans tarif ou fournisseur en erreur | État partiel ou indisponible, jamais 0 € par défaut ; pas de total trompeur. |
| Voiture seule puis caravane | Hypothèses tarifaires réévaluées ; pas de réutilisation du prix voiture seule. |
| Deux tarifs pour un même paiement | Un seul tarif applicable retenu ; aucune addition des alternatives. |
| Arrêt à une station, entrée ou sortie modifiée | Nouveau devis du trajet complet ; absence de péage compté deux fois. |
| Changement de trajet pendant une requête | Ancien montant retiré ; réponse obsolète ignorée. |
| Plein supérieur à la consommation du trajet | Total fondé sur le carburant consommé estimé, sans addition du plein acheté. |
| Trajets avec et sans péage | Comparaison réelle en euros et minutes ; postes inconnus identifiables. |
| Retour ou détour asymétrique | Calcul propre au nouveau sens et parcours ; pas de tarif simplement multiplié. |
| Montant négatif, devise inattendue, notice de couverture | Réponse rejetée ou déclarée incomplète selon le contrat ; aucun total silencieux. |
| Service non activé | Aucun tarif promis ; disponibilité visible sans consulter les avertissements détaillés. |

### Confort Routier et Caravane

Le besoin de confort consiste à privilégier les axes principaux et à éviter les routes étroites ou non revêtues, lorsque le moteur et les données le permettent. Il reste distinct du véhicule déclaré et de sa classe de péage. Le mode poids lourd ne constitue pas une garantie de largeur, d’état de chaussée ou de sécurité pour une caravane. Les préférences de confort restent **à qualifier**, sans approximation silencieuse par le seul profil poids lourd ; les limitations et la signalisation réelles demeurent déterminantes.

Édition V4 du cahier / V5 du dossier centralisé, 18 septembre 2026 : estimation des péages, budget carburant + péages, états incomplets, règles tarifaires de l’attelage et critères de recette ajoutés. Les versions antérieures sont conservées. Aucune activation du calcul tarifaire dans l’application à cette étape.

## 33. Lot de Préparation du Trajet

### État de Développement · 18 septembre 2026

Cette section actualise le suivi de réalisation sans retirer les exigences précédentes. Le lot prolonge la PR 5 en cours ; sa publication en aperçu dépend de la réussite des contrôles automatiques. Il ne vaut pas validation de l’ensemble du cahier des charges ni réception sur route réelle.

| Fonction | Réalisation de ce lot | Limites maintenues |
| --- | --- | --- |
| Disponibilité des options | Évitements désactivés sans service configuré ; catégories non prises en charge marquées indisponibles. Un profil caravane enregistré demeure intact et ne devient pas une voiture implicitement. | Aucun routage caravane ou calcul tarifaire ajouté. Un service configuré peut toujours échouer lors d’un appel. |
| Adresses ambiguës | Jusqu’à cinq lieux proposés, choix explicite avant calcul ; libellés complets du départ et de l’arrivée affichés après résolution. Coordonnées invalides refusées. | Résultats limités par le fournisseur, sans garantie d’exhaustivité. Pas d’autocomplétion à chaque frappe. |
| Recherche des lieux | Espacement minimal de 1,1 seconde entre appels dans la page ; cache de session borné à 30 recherches. | Ce mécanisme local n’est pas un quota partagé entre tous les visiteurs ; la montée en charge exige un fournisseur adapté. |
| Budget carburant | Volume consommé estimé sur le trajet affiché, avec son éventuel arrêt, multiplié par un prix saisi ou explicitement repris de la station choisie. | Péages affichés indisponibles, total carburant + péages incomplet. Aucun coût de plein assimilé au coût du déplacement. |
| Autonomie | Saisie facultative en kilomètres ou litres au point de départ, consommation déclarée et réserve modifiable ; heure de saisie visible. | Estimation ponctuelle, sans capteur, sans suivi GPS continu, sans garantie d’accès ou d’ouverture. |
| Portée des stations | Comparaison avec la distance routière d’accès ; filtre facultatif dans la portée utile. Les stations hors portée restent explicitement identifiées quand le filtre est retiré. | Filtre limité aux stations effectivement comparées ; aucune affirmation d’atteignabilité. |
| Résultats | Sélection habituelle ou liste de toutes les stations comparées, triées par distance routière ; points de carte et fiches conservés. | Maximum de candidates du moteur inchangé ; pas de promesse de recensement exhaustif. |
| Arrêt et recalcul | Distance et durée principales suivent le trajet affiché ; changement significatif après recalcul soumis à confirmation ; retrait restaure la référence. | Le moteur peut proposer d’autres routes autour de l’arrêt ; conservation géométrique stricte hors détour non certifiée. |

### Règles Complémentaires

- **Autonomie :** un changement d’unité efface la quantité afin de ne jamais interpréter des kilomètres comme des litres. Un changement de départ efface l’estimation. La réserve initiale de 30 km est un paramètre modifiable, pas une recommandation mécanique personnalisée. Une quantité absente ou invalide est inconnue ; zéro saisi explicitement reste zéro. L’autonomie n’est pas mémorisée dans le profil.
- **Portée utile :** `max(0, autonomie_theorique − reserve_km)`. L’accès à la station est comparé en distance routière, pas en projection sur la carte. La sélection d’une station au-delà de cette portée demande confirmation, sans langage rassurant sur la possibilité de l’atteindre.
- **Prix de référence :** aucune moyenne automatique. Un changement de carburant efface le prix ; un prix repris d’un arrêt est invalidé si cet arrêt est retiré ou remplacé. Le montant d’achat reste distinct, libellé « achat + carburant du détour », hors péages et autres frais.
- **Recalcul d’arrêt :** différence supérieure à 100 m ou 60 s par rapport à la comparaison : confirmation du nouveau trajet avant remplacement. Ces seuils relèvent de l’interface, pas d’une précision garantie du fournisseur. Le refus conserve le précédent trajet affiché et ses coûts.
- **Choix d’adresse :** aucune présélection entre plusieurs résultats. Annulation au bouton ou à Échap, sans lancer le routage. Le cache des résultats ne supprime pas l’étape de choix lorsqu’un texte demeure ambigu.
- **Position imprécise :** au-delà de 200 m d’incertitude annoncée, confirmation avant usage du point ; la saisie manuelle reste disponible.

### Recette et Traçabilité

Les scénarios automatisés du lot couvrent GEO-02/03/07/08, CAL-06, AUT-01 à AUT-06, ARR-04/05 et les parties réalisables de PEA-02/05/06/08/09. Ils vérifient notamment les deux choix de lieu successifs, l’annulation, les libellés hostiles, la réserve, le changement d’unité, le dépassement de portée, le prix d’un arrêt retiré et l’absence de tarif de péage. Tests de l’interface sur quatre formats Chromium ; ces tests ne constituent pas une validation de terrain ni une qualification de Safari.

Références consultées le 18 septembre 2026 : [API Search de Nominatim](https://nominatim.org/release-docs/latest/api/Search/) pour la limite de résultats et les détails d’adresse ; [politique du service public Nominatim](https://operations.osmfoundation.org/policies/nominatim/) pour les limites d’usage. L’ouverture à un public important reste conditionnée à une architecture conforme aux politiques des sources.

### Prochains Raccordements

Routage avec évitements et gabarits, tarification des péages, confort routier de l’attelage, transports publics et covoiturage connecté restent à qualifier ou raccorder. Budget, infrastructure, licences et protections des quotas demeurent des décisions d’activation distinctes. Aucun service payant, compte, abonnement ou hébergement supplémentaire n’est engagé par ce lot.

Édition V5 du cahier / V6 du dossier centralisé, 18 septembre 2026 : suivi des développements de préparation du trajet, limites et critères de recette ajoutés. Présentation, spécifications précédentes et originaux conservés.

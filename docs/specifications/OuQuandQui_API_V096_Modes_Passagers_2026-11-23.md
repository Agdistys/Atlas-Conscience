# V096 — Comparer les modes pour la portion des passagers

23 novembre 2026 · ARR-MULTI-09. Exigences ARR-06, COV-01, COV-04, BOU-02, BOU-03 et BOU-07 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Complète les [modes avec arrêts V095](OuQuandQui_API_V095_Modes_Arrets_2026-11-23.md), les horaires V092, le partage V093 et les budgets V083/V084. Les éditions et formats précédents restent conservés.

## Portion et voyageurs

Depuis un parcours adopté comprenant une prise en charge et une dépose, « Comparer les autres modes » propose une action explicite « Comparer la portion des passagers ». Le scénario commence à la prise en charge et finit à la dépose. Le trajet du conducteur avant et après cette portion est exclu, ainsi que les accès des passagers avant la prise en charge et après la dépose. Il ne constitue donc pas encore une comparaison porte à porte.

Le groupe reste vide jusqu’à déclaration de un à huit passagers, conducteur exclu. Une confirmation indique que les mêmes passagers sont prévus au point de prise en charge à l’heure affichée et que les stations intermédiaires servent seulement au ravitaillement. La présence, la synchronisation réelle, la capacité du véhicule et la réalisation du rendez-vous ne sont pas attestées. Aucun effectif ni consentement n’est repris du partage des frais conservé.

L’ouverture ne consulte aucun fournisseur. Un parcours historique doit être recalculé puis adopté ; une simple lecture ne devient pas une préparation actuelle. La comparaison sans rencontres de V095 reste disponible dans son périmètre initial.

## Départ commun et temps propres

Le départ commun est l’arrivée estimée du véhicule à la prise en charge. Il résulte du départ déclaré du conducteur, des durées des portions antérieures et de leurs pauses connues. Une pause inconnue avant la prise en charge empêche de situer cet instant ; aucune requête de comparaison n’est alors envoyée. Un départ manquant demande de revoir les horaires et d’adopter à nouveau le parcours.

L’instant exact est conservé, secondes et fractions de seconde comprises. Le champ local affiché en lecture seule ne remplace pas cette valeur. Un passage par l’heure répétée d’automne garde l’instant calculé depuis le départ initial non ambigu ; l’affichage d’une minute répétée ne provoque ni décalage ni nouveau choix implicite d’heure.

Deux durées propres au scénario restent à renseigner : attente et embarquement à la prise en charge ; dépose et sortie à l’arrivée. Chaque champ accepte de zéro à 1 440 minutes, y compris une fraction. Un champ vide ou ne contenant que des espaces reste inconnu ; zéro doit être explicite. Ces durées restent des hypothèses de comparaison, sans modification des horaires adoptés du conducteur.

La distance automobile est la somme des portions entre les deux rencontres. La durée est la conduite sur cette portion, augmentée des seules pauses carburant intermédiaires, de l’attente et embarquement, et de la dépose et sortie. Une durée absente rend le total automobile indisponible, tout en laissant visibles les distances et durées connues. Une pause inconnue après la dépose n’invalide pas cette portion déjà connue. Les accès et autres temps exclus sont indiqués.

## Marche, vélo et contraintes

La marche IGN et le vélo mécanique FOSSGIS facultatif relient uniquement les deux lieux de rencontre, à partir du même instant. Les requêtes contiennent les coordonnées nécessaires, sans liste des stations ni effectifs, coûts ou horaires ajoutés. Aucun moteur automobile n’est relancé ; le parcours adopté reste intact.

Les stations ne sont pas des lieux à visiter dans les autres modes. Si elles constituent des destinations, cette comparaison ne représente pas le même besoin. Les limitations des moteurs, de leurs données et de l’allure du groupe restent applicables. Aucune géométrie automobile partielle n’est inventée à partir du tracé global : la comparaison conserve les métriques de portion, tandis que la carte adoptée conserve le parcours complet.

Les limites de marche ou vélo, l’heure d’arrivée impérative, les dates passées, l’horloge incohérente et les données manquantes sont examinées avant les indices. Une durée automobile inconnue ne permet pas de classer la voiture sur sa seule conduite. Annuler, fermer ou modifier les temps ou le groupe retire les résultats précédents ; les réponses tardives et les quotas ne déclenchent pas de reprise automatique ni de recalcul automobile.

## Budgets et empreintes

Les cinq postes du budget commun restent à renseigner pour les seuls passagers comparés. Les frais du parcours complet, les achats aux stations, les péages d’un autre tracé et les affectations du partage ne sont pas recopiés. Les outils de reprise des tarifs du trajet de référence restent indisponibles pour cette portion différente. Une déclaration manuelle de coût reste possible ; une somme partielle ne devient pas un budget complet.

L’estimation facultative du carburant consommé emploie la distance automobile de la portion, la consommation, le prix déclaré et la fraction passagers comparés / occupants du véhicule. Les occupants doivent compter au moins ces passagers et le conducteur, qui est hors du groupe comparé. Un effectif d’occupants égal au nombre de passagers est refusé pour cette allocation. L’effectif maximal reste celui admis par les modèles existants ; aucune capacité physique n’est déduite.

La même règle d’occupation s’applique au modèle prospectif d’empreinte automobile dans les deux comparateurs. Les montants et facteurs restent déclarés ou sourcés selon leur origine ; une recette utilisant des coûts fictifs ne les transforme pas en tarifs constatés. La marche et le vélo conservent leurs périmètres de modèle propres. Les valeurs brutes, contraintes, tri financier et indices restent distincts.

## Conservation et retour

La conservation volontaire utilise le dispositif V079 et les budgets routiers de V083/V084. Le souvenir garde le groupe, l’instant exact, les lieux, la distance de portion, les valeurs comparées, les postes, les étapes et les hypothèses d’attente et de sortie. La durée des indices conserve l’arrondi supérieur en minutes du contrat V078 ; les métriques et l’instant de calcul gardent leur précision. La comparaison ne constitue pas un trajet réalisé.

Aucun nouveau format de profil, de parcours ou de comparaison n’est introduit. Les anciennes copies restent lisibles, sans migration à leur ouverture. Les contrôles de liaison au parcours, aux champs et à la consultation précèdent calcul, budgets, indices et sauvegarde. Une modification silencieuse ne contourne pas ces contrôles.

Fermer restitue les champs du comparateur de référence. Le parcours adopté, son tracé, ses horaires, achats, frais partagés, informations de stations, exports et journal restent inchangés. Aucun remplacement de trajet ni enregistrement de journal n’est implicite.

## Critères d’Achèvement

Vérifier les bornes de la portion, les seuls kilomètres et pauses inclus, les inconnus avant, pendant et après le trajet des passagers, les zéros explicites et les fractions. Contrôler l’heure répétée d’automne, les secondes exactes, le groupe et l’absence de conducteur dans ce groupe.

Tester les budgets et empreintes avec occupation incohérente, l’absence de frais hérités, la séparation des appels et les seules coordonnées transmises. Vérifier changements silencieux, délais, quotas, annulation, contraintes impératives, sauvegarde puis relecture, retour intact, clavier, texte agrandi, petit écran et carte indisponible.

L’inspection complète et l’aperçu doivent correspondre au même commit. Distinguer réponses simulées, parcours réellement consultés et coûts de démonstration. Ce lot ne qualifie ni rendez-vous réel, ni déplacement physique, état du terrain, guidage natif ou routage poids lourd/caravane. Aucun nouveau compte, fournisseur, paiement, hébergement ou fusion.

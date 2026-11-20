# V058 — Corriger les saisies du trajet

TRA-VALIDATION-01 · 20 novembre 2026. Complète GEO-01, UX-07, ERR-06 et QUA-01 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), les [horaires V016](OuQuandQui_API_V016_Horaires_2026-11-18.md), les [véhicules V020](OuQuandQui_API_V020_Vehicules_Memorises_2026-11-18.md), les [critères V021](OuQuandQui_API_V021_Criteres_Routiers_2026-11-18.md), les [limites de marche V042](OuQuandQui_API_V042_Limites_Marche_2026-11-19.md) et l’[annulation V057](OuQuandQui_API_V057_Annulation_Trajet_2026-11-20.md). Éditions précédentes conservées.

## Recherche et correction

Le calcul principal contrôle les saisies applicables avant toute demande de géocodage ou de routage. Un départ ou une arrivée vide, y compris une saisie composée d’espaces, produit une erreur liée à ce champ. Le texte saisi reste disponible pour correction. Une nouvelle recherche explicite retire les anciens résultats ; une erreur ne laisse pas un ancien trajet présenté comme résultat courant.

Le résumé « À corriger avant le calcul » rassemble les erreurs présentes. Chaque bouton conduit au champ concerné, y compris au clavier, et ouvre sa rubrique si elle était repliée. Le premier champ erroné reçoit le focus lors de la tentative de recherche. Chaque message est également affiché près du champ et associé à sa description accessible ; les indications déjà présentes restent conservées. La couleur n’est pas le seul signal.

Après une première tentative, les corrections actualisent les messages sans requête et sans déplacer le focus pendant la saisie. Un changement de mode retire les erreurs des paramètres devenus non applicables, en conservant leurs valeurs. Une reprise de préparation ou d’adresse mémorisée réévalue le formulaire. Le bouton de recherche reste nécessaire après correction ; aucun calcul ou enregistrement automatique n’est ajouté.

## Valeurs et contraintes

- Marche : bornes existantes de 0 à 500 km. Une préférence vide reste permise ; une limite impérative exige une distance. Zéro est une distance explicitement choisie, distincte du vide. Un nombre incomplet est refusé.
- Critère routier : durée ou distance explicitement choisie. Une ancienne préparation sans critère ne devient pas silencieusement « plus rapide ».
- Poids lourd : lorsque son service est configuré, les cinq dimensions et charges sont contrôlées séparément. Valeurs finies strictement positives, maxima techniques inchangés : hauteur et largeur 6 m, longueur 40 m, poids en charge 100 t, charge par essieu 30 t. La charge par essieu ne peut dépasser le poids en charge. Ces bornes ne constituent ni une autorisation de circulation ni une qualification du véhicule.
- Paramètres indisponibles : aucun véhicule, exclusion ou moteur de remplacement implicite. Une exclusion indisponible restaurée reste cochée ; l’action explicite pour la retirer est désignée. Les services publics avancés restent soumis à leur activation distincte.
- Horaires : années 2000–2099 et heure de Paris, calendrier et changements d’heure contrôlés selon V016. Heure inexistante ou ambiguë refusée. Une limite antérieure au départ est refusée, l’égalité est permise. Le filtre horaire exige une heure limite.
- Un départ ou une limite volontairement effacé reste inconnu. Le départ vide n’est plus présenté comme une erreur de saisie ; il ne devient jamais l’heure actuelle. Une limite sans départ reste permise, avec compatibilité temporelle inconnue. Une date partiellement saisie signalée comme telle par le navigateur doit être complétée ou effacée.

Les contrôles ne changent ni les seuils des modèles, ni les calculs des moteurs, ni les formats de profil et de préparation. Les paramètres de recherche des stations et les autres formulaires gardent leurs validations propres.

## Absence de lieu et panne du service

Une réponse de géocodage valide sans aucun lieu ramène au départ ou à l’arrivée concerné et invite à préciser la commune ou le code postal. Une nouvelle tentative reste volontaire, y compris avec la même saisie. Les commandes sont rendues disponibles avant le retour du focus.

Une panne, un quota, un délai dépassé ou une réponse illisible ne désigne pas automatiquement l’adresse comme erronée. Ces situations conservent leurs messages de service et leur diagnostic. L’annulation et les réponses tardives gardent les protections de V057.

## Vérifications et portée

Les scénarios couvrent lieux vides, accès clavier, rubriques repliées, descriptions conservées, correction sans réseau, valeurs vides ou nulles, marche, gabarit simulé, horaires et changements d’heure, options restaurées indisponibles, absence de lieu, panne et reprise d’une préparation. Les régressions portent aussi sur profils/imports, horaires, marche et annulation.

Les résultats exécutés, captures et contrôles de la version publiée sont consignés dans `quality/route-validation` et l’état de développement. Les tests simulés, la recette avec des lieux publics et les contrôles automatiques d’accessibilité restent distincts. Aucun téléphone physique ni déplacement attesté. Aucun nouveau fournisseur, compte, coût, hébergement, format de stockage ou droit d’accès introduit.

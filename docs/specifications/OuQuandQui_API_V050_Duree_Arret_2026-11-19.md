# OùQuandQui — Temps prévu à la station

V050 · 19 novembre 2026 · CAL-DUREE-ARRET-01. Complément de CAL-05, ARR-01/04/05 et TRA-05 du [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), des [horaires V016](OuQuandQui_API_V016_Horaires_2026-11-18.md) et de la [navigation V003](OuQuandQui_API_V003_Navigation_2026-11-17.md). Les éditions précédentes restent conservées.

## Saisie et portée

Le panneau Stations propose « Temps prévu à la station (min, facultatif) ». Le champ est vide au départ. Il accepte une valeur finie de 0 à 1 440 minutes, décimales comprises. Cette borne de saisie n’est pas une recommandation de durée. La personne peut prévoir le plein et l’attente sur place ; aucune attente, vitesse de pompe ou durée standard n’est déduite du carburant ou de la quantité achetée.

| Situation | Traitement |
|---|---|
| Champ vide | Durée inconnue, conservée comme `null` |
| Zéro saisi | Pause explicitement nulle, distincte d’un champ vide |
| Valeur valide | Hypothèse personnelle, jamais une mesure ou une annonce de la station |
| Valeur invalide | Erreur près du champ ; adoption d’une station et sauvegarde routière refusées, sans supprimer le trajet existant |
| Aucun arrêt adopté | Préférence conservée en session, sans ajout à l’itinéraire |

Cette version concerne l’unique arrêt carburant adopté. Les autres pauses, l’embarquement des passagers, le trafic en direct et les conditions réelles d’accès ne sont pas estimés. L’arrivée à la station précède la pause : son horaire d’arrivée et le contrôle de ses horaires habituels ne sont pas décalés par cette durée.

## Calcul et présentation

La durée routière reste celle de la réponse du moteur pour le trajet choisi, éventuellement recalculé via la station. Elle n’est jamais remplacée par une durée comprenant la pause. Géométrie, distance, détour, prix, litres consommés estimés et répartition des frais restent indépendants de la pause.

Avec un arrêt adopté et une pause connue :

`durée conduite + pause (secondes) = durée routière (secondes) + pause déclarée (minutes) × 60`

`arrivée estimée = départ (instant UTC) + durée conduite + pause`

Les calculs et comparaisons à l’heure limite utilisent les valeurs non arrondies. L’égalité exacte avec la limite reste compatible selon cette estimation. Les minutes du détail sont affichées à une décimale ; l’indicateur principal demeure une durée de déplacement arrondie à la minute. Aucune heure d’arrivée n’est garantie.

Avec un arrêt adopté mais une pause inconnue, le repère horaire hors temps du plein reste consultable. L’arrivée avec pause et la compatibilité avec l’heure limite sont indiquées comme inconnues. Effacer une valeur ne revient donc pas à promettre une arrivée plus tôt. Une pause invalide affiche un état distinct, à corriger.

Changer la durée réévalue localement le récapitulatif, le budget descriptif et l’horaire sans appel au moteur, sans recherche de stations et sans réécriture du profil. Remplacer la station utilise la même durée une seule fois. Retirer l’arrêt ou changer de variante retire la pause de l’estimation ; la préférence demeure disponible pour une prochaine adoption. Les trajets de la comparaison entre modes restent des allers simples sans arrêt : ils n’héritent pas de la pause du trajet affiché.

## Navigation et covoiturage

La fenêtre de navigation et la description du GPX séparent conduite, pause déclarée et leur somme. Le fichier conserve la géométrie préparée ; il ne crée aucune heure de passage aux points. Les liens vers les services externes ne transmettent pas la durée de pause.

Le récapitulatif local du conducteur ajoute le détail de la pause du trajet complet. Une modification de cette hypothèse retire le récapitulatif précédent et demande une nouvelle préparation avant copie. Il ne répartit pas les minutes entre portions de covoiturage et ne déduit aucune ponctualité de prise en charge ou de dépose.

## Préparations au format 10

Les préparations routières ajoutent `preferences.stopMinutes`, nombre fini dans les bornes ou `null`. Le champ est requis au format 10. Les préparations piétonnes restent sans préférence carburant. Le champ historique `snapshot.durationSeconds` garde exclusivement la durée de déplacement du moteur ; le temps comprenant la pause est dérivé lors de la consultation. Une préférence sans station reste mémorisée et explicitement non appliquée.

- Nouvelle clé `dragonroute.prepared.v10.<environnement>` ; lecture prioritaire du format 10, puis des formats 9 à 1. Une copie actuelle vide ou invalide n’est pas contournée par une copie plus ancienne.
- Les formats 1–9 migrent uniquement en mémoire avec une pause inconnue, même s’ils contiennent un champ étranger portant ce nom. Aucune ancienne valeur n’est promue en durée déclarée.
- L’écriture ne suit qu’une action explicite. Les neuf anciennes copies restent intactes. L’original format 9 peut être téléchargé exactement, y compris sa mise en forme.
- Les dix copies sont contrôlées avant écriture ou effacement : une divergence détectée dans un autre onglet bloque l’action, sans fusion implicite. Ce mécanisme n’est pas une transaction atomique entre onglets.
- La reprise recharge la durée souhaitée mais exige un nouveau calcul et une nouvelle adoption de la station. Le résultat historique reste inchangé ; il ne vaut pas trajet actuel.
- Limites de 20 préparations et 2 Mo, import avec confirmation, stockage local et séparation public/aperçus inchangés. Aucune synchronisation ou nouvelle collecte automatique.

## Vérifications

Treize contrôles nouveaux portent sur les bornes, les types, les inconnus, le zéro, l’addition sans arrondi, la frontière horaire, minuit et changement d’heure, la migration de neuf formats, les doublons et la préservation des durées routières.

Dix-huit scénarios navigateur vérifient la saisie et le clavier, l’adoption, la modification, le retrait, le changement de station et de variante, la limite horaire, l’absence d’appels implicites, le budget, la comparaison sans arrêt, le récapitulatif de covoiturage, le GPX, la sauvegarde/reprise, l’import et les conflits entre éditions. Les tests de régression couvrent aussi les horaires, les anciennes préparations, la marche et les choix de recherche.

L’état de développement central conserve les résultats datés, les vérifications GitHub et la recette de l’aperçu exact. Les scénarios simulés restent distincts de la consultation de services réels entre lieux publics. Aucun temps de plein mesuré, téléphone physique ou déplacement routier attesté. Aucun nouveau fournisseur, abonnement, compte ou hébergement.

# OùQuandQui — Fraîcheur des horaires V067

Date : 21 novembre 2026. Lot TC-FRAICHEUR-01. Complément aux exigences TC-01, TC-03, TC-04 et BOU-03, ainsi qu’aux [correspondances V043](OuQuandQui_API_V043_Correspondances_2026-11-19.md) et aux [réseaux V066](OuQuandQui_API_V066_Reseaux_2026-11-20.md).

## Résultat attendu

Une consultation laissée ouverte ne doit pas continuer à classer un départ théorique passé parmi les propositions actuelles. Les résultats restent consultables comme références datées, avec leurs horaires d’origine et leurs numéros. Le passage du temps ne déclenche ni nouvelle recherche ni nouvelle date, ne sélectionne aucun parcours et ne déclare aucun déplacement effectué.

Ce contrôle concerne les résultats collectifs du pilote Grenoble et leur comparaison avec les modes individuels. Il utilise l’horloge de l’appareil et les horaires déjà reçus. Il ne vérifie pas l’heure d’un serveur, les retards, l’annulation d’un service, la présence de voyageurs ou le départ réel du véhicule.

## Règles temporelles

| Situation | État et comportement |
| --- | --- |
| Heure demandée encore future, départ théorique futur | Les autres critères déterminent l’admissibilité. |
| Heure demandée dépassée | Toutes les options de cette consultation deviennent historiques, même si une option commençait plus tard. Une nouvelle heure doit être choisie explicitement. |
| Recherche pour arriver avant une heure future, mais départ théorique déjà passé | Cette option seule devient historique ; une autre option dont le départ reste futur peut rester admissible. |
| Instant exactement égal au départ ou à l’heure demandée | Pas encore passé ; le seuil est strictement dépassé. |
| Heure de départ absente ou invalide | L’option ne peut pas être qualifiée comme proposition actuelle. |
| Horloge invalide ou recul détecté depuis la recherche | Les propositions sont écartées comme non vérifiables. La correction de l’horloge ne les réadmet pas ; une nouvelle recherche volontaire est nécessaire. |
| Mode routier déjà indisponible | Il reste indisponible, sans horaire ni résultat inventé. |

Les comparaisons utilisent les instants numériques, sans reporter les dates au lendemain à minuit ni recalculer les heures lors d’un changement de jour. L’affichage conserve l’heure de Paris. L’instant de consultation initial reste distinct de l’instant de réévaluation. Le contrôle garde le dernier instant observé ; un recul détecté est mémorisé jusqu’à une nouvelle recherche.

Une heure demandée passée suffit à rendre le contexte historique, par prudence : la consultation ancienne n’est pas automatiquement transformée en recherche « partir maintenant ». Cette règle ne prétend pas que tous les services ont déjà quitté leur arrêt.

## Actualisation et cohérence

La vérification locale s’effectue à la réception des résultats, toutes les quinze secondes lorsque la page est visible, au retour au premier plan et avant les actions dans la fenêtre des transports collectifs. En arrière-plan, les minuteurs peuvent être suspendus par le navigateur ; le retour à la page provoque une vérification. Aucun appel à un service externe n’est ajouté par cette réévaluation.

Les fiches, le classement collectif, la carte sélectionnée, la comparaison des temps et celle des empreintes partagent le même état. Un coût, une empreinte ou un temps favorable ne réadmet pas une référence historique. Les exclusions de réseaux, limites de marche, correspondances et critères vélo restent applicables. Un mode voiture, marche ou vélo peut devenir historique avant les autres, selon son propre départ estimé.

La carte conserve l’option consultée et affiche « Référence historique » si nécessaire. Les dates, distances, durées, modèles d’empreinte, nombre de personnes et valeurs calculées restent attachés aux mêmes options. Les références sont séparées du classement admissible. L’actualisation conserve le focus de l’option consultée au clavier et les détails d’empreinte déjà ouverts. Si le détail vélo est ouvert pendant le passage au statut historique, sa fermeture retrouve le bouton de la comparaison actualisée. L’interface n’est reconstruite que lorsqu’un état temporel change.

Une réponse reçue après l’heure demandée est affichée comme historique. Une réponse reçue après annulation ou modification du contexte ne restaure pas les anciens résultats. Une modification silencieuse du contexte est vérifiée lors de la prochaine réévaluation.

## Conservation et actions volontaires

La réévaluation ne modifie ni le profil, ni les préparations, ni le journal. Enregistrer explicitement une préparation historique reste possible : son heure demandée, son instant initial de consultation et les horaires reçus sont conservés. Le format de sauvegarde reste inchangé ; le contrôle temporaire de l’horloge n’y est pas ajouté.

Le temps écoulé n’active pas le journal et ne présume aucun trajet effectué. Fermer puis rouvrir la fenêtre retire les résultats de consultation sans lancer de recherche. Une nouvelle recherche exige toujours une action et une heure recevable ; elle remet à zéro le contrôle de l’horloge pour ses propres résultats.

## Vérification et limites

Les contrôles couvrent les seuils exacts, départ et arrivée, minuit et instants de changement d’heure, données temporelles invalides, recul de l’horloge, contraintes cumulées, tris, empreintes, absence de mutation, annulation, réponse tardive, sauvegarde volontaire et navigation au clavier. Les parcours d’écran sont exécutés dans quatre dimensions de fenêtre, avec un contrôle complémentaire en paysage et texte agrandi.

Les scénarios de passage du temps utilisent une horloge de navigateur simulée. La recette publique consulte séparément des horaires réels pour des lieux publics du pilote Grenoble, puis simule l’écoulement du temps sur ces données : elle ne constitue pas un trajet réel ou une observation du départ des services. Les preuves locales, d’intégration et d’aperçu sont conservées dans `quality/transit-freshness` et dans le suivi du développement.

La fonction dépend d’une horloge locale raisonnablement correcte. Un appareil continuellement en retard peut laisser un horaire apparaître futur ; aucune synchronisation externe n’est introduite. La réévaluation périodique n’est pas une alarme et n’offre pas une garantie de départ à la seconde. Les horaires restent théoriques. Aucun téléphone physique, lecteur d’écran, service national, nouveau fournisseur, compte, coût ou hébergement n’est qualifié par ce lot.

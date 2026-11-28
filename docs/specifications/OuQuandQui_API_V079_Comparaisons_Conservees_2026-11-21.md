# V079 — Conserver une comparaison et ses hypothèses

BOU-CONSERVATION-COMPARAISONS-01 · 21 novembre 2026. Complète BOU-03/08, PRO-04 et ERR-06 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), après les priorités [routières V076](OuQuandQui_API_V076_Priorites_2026-11-21.md), [des préparations V077](OuQuandQui_API_V077_Priorites_Preparations_2026-11-21.md) et [des modes V078](OuQuandQui_API_V078_Priorites_Modes_2026-11-21.md). Les documents, formats et fonctions antérieurs sont conservés.

## Enregistrement volontaire

Chaque panneau de priorités propose « Enregistrer cette comparaison » après constitution d’un groupe figé. L’action ouvre une relecture des lieux, valeurs, poids, résultats, sources et hypothèses qui seront conservés. Un nom de 80 caractères au plus et une confirmation explicite sont requis. Le nom doit être distinct de ceux déjà chargés ; aucun remplacement silencieux. Fermer cette relecture ne crée aucune copie. Modifier le nom retire la confirmation.

La copie est indépendante du profil, des préparations et du journal. La conservation ne sélectionne aucun trajet, ne déclare aucun déplacement et ne transmet rien à un fournisseur. Elle n’active pas la mémorisation automatique des poids pour une prochaine recherche. Une sauvegarde volontaire n’est ni une réservation ni une preuve de circulation ou d’émissions mesurées.

Avant la confirmation finale, l’application relit le contexte, les poids, les modèles, les contraintes et le groupe courant. Une modification silencieuse ou l’expiration de l’admissibilité horaire interdit la sauvegarde de l’ancienne vue. Il faut fermer la relecture, actualiser le groupe puis préparer un nouvel enregistrement. Une erreur de stockage conserve le nom, la confirmation et les données en cours ; le succès n’est annoncé qu’après écriture réussie.

Une comparaison valide mais incomplète peut être conservée comme telle. Poids nuls, contexte non comparable, option exclue, valeur inconnue et coût absent restent distincts. Aucun indice n’est ajouté pour rendre le souvenir plus complet. Un résultat invalidé par un changement de contexte ne peut pas être enregistré.

## Retrouver et lire

« Mes comparaisons » est accessible depuis les trois panneaux et depuis « Mes trajets préparés ». Il ouvre une bibliothèque séparée ; les onglets et formats des préparations restent inchangés. Chaque souvenir affiche son type, son nom, sa date d’enregistrement et la date du groupe figé.

La lecture conserve les valeurs numériques effectivement utilisées, les unités et périmètres, les poids, la formule, les contributions, les bornes, les rangs et les ex æquo. Les valeurs brutes, dates, sources et hypothèses textuelles disponibles au moment de la copie restent consultables. Les modèles moyens et les allocations sont déclaratifs ; leurs périmètres ne deviennent pas identiques grâce à l’enregistrement.

Le souvenir est explicitement historique. Les données ne sont ni actualisées ni comparées aux résultats d’une nouvelle recherche. Aucun choix, tracé ou horaire actuel n’en est restauré. Les valeurs des trois comparateurs gardent leur portée : conduite routière pour le véhicule entier ; conduite + pause et budget historique carburant/péages pour les préparations ; temps avec attente/marge et empreinte du même groupe pour les modes. Un coût partiel ne devient pas total.

## Fichier et contrôle arithmétique

Format `version: 1`, collection de 20 entrées au plus, 2 Mo en UTF-8 au maximum. Une entrée est limitée à 200 ko. La clé locale est `dragonroute.comparisons.v1.<environnement>`, distincte du site public, de chaque aperçu et des autres rubriques. L’inventaire « Sources et données » indique cette présence sans lire le contenu personnel.

Chaque entrée comprend une identité stable, un nom, les dates, le type de comparateur, le groupe projeté, les poids, le résultat, le contexte et les explications conservées. La projection écarte les géométries, la configuration technique, le carnet d’adresses et les données sans rapport avec la comparaison. Les noms et lieux de la comparaison peuvent être personnels : les fichiers sont en clair et doivent être relus avant partage.

Le contrat refuse les champs inconnus, versions/formules non prises en charge, identités répétées, valeurs non finies ou négatives impossibles, périmètres incohérents, dates invalides et dépassements de limites. Aucune troncature silencieuse. Les indices, bornes, contributions et rangs sont vérifiés arithmétiquement avec la formule figée `ami-minmax-v1-proposition`, sur les seules valeurs enregistrées. Ce contrôle n’appelle pas les sources, ne met pas à jour les facteurs et n’authentifie pas les déclarations du fichier. Une version future devra être explicitement prise en charge ; aucun recalcul avec un nouveau barème n’est implicite.

## Export, restauration et suppression

Une comparaison peut être exportée en JSON pour conservation et restauration, ou en texte UTF-8 lisible. L’export global JSON conserve la collection. L’export de la copie originale chargée reste proposé même si son format est inconnu ou corrompu ; il n’en constitue pas une validation.

L’import est limité au format des comparaisons. Après lecture et validation complète, le nombre d’entrées et leur contenu sont présentés avant une confirmation distincte du remplacement. Un fichier vide annonce zéro entrée. L’annulation, une erreur ou la fermeture pendant une lecture tardive conservent la liste existante. Un import ne fusionne pas silencieusement les collections et ne modifie aucune préparation, profil ou journal. Ses dates et contenus restent déclaratifs, sans preuve d’authenticité.

Supprimer une entrée ou effacer la collection demande confirmation. L’effacement vise uniquement la clé des comparaisons de cet environnement. Une copie inconnue ou un stockage inaccessible restent protégés contre les écritures ; l’original peut être exporté lorsqu’il est lisible. Une modification concurrente est détectée avant écriture, lecture détaillée ou export de la collection ; fermer puis rouvrir charge la nouvelle version. Cette protection ne prétend pas fournir une transaction atomique entre onglets.

## Vérifications et limites

Les contrôles du modèle couvrent la fidélité numérique, les altérations de résultats, les inconnus, les contraintes, les limites, les identités, les formats futurs et l’absence de données étrangères dans la projection. Les parcours navigateur couvrent les trois origines, le consentement, les changements silencieux, les horaires passés, les écritures refusées, la concurrence, les imports tardifs, l’export/restauration, l’effacement limité et le texte HTML rendu inerte.

Les formats étroits, le clavier et le texte doublé sont contrôlés. La recette publiée conserve une comparaison obtenue sur des lieux publics dans un navigateur isolé, puis la relit et vérifie ses exports après rechargement. Les sources simulées et les réponses réelles sont distinguées dans les preuves. Les résultats GitHub, le commit, la publication et les ressources servies sont consignés dans le suivi du chantier.

Les stockages locaux restent sans synchronisation ni chiffrement applicatif. Aucun appareil physique, lecteur d’écran, déplacement ou émission observée n’est qualifié par ces essais. Les limites de couverture, de véhicules et de fournisseurs restent celles du [bilan V070](OuQuandQui_API_V070_Recette_Parcours_2026-11-21.md), complété par V071–V078. Aucun nouveau compte, fournisseur, achat, appel payant, hébergement ou fusion sur le site principal.

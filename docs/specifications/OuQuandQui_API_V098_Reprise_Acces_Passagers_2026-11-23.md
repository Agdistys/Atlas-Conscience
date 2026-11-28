# V098 — Conserver et reprendre les accès des passagers

23 novembre 2026 · COV-ACCES-02. Exigences COV-04, DOU-04, BOU-07, DAT-01 et conservation OFF-02 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Complète [V097](OuQuandQui_API_V097_Acces_Passagers_2026-11-23.md) et V079. Les éditions antérieures restent conservées.

## Conservation volontaire

Une comparaison porte à porte calculée peut être enregistrée depuis le comparateur des modes. Le formulaire annonce que les lieux et réglages réutilisables accompagnent le souvenir historique. La confirmation de conservation reste obligatoire. L’ouverture du formulaire, la lecture et la reprise ne créent aucune sauvegarde automatique.

La copie contient les saisies des deux lieux personnels, leurs libellés et coordonnées confirmés, les déclarations de même lieu, les deux rencontres de référence, le départ historique, le nombre de passagers hors conducteur, les temps d’embarquement et de sortie, les limites de marche et de vélo et l’ancienne limite d’arrivée. Les textes, durées, effectifs, coordonnées et dates sont bornés et validés. Un temps nul reste une déclaration ; un temps absent reste inconnu.

Les coordonnées historiques servent à relire le contexte. Elles ne deviennent pas des lieux actuels implicitement confirmés. Les champs laissés inutilisés derrière une déclaration de même lieu ne sont pas ajoutés à cette nouvelle structure. Les profils, adresses favorites et préparations automobiles ne sont pas réécrits.

## Reprise depuis Mes comparaisons

La lecture d’un souvenir possédant ce scénario propose « Reprendre les lieux et réglages ». Un parcours actuel avec prise en charge et dépose doit déjà être adopté. Une simple lecture d’un parcours historique ne suffit pas. L’absence de parcours, une prise en charge déjà passée, une horloge incohérente ou des pauses empêchant de situer le rendez-vous demandent de revoir les horaires et d’adopter un parcours actuel.

La reprise ouvre un nouveau formulaire porte à porte sur ce parcours. Les adresses saisies, le nombre de passagers, les durées déclarées et les limites de distance sont proposées à la vérification. Les prix, budgets, affectations de péages, modèles d’empreinte, indices et résultats du souvenir ne sont pas recopiés. Le départ personnel et la limite d’arrivée sont toujours à ressaisir, même si la date historique est encore future. Le vélo facultatif est à réactiver. Le groupe et l’autorisation de recherche sont décochés.

L’aperçu de reprise présente l’ancien départ et les rencontres du parcours courant. Si le libellé ou les coordonnées d’une rencontre ont changé, la déclaration « déjà au même point » correspondante est retirée et son champ d’adresse devient vide. L’autre extrémité reste indépendante. Une adresse personnelle explicitement saisie reste proposée, mais devra être recherchée et confirmée à nouveau. Aucun nouvel emplacement ni présence réelle n’est déduit.

Une autre portion automobile, un horaire ou des pauses différents utilisent uniquement le parcours actuellement adopté. Aucun ancien temps de conduite, rendez-vous, attente calculée ou coût n’est injecté dans ce nouveau calcul. Fermer le formulaire rend la lecture historique, sans modifier le souvenir ou le parcours du conducteur.

## Nouveau calcul et demandes aux services

Le nouveau calcul exige une date valide, les lieux ou déclarations de même point, la confirmation du groupe et celle de la recherche. Le libellé du départ indique désormais son caractère obligatoire en porte à porte. Le périmètre entre rencontres conserve son départ estimé en lecture seule ; la fermeture rend au comparateur précédent son libellé et ses propriétés.

Dans un scénario repris, l’action explicite de calcul demande à nouveau le géocodage IGN des adresses et le routage des accès et modes choisis. Les caches récents en mémoire ne dispensent pas de ces nouvelles demandes. Une déclaration de même point conservée évite uniquement la recherche de cette extrémité et le calcul d’un accès nul, selon V097. Le vélo personnel utilise le service existant seulement après réactivation volontaire.

Les délais, quotas, annulations, choix de lieux ambigus et réponses tardives gardent les protections communes. Aucun nouvel appel n’est déclenché lors de la simple reprise. Une panne ne rétablit pas les anciennes routes ou estimations. Le parcours automobile adopté ne fait l’objet d’aucun recalcul à cette occasion.

Le calcul conserve les règles V097 : attente calculée avant le rendez-vous, embarquement et sortie distincts, retard excluant la voiture, inconnus et contraintes avant classement, carburant sur les seuls kilomètres automobiles et empreinte complète inconnue lorsque les accès restent sans modèle qualifié.

## Format, export et conflits

La collection de comparaisons adopte le format 6 lors d’un enregistrement comprenant `passengerScenario`, de version interne 1. Les formats 1 à 5 restent lisibles sans migration. Les copies antérieures dépourvues de cette structure restent des souvenirs consultables et exportables ; aucun scénario n’est reconstitué depuis leur texte libre. La suppression d’une entrée ne rétrograde pas la collection.

La structure est réservée aux comparaisons de modes. Lorsqu’un budget est joint, son format, le groupe et le départ doivent correspondre au scénario. Les champs étrangers, versions futures et déclarations de même lieu avec coordonnées contradictoires sont refusés. La validation n’authentifie pas les déclarations d’un fichier importé.

Les exports JSON et TXT comprennent les lieux et réglages en clair. La confirmation d’import porte uniquement sur les comparaisons de cet environnement. Toute écriture concurrente détectée entre la lecture et la reprise arrête l’action et demande de rouvrir la collection. Un stockage inaccessible ou plein n’est pas présenté comme une sauvegarde réussie. Le nom et le formulaire restent disponibles selon le contrat V079.

Une nouvelle comparaison peut être conservée volontairement sous un autre nom ; elle ne remplace pas le souvenir source. Lire, reprendre, recalculer ou exporter ne déclare aucun déplacement effectué dans le journal.

## Critères d’Achèvement

Vérifier conservation et export des hypothèses, reprise sans appel, dates et confirmations retirées, nouveau géocodage et routage malgré les caches récents, coûts non hérités, changement de rencontre, anciennes dates et parcours devenu périmé. Tester les erreurs de source, versions futures, mélanges de formats, imports, textes HTML inertes et conflits silencieux de stockage.

Contrôler le retour au souvenir, les libellés du départ, la fermeture au clavier, les formats ordinateur/mobile, le texte agrandi et la carte indisponible. Préserver les protections d’annulation, de quotas, de budgets et les parcours précédemment qualifiés. L’inspection et l’aperçu doivent correspondre au même commit ; distinguer données simulées, requêtes réellement consultées et coûts de démonstration.

Ce lot ne rétablit pas automatiquement un parcours automobile au rechargement : il faut l’adopter selon son contrat existant avant de reprendre les accès. Il n’atteste ni présence au rendez-vous, déplacement physique, état du terrain, guidage natif ou routage poids lourd/caravane. Aucun nouveau fournisseur, compte, paiement, hébergement ou fusion.

# V047 — Confirmer un départ depuis une position ponctuelle

STA-ORIGINE-01 · 19 novembre 2026. Complète STA-01 et précise la limite de STA-08 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), en conservant la [fenêtre des stations V046](OuQuandQui_API_V046_Fenetre_Stations_2026-11-19.md). Les éditions précédentes restent disponibles.

## Proposition avant remplacement

L’action « Utiliser ma position » ouvre une demande ponctuelle au navigateur. Le départ et le trajet existants sont conservés pendant la demande et pendant l’examen de la proposition. La fenêtre affiche le départ actuel, la destination conservée, les coordonnées proposées, leur précision annoncée et la date d’observation en heure de Paris. Aucun géocodage inverse n’est ajouté.

Le navigateur gère l’autorisation de localisation. L’application utilise uniquement `getCurrentPosition`, sans `watchPosition`, avec précision élevée demandée, délai natif de quinze secondes et cache de position non sollicité (`maximumAge: 0`). Une garde locale de seize secondes évite une attente indéfinie si le navigateur ne termine pas la demande.

« Annuler », la fermeture ou Échap abandonnent la proposition et conservent le trajet, l’arrêt, les filtres et les données locales. L’application ignore les callbacks tardifs ; elle ne prétend pas interrompre le service de localisation interne du navigateur.

## Validation de la position

- Latitude et longitude numériques finies dans les bornes WGS84 ; précision numérique finie et positive ou nulle. Une valeur absente ne devient pas zéro.
- Horodatage numérique valide obligatoire. Une proposition de plus de soixante secondes est refusée à l’adoption et demande une nouvelle mesure volontaire. La fraîcheur est réévaluée pendant l’affichage et au clic de confirmation.
- Une date future de plus de cinq secondes est incohérente. La tolérance de cinq secondes absorbe un petit écart d’horloge ; elle ne constitue pas une mesure de qualité.
- Une précision annoncée supérieure à deux cents mètres demande une case d’accord supplémentaire. Ce seuil reprend la distinction antérieure et reste un choix d’interface ; il ne certifie aucune exactitude sur le terrain.

Une demande renouvelée retire la proposition précédente et réinitialise cet accord. Refus de permission, indisponibilité, délai dépassé, exception ou navigateur sans géolocalisation laissent la saisie manuelle possible. Aucune répétition automatique ni position de remplacement n’est inventée.

## Adoption et nouveau calcul

« Utiliser ce point comme départ » adopte uniquement une proposition encore valide et liée au contexte courant. L’ancien trajet calculé, ses arrêts et son budget calculé sont retirés. La destination, le véhicule et les préférences de recherche sont conservés ; l’autonomie est réinitialisée et doit être renseignée à nouveau. Le focus passe à « Trouver mon trajet ».

L’adoption ne lance aucune recherche d’adresse, aucun calcul de trajet ni recherche de stations. Les coordonnées sont transmises au moteur déjà configuré lors du calcul explicitement demandé ensuite. Les distances et la fenêtre V046 sont alors calculées depuis ce nouveau départ, et les stations doivent être recherchées à nouveau.

Le point adopté reste une origine fixe, accompagnée de sa date et de sa précision annoncée. Il n’est pas actualisé avec les déplacements de la personne. Une nouvelle position exige une nouvelle demande et une nouvelle confirmation. Modifier manuellement le départ retire la position temporaire mémorisée en session ; saisir ensuite « Ma position » ne ressuscite pas un ancien point.

## Réponses tardives et contexte

Chaque demande possède son état propre. Annulation, renouvellement, nouveau calcul, changement d’itinéraire ou modification des champs du trajet invalident la proposition. Le contexte est aussi comparé à la réception et à l’adoption pour détecter les changements silencieux. Un ancien succès ou une ancienne erreur ne remplace ni le départ ni le message d’une demande plus récente.

La demande et l’adoption n’écrivent rien dans les profils, journaux ou préparations. Le rechargement de la page perd le point temporaire. Enregistrer ensuite volontairement une préparation conserve son départ comme un point historique explicite, conformément au format 7 ; il n’est jamais repris comme une position actuelle. Aucun format de stockage n’est modifié dans ce lot.

## Vérification et limites

Contrôles de modèle : types, bornes, horodatage, fraîcheur, précision et traduction des erreurs. Parcours navigateur : attente, annulation, confirmation, faible précision, erreurs et relances, expiration, réponses tardives, changement de contexte, recalcul des accès depuis la nouvelle origine, stockage intact et préparation historique.

La recette de l’aperçu utilise une position de navigateur **simulée sur les coordonnées d’un lieu public résolu par l’IGN**, avec routage et données de stations réellement consultés. Elle ne mesure ni un GPS physique ni un déplacement de Diane. Les preuves distinguent simulation, sources réelles, inspection GitHub et relecture des vues ordinateur/mobile.

STA-08 reste partiel : repartir d’une nouvelle origine ne démontre pas le sens d’accès d’une station, son côté de route ni l’absence de retour en arrière. Les détours routiers calculés et leurs limites restent visibles ; aucun suivi permanent ou classement fondé sur une progression supposée n’est ajouté. Corridor, plafonds source, tarifs et routage spécialisé gardent leurs limites propres. Aucun nouveau fournisseur, abonnement ou hébergement.

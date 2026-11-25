# V106 — Parcours prioritaire et recette Android

NAV-GPS-04 · 25 novembre 2026. Complète le [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), le [guidage V103](OuQuandQui_API_V103_Guidage_GPS_Integre_2026-11-25.md), les [stations V104](OuQuandQui_API_V104_Stations_Pendant_Guidage_2026-11-25.md) et l’[autonomie V105](OuQuandQui_API_V105_Autonomie_Pendant_Guidage_2026-11-25.md). Les anciennes éditions restent conservées.

## Parcours de référence

La première version vise un trajet automobile préparé, un guidage intégré au premier plan, la recherche puis l’ajout confirmé d’une station, l’arrivée à cette étape, une nouvelle déclaration d’autonomie si nécessaire, la reprise volontaire et l’arrivée finale. Les fonctions de covoiturage et d’alternatives déjà livrées restent conservées ; leur enrichissement demeure différé pendant la qualification de ce parcours.

Le scénario de bout en bout conserve moteur, exclusions, ordre des étapes et préparation d’origine. Les litres restants ne sont pas les litres achetés. La déclaration après une étape reprend la portion suivante sans créer d’achat, de souvenir ou de trace GPS persistante. L’arrivée finale libère le suivi et le maintien de l’écran.

## Essai vocal avant départ

Dans « Voix et écran », « Tester la voix à l’arrêt » demande une courte phrase avec une voix française déclarée locale par le navigateur. Cette action n’active pas les annonces du trajet et ne demande aucune position ni requête routière. Si le guidage est déjà actif ou en préparation, il passe en pause ; la reprise reste volontaire. À une étape atteinte, l’essai conserve l’étape à reprendre.

Une voix distante seule, une liste de voix indisponible ou l’absence du moteur vocal rend l’essai indisponible. Aucun remplacement par un service distant. La présence d’une voix et l’événement de fin du navigateur ne prouvent pas l’audibilité : le texte demande une confirmation à l’écoute. Le volume, le haut-parleur et une éventuelle sortie Bluetooth nécessitent un essai sur l’appareil.

Une erreur audio, y compris une exception de démarrage, désactive les annonces, présente l’échec et conserve les indications visuelles. Elle ne déclenche ni nouvelle tentative automatique ni autre fournisseur. Une nouvelle tentative exige une action explicite. Les annulations décidées par l’application invalident les anciens événements ; une erreur ou une fin reçue après pause, fermeture, remplacement de la phrase ou changement de session ne modifie plus l’état courant.

## Écran, permission et interruptions

Le maintien de l’écran ne peut être déclaré actif qu’après accord de l’appareil pour la session courante. Un refus tardif appartenant à une ancienne demande ne remplace pas le résultat d’une nouvelle session. La libération par l’appareil reste affichée. Réactiver l’option pendant une session active déclenche une nouvelle demande volontaire ; il n’existe pas de garantie de maintien en cas de refus système.

Le refus GPS, la pause, la fermeture, le passage en arrière-plan, les étapes et l’arrivée libèrent les ressources selon V103. Le retour au premier plan ne reprend pas automatiquement le guidage. Les positions après interruption n’effacent pas l’incertitude de l’autonomie antérieure : une déclaration actuelle reste nécessaire selon V105.

## Reprise après une station dans une boucle routière

La recette avec une réponse IGN réelle a révélé un tracé qui revient à proximité de la station environ 493 mètres plus loin. Une position identique pouvait correspondre au départ de la portion suivante ou à son retour ultérieur. Une arrivée déjà confirmée et la reprise volontaire fournissent une référence de départ pour cette portion : si la nouvelle position se trouve à 50 mètres au plus de l’étape calculée, les candidats de départ restent limités aux 100 premiers mètres de la portion suivante. L’application ne saute pas vers le retour de la boucle.

Cette référence ne peut être créée qu’à partir d’une étape intermédiaire atteinte. Elle ne lève pas une ambiguïté à un autre endroit du trajet, ne remplace pas les contrôles de précision et disparaît après la première position acceptée. La reprise directe et la nouvelle déclaration d’autonomie utilisent la même règle. Une position encore incertaine est explicitement refusée ; elle n’est plus présentée à tort comme un recul établi.

## Preuves logicielles et limites matérielles

Les scénarios de recette parcourent l’enchaînement complet avec IGN et OSRM simulés, station choisie dans l’interface, plein déclaré, reprise et arrivée. Ils contrôlent également les erreurs audio, le test sans GPS, l’absence de voix locale, les réponses tardives, les permissions, l’interruption de l’écran, le clavier et le texte agrandi. Les voix, antennes GPS et réponses du système sont simulées dans ces essais ; les scénarios ne constituent pas une certification Android.

Les premiers écarts reproduits avant correction sont conservés dans les preuves du lot : échec audio non signalé et refus de maintien d’écran tardif modifiant une nouvelle session. La recette de la version publiée vérifie séparément les fichiers exacts, les services réellement consultés et les positions simulées. Aucune preuve antérieure ne vaut automatiquement pour cette version.

## Jalon humain obligatoire

La [fiche d’essai Android](../acceptance/Recette_Android_V001_2026-11-25.md) distingue une première passe à l’arrêt et un parcours observé comme passagère. Les résultats possibles sont « observé conforme », « écart observé », « indisponible sur cet appareil » et « non testé ». Une absence de réponse ne valide aucun cas. Une simulation ne remplit aucune case matérielle.

La première passe vérifie lecture, voix locale, permission et position, maintien de l’écran et reprise après interruption. La seconde observe progression et manœuvre, arrivée à la station, actualisation volontaire, reprise et arrivée finale. Aucun trajet privé, historique GPS ou capture comportant une adresse personnelle n’est demandé dans le retour.

En attente de ces observations, l’aperçu reste une version d’essai. La première version opérationnelle sur route, la précision terrain, l’audibilité réelle, la tenue du téléphone et la consommation énergétique ne sont pas déclarées qualifiées. Écran verrouillé et arrière-plan restent hors du périmètre du guidage actif. Un résultat positif sur un appareil ne prouve pas une couverture de tous les Android, de toute la France, des caravanes ou des poids lourds.

## Sources techniques

Consultées le 25 novembre 2026 : [événement d’erreur de synthèse vocale](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/error_event), [motifs d’erreur audio](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisErrorEvent/error), [caractère local d’une voix](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService), [maintien de l’écran et libération par le système](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).

## Suite

La recette logicielle et la préparation de l’essai sont livrables après inspection et publication vérifiées. La validation physique reste ouverte jusqu’au retour humain. Suspendre l’enchaînement autonome à ce jalon ; reprendre par la correction des écarts observés, puis qualifier le parcours prioritaire avant d’élargir les alternatives. Aucun nouveau fournisseur, compte, achat, abonnement, hébergement ou fusion n’est autorisé par ce lot.

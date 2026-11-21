# V080 — Délais des services carburants et transports

FIO-QUOTAS-SERVICES-01 · 21 novembre 2026. Complète ERR-02/04/05, DAT-03 et QUA-10 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), la [collecte des stations V045](OuQuandQui_API_V045_Stations_Suivantes_2026-11-19.md), les [informations réseau V028](OuQuandQui_API_V028_Infos_Reseau_2026-11-18.md) et la [gestion routière des interruptions V057](OuQuandQui_API_V057_Annulation_Trajet_2026-11-20.md). Les éditions et capacités antérieures restent conservées.

## Résultat attendu

Lorsqu’une source signale une limite de requêtes, les actions qui sollicitent cette même source doivent attendre le délai communiqué. Cliquer à nouveau pendant l’attente affiche le temps restant sans envoyer une nouvelle demande. L’expiration ne provoque aucun appel : la reprise exige une action volontaire.

La retenue concerne deux familles déjà raccordées : carburants officiels, y compris les fiches favorites ; calcul d’itinéraires collectifs et informations du réseau Mobilités M. Chaque famille partage son attente dans la page. Une limite carburants ne bloque pas le calcul collectif, et une limite collective ne bloque pas les comparaisons routières indépendantes. Les protections existantes du géocodage, des moteurs routiers et du vélo sont conservées.

## Délais et erreurs

Le champ HTTP `Retry-After` peut indiquer un nombre entier de secondes ou une date HTTP ; sa signification est définie par la [RFC 9110, section 10.2.3](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after). L’application traite la réponse 429 comme une limite de service. Une réponse 503 munie de cet en-tête entraîne aussi une attente, nommée comme indisponibilité temporaire, sans être assimilée à un quota.

Les valeurs en secondes et les dates HTTP reconnues déterminent le délai. Si la date `Date` du serveur est également lisible, l’écart entre les deux dates reçues est utilisé pour éviter de dépendre du décalage de l’horloge locale. Sinon la date de réception selon l’appareil sert de référence. Les formes HTTP historiques sont acceptées lorsqu’elles sont cohérentes ; une date civile impossible ou un jour de semaine contradictoire est refusé.

La retenue minimale locale est de cinq secondes. En l’absence de délai lisible ou valide, une réponse 429 applique un repli local de soixante secondes, annoncé comme tel. Un en-tête non exposé par la politique interorigine du fournisseur est indistinguable d’un en-tête absent dans le navigateur. Aucun délai arbitraire n’est présenté comme une consigne du serveur.

Une réponse 503 sans cet en-tête, une autre erreur HTTP, une panne réseau, une expiration de requête et une absence de résultat restent distinctes. Un très grand entier valide ne devient pas une attente courte par dépassement numérique : la retenue demeure, avec un message indiquant que le délai ne peut pas être affiché normalement.

Après réception, l’attente utilise le temps monotone de la page : avancer ou reculer l’heure civile ne la raccourcit pas. Une nouvelle réponse ne raccourcit jamais une retenue déjà plus longue. Le délai restant est recalculé à chaque action ; le message n’est pas un compte à rebours animé. Les limites ne sont ni persistées ni synchronisées entre onglets, appareils ou visiteurs. Fermer ou recharger la page réinitialise cet état local : il ne constitue pas un contrôle global de quota ou de facturation.

## Carburants : collecte partielle et fiches

La collecte existante lance au plus quatre points simultanément. Dès qu’une réponse impose l’attente, aucun groupe supplémentaire n’est lancé. Les autres demandes du groupe déjà parti peuvent terminer : leurs réponses valides restent utilisables. Les points en échec, points non demandés et réponses plafonnées sont comptés séparément. L’état des carburants signale la collecte partielle.

Les stations déjà reçues peuvent encore faire l’objet de calculs d’accès auprès du moteur routier, avec les mêmes contraintes. La continuation des candidates reçues ne relance pas la source carburants et reste disponible. Numéros, filtres, dates des prix, arrêt choisi et budget conservent leurs règles antérieures.

Une nouvelle collecte demandée pendant l’attente est refusée avant d’effacer les résultats datés présents. Ils restent consultables dans leur contexte ; une modification des lieux ou critères continue de les invalider. Après l’expiration, une nouvelle collecte volontaire remplace normalement l’ancienne recherche. Une collecte interrompue par une limite et dépourvue de résultat exploitable ne déclare pas qu’il n’existe aucune station.

Les fiches favorites utilisent la même retenue. Les informations enregistrées restent consultables avec leur statut historique ; l’échec d’actualisation ne les transforme pas en données fraîches et ne supprime pas le favori. Le quota ne modifie ni le profil, ni les préparations, ni le journal.

## Collectif : une attente commune au calcul et au réseau

Calcul théorique, catalogue des lignes, passages aux arrêts et alertes partagent la même retenue Mobilités M. Une limite reçue par les informations réseau empêche aussi un nouveau calcul durant ce délai. Le refus préalable conserve les résultats datés déjà affichés. Une recherche effectivement lancée continue, elle, d’invalider ses anciens résultats avant réception conformément à ERR-03.

Une consultation réseau peut conserver son catalogue et ses passages reçus si les alertes deviennent indisponibles. Après une limite, les appels restants de cette consultation sont empêchés. Le message d’attente apparaît aussi en tête du panneau, sans masquer les détails déjà obtenus. Cliquer sur la même option pendant la retenue conserve sa consultation et sa date ; demander une autre option retire la consultation précédente pour ne pas lui attribuer un nouveau numéro.

L’annulation libère immédiatement la recherche collective, même si une réponse tarde à revenir. La fin d’une ancienne opération ne déverrouille pas une recherche plus récente.

Les résultats théoriques ne sont jamais modifiés à partir d’un quota ou d’une panne. Les règles de fraîcheur restent applicables aux résultats consultés. Une réponse tardive d’une opération annulée ou dont le contexte a changé ne restaure pas l’ancienne vue et n’installe pas une nouvelle retenue à partir de cette opération abandonnée.

## Vérification et portée

Les contrôles couvrent secondes, dates HTTP, date du serveur, valeurs absentes ou invalides, délais très grands, frontière d’expiration, prolongation et changements d’horloge. Les parcours couvrent collecte partielle, fiches favorites, continuation, services indépendants, données conservées, attente commune au collectif, fermeture, annulation, réponses tardives, clavier, petits écrans et texte agrandi.

Les limites 429 et 503 sont provoquées uniquement dans des réponses simulées. La recette publiée consulte séparément des services réels entre lieux publics ; elle ne cherche pas à épuiser leurs quotas. Les réponses rejouées et les délais simulés sont identifiés dans les preuves. Les contrôles et fichiers publiés sont liés au commit exact.

Aucun fournisseur, compte, clé, abonnement, paiement, hébergement, format de sauvegarde ou droit de publication générale n’est ajouté. Ce lot ne qualifie ni téléphone physique, ni disponibilité garantie des services, ni couverture nationale, ni caravane ou poids lourd. Les autres limites restent celles du cahier et des compléments précédents.

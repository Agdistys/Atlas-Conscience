# V094 — Informations de stations aux arrivées estimées

23 novembre 2026 · ARR-MULTI-07 · ARR-06, STA-10 et FIC-03 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Complète les [horaires déclarés V011](OuQuandQui_API_V011_Horaires_Stations_2026-11-18.md), les [horaires des étapes V092](OuQuandQui_API_V092_Horaires_Arrets_2026-11-23.md) et le [partage des frais V093](OuQuandQui_API_V093_Partage_Arrets_2026-11-23.md). Les éditions précédentes restent conservées.

## Consultation volontaire

Un parcours confirmé à deux ou trois stations propose « Consulter les horaires et services des stations ». Ouvrir ce panneau ne contacte aucun fournisseur. « Actualiser les horaires et services » interroge le fournisseur carburants existant pour chacun des identifiants de station, dans l’ordre, avec annulation possible. Les coordonnées du parcours, ses horaires, son budget et ses voyageurs ne sont pas transmis par cette consultation.

Le flux officiel instantané v2 fournit les champs `id`, `cp`, `geom`, `horaires`, `horaires_automate_24_24` et `services_service`. La requête ne demande aucun prix. Elle conserve la distinction entre horaires habituels du guichet, automate déclaré et services. Les horaires ne sont pas assimilés à ceux de la boutique ou de chaque service. Leur date de modification et les fermetures exceptionnelles ne sont pas fournies par ces champs ; la date du prix ne les date pas.

Chaque réponse doit désigner exactement la station demandée, sans doublon. Ses coordonnées sont rapprochées de celles conservées pour cette station, avec une tolérance numérique d’un mètre. Une position différente demande de recalculer la station : aucun déplacement de point ni remplacement d’adresse n’est effectué. Cette vérification d’identité ne qualifie ni l’entrée routière ni l’accès physique.

Les délais et quotas utilisent l’attente commune du fournisseur carburants. Aucune relance automatique n’est créée. Une panne, un dépassement de délai, une réponse absente, répétée, déplacée ou invalide produit une ligne indisponible. Les autres réponses reçues restent consultables ; aucune donnée ancienne n’est recyclée comme réponse actuelle d’une station en échec.

## Arrivées et déclarations habituelles

Chaque station utilise l’arrivée de son propre parcours : départ choisi, durées des portions précédentes et pauses carburant précédentes. Sa propre pause suit son arrivée. Sans départ ou avec une pause antérieure inconnue, l’heure concernée reste inconnue. Les données horaires de station ne remplacent jamais une durée de trajet manquante.

Le parseur qualifié dans V011 est réutilisé : Europe/Paris et localisation métropolitaine cohérente, jours officiels, plages multiples, nuit et changement de semaine, bornes incluses/exclues, jours absents, contradictions et déclarations d’automate. Un automate ne qualifie pas à lui seul l’accès au GPLc. Trafic, attente et temps d’embarquement restent exclus des arrivées selon V092.

Les états sont « dans les horaires habituels du guichet », « automate 24 h/24 déclaré », « hors horaires déclarés du guichet sans automate déclaré » ou « inconnu / à vérifier ». Une compatibilité porte uniquement sur les déclarations hebdomadaires. Les jours fériés, fermetures exceptionnelles, fonctionnement, stock, carburants de l’automate et accès réel restent non vérifiés. Il ne s’agit pas d’un filtre certifiant une ouverture physique à l’arrivée.

Les résultats sont visibles dans la préparation, dans la vue principale après adoption et dans le détail du point sélectionné sur la carte. Les horaires du guichet et les services restent dans des sections repliables. Chaque station distingue données reçues et tentative infructueuse, avec date et heure de consultation. La source est explicitement reliée.

## Âge de consultation et historique

La lecture courante est limitée à moins de vingt-quatre heures depuis chaque consultation. À la borne de vingt-quatre heures, après recul incohérent de l’horloge ou si une date de réception est future, la compatibilité courante devient inconnue et une actualisation volontaire est proposée. Cette limite locale évite de présenter indéfiniment une ancienne lecture comme actuelle ; elle ne fournit aucune date de validation des horaires source.

Une consultation invalidée en session ne redevient pas actuelle par simple retour de l’horloge. Une nouvelle consultation explicitement conservée renouvelle la préparation ; le parcours déjà adopté garde son propre état jusqu’à une nouvelle adoption. Les dates et détails de la dernière consultation restent lisibles pendant la recherche.

Une copie historique conserve données, source, dates et arrivées calculées. Sa compatibilité actuelle est indiquée comme inconnue ; aucune requête ni réécriture ne découle de la lecture. Modifier cette copie exige le parcours de reprise existant : copie distincte et recalcul. Les observations de stations sont retirées de la nouvelle copie, sans toucher à l’original.

## Confirmation et indépendance des coûts

La recherche produit une proposition. « Conserver dans la préparation » applique les informations examinées ; annuler conserve la consultation précédente. Aucun enregistrement local n’est implicite. Une nouvelle adoption est nécessaire pour modifier la vue principale et « Enregistrer une copie » reste nécessaire pour conserver le résultat dans la bibliothèque.

La consultation ne modifie ni tracé, ni ordre, ni autonomie, ni prix, ni budget, ni répartition des frais. Les invalidations antérieures du budget ou du partage ne sont pas levées par une nouvelle consultation des horaires. Une réponse tardive, un changement de préparation, une fermeture ou une annulation ne remplace pas la préparation conservée.

Modifier le départ ou les pauses réévalue localement les observations encore utilisables aux nouvelles arrivées, sans appel supplémentaire. La source et ses dates restent identiques. Les règles existantes qui retirent budget et partage après de nouveaux horaires restent applicables. Une nouvelle déclaration de frais n’efface pas les informations de station, dont la validité reste indépendante.

## Format et exports

Le format de parcours 5 ajoute le champ obligatoire `stationChecks`, nul ou contenant version, source officielle, liaison aux identités et coordonnées ordonnées des stations ainsi qu’au carburant, date de conservation et une ligne par station. Une ligne conserve identifiant, date de consultation, état reçu/indisponible, détails ou motif d’indisponibilité. Les détails comprennent coordonnées source, code postal, horaires bruts bornés, déclaration d’automate et services bornés.

Les champs `timing`, `budget` et `sharing` restent obligatoires, avec null permis selon les confirmations présentes. Promouvoir un budget de format 2 ne crée aucun horaire et ne modifie pas sa liaison. Les observations ne font pas partie des hypothèses monétaires ; confirmer une consultation ne change donc pas un budget ou un partage valide.

Les collections 5 lisent les formats 1 à 5 sans migration à la lecture et sans régression de collection lors d’un import ancien ou d’un effacement. Formats futurs, identités ou sources incohérentes, dates impossibles, champs absents, tailles excessives et conflits d’écriture sont refusés avant sauvegarde. Les données importées restent déclaratives : les liaisons et contrôles de structure n’authentifient pas leur provenance.

Le JSON conserve les informations. Le GPX et les liens de navigation gardent leurs points, sans horaires source ni services. Aucune inscription au journal, aucun prix actualisé, contact, compte ou nouveau fournisseur n’est ajouté. Les limites de dix parcours et 3 Mo restent applicables.

## Critères d’Achèvement

Vérifier les arrivées propres à chaque étape, les pauses inconnues, les déclarations contradictoires, les automates et le GPLc, les sources absentes et les déplacements de position. Tester l’expiration exacte, les horloges, la lecture historique, les pannes partielles, quotas, annulation et réponses tardives.

Contrôler la conservation du budget et du partage, y compris leurs invalidations ; la confirmation, l’adoption et la sauvegarde distinctes ; les formats mixtes, imports incohérents et conflits. Vérifier les textes hostiles, les exports, l’absence d’appel à l’ouverture et à la relecture, quatre formats, clavier, texte agrandi et schéma sans carte.

L’inspection complète et la recette publiée portent sur le même commit. Les réponses simulées, les stations publiques réellement interrogées et un déplacement physique restent distingués. La disponibilité nationale, les fermetures exceptionnelles, les enseignes exclues et les comparaisons multimodales du parcours successif restent des périmètres distincts.

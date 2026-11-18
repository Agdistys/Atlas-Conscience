# OùQuandQui — Sauvegarde et restauration du journal

V010 · 18 novembre 2026 · Lot JOURNAL-RESTAURATION-01. Complément de JOU-03, JOU-04 et JOU-05 du [cahier des charges V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md). Le journal et ses facteurs restent décrits dans [V008](OuQuandQui_API_V008_Journal_Mobilite_2026-11-18.md) et [V009](OuQuandQui_API_V009_Empreinte_Journal_2026-11-18.md). Leur limite historique « restauration non disponible » est levée par cette version. V001–V009 conservés.

## Parcours

« Mon journal » → « Importer une sauvegarde » ouvre un fichier JSON local. Sa lecture ne modifie aucune donnée et n’active pas le journal. Une fenêtre de vérification montre le nom du fichier, le nombre de trajets, la période, les distances inconnues, les estimations présentes et l’état actuel. Chaque trajet est consultable avec date, lieux, mode, distance, note, révision, calcul routier et historique carbone. Le résultat prévu et les décisions manquantes sont explicités.

Deux opérations sont proposées :

| Opération | Comportement |
| --- | --- |
| Ajouter au journal actuel, choix initial | Conserve toutes les entrées actuelles et ajoute celles acceptées. Les doublons possibles et versions en conflit nécessitent une décision. |
| Remplacer le journal actuel | Reprend toutes les entrées du fichier à la place des entrées courantes. Le nombre remplacé est affiché ; un fichier vide avertit que le journal sera vidé. |

Un bouton exporte le journal actuel avant l’import. Ce téléchargement est proposé, pas imposé ni réputé effectué automatiquement. Le remplacement exige une case de confirmation propre à cette opération, puis le bouton « Confirmer l’import ». Modifier le mode ou un choix de doublon retire l’accord précédent. Annuler ou Échap ferme la vérification, conserve les données et rend le focus au bouton d’import.

L’état activé/désactivé du journal local reste inchangé, même si le fichier indique le contraire. Un journal désactivé peut être restauré pour consultation et export ; son activation demeure une action séparée. Le profil, les stations favorites, les autres environnements et la copie locale d’origine de l’ancien journal ne sont pas remplacés par cette opération.

## Identité, doublons et conflits

Le mode ajout compare les entrées validées du fichier au journal actuel et aux entrées déjà retenues pendant cette préparation :

- Même identifiant et contenu reconnu identique : signalé « Déjà présent, inchangé », sans deuxième ajout. Réimporter une sauvegarde identique ne provoque aucune écriture.
- Même identifiant mais contenu différent : comparer les deux versions, puis conserver les trajets déjà retenus ou conserver aussi la version du fichier comme copie distincte. Aucun choix automatique de la date la plus récente ni remplacement silencieux.
- Identifiants différents, mais mêmes date, lieux normalisés, mode et distance : doublon possible. Choix entre conserver les trajets déjà retenus et ajouter aussi ce déplacement. Des déplacements réellement répétés restent possibles ; cette détection ne prouve pas leur identité physique.
- Aucun rapprochement : ajout proposé, soumis à la confirmation globale.

Conserver deux versions d’un identifiant crée un nouvel identifiant pour la copie, sans changer ses dates, révision, note, distance, calculs ou estimations historiques. Cette copie représente une deuxième entrée du bilan : elle peut donc compter deux fois un même déplacement si les deux versions décrivent en réalité le même voyage. Le libellé et le nombre de copies permettent de vérifier ce choix. Le fichier source reste la référence pour son identifiant initial ; aucun historique général de synchronisation ou de renommage n’est introduit.

Les doublons internes au fichier sont également examinés. Un choix précédent peut faire apparaître un nouveau doublon pour une ligne suivante ; la confirmation reste indisponible tant qu’un choix manque. Si plusieurs trajets correspondent, leur nombre est affiché et les trois premiers sont consultables, pour éviter une comparaison multipliée jusqu’à un million de blocs. L’export du journal actuel permet d’examiner l’ensemble des entrées.

En mode remplacement, le contenu validé du fichier est restauré tel quel, y compris ses entrées distinctes décrivant des voyages similaires. Les doublons physiques ne sont pas automatiquement fusionnés. Des identifiants réellement dupliqués au sein du fichier sont invalides et refusés dans les deux modes.

## Validation et conservation

Formats reconnus : versions 1 et 2 du journal. La version 1 est normalisée vers la version 2 sans création d’estimation. Le validateur commun contrôle identifiants, modes, dates, nombres finis, distances, lien entre trajet et calcul routier, facteurs carbone, hypothèses, résultats et historiques. Les clés JSON peuvent être dans un ordre différent ; cet ordre n’altère pas leur sens. Les champs étrangers au format reconnu ne sont pas repris, ce que l’aperçu précise.

Une estimation importée n’est jamais remplacée par un calcul au facteur du jour. Le contrôle arithmétique vérifie sa cohérence avec le jeu de facteurs figé reconnu, puis restitue les mêmes valeurs et dates. Un jeu de facteurs futur, inconnu ou altéré est refusé avec l’ensemble du fichier : aucun résultat incomplet n’est importé en prétendant avoir tout restauré. Les instantanés routiers, facteurs et historiques validés sont conservés ; les textes sont rendus comme du texte, jamais exécutés.

Une distance inconnue reste `null`, distincte de zéro. Les entrées anciennes portant une date postérieure à l’horloge courante restent lisibles et importables comme dans le journal existant : un changement d’horloge ne réécrit pas les sauvegardes. L’import ne prouve pas la réalisation physique d’un déplacement.

Limites : fichier de 2 000 000 octets maximum, 1 000 entrées, 50 estimations historiques par entrée, puis contrôle du volume du journal final formaté à 2 000 000 octets. Deux fichiers valides séparément peuvent dépasser la capacité une fois réunis ; le résultat est alors bloqué sans troncature ni suppression des plus anciennes entrées. Choisir un autre périmètre, restaurer un fichier complet après export ou libérer volontairement de la place reste possible.

## Écritures, annulation et concurrence

L’opération n’écrit qu’après confirmation, dans la clé du journal version 2 de l’environnement courant. Le document JSON entier est validé puis écrit atomiquement. L’état chargé des deux clés de journal (courante et origine) est comparé au stockage au moment de l’écriture ; un autre onglet ne peut pas être écrasé silencieusement. L’état interne est également comparé à celui de l’aperçu.

Un refus de stockage, un quota dépassé ou un conflit conserve le journal précédent, le fichier préparé et ses choix. Aucun message de succès n’est affiché. Une double confirmation immédiate ne réalise pas un deuxième import. La fermeture du journal invalide une lecture de fichier encore en cours ; si un nouveau fichier est sélectionné, une réponse tardive du premier n’ouvre ni ne remplace son aperçu.

Un journal local de format inconnu ou invalide reste protégé : l’import ne permet pas de le remplacer à l’aveugle. Les actions de récupération et d’effacement restent séparées. Le téléchargement préalable est une sauvegarde volontaire ; il n’existe pas de restauration automatique du journal remplacé si aucun export n’a été conservé.

Le fichier est lu sur l’appareil. Aucun lieu, historique, note ou facteur importé n’est envoyé à un fournisseur. Le journal d’essai et le journal public restent isolés ; une personne peut transférer explicitement une sauvegarde d’un environnement à l’autre par le fichier, sans synchronisation implicite.

## Vérification et suite

Six contrôles du modèle couvrent la migration, l’idempotence, les versions conflictuelles, les doublons internes/externes, le remplacement et les limites/altérations. Huit scénarios navigateur couvrent l’aperçu, l’historique, les choix, l’export préalable et Échap, les fichiers invalides, les erreurs de stockage et conflits, les lectures retardées et l’isolation/capacité. Les suites du journal et de son empreinte restent exécutées. Le rapport du commit publié consigne les résultats effectivement obtenus.

Les fichiers et trajets des vérifications sont fictifs et distincts du journal de la propriétaire. Les tests sur formats mobiles ne remplacent pas une vérification sur téléphone physique. La synchronisation, un compte et un historique global des imports ne sont pas introduits. Le prochain axe proposé concerne l’usage des horaires déclarés des stations pour qualifier l’ouverture à une arrivée estimée, sans confondre absence d’information et fermeture.

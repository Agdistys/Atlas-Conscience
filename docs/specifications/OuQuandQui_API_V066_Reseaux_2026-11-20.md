# V066 — Exclure des réseaux dans les parcours collectifs reçus

BOU-RESEAUX-01 · 20 novembre 2026. Complète BOU-04, BOU-02/03/07 du [cahier V5](OuQuandQui-Cahier-des-Charges-V5-2026-09-18.md), le [pilote collectif V026](OuQuandQui_API_V026_Transports_Collectifs_2026-11-18.md), la [comparaison des empreintes V063](OuQuandQui_API_V063_Comparaison_Empreintes_2026-11-20.md) et les [groupes V064](OuQuandQui_API_V064_Groupes_2026-11-20.md). Éditions précédentes conservées.

## Choix personnel et source

Après une recherche collective, « Réseaux à écarter » présente les identifiants et noms présents dans les étapes reçues de Mobilités M. Chaque case exclut volontairement un réseau de cette consultation. Aucun choix préalable, jugement éditorial, réputation ou propriétaire juridique déduit du nom. L’annuaire des opérateurs n’est pas appelé ; aucune nouvelle source n’est raccordée.

L’identifiant reçu est vérifié comme chaîne bornée, sans normalisation qui fusionnerait deux identités. Les noms sont du texte, jamais du code exécuté. Un même nom associé à deux identifiants donne deux choix distincts. Plusieurs noms reçus pour le même identifiant restent visibles sous ce choix. Un identifiant absent ou invalide reste inconnu, même si un nom existe. La marche ne constitue pas un réseau à exclure.

La détection des doublons d’itinéraire inclut désormais l’identité des réseaux : deux parcours aux mêmes horaires et lieux mais avec des identifiants différents ne disparaissent pas l’un derrière l’autre.

## Toutes les étapes et contraintes prioritaires

Une exclusion active s’applique à **chaque étape collective** de l’option. Un seul réseau exclu suffit à rendre l’option non admissible. Si une étape collective n’a pas d’identifiant vérifiable, le respect de l’exclusion ne peut pas être affirmé : l’option devient une référence non admissible. Sans exclusion active, cette absence d’identité n’empêche pas de consulter les horaires qualifiés.

Les exclusions se cumulent avec les correspondances impératives. Elles ne remplacent ni les limites de marche du calcul ni les autres contraintes. Une empreinte basse, un temps court ou un réseau autorisé sur une autre étape ne compense jamais un réseau exclu.

Le même contrôle détermine l’état des fiches, le classement collectif, la comparaison des temps et celle des empreintes. Les numéros des options restent stables. La sélection cartographique courante est conservée : si elle devient exclue, le titre de la carte indique « Référence non admissible ». Les options écartées restent consultables comme références, séparées du classement admissible. Aucune autre route n’est adoptée automatiquement.

Si aucune option reçue ne respecte les critères, l’interface l’indique explicitement. Elle ne promet pas qu’une autre recherche trouvera un réseau différent. Un réseau ou un tarif inconnu ne devient jamais zéro ni une conformité acquise.

## Réversibilité et durée des choix

« Retirer toutes les exclusions » rétablit les options selon les autres critères toujours actifs, conserve leurs numéros et rend le focus au premier choix. Décocher une case réévalue immédiatement les résultats. Ni appel réseau, ni écriture locale, ni sauvegarde, ni déclaration de déplacement ne découle de cette action.

Les exclusions sont locales à la consultation. Une fermeture, une nouvelle recherche, un changement du contexte ou une reprise de préparation les retire. Les résultats et consultations secondaires devenus anciens sont invalidés. Pendant le calcul, les cases sont indisponibles ; une modification synthétique annule la recherche et une réponse tardive ne la restaure pas. Un changement silencieux de contexte est vérifié à l’action suivante.

Les modèles d’empreinte déjà saisis restent associés aux mêmes options lors d’une simple exclusion ; leur admissibilité et les tris sont recalculés. Les infos réseau et estimations individuelles ouvertes sont retirées lors du changement de filtre pour ne pas conserver une consultation devenue ambiguë.

Les préparations, profils et journaux conservent leurs formats. **Les exclusions ne sont pas enregistrées** dans une préparation collective : l’interface et son formulaire d’enregistrement le rappellent. Les anciennes éditions ne sont ni migrées ni réécrites par une consultation. La reprise d’un souvenir exige toujours une nouvelle recherche, puis de nouveaux choix d’exclusion.

## Recette et limites

Contrôles : identité absente/invalide, noms identiques et divergents, étape exclue au milieu d’un parcours, contraintes cumulées, absence de mutation, identité dans la déduplication et priorité des exclusions sur les tris et empreintes. Parcours navigateur : filtre/réinitialisation, carte, comparaison, clavier, contenu externe inerte, contexte modifié, réponses tardives, sauvegardes et vues étroites/texte agrandi.

Les scénarios multi-réseaux sont des simulations identifiées. La recette publique emploie des lieux publics du pilote Grenoble et les réponses réellement reçues ; un exemple mono-réseau ne qualifie pas une couverture nationale ni multi-réseaux. Les preuves locales, GitHub et publiées sont consignées séparément dans quality/transit-networks et le suivi du développement. Aucun téléphone physique ou trajet effectué n’est attesté.

BOU-04 reste partiel : choix parmi les réseaux déclarés dans les options reçues seulement, sans préférences pondérées, annuaire juridique, enseignes des stations ou recherche exhaustive d’autres opérateurs. Aucun nouveau fournisseur, compte, budget, hébergement ou fusion sur le site principal.

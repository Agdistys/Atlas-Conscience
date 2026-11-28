# Tarifs ordinaires des ponts, 1er mai 2026

Source normative : DILA, arrêté TRAT2609535A du 30 mars 2026, JORF du 21 avril 2026, texte 8, annexe I. Lien long, licence et dates dans `provenance.json` et les deux tables JSON.

`annexe-consultee.txt` est une transcription bornée de l’extraction de la page officielle consultée le 22 novembre 2026. L’outil indiquait une indexation deux mois auparavant. Ce n’est ni un HTML original ni un XML du stock DILA. Le document permet de vérifier la transcription des huit prix embarqués, sans transformer son empreinte en preuve d’authenticité. Les huit valeurs ont été corroborées avec la page actuelle de l’exploitant, HTTP 200, empreinte conservée dans le manifeste. Le texte et la mise en page commerciaux de l’exploitant ne sont pas redistribués.

`python3 tools/build-toll-tables.py --check` vérifie les empreintes et chaque prix par classe, puis la reproduction dans la configuration. Les tarifs sont des centimes entiers TTC par passage. Classe 5 : `null`, non qualifiée, pas zéro. Aucun abonnement, réduction, aller-retour, passage déduit de la carte ni prix 2027.

Le 31 décembre 2026 est une échéance interne de consultation, pas une fin de validité juridique ni une garantie de stabilité des prix. Les attributs de source sont conservés dans les préparations et les budgets ; la classe, le passage et la couverture restent déclaratifs.

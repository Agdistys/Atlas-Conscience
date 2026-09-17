#!/bin/zsh
# ── Vérification des scellés — Protocole de ConScience aMi ──
# Double-clique ce fichier. Il se place tout seul dans le bon dossier.
cd "$(dirname "$0")" || exit 1
print -P "\n%F{yellow}Vérification des neuf scellés — %f$(pwd)\n"
shasum -a 256 -c EMPREINTES.txt
code=$?
print ""
if [ $code -eq 0 ]; then
  print -P "%F{green}✅  Les neuf fichiers sont intacts. Aucun n'a bougé depuis son scellement.%f"
else
  print -P "%F{red}❌  Au moins un fichier a changé. Une ligne FAILED annule le sceau correspondant.%f"
fi
print "\nAppuie sur Entrée pour fermer."
read

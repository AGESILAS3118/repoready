name: Rapport de bogue
description: "Signaler un bogue pour nous aider à améliorer {{project}}"
title: "[Bogue] : "
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        Merci de prendre le temps de remplir ce rapport de bogue pour {{project}} !
  - type: input
    id: summary
    attributes:
      label: Résumé du bogue
      description: Une description claire et concise du dysfonctionnement.
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Étapes pour reproduire
      description: Étapes permettant de reproduire le comportement.
      placeholder: |
        1. Aller sur '...'
        2. Clic sur '...'
        3. Voir l'erreur
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Comportement attendu
      description: Qu'auriez-vous dû obtenir ?
    validations:
      required: false
  - type: textarea
    id: environment
    attributes:
      label: Détails de l'environnement
      description: Système d'exploitation, navigateur ou version de l'environnement d'exécution.
    validations:
      required: false

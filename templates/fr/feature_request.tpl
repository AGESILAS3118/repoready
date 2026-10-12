name: Demande de fonctionnalité
description: "Proposer une idée ou une amélioration pour {{project}}"
title: "[Fonctionnalité] : "
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        Merci de proposer une nouvelle fonctionnalité pour {{project}} !
  - type: input
    id: title
    attributes:
      label: Titre de la fonctionnalité
      description: Résumé concis de la fonctionnalité demandée.
    validations:
      required: true
  - type: textarea
    id: problem
    attributes:
      label: Description du problème
      description: Votre demande est-elle liée à un problème particulier ? Veuillez détailler.
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Solution proposée
      description: Décrivez la solution que vous aimeriez voir mise en place.
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives envisagées
      description: Décrivez les solutions ou fonctionnalités alternatives que vous avez envisagées.
    validations:
      required: false

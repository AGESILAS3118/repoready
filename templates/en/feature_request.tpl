name: Feature Request
description: "Suggest an idea or enhancement for {{project}}"
title: "[Feature]: "
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        Thank you for suggesting a feature for {{project}}!
  - type: input
    id: title
    attributes:
      label: Feature Title
      description: Concise summary of the requested feature.
    validations:
      required: true
  - type: textarea
    id: problem
    attributes:
      label: Problem Statement
      description: Is your feature request related to a problem? Please describe.
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: Describe the solution you'd like.
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives Considered
      description: Describe any alternative solutions or features you've considered.
    validations:
      required: false

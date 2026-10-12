name: Bug Report
description: "File a bug report to help us improve {{project}}"
title: "[Bug]: "
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report for {{project}}!
  - type: input
    id: summary
    attributes:
      label: Bug Summary
      description: A clear and concise description of the bug.
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior.
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. See error
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What did you expect to happen?
    validations:
      required: false
  - type: textarea
    id: environment
    attributes:
      label: Environment Details
      description: Operating system, browser or runtime version.
    validations:
      required: false

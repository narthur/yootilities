# GitHub Actions Guidelines

## Workflow Style
- Keep workflows minimal and concise
- No step names or workflow names unless absolutely necessary
- Extract shared logic into composite actions
- Run jobs in parallel by default

## Composite Actions
- Place in `.github/actions/`
- Keep focused on one responsibility
- Avoid duplicating logic across workflows

## Example Pattern
```yaml
# Workflow (ci.yml)
on: push
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup
      - run: pnpm lint

# Action (actions/setup/action.yml)
name: Setup
runs:
  using: composite
  steps:
    - uses: asdf-vm/actions/install@v4
    - uses: actions/cache@v4
      with: ...
    - run: pnpm install
      shell: bash
```
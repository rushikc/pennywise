# Contributing

Setup, the test table, and the branch flow are in [DEVELOP.md](docs/DEVELOP.md).

Before you open a pull request:

- Run the test command for the area you touched (see the table in DEVELOP.md).
- Run `npm run lint` for web changes and `npm run lint --prefix functions` for Cloud Functions.
- Run `npm run docs:check` when you change markdown or `.cursor/rules`.

Commits are one line, `type: description`. Types: `feat`, `fix`, `refactor`, `test`, `doc`, `chore`.

Do not commit secrets, tokens, real transaction data, or a personal Firebase project id. Use placeholders such as `<your-project-id>`.

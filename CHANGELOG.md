# Changelog

All notable changes are summarized here. The version in `package.json` is 1.1.0. Older history is in git.

## [Unreleased]

- Tags-v1: `tags[]` plus a deprecated `tag` mirror, an open tag policy, and `shared/tagCases.json` as the spec.
- Playwright end-to-end suite against the local Firebase emulators.
- Public demo deploy on every push to `main` (static Hosting, no Firebase in the bundle).
- Gmail import via Pub/Sub push and an hourly sweep, with regex first and Gemini as the fallback.
- `pennywiseApi` is exported and unreleased. It is not a supported API. See [docs/adr/0006-external-write-api.md](docs/adr/0006-external-write-api.md).

## [1.1.0]

Current package version. This file does not reconstruct older releases.

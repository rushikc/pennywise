# 0006. External write API

Status: Proposed

## Context

A local enrichment process needs to write extra tags and descriptions onto expenses. Two shapes are on the table: an HTTPS Cloud Function in this repo, or a local Python process that writes with the Admin SDK. The function shape is partly built. Terraform creates the secret shells `pennywise-api-token` and `pennywise-api-token-next`. `functions/api/` has token checks, owner resolution, and request handling. `functions/index.js` exports `pennywiseApi` as a public HTTPS function.

## Decision

No decision yet. The export stays as it is. This record does not accept either shape, and it does not describe routes.

## Consequences

Do not treat `pennywiseApi` as a supported API. Do not add API docs until this record is Accepted. `SECURITY.md` has to be updated before that function is documented or relied on. A later decision may still replace the Cloud Function with a local Python writer.

# 0003. Per-user data and the allowlist

Status: Accepted

## Context

Expenses used to live in root collections (`expense`, `vendorTag`, `budget`, `config`). One Firebase project could not keep two people apart, and any signed-in Google account could be treated as the owner.

## Decision

Live data sits under `users/{uid}/...`. Firestore rules allow that tree only when the signed-in email is verified and `allowedUsers/{lowercase-email}` exists. Anyone else gets demo data. `scripts/migrate/migrateToUser.js` (`npm run migrate`) copies a backup of the old root collections into one user's tree.

## Consequences

Old root documents stay hidden until that migration runs. Family members need an allowlist document each. The rules, not an env flag, decide who sees live data.

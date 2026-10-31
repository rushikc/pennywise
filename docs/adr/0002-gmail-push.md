# 0002. Gmail push via Pub/Sub

Status: Accepted

## Context

Mail import used to depend on Apps Script hourly jobs. Those jobs were slow, easy to miss, and lived outside this repo.

## Decision

Gmail `users.watch` publishes to the Pub/Sub topic `gmail-push`. `onGmailPush` ingests matching mail. `hourlyGmailSweep` renews the watch, catches up, and continues a 30-day backfill. Regex parses known bank templates. Gemini is the fallback.

## Consequences

Terraform owns the topic. `firebase deploy` owns the functions and the subscription the deploy creates. Apps Script is not part of the import path. The roadmap line that records this replacement stays as history.

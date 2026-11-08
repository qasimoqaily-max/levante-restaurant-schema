# Levante optional analytics implementation plan

> **For agentic workers:** Execute this approved scope inline; keep the branch local until the parent reviews it. No deployment, DNS, credentials, or paid service changes.

**Goal:** Measure voluntary page visits and contact, reservation, and order intent without reporting completed transactions.

**Architecture:** The existing static generator renders an inert JSON config and a local consent module. A consent controller gates the Google library; the browser adapter handles preference storage, cookie removal, URL sanitization, and GA4 commands.

**Tech stack:** Existing dependency-free Node generator, browser modules, Node built-in tests.

**Approved scope:** Parent task instructions of 8 November 2026; GA4 property `563243301`, stream `16299962468`, measurement ID `G-CR68Q9RVE5`.

## Constraints

- Basic mode: no Google load/request for unknown or denied consent; equal accept/reject choices and persistent settings in DE/EN/AR.
- Analytics only. All advertising consent stays denied; Signals and personalization stay disabled.
- One sanitized manual `page_view` per start plus `click_to_call`, `booking_intent`, and `order_intent`; no completed-sale events or financial values.
- No raw queries, hashes, personal contact values, or click IDs in payload or preference storage. Only the literal owner-approved UTM triple maps to campaign fields.
- Native CTAs remain immediate; no cross-domain tracking.

## Steps

- [x] Verify a source snapshot from upstream commit `971530b7d11be7b88aeb3bf827e2afc17e813859` through GitHub tools after direct Git networking was denied.
- [x] Write failing consent/controller and generated-UI tests; implement the smallest matching behavior.
- [x] Update localized UI, privacy copy, config, and withdrawal/expiry regression tests together.
- [x] Run the complete build and Node acceptance suite; request independent read-only code review.
- [ ] Parent review, approved publication, then live-browser verification of network gating, cookies, language layout, native CTAs, and GA4 results.

## Review focus

Blocked storage, malformed/expired consent, withdrawal with stale grants, URL/referrer minimization, and native navigation are covered by regression tests. A missing Chromium executable prevents actual browser/network verification in this checkout; simulated adapter commands are not a substitute for the final live check.

Known browser-storage limit accepted at parent review: if both localStorage and sessionStorage refuse every write and deletion, a denial cannot be durably recorded. A surviving old grant can return when storage later recovers. The normal write-only/localStorage failure path is covered by the session-denial fallback and write probe; privacy copy advises clearing site data when storage prevents reliable choice persistence.

## Official implementation references

- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic
- https://developers.google.com/analytics/devguides/collection/ga4/reference/config
- https://developers.google.com/analytics/devguides/collection/ga4/views

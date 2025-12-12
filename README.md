🚀 CryptoPay Service — PSP Core

Backend Core of a Swiss-Grade Crypto Payment Processor

✅ What we had (initial state)

No backend core for handling crypto payments

No invoice lifecycle, AML logic, or webhook engine

No architecture suitable for Swiss partners or production PSPs

✅ What we built (current MVP)

We have created a Swiss-grade backend engine for a crypto payment processor.

1. Architecture

NestJS 11, TypeScript, Node.js 20

Clean modular structure

Prepared for AML, Risk Engine, PostgreSQL, Merchant Logic

Ready for integration with external AML providers (Crystal)

2. Full Invoice Lifecycle

Statuses:

waiting

confirmed

expired

rejected

API Endpoints:

POST /invoices — create

GET /invoices/:id — fetch

POST /invoices/:id/confirm

POST /invoices/:id/expire

POST /invoices/:id/reject

POST /invoices/:id/tx — attach blockchain tx

POST /invoices/:id/aml/check — auto AML

3. AML / Risk Engine (v1)

Evaluates amount, asset cleanliness, stablecoin score

Produces riskScore, level, status

Saves AML results to DB

Ready for Crystal Intelligence integration

4. Webhook Engine

Generates events

Persists to DB

Dispatch endpoint with retries ready

5. CryptoPay Frontend Integration

Hosted payment page

Real-time polling

Apple-style UI

Example:

https://demo.your-cryptopay.com/open/pay/[invoiceId]

6. Storage

SQLite (MVP)

Auto schema creation

Fields include txHash, network, amlStatus, riskScore, merchantId

Ready for PostgreSQL migration

🚀 What we will build next
🔥 Phase 2 — PostgreSQL + Prisma

schema migration

transactions

seed scripts

🔥 Phase 3 — Webhook Engine Pro

message queue

retries

request signatures

🔥 Phase 4 — AML Engine Pro

Crystal Intelligence API

wallet analytics

transaction screening

risk rules

🔥 Phase 5 — Merchant Dashboard

UI for merchants

filtering, reports, analytics

AML monitoring

🧾 Summary

You now have a Swiss-grade PSP Core MVP:

✔ Stable backend
✔ Complete invoice lifecycle
✔ AML engine (auto)
✔ Webhooks
✔ SQLite with extended schema
✔ Ready for PostgreSQL
✔ Fully integrated with frontend

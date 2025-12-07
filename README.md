🚀 CryptoPay Service — PSP Core

Backend Core of a Swiss-Grade Crypto Payment Processor

psp-core is the backend engine that:

generates crypto invoices

manages their full lifecycle

stores blockchain transaction data

performs AML checks (manual + automatic)

generates webhook events

forms the foundation for a fully compliant Swiss PSP

It is integrated with the official CryptoPay frontend and ready for partner demos.

✅ MVP v1 — Current Status (Ready)
🔹 1. Backend Architecture

NestJS 11

TypeScript

Node.js 20

Clean modular structure

Prepared for AML, Risk Engine, PostgreSQL, Merchant logic

🔹 2. Complete Invoice Lifecycle
Supported Statuses
Status Description
waiting Awaiting payment
confirmed Payment confirmed
expired Timer expired (15 minutes)
rejected Rejected (AML / risk / manual review)
API Endpoints
Invoices

POST /invoices — create invoice

GET /invoices/:id — fetch invoice

POST /invoices/:id/confirm — mark as confirmed

POST /invoices/:id/expire — expire invoice

POST /invoices/:id/reject — reject invoice

Blockchain

POST /invoices/:id/tx — attach blockchain transaction

AML

POST /invoices/:id/aml — set AML decision

POST /invoices/:id/aml/check — auto AML based on amount

Webhooks

GET /invoices/:id/webhooks — list webhook events

POST /invoices/:id/webhooks/dispatch — dispatch pending events

🔹 3. Integration With CryptoPay Frontend

Frontend:

displays invoice details

performs real-time status polling

shows waiting / confirmed / expired / rejected states

renders the hosted payment page

Example:

https://demo.your-cryptopay.com/open/pay/[invoiceId]

🔹 4. Storage (Current MVP)

SQLite with automatically created schema:

Tables:

invoices

webhook_events

Fields include:

network, txHash, walletAddress

riskScore, amlStatus

merchantId

Ready for PostgreSQL migration.

🧩 Tech Stack

NestJS

TypeScript

Node.js

SQLite (temporary storage)

→ Next step: PostgreSQL + Prisma

📁 Project Structure
psp-core/
├── src/
│ ├── invoices/
│ ├── aml/
│ ├── webhooks/
│ ├── db/sqlite.service.ts
│ ├── app.module.ts
│ └── main.ts
├── data/
└── README.md

🚀 Local Development
npm install
npm run start:dev

Server:

http://localhost:3000

🔥 API Example Usage
Create Invoice
curl -X POST http://localhost:3000/invoices \
 -H "Content-Type: application/json" \
 -d '{"fiatAmount":77,"fiatCurrency":"EUR","cryptoCurrency":"USDT"}'

Auto-AML
POST /invoices/:id/aml/check

Dispatch Webhooks
POST /invoices/:id/webhooks/dispatch

🧠 Storage Behavior

SQLite file created automatically

auto-migrations for columns

persistent across restarts

PostgreSQL migration planned

🛣 Roadmap — Toward a Production-Ready PSP
🔥 Phase 2 — PostgreSQL + Prisma
🔥 Phase 3 — Webhook Engine Pro
🔥 Phase 4 — AML / Risk Engine
🔥 Phase 5 — Merchant Dashboard
🧾 Summary

You now have a Swiss-grade PSP Core MVP:

✔ Stable backend
✔ Complete invoice lifecycle
✔ AML engine (manual + auto)
✔ Webhooks with signatures
✔ SQLite DB with extended schema
✔ Frontend integration
✔ Production-oriented architecture

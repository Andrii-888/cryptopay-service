🚀 CryptoPay Service — PSP Core

Backend Core of a Swiss-Grade Crypto Payment Processor

psp-core is the backend engine responsible for generating crypto invoices, managing their lifecycle, storing blockchain transaction data, running AML checks, generating webhook events, and preparing the system for a fully compliant Swiss PSP.

It is tightly integrated with the official CryptoPay frontend and is ready for partner demos.

✅ MVP v1 — Current Status (Ready)
🔹 1. Backend Architecture

NestJS 11

TypeScript

Node.js 20

Clean modular structure

Ready for AML, Risk Engine, PostgreSQL, Merchant Logic

🔹 2. Complete Invoice Lifecycle
Supported Statuses
Status Description
waiting Invoice created — awaiting payment
confirmed Payment confirmed
expired Invoice expired (15 minutes by default)
rejected Rejected (AML / risk / manual review)
API Endpoints
Method Endpoint Description
POST /invoices Create invoice
GET /invoices/:id Get invoice
POST /invoices/:id/confirm Mark confirmed
POST /invoices/:id/expire Mark expired
POST /invoices/:id/reject Reject
POST /invoices/:id/tx Add blockchain transaction
POST /invoices/:id/aml Set AML results
POST /invoices/:id/aml/check Auto-AML based on amount
GET /invoices/:id/webhooks Get webhook events
POST /invoices/:id/webhooks/dispatch “Send” pending webhooks

All endpoints are fully operational and tested.

🔹 3. Integrated With the CryptoPay Frontend (Next.js)

The frontend:

displays invoice details

shows real-time countdown

updates status dynamically

renders the hosted payment page

Example invoice page:

https://demo.your-cryptopay.com/open/pay/[invoiceId]

🔹 4. Storage (Current MVP)

Using SQLite with automatically generated schema:

invoices table

webhook_events table

fields:

network, txHash, walletAddress

riskScore, amlStatus

merchantId

Fully prepared for migration to PostgreSQL.

🧩 Tech Stack

NestJS 11

TypeScript

Node.js 20+

SQLite (temporary)

Ready for PostgreSQL + Prisma

📁 Project Structure
psp-core/
src/
invoices/
aml/
webhooks/
db/sqlite.service.ts
app.module.ts
main.ts

🚀 Running Locally
npm install
npm run start:dev

Server:

http://localhost:3000

🔥 API Examples

Create invoice:

curl -X POST http://localhost:3000/invoices \
 -H "Content-Type: application/json" \
 -d '{"fiatAmount":77,"fiatCurrency":"EUR","cryptoCurrency":"USDT"}'

Auto-AML:

POST /invoices/:id/aml/check

Dispatch webhooks:

POST /invoices/:id/webhooks/dispatch

🧠 How Storage Works

SQLite database file

Auto-migration of columns

Persistent across restarts

PostgreSQL is the next upgrade

🛣 Roadmap — Toward Production PSP
🔥 Phase 2 — PostgreSQL + Prisma

Persistent storage, merchant support, filtering, analytics.

🔥 Phase 3 — Webhooks

Signed callbacks (HMAC), retries, dead-letter queue.

🔥 Phase 4 — AML / Risk Engine

Risk scoring, address screening, AML integrations.

🔥 Phase 5 — Merchant Dashboard

Next.js panel with filters, AML logs, exports.

🧾 Summary

You now have a ready-to-demonstrate Swiss-grade PSP Core:

✔ Stable backend
✔ Full invoice lifecycle
✔ AML checks
✔ Webhook engine
✔ Frontend integration
✔ Scalable architecture

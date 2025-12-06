🚀 CryptoPay Service — PSP Core
Backend Core of a Swiss-Grade Crypto Payment Processor

psp-core is the backend engine that creates and manages crypto invoices, updates payment statuses, and prepares the system for AML checks, risk scoring, webhooks, and accounting.

It serves as the foundational layer of a future Swiss-compliant crypto PSP that integrates seamlessly with e-commerce platforms and merchant systems.

✅ MVP v1 — Current State (Ready)
🔹 1. Backend Architecture

NestJS 11

TypeScript

Node.js 20

Clean modular structure (InvoicesModule)

Fully prepared for scaling into AML, risk, and PostgreSQL

🔹 2. Complete Invoice Lifecycle
Supported Statuses
Status Description
waiting Invoice created — awaiting payment
confirmed Payment confirmed
expired Invoice expired (default 15 min)
rejected Rejected due to AML / risk / manual error
Available API Endpoints
Method Endpoint Description
POST /invoices Create a new invoice
GET /invoices/:id Get invoice by ID
POST /invoices/:id/confirm Mark as confirmed
POST /invoices/:id/expire Mark as expired
POST /invoices/:id/reject Reject due to AML / risk

All endpoints are live, stable, and verified with the production frontend.

🔹 3. Integrated With the Next.js Frontend

The official CryptoPay frontend:

fetches invoices from psp-core

displays amount, currency, countdown timer

shows all UI states (waiting / confirmed / expired / rejected)

works with real-time expiry countdown

renders a clean hosted payment page

Example payment page:
https://demo.your-cryptopay.com/open/pay/[invoiceId]

🔹 4. Storage (MVP)

For development & testing:

uses an in-memory store

resets on server restart

schema is fully prepared for PostgreSQL + Prisma

🧩 Tech Stack

NestJS 11

TypeScript

Node.js 20+

Temporary store: in-memory array
(→ will migrate to PostgreSQL in the next milestone)

📁 Project Structure
psp-core/
src/
invoices/
dto/
create-invoice.dto.ts
invoices.controller.ts
invoices.service.ts
app.module.ts
main.ts
package.json
README.md

🚀 Running Locally
cd psp-core
npm install --legacy-peer-deps
npm run start:dev

Server starts at:

➡ http://localhost:3000

🔥 API Usage Examples
Create Invoice
curl -X POST http://localhost:3000/invoices \
 -H "Content-Type: application/json" \
 -d '{"fiatAmount": 77, "fiatCurrency": "EUR", "cryptoCurrency": "USDT"}'

Get Invoice
GET /invoices/:id

Confirm Invoice
POST /invoices/:id/confirm

Expire Invoice
POST /invoices/:id/expire

Reject Invoice (AML / Risk)
POST /invoices/:id/reject

🧠 How MVP Storage Works

invoices are stored in memory (this.invoices)

storage resets when the server restarts

recommended testing flow:

Create an invoice

Copy its id

Call confirm / expire / reject

Check updated UI on the payment page

PostgreSQL will replace this layer in the next phase.

🛣 Roadmap — Production-Ready PSP
🔥 Phase 2 — PostgreSQL + Prisma (2–3 days)

persistent invoice storage

merchantId support

riskScore, txHash, blockchain network

date/status/merchant filtering

🔥 Phase 3 — Merchant Integration + Webhooks (3–5 days)
Webhooks:

invoice confirmed

invoice expired

invoice rejected

Features:

HMAC-signed callbacks

automatic retry logic

configurable webhook URLs

merchant dashboard settings

🔥 Phase 4 — AML / Risk Engine (5–7 days)

internal risk scoring (0–100)

address/transaction analysis

external AML API integration

auto-reject on high risk

regulator-grade audit logs

🔥 Phase 5 — Partner Dashboard (7–10 days)

Next.js admin panel:

invoice list + filters

AML insights

manual approve/reject

CSV/Excel export

accounting history

🧾 Summary

You now have a fully working CryptoPay PSP Core MVP:

✔ Stable NestJS backend
✔ Complete invoice lifecycle
✔ Integrated with frontend
✔ All statuses supported
✔ Architecture ready for AML, DB, Webhooks
✔ Perfect foundation for a Swiss-grade PSP

🎯 Next Steps

1️⃣ Add PostgreSQL
2️⃣ Implement Webhooks
3️⃣ Build AML / Risk Engine
4️⃣ Create Partner Dashboard
5️⃣ Release production-ready CryptoPay PSP

🚀 CryptoPay Service — PSP Core

Backend core of a Swiss-grade crypto payment processor

psp-core is the backend service responsible for creating and managing crypto invoices, updating payment statuses, and preparing the system for AML checks, risk scoring, webhooks, and accounting.

This is the foundational layer of a future Swiss-compliant crypto PSP that integrates with e-commerce platforms.

✅ Current State (MVP v1 Ready)
🔹 1. Backend architecture

NestJS 11

TypeScript

Node.js 20

Clean modular structure (InvoicesModule)

🔹 2. Fully implemented invoice lifecycle
Status Meaning
waiting Invoice created — awaiting payment
confirmed Payment confirmed
expired Invoice expired (default: 15 mins)
rejected Rejected due to AML / error / risk

Available API endpoints:

POST /invoices — create invoice

GET /invoices/:id — retrieve invoice

POST /invoices/:id/confirm — mark as confirmed

POST /invoices/:id/expire — mark as expired

POST /invoices/:id/reject — reject invoice

🔹 3. Connected to frontend (crypto-pay)

The Next.js frontend:

fetches invoices from psp-core

displays amount, currency, timer, payment status

shows beautiful UI states for rejected / expired / confirmed

supports real-time expiry countdown

Working payment page example:
https://demo.your-cryptopay.com/open/pay/[invoiceId]

🔹 4. Storage (MVP)

currently using in-memory storage

simple and perfect for demo/testing

full schema ready for PostgreSQL migration

🧩 Tech Stack

NestJS 11

TypeScript

Node.js 20+

Temporary store: in-memory array
(later → PostgreSQL + Prisma)

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

🚀 How to Run Locally
cd psp-core
npm install --legacy-peer-deps
npm run start:dev

Server runs at:
http://localhost:3000

🔥 API Examples
Create invoice
curl -X POST http://localhost:3000/invoices \
 -H "Content-Type: application/json" \
 -d '{"fiatAmount": 77, "fiatCurrency": "EUR", "cryptoCurrency": "USDT"}'

Get invoice
GET /invoices/:id

Confirm invoice
POST /invoices/:id/confirm

Expire invoice
POST /invoices/:id/expire

Reject invoice (AML / risk)
POST /invoices/:id/reject

🧠 How MVP storage works

For this early version:

invoices are stored in memory (this.invoices)

storage resets every time the server restarts

for testing:

create invoice → get its ID → use that ID in confirm/expire/reject

This will be replaced by PostgreSQL in the next milestone.

🛣 Roadmap — What’s Next (Full Production Version)
🔥 Phase 2 — PostgreSQL + Prisma (2–3 days)

persistent invoice storage

merchantId support

riskScore, txHash, blockchain network

query filters (date/status/merchant)

🔥 Phase 3 — Merchant integration + Webhooks (3–5 days)

Webhooks:

invoice confirmed

invoice expired

invoice rejected

Features:

signed callbacks (HMAC)

automatic retry logic

merchant dashboard configuration

🔥 Phase 4 — AML / Risk Engine (5–7 days)

internal 0–100 risk scoring

wallet analysis

external AML API integration

automatic reject on high-risk

audit logs for regulator requirements

🔥 Phase 5 — Partner Dashboard (7–10 days)

Admin panel for Swiss partner (Next.js):

invoice list

filters & search

AML results

manual status actions

CSV/Excel export

transaction history for accounting

🧾 Summary
You now have a fully working PSP Core MVP:

✔ NestJS backend running
✔ Complete invoice lifecycle
✔ Integrates with your crypto-pay frontend
✔ Supports all payment statuses
✔ API is clean, stable, and ready for partners
✔ Architecture prepared for databases, AML, risk, and webhooks

Next steps:
➡ Move to PostgreSQL
➡ Add AML and webhooks
➡ Build the partner dashboard
➡ Release production-ready CryptoPay PSP

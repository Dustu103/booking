# Maintenance & Risk Profile — Senior Specs

## 🧪 Gap Analysis (Technical Debt)

| # | Missing Feature | Priority | Effort | Notes |
|---|----------------|----------|--------|-------|
| 1 | `Metadata` Logging for Webhooks | 🟡 High | 2h | Essential for troubleshooting Stripe failures |
| 2 | Redis Caching (Public Catalog) | 🟢 Med | 4h | Required for 10k+ users |
| 3 | Admin Role Gating | 🔴 Critical | 3h | Current API allows all authenticated users to hit create routes |
| 4 | Email Confirmation | 🟡 Low | 2h | Post-payment receipt logic |

## 🛡️ Risk & Considerations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Invalid Seat State Corruption | High | Mongoose strict schema + Inngest atomicity |
| Stripe Webhook Tampering | Critical | Cryptographic signature verification (`stripe.webhooks.constructEvent`) |
| API Rate Limiting | Med | Planned: `express-rate-limit` for `/booking` |
| Large Show Concurrency | High | Optimistic concurrency control via `__v` in MongoDB |

## 🧪 Verification Plan

The platform is verified via three layers of strategy:
1.  **Unit Tests**: All controller logic is verified via `jest` mocks for DB and Stripe.
2.  **Webhooks Local Simulation**: `stripe listen --forward-to localhost:3000/api/stripe`
3.  **Job Continuity**: Inngest Dev Server confirms event ingestion and step-by-step resolution.

---

## 📅 Revision History

| Version | Date       | Changes |
|---------|------------|---------|
| 1.0     | 2026-04-02 | Initial Risk & Verification Strategy Release |

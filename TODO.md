# TODO: complete project we need :

## Tasks
- [x] Add messaging feature
- [x] disclimer on calculator 
- [x] Logout button working 
- [x] transactions enabled
- [x] Mobile version 
- [x] guards on steps
- [x] enable webhook for didit response 
- [x] add documents , disclamers , privacy policy, user guide 
- [x] fix calculations 
- [x] get correct company details 
- [x] show file on upload screen
- [x] yah

## Backlog (2026-04-26)

### Loan rules & calculations
- [x] 1st-time applicants: 1 month max term
- [x] More than 3 loans: limited to 6 (months)
- [x] Online applications limited to 6 months
- [ ] Leave loan term open — admin reviews/sets loan period
- [x] Interest/fees: 5% + 15% total
- [x] First loan of the year always 5%
- [x] Remove option to set date (use system date) — already in code
- [x] Rename status "Ready" → "Approved"
- [ ] In default: current balance × 3%
- [ ] Service fee prorated; next month R60
- [x] Add 0.45% (CPI?) to all loan calculations (already there)
- [ ] Add Credit Insurance Contract — line item for CPI (% calc) on all loans (display)
- [ ] Total insurance premium calculation; service fee apportioned
- [x] Make loans follow sequence referencing (ClientNumber-LoanNumber format)
- [x] Custom client reference — generated from user ID
- [x] Referencing format: Client Number - Loan Number
- [x] Agreement number generated (AGRxxxxxxxxxx)

### Truid / Contract
- [ ] Truid details should show contract logo
- [ ] Add colour for manual inserts on contract
- [ ] Purpose of the loan field
- [ ] Letters of Demand — generated per loan

### Experian / Affordability
- [x] Clients CAN input financial data (clients or consultants can input)
- [x] Track expenses (RESTORED: needed for affordability calculations)
- [ ] Allow additional income + other banks (UI toggles needed)
- [ ] Tick/untick other earnings to remove from affordability check
- [ ] Experian Affordability Assessment API integration
- [ ] Pull current balance + everything from Experian
- [ ] Show why declined (to applicant)
- [ ] Reference for credit report (Experian ref for NCR reporting)
- [ ] Product portal integration: PORTAL/EXPIRIEN.CO.ZA
- [ ] C(P or B)M payments — closed on their system but open on Compuscan
- [ ] Fix credit check

### Onboarding / Verification
- [ ] Register via WhatsApp
- [ ] Add WhatsApp SMTP
- [ ] Take a picture of the client / SMS verification
- [ ] System live date & time tracking via SMS
- [ ] Add employer verification
- [ ] Compulsory next of kin

### Banking / Payouts
- [ ] Automatically upload to bank via Capitec
- [ ] CSV should include bank accounts etc
- [ ] Lock CSV on download
- [ ] CSV format spec (TBD)
- [ ] Payout: use current primary bankout logic
- [ ] CashSend has extra fees — logic to choose which account from CashSend payout
- [ ] Choose specific payment method
- [ ] CashSend fee structure
- [ ] Payout to client / third party

### Audit & Cash
- [ ] Deeper audit trail
- [ ] Audit trail of cash
- [ ] Request for the day → then add journal
- [ ] Cash Ledger under Analytics — no editing
- [ ] Track client activity
- [ ] Solve back-dating + payment history
- [ ] Backdating with SACRRA

### Analytics & Reporting
- [ ] Financials by branch
- [ ] Time filters (down to days) for incoming payments
- [ ] Outgoing full comparisons + downloadable
- [ ] All online applications routed to head office
- [ ] Export all pages data
- [ ] Move loan book — analysis
- [ ] Export dashboard

### Client management
- [ ] Be able to cap specific clients
- [ ] Client-specific data
- [ ] Use agent logic from Flexi


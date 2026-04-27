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
- [ ] 1st-time applicants: 1 month max term
- [ ] More than 3 loans: limited to 6 (months)
- [ ] Online applications limited to 6 months
- [ ] Leave loan term open — admin reviews/sets loan period
- [ ] Interest/fees: 5% + 15% total
- [ ] First loan of the year always 5%
- [ ] Remove option to set date (use system date)
- [ ] Rename status "Ready" → "Approved"
- [ ] In default: current balance × 3%
- [ ] Service fee prorated; next month R60
- [ ] Add 0.45% (CPI?) to all loan calculations
- [ ] Add Credit Insurance Contract — line item for CPI (% calc) on all loans
- [ ] Total insurance premium calculation; service fee apportioned
- [ ] Make loans follow sequence referencing
- [ ] Custom client reference — keep same as current book
- [ ] Referencing format: Client Number - Loan Number
- [ ] Agreement number must match Max Money

### Truid / Contract
- [ ] Truid details should show contract logo
- [ ] Add colour for manual inserts on contract
- [ ] Purpose of the loan field
- [ ] Letters of Demand — generated per loan

### Experian / Affordability
- [ ] Clients can't input financial data — use Experian for all details
- [ ] Consultant inputs all details
- [ ] Required figures only
- [ ] Allow additional income + other banks
- [ ] Don't track expenses
- [ ] Tick/untick other earnings to remove from affordability check
- [ ] Experian Affordability Assessment
- [ ] Show why declined
- [ ] Reference for credit report (prove NCR reporting was done)
- [ ] Pull current balance + everything possible from Experian
- [ ] C(P or B)M payments — closed on their system but open on Compuscan
- [ ] Product portal: PORTAL/EXPIRIEN.CO.ZA
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


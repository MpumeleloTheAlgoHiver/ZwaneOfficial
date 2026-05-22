-- BRUCE WAYNE UAT SEED
TRUNCATE accounts, consumers CASCADE;

INSERT INTO consumers (sa_id, first_name, surname, date_of_birth)
VALUES ('8001015009087', 'BRUCE', 'WAYNE', '19800101');

INSERT INTO accounts (consumer_id, account_number, account_type, current_balance, instalment_amount, opened_date)
SELECT id, 'ZN-WAYNE-001', 'P', 150000, 2500, '20230101' FROM consumers;

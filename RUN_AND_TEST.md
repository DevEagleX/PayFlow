# Running & Testing PayTab

A complete, step-by-step guide to get PayTab running locally and verify
every feature works — backend, frontend, automated tests, and a manual
end-to-end smoke test. Follow this top to bottom the first time.

---

## 0. Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Java | 21 | `java -version` |
| Maven | 3.8+ | `mvn -v` |
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |
| Docker + Docker Compose | any recent | `docker -v` |

If you don't have Docker, you can install PostgreSQL 16 natively instead —
just make sure the database/user/password match what's in
`docker-compose.yml` (`paytab` / `paytab` / `paytab_local_password`), or
adjust the environment variables in Step 2 accordingly.

---

## 1. Start PostgreSQL

From the project root:

```bash
docker compose up -d
```

Verify it's running:

```bash
docker ps
```

You should see a `paytab-postgres` container listed, with port `5432`
mapped to your machine. No further setup is needed — unlike the MongoDB
version of this project, Postgres transactions work with zero extra
configuration (no replica-set initialization step).

To stop it later: `docker compose down` (add `-v` to also delete the data volume and start fresh next time).

---

## 2. Configure and run the backend

### 2.1 Set environment variables

```bash
export POSTGRES_URL=jdbc:postgresql://localhost:5432/paytab
export POSTGRES_USER=paytab
export POSTGRES_PASSWORD=paytab_local_password
export JWT_SECRET=replace-with-a-long-random-secret-at-least-32-bytes-long
```

(These match the defaults in `docker-compose.yml`. If you changed those defaults, or you're using a native Postgres install, update these to match.)

Alternatively, copy the local profile example and use `--spring.profiles.active=local` instead of exporting variables:

```bash
cp backend/src/main/resources/application-local.yml.example backend/src/main/resources/application-local.yml
# edit the JWT secret in that file, then:
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### 2.2 Run the backend

```bash
cd backend
mvn spring-boot:run
```

**What should happen:**
- Flyway runs automatically on startup and applies `V1__init_schema.sql`, creating the `users`, `wallets`, and `transactions` tables with all constraints. You'll see Flyway log lines like `Successfully applied 1 migration`.
- Hibernate validates that the JPA entities match the schema Flyway just created (`ddl-auto: validate`) — if this fails, something is out of sync between the entities and the migration (shouldn't happen out of the box).
- The app starts on `http://localhost:8080`.

**Quick sanity check** (in a new terminal):

```bash
curl -i http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.com","password":"wrong"}'
```

Expect `HTTP/1.1 401` with a JSON body containing `"Invalid email or password"`. If you get a connection refused, the backend isn't up yet; if you get a `500`, check the backend logs — likely a database connection issue (double-check Step 1 and your env vars).

---

## 3. Run the backend automated tests

No database is required for this — every test uses Mockito-mocked repositories.

```bash
cd backend
mvn test
```

**Expected:** all tests pass. This covers:
- `JwtServiceTest` — token generation, validation, expiry
- `AuthServiceTest` — duplicate email/phone rejection, successful registration + wallet creation, login success/failure
- `WalletServiceTest` — the atomic debit/credit logic, distinguishing "wallet not found" from "insufficient balance"
- `TransferServiceTest` — self-transfer rejection, missing recipient, and critically: that `credit()` is **never called** when `debit()` fails
- `AuthControllerTest` — HTTP status codes and response shape for register/login

To run a single test class:

```bash
mvn test -Dtest=TransferServiceTest
```

To see full stack traces for any failure:

```bash
mvn test -Dsurefire.printSummary=true
```

---

## 4. Configure and run the frontend

Open a new terminal (leave the backend running).

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

`.env` should contain:
```
VITE_API_BASE_URL=http://localhost:8080/api
```
(only change this if your backend isn't on `localhost:8080`)

The frontend runs on **http://localhost:5173**. Open it in a browser — you should land on the Login page.

---

## 5. Manual end-to-end smoke test (do this once, in order)

This is the single most useful test — it exercises every feature built across all 5 days in one pass.

1. **Register User A**
   Go to `/register`, create an account (e.g. `aditi@example.com`, `9876543210`). You should land on the Dashboard showing **₹0.00**.

2. **Register User B**
   Open an incognito window (or a different browser), register a second account (e.g. `rohan@example.com`, `9123456780`). You now have two accounts to transfer between.

3. **Check the Profile page**
   As User A, go to Profile. Confirm email and phone show as read-only, and full name is editable. Change the name, save, confirm the toast and that the new name persists on reload.

4. **Search for a recipient**
   As User A, go to Transfer, search for `rohan@example.com`. Confirm you see User B's name and a **masked** identifier (e.g. `r***n@example.com`), not the raw email echoed back.

5. **Try a self-transfer**
   Search for your own email as User A. Confirm this either fails at search or is rejected when you try to send — you should never be able to complete a transfer to yourself.

6. **Try transferring more than your balance**
   Since both accounts start at ₹0, try sending ₹100 from A to B. Confirm you get a clear "insufficient balance" error, not a crash — and that A's balance is still exactly what it was before (check via the Dashboard, or via `GET /api/wallet/balance` in Postman).

   At this point both wallets are at 0, so to actually test a successful transfer you'll need to either:
   - Directly update a balance in the database for testing purposes:
     ```bash
     docker exec -it paytab-postgres psql -U paytab -d paytab \
       -c "UPDATE wallets SET balance = 5000 WHERE user_id = (SELECT id FROM users WHERE email = 'aditi@example.com');"
     ```
   - or extend the project with a "top-up" feature (a good exercise, not built here since it wasn't in the original 5-day scope).

7. **Send a successful transfer**
   As User A (now funded), send ₹500 to User B with a note. Confirm:
   - You see the confirmation dialog with the correct recipient, amount, and note before it sends
   - After confirming, you land on the success page showing the new balance
   - A's Dashboard balance dropped by exactly 500; B's Dashboard balance (log in as B) rose by exactly 500

8. **Check transaction history**
   As User A, go to History. Confirm the transfer to B appears, marked "Sent," with the correct amount and timestamp. Switch to the "Received" filter — confirm it's empty for A. Log in as B and confirm the same transaction appears there marked "Received."

9. **Check transaction detail**
   Click into the transaction from the History list. Confirm the detail page shows the same information (amount, note, counterparty, timestamp, transaction ID).

10. **Check a 404**
    Navigate to a nonexistent route, e.g. `http://localhost:5173/this-does-not-exist`. Confirm you see the styled 404 page, not a blank screen.

11. **Check network error handling**
    Stop the backend (`Ctrl+C` in its terminal) and try any action in the frontend (e.g. refresh Dashboard). Confirm you get a clear error toast, not a silent failure or crash.

If all 11 steps behave as described, every feature from Days 1–5 (and the Postgres migration) is working end-to-end.

---

## 6. Testing via Postman

A ready-made collection is at `postman/PayTab.postman_collection.json`.

1. Open Postman → **Import** → select that file.
2. The collection has a `baseUrl` variable pre-set to `http://localhost:8080/api`.
3. Run **Auth → Register** (or **Login** if the account already exists). Copy the `token` from the response.
4. Set the collection's `token` variable to that value (top-right collection settings, or edit the variable directly).
5. Every other request (Wallet, Profile, Transfer, Transaction History) will now automatically include `Authorization: Bearer {{token}}`.
6. Run requests in this order for a full API-level smoke test:
   - Auth → Register
   - Wallet → Get Balance (expect `0.00`)
   - Profile → Get Profile, then Update Profile
   - Transfer → Search Recipient (register a second user first via a second Register call with different details)
   - Transfer → Send Transfer
   - Transaction History → Get History (paginated)
   - Transaction History → Get Transaction By Id (copy a `transactionId` from the history response into the `transactionId` collection variable first)

---

## 7. Verifying the database directly (optional but useful)

Connect with `psql` via Docker:

```bash
docker exec -it paytab-postgres psql -U paytab -d paytab
```

Useful queries once inside:

```sql
-- List all users
SELECT id, full_name, email, phone_number FROM users;

-- Check wallet balances
SELECT u.email, w.balance, w.currency FROM wallets w JOIN users u ON u.id = w.user_id;

-- List all transactions with sender/receiver emails
SELECT t.id, su.email AS sender, ru.email AS receiver, t.amount, t.note, t.created_at
FROM transactions t
JOIN users su ON su.id = t.sender_id
JOIN users ru ON ru.id = t.receiver_id
ORDER BY t.created_at DESC;

-- Confirm the CHECK constraint actually works - this should fail:
UPDATE wallets SET balance = -100;
```

That last query should error with something like `violates check constraint "chk_wallets_balance_non_negative"` — a good way to see the database-level defense-in-depth in action, independent of the application code.

Exit with `\q`.

---

## 8. Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Backend fails to start with a Flyway error | Postgres container isn't up yet, or wrong credentials | `docker ps` to confirm the container is running; re-check env vars against `docker-compose.yml` |
| `Connection refused` on port 5432 | Docker container not started, or a local Postgres install is already using that port | `docker compose up -d`; if port conflict, stop the other Postgres instance or change the mapped port in `docker-compose.yml` |
| Hibernate `ddl-auto: validate` fails on startup | Entities and the Flyway migration are out of sync (shouldn't happen with the bundled code, but would after manual edits) | Compare `V1__init_schema.sql` column names/types against the `@Entity` classes' `@Column` annotations |
| Frontend shows "Could not reach the server" | Backend isn't running, or `VITE_API_BASE_URL` in `.env` is wrong | Confirm backend is up on port 8080; check `frontend/.env` |
| `401` on every request after login | Token not being attached, or expired (24h default) | Check browser localStorage for `paytab_token`; log in again |
| `mvn test` fails to download dependencies | No internet access, or a corporate proxy blocking Maven Central | Ensure your machine (not a sandboxed environment) has normal internet access — this is a genuine local-machine run, not a restricted sandbox |
| Two people register with the same email at the exact same moment and one still gets through | Shouldn't happen — Postgres's unique constraint plus the `DataIntegrityViolationException` handler should catch it as a `409` | If you can reproduce this, it's worth investigating as a real bug, not an expected gap |

---

## 9. What "done" looks like

You should be able to check off all of these:

- [ ] `docker compose up -d` — Postgres container running
- [ ] `mvn spring-boot:run` — backend starts cleanly, Flyway migration applied
- [ ] `mvn test` — all backend tests pass
- [ ] `npm run dev` — frontend starts on port 5173
- [ ] Full manual smoke test (Section 5) — all 11 steps pass
- [ ] Postman collection (Section 6) — every request returns the expected status code
- [ ] Direct database check (Section 7) — data looks correct, `CHECK` constraint verified

If all of the above pass, PayTab is fully working end-to-end on PostgreSQL.

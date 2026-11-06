# PayFlow

**PayFlow** is a full-stack digital wallet, inspired by apps like Paytm and PhonePe. Users can sign up, get a wallet automatically, send money to other users, and track every rupee through a searchable, filterable transaction history, all behind secure JWT authentication.

The main engineering focus is **money correctness**. Balances can never go negative, concurrent transfers can't cause double-spends, and every transfer either fully succeeds or fully rolls back.

---

## Features

| Area | What it does |
|---|---|
| **Authentication** | Register and log in with email and phone. Passwords are hashed with BCrypt, sessions use stateless JWT. |
| **Wallet** | A wallet is created automatically at registration, in the same transaction as the user. Balance API included. |
| **Profile** | View your profile and update your name. Email and phone are immutable. |
| **Send money** | Find a recipient by exact email or phone (shown with a masked identifier), review the transfer in a confirmation dialog, then send. |
| **Transaction history** | Paginated list with Sent/Received filters and date range. Each transaction has a detail page. |
| **Dashboard** | Balance card, Received vs Sent activity chart (7/30/90 days, hover tooltip, table view), quick transfer, wallet summary, weekly and monthly totals, recent activity. |
| **Safety rules** | No self-transfers, no overdrafts, no sending zero or negative amounts, and no reading other users' transactions. |

---

## Tech stack

**Backend**
- Java 21, Spring Boot 3.3
- Spring Security with JWT (jjwt)
- Spring Data JPA (Hibernate)
- PostgreSQL 16 with Flyway migrations
- Lombok, Maven
- JUnit 5, Mockito, MockMvc

**Frontend**
- React 18 with Vite
- React Router, Axios (JWT interceptor)
- Context API for auth state
- Tailwind CSS
- React Hook Form, React Hot Toast
- Hand-built SVG charts (no chart library)

**DevOps**
- GitHub Actions CI for backend (`mvn test`) and frontend (`npm run build`)
- Docker Compose for local Postgres
- Postman collection for every endpoint

---

## How the important parts work

### Atomic, concurrency-safe transfers
A transfer debits one wallet and credits another inside a single `@Transactional` method. The debit is a conditional SQL update:

```sql
UPDATE wallets SET balance = balance - :amount
WHERE user_id = :id AND balance >= :amount
```

If the update affects 0 rows, the balance was too low and the whole transfer rolls back. Because the check and the debit happen in one statement, two simultaneous transfers can't both spend the same money. A database `CHECK (balance >= 0)` constraint backs this up.

### Why PostgreSQL
A ledger is relational by nature. Postgres gives native foreign keys, ACID transactions with no extra server setup, and `NUMERIC` and `CHECK` constraints, which are the idiomatic way to model money. The project originally used MongoDB and was migrated for these reasons.

### Security
- Passwords are stored only as BCrypt hashes.
- Every API route except register and login requires a valid JWT.
- Requesting another user's transaction returns **404, not 403**, so the API doesn't reveal that it exists.
- Recipient search is exact-match only, so users can't enumerate other accounts, and results show a masked identifier.
- CORS is limited to the configured frontend origin.

---

## Architecture

```
React (Vite)  ──HTTP + JWT──▶  Spring Boot API  ──JPA──▶  PostgreSQL
                               Controller → Service → Repository
                               DTOs at every boundary, GlobalExceptionHandler
```

```
paytab/
├── src/                     Spring Boot backend (controllers, services, repositories, entities, security)
├── pom.xml
├── docker-compose.yml       Local PostgreSQL
├── frontend/                React app
│   └── src/
│       ├── api/             Axios instance + per-feature API modules
│       ├── context/         AuthContext
│       ├── components/      Layout, chart, dialogs, rows
│       ├── lib/             Formatting and chart-data helpers
│       └── pages/           Login, Register, Dashboard, Transfer, History, Profile…
├── postman/                 API collection
└── .github/workflows/       CI
```

---

## Getting started

### Prerequisites
- Java 21
- Maven
- Node.js 18 or newer
- PostgreSQL 16 (or Docker)

### 1. Database

**Option A: Docker (easiest)**
```bash
docker compose up -d
```

**Option B: an existing Postgres install.** Create the database once:
```sql
CREATE DATABASE paytab;
```
Flyway then creates all tables automatically on first start. You never run SQL by hand.

### 2. Backend

Set the required environment variables.

**Windows (PowerShell)**
```powershell
$env:POSTGRES_URL="jdbc:postgresql://localhost:5432/paytab"
$env:POSTGRES_USER="paytab"
$env:POSTGRES_PASSWORD="your_password"
$env:JWT_SECRET="replace-with-a-long-random-secret-at-least-32-bytes"
mvn spring-boot:run
```

**macOS / Linux**
```bash
export POSTGRES_URL=jdbc:postgresql://localhost:5432/paytab
export POSTGRES_USER=paytab
export POSTGRES_PASSWORD=your_password
export JWT_SECRET=replace-with-a-long-random-secret-at-least-32-bytes
mvn spring-boot:run
```

The API starts on `http://localhost:8080`.

> Alternatively, copy `src/main/resources/application-local.yml.example` to `application-local.yml`, fill it in, and run with the `local` profile (in PowerShell: `mvn spring-boot:run "-Dspring-boot.run.profiles=local"`).

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env     # only edit if the API isn't on localhost:8080
npm run dev
```

Open `http://localhost:5173`.

### 4. Try it

1. Register two accounts (use a private window for the second one).
2. New wallets start at ₹0, so for testing, add funds directly in the database:
   ```sql
   UPDATE wallets SET balance = 5000
   WHERE user_id = (SELECT id FROM users WHERE email = 'you@example.com');
   ```
3. Send money from one account to the other using the recipient's email or phone, then check both dashboards and transaction histories.

---

## API reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account and wallet, returns JWT |
| POST | `/api/auth/login` | No | Log in, returns JWT |
| GET | `/api/wallet/balance` | Yes | Current balance |
| GET | `/api/profile` | Yes | Your profile |
| PUT | `/api/profile` | Yes | Update full name |
| GET | `/api/users/search?identifier=` | Yes | Exact-match recipient lookup |
| POST | `/api/transfer` | Yes | Send money |
| GET | `/api/transactions` | Yes | Paginated history (`page`, `size`, `direction=ALL\|SENT\|RECEIVED`, `from`, `to`) |
| GET | `/api/transactions/{id}` | Yes | Transaction detail |

Import `postman/PayTab.postman_collection.json` into Postman to try every endpoint.

---

## Testing

```bash
mvn test                       # backend: service, JWT and controller tests (no database needed)
cd frontend && npm run build   # frontend build check
```

Both run automatically in GitHub Actions on every push and pull request.

---

## Roadmap

- Add-money / top-up endpoint and a "Fund account" flow
- Idempotency keys for transfers
- Refresh tokens and logout-everywhere
- Payment requests ("request money")
- Email notifications for received payments

---

## License

Released for learning and portfolio purposes.

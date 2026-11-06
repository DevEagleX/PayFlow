-- Flyway owns the schema; Hibernate runs in "validate" mode against it
-- (see application.yml: spring.jpa.hibernate.ddl-auto=validate). This is
-- the professional-grade approach: schema changes are explicit, reviewable
-- migration files, not something inferred implicitly from entity classes.

CREATE TABLE users (
    id              UUID PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    phone_number    VARCHAR(10)  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_phone_number UNIQUE (phone_number)
);

CREATE TABLE wallets (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL,
    balance         NUMERIC(19,4) NOT NULL,
    currency        VARCHAR(3) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_wallets_user_id UNIQUE (user_id),
    CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id),
    -- Defense in depth: even if application logic somewhere had a bug,
    -- Postgres itself refuses to let a wallet balance go negative. This is
    -- the database-level backstop behind WalletRepository's atomic
    -- conditional UPDATE, not a replacement for it.
    CONSTRAINT chk_wallets_balance_non_negative CHECK (balance >= 0)
);

CREATE TABLE transactions (
    id              UUID PRIMARY KEY,
    sender_id       UUID NOT NULL,
    receiver_id     UUID NOT NULL,
    amount          NUMERIC(19,4) NOT NULL,
    currency        VARCHAR(3) NOT NULL,
    note            VARCHAR(140),
    created_at      TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_transactions_sender FOREIGN KEY (sender_id) REFERENCES users(id),
    CONSTRAINT fk_transactions_receiver FOREIGN KEY (receiver_id) REFERENCES users(id),
    CONSTRAINT chk_transactions_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_transactions_sender ON transactions(sender_id);
CREATE INDEX idx_transactions_receiver ON transactions(receiver_id);

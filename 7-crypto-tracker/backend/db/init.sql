CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    base_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    image VARCHAR(255) NOT NULL,
    coin_id VARCHAR(50) UNIQUE NOT NULL,
    current_price DECIMAL(20,8) NOT NULL,
    price_change_percentage_24h DECIMAL(10,2) NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    coin_id INTEGER REFERENCES coins(id),
    type VARCHAR(10) CHECK (type IN ('BUY', 'SELL')),
    quantity NUMERIC(20,8) NOT NULL,
    price NUMERIC(20,8) NOT NULL,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE holdings (
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    coin_id INTEGER REFERENCES coins(id),
    total_quantity NUMERIC(20,8) DEFAULT 0,
    PRIMARY KEY (portfolio_id, coin_id)
);

CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_portfolio_user ON portfolios(user_id);
CREATE INDEX idx_transaction_portfolio ON transactions(portfolio_id);
CREATE INDEX idx_transaction_coin ON transactions(coin_id);

/* With this schema can easily add:
Portfolio value history
PnL calculation
Multi-currency support
Price snapshots
Alerts
Tax reporting*/
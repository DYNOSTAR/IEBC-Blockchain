-- ─────────────────────────────────────────────────────────────
-- IEBC Blockchain Voting System — Database Schema
-- Run: psql -U postgres -d voting_db -f database.sql
-- ─────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS voters CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS elections CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS counties CASCADE;

-- ── Users ──────────────────────────────────────────────────────
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,          -- bcrypt hash
    role VARCHAR(50) NOT NULL CHECK (role IN ('voter', 'admin', 'iebc_official')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Counties ───────────────────────────────────────────────────
CREATE TABLE counties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    population INTEGER,
    registered_voters INTEGER DEFAULT 0
);

-- ── Elections ──────────────────────────────────────────────────
CREATE TABLE elections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'closed', 'results_published')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Positions ──────────────────────────────────────────────────
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    level VARCHAR(50) CHECK (level IN ('national', 'county', 'constituency', 'ward'))
);

-- ── Candidates ─────────────────────────────────────────────────
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
    position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    party VARCHAR(100),
    symbol VARCHAR(50),
    description TEXT,
    photo_url TEXT,
    county_id INTEGER REFERENCES counties(id)
);

-- ── Voters ─────────────────────────────────────────────────────
CREATE TABLE voters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    national_id VARCHAR(20) UNIQUE NOT NULL,
    polling_station_id VARCHAR(50),
    county_id INTEGER REFERENCES counties(id),
    ward VARCHAR(100),
    has_voted BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Votes ──────────────────────────────────────────────────────
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    voter_id INTEGER REFERENCES voters(id) ON DELETE CASCADE,
    election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
    position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    block_number INTEGER,
    verification_code VARCHAR(50) UNIQUE NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Audit Logs ─────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────────────────────

-- Counties (all 5 sample)
INSERT INTO counties (name, code, population, registered_voters) VALUES
('Nairobi',  '047', 4397073, 2456789),
('Mombasa',  '001', 1208333,  567890),
('Kisumu',   '040', 1155574,  456789),
('Nakuru',   '032', 2163202,  789012),
('Kiambu',   '022', 2417735,  890123);

-- Admin user
-- password: Admin@2027  (bcrypt hash below)
INSERT INTO users (first_name, last_name, email, password, role, is_active) VALUES
('IEBC', 'Administrator', 'admin@iebc.or.ke',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAUjBhmGNrJGp7v2',
 'admin', TRUE);

-- Sample voter 1
-- national_id: 12345678  password: Voter@2027
INSERT INTO users (first_name, last_name, email, password, role, is_active) VALUES
('John', 'Kamau', 'john.kamau@email.com',
 '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'voter', TRUE);

INSERT INTO voters (user_id, national_id, polling_station_id, county_id, ward, has_voted)
VALUES (2, '12345678', 'PS001', 1, 'Kasarani', FALSE);

-- Sample voter 2
-- national_id: 87654321  password: Voter@2027
INSERT INTO users (first_name, last_name, email, password, role, is_active) VALUES
('Jane', 'Wanjiku', 'jane.wanjiku@email.com',
 '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'voter', TRUE);

INSERT INTO voters (user_id, national_id, polling_station_id, county_id, ward, has_voted)
VALUES (3, '87654321', 'PS002', 1, 'Westlands', FALSE);

-- Election (set active NOW for testing — change dates for production)
INSERT INTO elections (name, description, start_date, end_date, status, created_by) VALUES
('Kenya General Election 2027',
 'Multi-level elections for President, Governors, Senators, MPs, Women Representatives, and MCAs',
 NOW() - INTERVAL '1 hour',
 NOW() + INTERVAL '12 hours',
 'active',
 1);

-- Positions
INSERT INTO positions (election_id, title, description, display_order, level) VALUES
(1, 'President of Kenya',        'Vote for the next President of the Republic of Kenya',       1, 'national'),
(1, 'County Governor',           'Vote for your County Governor',                               2, 'county'),
(1, 'Senator',                   'Vote for your County Senator',                                3, 'county'),
(1, 'Member of Parliament',      'Vote for your Constituency Member of Parliament',             4, 'constituency'),
(1, 'Women Representative',      'Vote for your County Women Representative',                   5, 'county'),
(1, 'Member of County Assembly', 'Vote for your Ward MCA',                                      6, 'ward');

-- Presidential candidates
INSERT INTO candidates (election_id, position_id, name, party, symbol, description) VALUES
(1, 1, 'Candidate A', 'UDA',   '🟢', 'United Democratic Alliance candidate'),
(1, 1, 'Candidate B', 'ODM',   '🔴', 'Orange Democratic Movement candidate'),
(1, 1, 'Candidate C', 'Wiper', '🟡', 'Wiper Democratic Movement candidate'),
(1, 1, 'Candidate D', 'Roots', '🌿', 'Roots Party candidate');

-- Governor candidates
INSERT INTO candidates (election_id, position_id, name, party, symbol, description) VALUES
(1, 2, 'Governor Candidate A', 'UDA', '🏗️', 'UDA Governor candidate'),
(1, 2, 'Governor Candidate B', 'ODM', '🤝', 'ODM Governor candidate');

-- Senator candidates
INSERT INTO candidates (election_id, position_id, name, party, symbol, description) VALUES
(1, 3, 'Senator Candidate A', 'ODM', '📚', 'ODM Senator candidate'),
(1, 3, 'Senator Candidate B', 'UDA', '💪', 'UDA Senator candidate');

-- MP candidates
INSERT INTO candidates (election_id, position_id, name, party, symbol, description) VALUES
(1, 4, 'MP Candidate A', 'UDA', '📋', 'UDA MP candidate'),
(1, 4, 'MP Candidate B', 'ODM', '🌹', 'ODM MP candidate');

-- Women Rep candidates
INSERT INTO candidates (election_id, position_id, name, party, symbol, description) VALUES
(1, 5, 'Women Rep Candidate A', 'ODM', '👩‍⚖️', 'ODM Women Representative candidate'),
(1, 5, 'Women Rep Candidate B', 'UDA', '🏛️',  'UDA Women Representative candidate');

-- MCA candidates
INSERT INTO candidates (election_id, position_id, name, party, symbol, description) VALUES
(1, 6, 'MCA Candidate A', 'UDA', '🏘️', 'UDA MCA candidate'),
(1, 6, 'MCA Candidate B', 'ODM', '🏥', 'ODM MCA candidate');
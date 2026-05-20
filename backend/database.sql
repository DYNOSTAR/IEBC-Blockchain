-- ─────────────────────────────────────────────────────────────
-- IEBC Blockchain Voting System — Database Schema
-- Run: psql -U postgres -d voting_db -f database.sql
-- Preferred: node backend/scripts/seedDatabase.js (hashes passwords)
-- ─────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS audit_logs    CASCADE;
DROP TABLE IF EXISTS votes         CASCADE;
DROP TABLE IF EXISTS voters        CASCADE;
DROP TABLE IF EXISTS candidates    CASCADE;
DROP TABLE IF EXISTS positions     CASCADE;
DROP TABLE IF EXISTS elections     CASCADE;
DROP TABLE IF EXISTS wards         CASCADE;
DROP TABLE IF EXISTS constituencies CASCADE;
DROP TABLE IF EXISTS counties      CASCADE;
DROP TABLE IF EXISTS users         CASCADE;

-- ── Users ──────────────────────────────────────────────────────
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE,
    national_id     VARCHAR(20)  UNIQUE,
    password        VARCHAR(255) NOT NULL,
    role            VARCHAR(50)  NOT NULL
        CHECK (role IN ('voter', 'admin', 'iebc_official')),
    phone           VARCHAR(20),
    is_active       BOOLEAN DEFAULT TRUE,
    otp_code        VARCHAR(10),
    otp_expires_at  TIMESTAMP,
    last_login      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Counties ───────────────────────────────────────────────────
CREATE TABLE counties (
    id                 SERIAL PRIMARY KEY,
    name               VARCHAR(100) NOT NULL,
    code               VARCHAR(10)  UNIQUE NOT NULL,
    population         INTEGER,
    registered_voters  INTEGER DEFAULT 0
);

-- ── Constituencies ─────────────────────────────────────────────
CREATE TABLE constituencies (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    county_id  INTEGER REFERENCES counties(id),
    code       VARCHAR(20)
);

-- ── Wards ──────────────────────────────────────────────────────
CREATE TABLE wards (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    constituency_id   INTEGER REFERENCES constituencies(id),
    code              VARCHAR(20)
);

-- ── Elections ──────────────────────────────────────────────────
CREATE TABLE elections (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    start_date  TIMESTAMP NOT NULL,
    end_date    TIMESTAMP NOT NULL,
    status      VARCHAR(50) DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'closed', 'results_published')),
    created_by  INTEGER REFERENCES users(id),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Positions (use `name` — all queries reference p.name) ──────
CREATE TABLE positions (
    id            SERIAL PRIMARY KEY,
    election_id   INTEGER REFERENCES elections(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    display_order INTEGER DEFAULT 0,
    level         VARCHAR(50) CHECK (level IN ('national', 'county', 'constituency', 'ward'))
);

-- ── Candidates ─────────────────────────────────────────────────
-- symbol column stores party abbreviation (UDA, ODM…) — used by
-- all result queries as c.symbol AS party.
CREATE TABLE candidates (
    id                      SERIAL PRIMARY KEY,
    election_id             INTEGER REFERENCES elections(id)     ON DELETE CASCADE,
    position_id             INTEGER REFERENCES positions(id)     ON DELETE CASCADE,
    name                    VARCHAR(255) NOT NULL,
    party                   VARCHAR(100),
    symbol                  VARCHAR(100),   -- party abbreviation used by queries
    description             TEXT,
    photo_url               TEXT,
    is_active               BOOLEAN DEFAULT TRUE,
    blockchain_candidate_id INTEGER,        -- set by setupElection.js after blockchain registration
    county_id               INTEGER REFERENCES counties(id),
    constituency_id         INTEGER REFERENCES constituencies(id),
    ward_id                 INTEGER REFERENCES wards(id)
);

-- ── Voters ─────────────────────────────────────────────────────
CREATE TABLE voters (
    id                 SERIAL PRIMARY KEY,
    user_id            INTEGER REFERENCES users(id)           ON DELETE CASCADE,
    national_id        VARCHAR(20) UNIQUE NOT NULL,
    polling_station_id VARCHAR(50),
    county_id          INTEGER REFERENCES counties(id),
    constituency_id    INTEGER REFERENCES constituencies(id),
    ward_id            INTEGER REFERENCES wards(id),
    has_voted          BOOLEAN DEFAULT FALSE,
    is_verified        BOOLEAN DEFAULT FALSE,
    verification_level INTEGER DEFAULT 0,
    otp_verified       BOOLEAN DEFAULT FALSE,
    biometric_verified BOOLEAN DEFAULT FALSE,
    id_card_path       TEXT,
    face_image_path    TEXT,
    registered_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Votes ──────────────────────────────────────────────────────
-- Uses created_at (not voted_at) — all backend queries reference created_at
CREATE TABLE votes (
    id                SERIAL PRIMARY KEY,
    voter_id          INTEGER REFERENCES voters(id)     ON DELETE CASCADE,
    election_id       INTEGER REFERENCES elections(id)  ON DELETE CASCADE,
    position_id       INTEGER REFERENCES positions(id)  ON DELETE CASCADE,
    candidate_id      INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    transaction_hash  VARCHAR(255) UNIQUE NOT NULL,
    block_number      INTEGER,
    verification_code VARCHAR(50)  UNIQUE NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Audit Logs ─────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id),
    action     VARCHAR(255) NOT NULL,
    details    TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────────────────────

-- ── Admin user ─────────────────────────────────────────────────
-- password: Admin@2027
INSERT INTO users (first_name, last_name, email, password, role, is_active) VALUES
('IEBC', 'Administrator', 'admin@iebc.or.ke',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeAUjBhmGNrJGp7v2',
 'admin', TRUE);

-- ── Counties ───────────────────────────────────────────────────
INSERT INTO counties (name, code, population, registered_voters) VALUES
('Nairobi',  '047', 4397073, 2456789),
('Mombasa',  '001', 1208333,  567890),
('Kisumu',   '040', 1155574,  456789),
('Nakuru',   '032', 2163202,  789012),
('Kiambu',   '022', 2417735,  890123);
-- Assigned IDs: Nairobi=1, Mombasa=2, Kisumu=3, Nakuru=4, Kiambu=5

-- ── Constituencies (2 per county) ──────────────────────────────
INSERT INTO constituencies (name, county_id, code) VALUES
('Westlands',        1, 'C-WL'),   -- id=1
('Kasarani',         1, 'C-KS'),   -- id=2
('Mvita',            2, 'C-MV'),   -- id=3
('Likoni',           2, 'C-LK'),   -- id=4
('Kisumu Central',   3, 'C-KC'),   -- id=5
('Kisumu East',      3, 'C-KE'),   -- id=6
('Nakuru Town East', 4, 'C-NE'),   -- id=7
('Nakuru Town West', 4, 'C-NW'),   -- id=8
('Thika Town',       5, 'C-TT'),   -- id=9
('Ruiru',            5, 'C-RU');   -- id=10

-- ── Wards (2 per constituency) ─────────────────────────────────
INSERT INTO wards (name, constituency_id, code) VALUES
('Parklands',      1, 'W-PL'),    -- id=1  Westlands
('Highridge',      1, 'W-HR'),    -- id=2  Westlands
('Mirema',         2, 'W-MI'),    -- id=3  Kasarani
('Clay City',      2, 'W-CC'),    -- id=4  Kasarani
('Tudor',          3, 'W-TD'),    -- id=5  Mvita
('Tononoka',       3, 'W-TN'),    -- id=6  Mvita
('Mtongwe',        4, 'W-MT'),    -- id=7  Likoni
('Shika Adabu',    4, 'W-SA'),    -- id=8  Likoni
('Kondele',        5, 'W-KN'),    -- id=9  Kisumu Central
('Kaloleni',       5, 'W-KL'),    -- id=10 Kisumu Central
('Kolwa Central',  6, 'W-KC'),    -- id=11 Kisumu East
('Manyatta B',     6, 'W-MB'),    -- id=12 Kisumu East
('Biashara',       7, 'W-BN'),    -- id=13 Nakuru Town East
('Kivumbini',      7, 'W-KV'),    -- id=14 Nakuru Town East
('Kaptembwo',      8, 'W-KP'),    -- id=15 Nakuru Town West
('Shauri Yako',    8, 'W-SY'),    -- id=16 Nakuru Town West
('Kamenu',         9, 'W-KM'),    -- id=17 Thika Town
('Gatuanyaga',     9, 'W-GT'),    -- id=18 Thika Town
('Gitothua',      10, 'W-GH'),    -- id=19 Ruiru
('Biashara Ruiru',10, 'W-BR');    -- id=20 Ruiru

-- ── Election ───────────────────────────────────────────────────
-- created_by=1 (admin)
INSERT INTO elections (name, description, start_date, end_date, status, created_by) VALUES
('Kenya General Election 2027',
 'General election for President, Governors, Senators, MPs, Women Representatives and MCAs',
 NOW() - INTERVAL '1 hour',
 NOW() + INTERVAL '12 hours',
 'active', 1);
-- Assigned ID: 1

-- ── Positions (election_id=1) ──────────────────────────────────
INSERT INTO positions (election_id, name, description, display_order, level) VALUES
(1, 'President of Kenya',        'Vote for the next President of the Republic of Kenya',    1, 'national'),
(1, 'Governor',                  'Vote for your County Governor',                           2, 'county'),
(1, 'Senator',                   'Vote for your County Senator',                            3, 'county'),
(1, 'Member of Parliament',      'Vote for your Constituency Member of Parliament',         4, 'constituency'),
(1, 'Women Representative',      'Vote for your County Women Representative',               5, 'county'),
(1, 'Member of County Assembly', 'Vote for your Ward Member of County Assembly',            6, 'ward');
-- Assigned IDs: President=1, Governor=2, Senator=3, MP=4, WomenRep=5, MCA=6

-- ─────────────────────────────────────────────────────────────
-- CANDIDATES
-- blockchain_candidate_id assigned by setupElection.js.
-- Order: Presidential → Governor → Senator → Women Rep → MP → MCA
-- symbol column = party abbreviation (used by results queries as c.symbol AS party)
-- ─────────────────────────────────────────────────────────────

-- ── Presidential (position_id=1, national — no location fields) ─
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active) VALUES
(1, 1, 'William Ruto',     'UDA',   'UDA',   'United Democratic Alliance presidential candidate',  TRUE),
(1, 1, 'Raila Odinga',     'ODM',   'ODM',   'Orange Democratic Movement presidential candidate',  TRUE),
(1, 1, 'Kalonzo Musyoka',  'Wiper', 'Wiper', 'Wiper Democratic Movement presidential candidate',   TRUE),
(1, 1, 'George Wajackoyah','Roots', 'Roots', 'Roots Party presidential candidate',                 TRUE);
-- blockchain_candidate_id: 1, 2, 3, 4

-- ── Governors (position_id=2, county-level — county_id required) ─
-- Nairobi (county_id=1)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 2, 'Johnson Sakaja',   'UDA', 'UDA', 'UDA Governor candidate for Nairobi County',  TRUE, 1),
(1, 2, 'Timothy Wanyonyi', 'ODM', 'ODM', 'ODM Governor candidate for Nairobi County',  TRUE, 1);
-- blockchain_candidate_id: 5, 6

-- Mombasa (county_id=2)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 2, 'Abdulswamad Nassir', 'ODM',     'ODM',     'ODM Governor candidate for Mombasa County', TRUE, 2),
(1, 2, 'Hassan Omar Hassan', 'Jubilee', 'Jubilee', 'Jubilee Governor candidate for Mombasa County', TRUE, 2);
-- blockchain_candidate_id: 7, 8

-- Kisumu (county_id=3)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 2, 'Anyang Nyong''o', 'ODM', 'ODM', 'ODM Governor candidate for Kisumu County', TRUE, 3),
(1, 2, 'Jane Akinyi',     'UDA', 'UDA', 'UDA Governor candidate for Kisumu County', TRUE, 3);
-- blockchain_candidate_id: 9, 10

-- Nakuru (county_id=4)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 2, 'Susan Kihika',   'UDA',     'UDA',     'UDA Governor candidate for Nakuru County',     TRUE, 4),
(1, 2, 'Lee Kinyanjui',  'Jubilee', 'Jubilee', 'Jubilee Governor candidate for Nakuru County', TRUE, 4);
-- blockchain_candidate_id: 11, 12

-- Kiambu (county_id=5)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 2, 'Kimani Wamatangi', 'UDA',     'UDA',     'UDA Governor candidate for Kiambu County',     TRUE, 5),
(1, 2, 'Grace Waruguru',   'Jubilee', 'Jubilee', 'Jubilee Governor candidate for Kiambu County', TRUE, 5);
-- blockchain_candidate_id: 13, 14

-- ── Senators (position_id=3, county-level — county_id required) ─
-- Nairobi (county_id=1)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 3, 'Edwin Sifuna',    'ODM', 'ODM', 'ODM Senator candidate for Nairobi County', TRUE, 1),
(1, 3, 'Millicent Omanga','UDA', 'UDA', 'UDA Senator candidate for Nairobi County', TRUE, 1);
-- blockchain_candidate_id: 15, 16

-- Mombasa (county_id=2)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 3, 'Mohamed Faki',     'ODM',     'ODM',     'ODM Senator candidate for Mombasa County',     TRUE, 2),
(1, 3, 'Rashid Bedzimba',  'Jubilee', 'Jubilee', 'Jubilee Senator candidate for Mombasa County', TRUE, 2);
-- blockchain_candidate_id: 17, 18

-- Kisumu (county_id=3)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 3, 'Oburu Oginga', 'ODM', 'ODM', 'ODM Senator candidate for Kisumu County', TRUE, 3),
(1, 3, 'Alice Otieno', 'UDA', 'UDA', 'UDA Senator candidate for Kisumu County', TRUE, 3);
-- blockchain_candidate_id: 19, 20

-- Nakuru (county_id=4)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 3, 'Samson Cherargei', 'UDA',     'UDA',     'UDA Senator candidate for Nakuru County',     TRUE, 4),
(1, 3, 'Kioni Ndungu',     'Jubilee', 'Jubilee', 'Jubilee Senator candidate for Nakuru County', TRUE, 4);
-- blockchain_candidate_id: 21, 22

-- Kiambu (county_id=5)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 3, 'Karungo Thang''wa', 'UDA', 'UDA', 'UDA Senator candidate for Kiambu County', TRUE, 5),
(1, 3, 'Mary Wanjiku',      'ODM', 'ODM', 'ODM Senator candidate for Kiambu County', TRUE, 5);
-- blockchain_candidate_id: 23, 24

-- ── Women Reps (position_id=5, county-level — county_id required) ─
-- Nairobi (county_id=1)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 5, 'Esther Passaris', 'ODM', 'ODM', 'ODM Women Rep candidate for Nairobi County', TRUE, 1),
(1, 5, 'Rachel Shebesh',  'UDA', 'UDA', 'UDA Women Rep candidate for Nairobi County', TRUE, 1);
-- blockchain_candidate_id: 25, 26

-- Mombasa (county_id=2)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 5, 'Asha Hussein',   'ODM',     'ODM',     'ODM Women Rep candidate for Mombasa County',     TRUE, 2),
(1, 5, 'Amina Mohamed',  'Jubilee', 'Jubilee', 'Jubilee Women Rep candidate for Mombasa County', TRUE, 2);
-- blockchain_candidate_id: 27, 28

-- Kisumu (county_id=3)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 5, 'Linet Toto',   'UDA', 'UDA', 'UDA Women Rep candidate for Kisumu County', TRUE, 3),
(1, 5, 'Ruth Odinga',  'ODM', 'ODM', 'ODM Women Rep candidate for Kisumu County', TRUE, 3);
-- blockchain_candidate_id: 29, 30

-- Nakuru (county_id=4)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 5, 'Liza Chelule',     'UDA',     'UDA',     'UDA Women Rep candidate for Nakuru County',     TRUE, 4),
(1, 5, 'Hellen Chepkwony', 'Jubilee', 'Jubilee', 'Jubilee Women Rep candidate for Nakuru County', TRUE, 4);
-- blockchain_candidate_id: 31, 32

-- Kiambu (county_id=5)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id) VALUES
(1, 5, 'Alice Ng''ang''a', 'Jubilee', 'Jubilee', 'Jubilee Women Rep candidate for Kiambu County', TRUE, 5),
(1, 5, 'Lydia Githiomi',   'UDA',     'UDA',     'UDA Women Rep candidate for Kiambu County',     TRUE, 5);
-- blockchain_candidate_id: 33, 34

-- ── MPs (position_id=4, constituency-level — constituency_id required) ─
-- Westlands (constituency_id=1)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id) VALUES
(1, 4, 'Tim Wanyonyi',  'ODM', 'ODM', 'ODM MP candidate for Westlands', TRUE, 1, 1),
(1, 4, 'Jane Wangechi', 'UDA', 'UDA', 'UDA MP candidate for Westlands', TRUE, 1, 1);
-- blockchain_candidate_id: 35, 36

-- Kasarani (constituency_id=2)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id) VALUES
(1, 4, 'Ronald Karauri', 'UDA', 'UDA', 'UDA MP candidate for Kasarani', TRUE, 1, 2),
(1, 4, 'Peter Kariuki',  'ODM', 'ODM', 'ODM MP candidate for Kasarani', TRUE, 1, 2);
-- blockchain_candidate_id: 37, 38

-- Mvita (constituency_id=3)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id) VALUES
(1, 4, 'Abdulrahman Wandati', 'ODM',     'ODM',     'ODM MP candidate for Mvita', TRUE, 2, 3),
(1, 4, 'Ali Mwangi',          'Jubilee', 'Jubilee', 'Jubilee MP candidate for Mvita', TRUE, 2, 3);
-- blockchain_candidate_id: 39, 40

-- Likoni (constituency_id=4)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id) VALUES
(1, 4, 'Mishi Mboko',  'ODM',     'ODM',     'ODM MP candidate for Likoni', TRUE, 2, 4),
(1, 4, 'Hassan Joho',  'Jubilee', 'Jubilee', 'Jubilee MP candidate for Likoni', TRUE, 2, 4);
-- blockchain_candidate_id: 41, 42

-- Kisumu Central (constituency_id=5)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id) VALUES
(1, 4, 'Joshua Oron',  'ODM', 'ODM', 'ODM MP candidate for Kisumu Central', TRUE, 3, 5),
(1, 4, 'Peter Owino',  'UDA', 'UDA', 'UDA MP candidate for Kisumu Central', TRUE, 3, 5);
-- blockchain_candidate_id: 43, 44

-- Kisumu East (constituency_id=6)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id) VALUES
(1, 4, 'Shakeel Shabbir', 'ODM', 'ODM', 'ODM MP candidate for Kisumu East', TRUE, 3, 6),
(1, 4, 'Mary Achieng',    'UDA', 'UDA', 'UDA MP candidate for Kisumu East', TRUE, 3, 6);
-- blockchain_candidate_id: 45, 46

-- Nakuru Town East (constituency_id=7)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id) VALUES
(1, 4, 'David Gikaria', 'Jubilee', 'Jubilee', 'Jubilee MP candidate for Nakuru Town East', TRUE, 4, 7),
(1, 4, 'Anne Ng''ang''a', 'UDA', 'UDA', 'UDA MP candidate for Nakuru Town East', TRUE, 4, 7);
-- blockchain_candidate_id: 47, 48

-- Nakuru Town West (constituency_id=8)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id) VALUES
(1, 4, 'Samuel Arama',     'UDA',     'UDA',     'UDA MP candidate for Nakuru Town West',     TRUE, 4, 8),
(1, 4, 'Grace Chepkurui',  'Jubilee', 'Jubilee', 'Jubilee MP candidate for Nakuru Town West', TRUE, 4, 8);
-- blockchain_candidate_id: 49, 50

-- Thika Town (constituency_id=9)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id) VALUES
(1, 4, 'Patrick Wainaina', 'UDA',     'UDA',     'UDA MP candidate for Thika Town',     TRUE, 5, 9),
(1, 4, 'Alice Kinuthia',   'Jubilee', 'Jubilee', 'Jubilee MP candidate for Thika Town', TRUE, 5, 9);
-- blockchain_candidate_id: 51, 52

-- Ruiru (constituency_id=10)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id) VALUES
(1, 4, 'Simon King''ara', 'UDA', 'UDA', 'UDA MP candidate for Ruiru', TRUE, 5, 10),
(1, 4, 'Jane Njeri',      'ODM', 'ODM', 'ODM MP candidate for Ruiru', TRUE, 5, 10);
-- blockchain_candidate_id: 53, 54

-- ── MCAs (position_id=6, ward-level — ward_id + constituency_id + county_id required) ─
-- Ward 1 — Parklands (constituency_id=1 Westlands, county_id=1 Nairobi)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'James Njoroge', 'UDA', 'UDA', 'UDA MCA candidate for Parklands Ward', TRUE, 1, 1, 1),
(1, 6, 'Lucy Wanjiru',  'ODM', 'ODM', 'ODM MCA candidate for Parklands Ward', TRUE, 1, 1, 1);
-- blockchain_candidate_id: 55, 56

-- Ward 2 — Highridge (constituency_id=1, county_id=1)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Peter Kamau',  'UDA', 'UDA', 'UDA MCA candidate for Highridge Ward', TRUE, 1, 1, 2),
(1, 6, 'Alice Mwangi', 'ODM', 'ODM', 'ODM MCA candidate for Highridge Ward', TRUE, 1, 1, 2);
-- blockchain_candidate_id: 57, 58

-- Ward 3 — Mirema (constituency_id=2 Kasarani, county_id=1)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'John Karanja',  'ODM', 'ODM', 'ODM MCA candidate for Mirema Ward', TRUE, 1, 2, 3),
(1, 6, 'Sarah Otieno',  'UDA', 'UDA', 'UDA MCA candidate for Mirema Ward', TRUE, 1, 2, 3);
-- blockchain_candidate_id: 59, 60

-- Ward 4 — Clay City (constituency_id=2, county_id=1)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Michael Mutua', 'UDA',     'UDA',     'UDA MCA candidate for Clay City Ward', TRUE, 1, 2, 4),
(1, 6, 'Jane Njoki',    'Jubilee', 'Jubilee', 'Jubilee MCA candidate for Clay City Ward', TRUE, 1, 2, 4);
-- blockchain_candidate_id: 61, 62

-- Ward 5 — Tudor (constituency_id=3 Mvita, county_id=2 Mombasa)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Ahmed Omar',   'ODM',     'ODM',     'ODM MCA candidate for Tudor Ward', TRUE, 2, 3, 5),
(1, 6, 'Fatuma Said',  'Jubilee', 'Jubilee', 'Jubilee MCA candidate for Tudor Ward', TRUE, 2, 3, 5);
-- blockchain_candidate_id: 63, 64

-- Ward 6 — Tononoka (constituency_id=3, county_id=2)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Ali Hassan',     'ODM',     'ODM',     'ODM MCA candidate for Tononoka Ward',     TRUE, 2, 3, 6),
(1, 6, 'Mwanaisha Ali',  'Jubilee', 'Jubilee', 'Jubilee MCA candidate for Tononoka Ward', TRUE, 2, 3, 6);
-- blockchain_candidate_id: 65, 66

-- Ward 7 — Mtongwe (constituency_id=4 Likoni, county_id=2)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Suleiman Dori',  'ODM',     'ODM',     'ODM MCA candidate for Mtongwe Ward',     TRUE, 2, 4, 7),
(1, 6, 'Hadija Mohamed', 'Jubilee', 'Jubilee', 'Jubilee MCA candidate for Mtongwe Ward', TRUE, 2, 4, 7);
-- blockchain_candidate_id: 67, 68

-- Ward 8 — Shika Adabu (constituency_id=4, county_id=2)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Rashid Katana', 'Jubilee', 'Jubilee', 'Jubilee MCA candidate for Shika Adabu Ward', TRUE, 2, 4, 8),
(1, 6, 'Amina Soud',    'ODM',     'ODM',     'ODM MCA candidate for Shika Adabu Ward',    TRUE, 2, 4, 8);
-- blockchain_candidate_id: 69, 70

-- Ward 9 — Kondele (constituency_id=5 Kisumu Central, county_id=3 Kisumu)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Fredrick Ochieng', 'ODM', 'ODM', 'ODM MCA candidate for Kondele Ward', TRUE, 3, 5, 9),
(1, 6, 'Grace Aloo',       'UDA', 'UDA', 'UDA MCA candidate for Kondele Ward', TRUE, 3, 5, 9);
-- blockchain_candidate_id: 71, 72

-- Ward 10 — Kaloleni (constituency_id=5, county_id=3)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Vincent Otieno',   'ODM', 'ODM', 'ODM MCA candidate for Kaloleni Ward', TRUE, 3, 5, 10),
(1, 6, 'Margaret Adhiambo','UDA', 'UDA', 'UDA MCA candidate for Kaloleni Ward', TRUE, 3, 5, 10);
-- blockchain_candidate_id: 73, 74

-- Ward 11 — Kolwa Central (constituency_id=6 Kisumu East, county_id=3)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Charles Onyango',  'ODM', 'ODM', 'ODM MCA candidate for Kolwa Central Ward', TRUE, 3, 6, 11),
(1, 6, 'Beatrice Akinyi',  'UDA', 'UDA', 'UDA MCA candidate for Kolwa Central Ward', TRUE, 3, 6, 11);
-- blockchain_candidate_id: 75, 76

-- Ward 12 — Manyatta B (constituency_id=6, county_id=3)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Samuel Oloo',   'ODM', 'ODM', 'ODM MCA candidate for Manyatta B Ward', TRUE, 3, 6, 12),
(1, 6, 'Patricia Were', 'UDA', 'UDA', 'UDA MCA candidate for Manyatta B Ward', TRUE, 3, 6, 12);
-- blockchain_candidate_id: 77, 78

-- Ward 13 — Biashara (constituency_id=7 Nakuru Town East, county_id=4 Nakuru)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'David Kimutai',      'UDA',     'UDA',     'UDA MCA candidate for Biashara Ward (Nakuru)',     TRUE, 4, 7, 13),
(1, 6, 'Elizabeth Chepkorir','Jubilee', 'Jubilee', 'Jubilee MCA candidate for Biashara Ward (Nakuru)', TRUE, 4, 7, 13);
-- blockchain_candidate_id: 79, 80

-- Ward 14 — Kivumbini (constituency_id=7, county_id=4)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Joseph Nganga',   'Jubilee', 'Jubilee', 'Jubilee MCA candidate for Kivumbini Ward', TRUE, 4, 7, 14),
(1, 6, 'Catherine Wanjiku','UDA',    'UDA',     'UDA MCA candidate for Kivumbini Ward',     TRUE, 4, 7, 14);
-- blockchain_candidate_id: 81, 82

-- Ward 15 — Kaptembwo (constituency_id=8 Nakuru Town West, county_id=4)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Robert Koech',  'UDA',     'UDA',     'UDA MCA candidate for Kaptembwo Ward',     TRUE, 4, 8, 15),
(1, 6, 'Dorcas Chebii', 'Jubilee', 'Jubilee', 'Jubilee MCA candidate for Kaptembwo Ward', TRUE, 4, 8, 15);
-- blockchain_candidate_id: 83, 84

-- Ward 16 — Shauri Yako (constituency_id=8, county_id=4)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Stephen Mutai', 'UDA',     'UDA',     'UDA MCA candidate for Shauri Yako Ward',     TRUE, 4, 8, 16),
(1, 6, 'Nancy Rotich',  'Jubilee', 'Jubilee', 'Jubilee MCA candidate for Shauri Yako Ward', TRUE, 4, 8, 16);
-- blockchain_candidate_id: 85, 86

-- Ward 17 — Kamenu (constituency_id=9 Thika Town, county_id=5 Kiambu)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Paul Muigai',    'UDA',     'UDA',     'UDA MCA candidate for Kamenu Ward',     TRUE, 5, 9, 17),
(1, 6, 'Hannah Wanjiru', 'Jubilee', 'Jubilee', 'Jubilee MCA candidate for Kamenu Ward', TRUE, 5, 9, 17);
-- blockchain_candidate_id: 87, 88

-- Ward 18 — Gatuanyaga (constituency_id=9, county_id=5)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'George Kamau',  'Jubilee', 'Jubilee', 'Jubilee MCA candidate for Gatuanyaga Ward', TRUE, 5, 9, 18),
(1, 6, 'Rose Njeri',    'UDA',     'UDA',     'UDA MCA candidate for Gatuanyaga Ward',     TRUE, 5, 9, 18);
-- blockchain_candidate_id: 89, 90

-- Ward 19 — Gitothua (constituency_id=10 Ruiru, county_id=5)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Daniel Mwangi', 'UDA',     'UDA',     'UDA MCA candidate for Gitothua Ward',     TRUE, 5, 10, 19),
(1, 6, 'Joyce Njoki',   'Jubilee', 'Jubilee', 'Jubilee MCA candidate for Gitothua Ward', TRUE, 5, 10, 19);
-- blockchain_candidate_id: 91, 92

-- Ward 20 — Biashara Ruiru (constituency_id=10, county_id=5)
INSERT INTO candidates (election_id, position_id, name, party, symbol, description, is_active, county_id, constituency_id, ward_id) VALUES
(1, 6, 'Simon Kariuki', 'Jubilee', 'Jubilee', 'Jubilee MCA candidate for Biashara Ruiru Ward', TRUE, 5, 10, 20),
(1, 6, 'Ann Njuguna',   'UDA',     'UDA',     'UDA MCA candidate for Biashara Ruiru Ward',     TRUE, 5, 10, 20);
-- blockchain_candidate_id: 93, 94

-- ─────────────────────────────────────────────────────────────
-- SAMPLE VOTERS
-- password for all voters: Voter@1234
-- Hash below was generated with bcrypt cost=12. For accurate hashes run:
--   node backend/scripts/seedDatabase.js
-- ─────────────────────────────────────────────────────────────

-- User 2: voter (Nairobi / Westlands / Parklands)
INSERT INTO users (first_name, last_name, email, national_id, password, role, is_active) VALUES
('John', 'Kamau', 'john.kamau@example.com', '12345678',
 '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'voter', TRUE);
INSERT INTO voters (user_id, national_id, polling_station_id, county_id, constituency_id, ward_id, has_voted) VALUES
(2, '12345678', 'PS001', 1, 1, 1, FALSE);

-- User 3: voter (Nairobi / Kasarani / Mirema)
INSERT INTO users (first_name, last_name, email, national_id, password, role, is_active) VALUES
('Jane', 'Wanjiku', 'jane.wanjiku@example.com', '87654321',
 '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'voter', TRUE);
INSERT INTO voters (user_id, national_id, polling_station_id, county_id, constituency_id, ward_id, has_voted) VALUES
(3, '87654321', 'PS002', 1, 2, 3, FALSE);

-- User 4: voter (Mombasa / Mvita / Tudor)
INSERT INTO users (first_name, last_name, email, national_id, password, role, is_active) VALUES
('Peter', 'Omondi', 'peter.omondi@example.com', '11223344',
 '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'voter', TRUE);
INSERT INTO voters (user_id, national_id, polling_station_id, county_id, constituency_id, ward_id, has_voted) VALUES
(4, '11223344', 'PS003', 2, 3, 5, FALSE);

-- User 5: voter (Kisumu / Kisumu Central / Kondele)
INSERT INTO users (first_name, last_name, email, national_id, password, role, is_active) VALUES
('Mary', 'Chebet', 'mary.chebet@example.com', '44332211',
 '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'voter', TRUE);
INSERT INTO voters (user_id, national_id, polling_station_id, county_id, constituency_id, ward_id, has_voted) VALUES
(5, '44332211', 'PS004', 3, 5, 9, FALSE);

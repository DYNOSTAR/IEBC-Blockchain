-- Drop existing tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS voters CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS elections CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS counties CASCADE;

-- Create users table (for both voters and admins)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('voter', 'admin', 'iebc_official')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create counties table
CREATE TABLE counties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    population INTEGER,
    registered_voters INTEGER DEFAULT 0
);

-- Create elections table
CREATE TABLE elections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create positions table
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    level VARCHAR(50) CHECK (level IN ('national', 'county', 'constituency', 'ward'))
);

-- Create candidates table
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
    position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    party VARCHAR(100),
    symbol VARCHAR(50),
    description TEXT,
    image_url TEXT,
    county_id INTEGER REFERENCES counties(id)
);

-- Create voters table
CREATE TABLE voters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    national_id VARCHAR(20) UNIQUE NOT NULL,
    polling_station_id VARCHAR(50),
    county_id INTEGER REFERENCES counties(id),
    constituency_id INTEGER REFERENCES counties(id),
    ward VARCHAR(100),
    has_voted BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(50),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table (for blockchain record keeping)
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    voter_id INTEGER REFERENCES voters(id) ON DELETE CASCADE,
    election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
    position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    block_number INTEGER,
    verification_code VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample counties
INSERT INTO counties (name, code, population, registered_voters) VALUES
('Nairobi', '001', 4397073, 2456789),
('Mombasa', '002', 1208333, 567890),
('Kisumu', '003', 1155574, 456789),
('Nakuru', '004', 2163202, 789012),
('Kiambu', '005', 2417735, 890123);

-- Insert sample admin user (password: Admin@2027!)
-- Note: Use bcrypt hash. This is a sample hash for 'Admin@2027!'
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) VALUES
('iebc_admin', 'admin@iebc.or.ke', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrCqVqE5RqJkYVcFQrLqWpVZfYqXvK6', 'IEBC', 'Administrator', 'admin', TRUE);

-- Insert sample voters
-- Password for voters is 'Voter@2027!' (hash: $2a$10$rQKjqLxgZgMZgMZgMZgMZu)
INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active) VALUES
('john.doe', 'john.doe@email.com', '$2a$10$rQKjqLxgZgMZgMZgMZgMZu', 'John', 'Doe', 'voter', TRUE),
('jane.smith', 'jane.smith@email.com', '$2a$10$rQKjqLxgZgMZgMZgMZgMZu', 'Jane', 'Smith', 'voter', TRUE);

INSERT INTO voters (user_id, national_id, polling_station_id, county_id, constituency_id, ward, has_voted) VALUES
(2, '12345678', 'PS001', 1, 1, 'Kasarani', FALSE),
(3, '87654321', 'PS002', 1, 1, 'Westlands', FALSE);

-- Insert sample election
INSERT INTO elections (name, description, start_date, end_date, status, created_by) VALUES
('Kenya General Election 2027', 
 'Multi-level elections for President, Governors, Senators, MPs, MCAs, and Women Representatives',
 '2027-08-09 06:00:00',
 '2027-08-09 17:00:00',
 'upcoming',
 1);

-- Insert positions for Kenya elections
INSERT INTO positions (election_id, title, description, display_order, level) VALUES
(1, 'President of Kenya', 'Vote for the next President of the Republic of Kenya', 1, 'national'),
(1, 'County Governor', 'Vote for your County Governor', 2, 'county'),
(1, 'Senator', 'Vote for your County Senator', 3, 'county'),
(1, 'Member of Parliament', 'Vote for your Constituency Member of Parliament', 4, 'constituency'),
(1, 'Women Representative', 'Vote for your County Women Representative', 5, 'county'),
(1, 'Member of County Assembly', 'Vote for your Ward MCA', 6, 'ward');

-- Insert sample candidates
INSERT INTO candidates (election_id, position_id, name, party, symbol, description) VALUES
(1, 1, 'William Ruto', 'UDA', '🟢', 'Current President seeking re-election'),
(1, 1, 'Raila Odinga', 'ODM', '🔴', 'Veteran opposition leader and former Prime Minister'),
(1, 1, 'Kalonzo Musyoka', 'Wiper', '🟡', 'Former Vice President'),
(1, 1, 'George Wajackoyah', 'Roots', '🌿', 'Roots Party candidate'),
(1, 2, 'Johnson Sakaja', 'UDA', '🏗️', 'Current Nairobi Governor'),
(1, 2, 'Timothy Wanyonyi', 'ODM', '🤝', 'Westlands MP'),
(1, 3, 'Edwin Sifuna', 'ODM', '📚', 'Current Nairobi Senator'),
(1, 3, 'Millicent Omanga', 'UDA', '💪', 'Former nominated Senator');
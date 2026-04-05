-- IEBC Blockchain Voting System Database Schema

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'voter')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create voters table
CREATE TABLE voters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    national_id VARCHAR(50) UNIQUE NOT NULL,
    county VARCHAR(100),
    constituency VARCHAR(100),
    polling_station_id INTEGER,
    has_voted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admins table
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(100),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create candidates table
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    party VARCHAR(100) NOT NULL,
    symbol VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    voter_id INTEGER NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id),
    transaction_hash VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create elections table
CREATE TABLE elections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'ended')),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_voters_national_id ON voters(national_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);
CREATE INDEX idx_votes_candidate_id ON votes(candidate_id);
CREATE INDEX idx_candidates_name ON candidates(name);

-- Insert sample admin user (password: admin123)
-- Use bcrypt to hash: $2a$10$... (example hash)
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('admin@iebc.or.ke', '$2a$10$7JzH8qzqq8qzqzqzqzqzqO7JzH8qzqzq8qzqzqzqzqzqzqzqzqzqzqz', 'IEBC', 'Administrator', 'admin');

INSERT INTO admins (user_id, position, department)
VALUES (1, 'Chief Elections Officer', 'Elections Management');

-- Insert sample voter users (password: voter123)
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES 
('voter1@test.com', '$2a$10$7JzH8qzqq8qzqzqzqzqzqO7JzH8qzqzq8qzqzqzqzqzqzqzqzqzqzqz', 'John', 'Doe', 'voter'),
('voter2@test.com', '$2a$10$7JzH8qzqq8qzqzqzqzqzqO7JzH8qzqzq8qzqzqzqzqzqzqzqzqzqzqz', 'Jane', 'Smith', 'voter'),
('voter3@test.com', '$2a$10$7JzH8qzqq8qzqzqzqzqzqO7JzH8qzqzq8qzqzqzqzqzqzqzqzqzqzqz', 'Ahmed', 'Hassan', 'voter');

-- Insert voters
INSERT INTO voters (user_id, national_id, county, constituency, polling_station_id)
VALUES 
(2, '25874123', 'Nairobi', 'Starehe', 1),
(3, '34521098', 'Kiambu', 'Limuru', 2),
(4, '45632187', 'Mombasa', 'Mombasa', 3);

-- Insert sample candidates
INSERT INTO candidates (name, party, symbol)
VALUES 
('John Kipchoge', 'Democratic Alliance', '🦁'),
('Mary Wanjiru', 'Progressive Movement', '🌟'),
('Ahmed Hassan', 'Unity Coalition', '🕊️');

-- Insert sample election
INSERT INTO elections (name, status, start_date, end_date)
VALUES ('2027 General Election', 'upcoming', '2027-08-09 08:00:00', '2027-08-09 17:00:00');

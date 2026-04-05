# Database Setup Guide

## 🗄️ Database Schema

The system now uses actual PostgreSQL database for storing users, voters, and admins. No more hardcoded credentials!

### Tables Created:
1. **users** - Base user records (admins & voters)
2. **voters** - Voter-specific information
3. **admins** - Admin-specific information
4. **candidates** - Election candidates
5. **votes** - Recorded votes
6. **elections** - Election information

## 📋 Setup Steps

### Step 1: Create Database
```sql
CREATE DATABASE voting_db;
```

### Step 2: Run Database Schema
```sql
psql -U postgres -d voting_db -f backend/database.sql
```

Or copy and paste the SQL from `backend/database.sql` into your PostgreSQL client.

### Step 3: Verify Environment Variables
Make sure your `.env` file has these variables set:
```bash
DB_USER=postgres
DB_HOST=localhost
DB_NAME=voting_db
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_super_secret_key_change_this
PORT=5000
```

### Step 4: Seed Database with Sample Data
From the backend directory:
```bash
npm run seed
```

This will create:
- 1 Admin user
- 5 Voter users
- 3 Candidates
- 1 Election record

## 🔐 Test Credentials

After seeding, you can login with:

### Admin Login:
- **Email**: admin@iebc.or.ke
- **Password**: admin123
- **Path**: http://localhost:3000/admin/login

### Voter Logins:
All voters use the same password: `voter123`

| National ID | Name | County |
|---|---|---|
| 25874123 | John Kipchoge | Nairobi |
| 34521098 | Jane Wanjiru | Kiambu |
| 45632187 | Ahmed Hassan | Mombasa |
| 56743298 | Mary Ochieng | Kisumu |
| 67854309 | David Mutua | Makueni |

- **Path**: http://localhost:3000/login

## 🔄 Add More Users

### Add New Admin User:
```sql
-- First hash the password using bcryptjs
-- Then insert:
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('newadmin@iebc.or.ke', '$2a$10$[bcrypt_hash]', 'First', 'Last', 'admin');

-- Get the user ID and insert admin record
INSERT INTO admins (user_id, position, department)
VALUES (user_id, 'Position', 'Department');
```

### Add New Voter User:
```sql
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('newvoter@iebc.or.ke', '$2a$10$[bcrypt_hash]', 'First', 'Last', 'voter');

-- Get the user ID and insert voter record
INSERT INTO voters (user_id, national_id, county, constituency, polling_station_id)
VALUES (user_id, 'national_id', 'County', 'Constituency', 1);
```

## 🔧 Generate Password Hashes

To generate bcrypt hashes for new users, run:
```bash
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('your_password', 10).then(hash => console.log(hash));
"
```

## 📊 Database Queries

### View All Users:
```sql
SELECT id, email, first_name, last_name, role FROM users;
```

### View All Voters:
```sql
SELECT v.id, u.email, v.national_id, u.first_name, u.last_name, v.county FROM voters v
JOIN users u ON v.user_id = u.id;
```

### View All Admins:
```sql
SELECT a.id, u.email, u.first_name, u.last_name, a.position FROM admins a
JOIN users u ON a.user_id = u.id;
```

### View All Votes Cast:
```sql
SELECT v.id, vo.first_name, vo.last_name, c.name, c.party FROM votes v
JOIN voters vt ON v.voter_id = vt.id
JOIN users vo ON vt.user_id = vo.id
JOIN candidates c ON v.candidate_id = c.id;
```

## 🚀 Running the Application

1. **Start PostgreSQL** (ensure database and schema are created)
2. **Seed the database** (if not already done):
   ```bash
   npm run seed
   ```
3. **Start backend**:
   ```bash
   npm start
   ```
4. **Start frontend** (in another terminal):
   ```bash
   cd frontend
   npm start
   ```

## ⚠️ Important Notes

- ✅ All credentials are now stored in the database with bcrypt hashing
- ✅ No more hardcoded test credentials in the code
- ✅ Each user is uniquely identified by their email (admin) or national ID (voter)
- ✅ Passwords are securely hashed and never stored in plain text
- ✅ JWT tokens are issued upon successful login

## 🔗 API Endpoints

### Authentication Endpoints:
- `POST /api/auth/voter/login` - Voter login (requires nationalId & password)
- `POST /api/auth/admin/login` - Admin login (requires email & password)
- `POST /api/auth/verify-voter` - Verify voter registration (requires nationalId)

All require actual credentials from the database now!

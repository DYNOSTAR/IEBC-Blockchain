<div align="center">

```
██╗███████╗██████╗  ██████╗
██║██╔════╝██╔══██╗██╔════╝
██║█████╗  ██████╔╝██║
██║██╔══╝  ██╔══██╗██║
██║███████╗██████╔╝╚██████╗
╚═╝╚══════╝╚═════╝  ╚═════╝
```

# 🗳️ IEBC Blockchain Voting System

### *Secure · Transparent · Decentralized*

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js)
![Solidity](https://img.shields.io/badge/Solidity-0.8.x-363636?style=flat-square&logo=solidity)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-4169E1?style=flat-square&logo=postgresql)
![Ethereum](https://img.shields.io/badge/Ethereum-Ganache-3C3C3D?style=flat-square&logo=ethereum)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**A blockchain-based electronic voting system for Kenya's multi-level general elections, built as an academic project to address transparency, security, and accessibility challenges in the electoral process.**

---

*Submitted in partial fulfillment of the requirements for the degree of Bachelor of Science in Computer Science*

**Student:** Joshua Muhoro Ndirangu | **Reg No:** P101/2264G/22

**Institution:** Karatina University, School of Pure and Applied Sciences

**Supervisor:** [Supervisor Name] | **Year:** 2027

---

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Database Setup](#database-setup)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Running the System](#running-the-system)
- [API Documentation](#api-documentation)
- [Verification Flow](#verification-flow)
- [Test Credentials](#test-credentials)
- [Screenshots](#screenshots)
- [Academic Context](#academic-context)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

The IEBC Blockchain Voting System is a full-stack decentralized application (DApp) that enables Kenyan citizens to participate in all six levels of the general election securely and transparently. Every vote is cryptographically signed, recorded on an Ethereum-compatible blockchain, and verifiable by any citizen using a unique verification code.

The system replaces paper-based processes and centralized databases with an immutable, tamper-proof ledger while maintaining voter privacy through server-side transaction signing — voters never expose private keys.

---

## ⚠️ Problem Statement

Kenya's electoral process has faced recurring challenges:

- **Lack of transparency** — centralized result tallying systems are susceptible to manipulation
- **Voter fraud** — paper ballots and manual processes enable stuffing and impersonation
- **Accessibility** — remote voters and diaspora face barriers to participation
- **Auditability** — post-election audits are slow, expensive, and contested

This system addresses these challenges by placing vote records on an immutable blockchain, making results independently verifiable by IEBC officials, observers, and citizens.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    VOTER / ADMIN                     │
│              React.js Frontend (Port 3000)           │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / REST API
┌──────────────────────▼──────────────────────────────┐
│              Node.js + Express.js Backend            │
│                     (Port 5000)                      │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────┐ │
│  │   Auth      │  │  Elections │  │    Votes     │ │
│  │  Controller │  │ Controller │  │  Controller  │ │
│  └──────┬──────┘  └─────┬──────┘  └──────┬───────┘ │
└─────────┼───────────────┼────────────────┼──────────┘
          │               │                │
┌─────────▼───┐   ┌───────▼───────┐  ┌────▼──────────┐
│  PostgreSQL  │   │  Blockchain   │  │   Ganache     │
│  Database   │   │   Service     │  │   Testnet     │
│  (Port 5432)│   │ (Web3.js v4)  │  │  (Port 7545)  │
└─────────────┘   └───────────────┘  └───────────────┘
                          │
                ┌─────────▼─────────┐
                │   Voting.sol      │
                │  Smart Contract   │
                │  (Ethereum EVM)   │
                └───────────────────┘
```

---

## ✨ Features

### Voter Features
- **Multi-method login** — National ID or Passport Number
- **Voter registration** with National ID verification
- **OTP verification** via SMS/email after registration
- **Voter declaration** — legal consent screen before ballot
- **6-position ballot** — vote for all positions in one session
- **Blockchain vote receipt** — verification code + transaction hash
- **Vote verification** — confirm vote recorded on blockchain
- **Civic education chatbot** — AI-powered voter guidance

### Security Features
- **bcrypt password hashing** — industry-standard (12 rounds)
- **JWT authentication** — stateless, expiring tokens
- **Server-side blockchain signing** — no voter private keys exposed
- **Double-vote prevention** — enforced at DB and smart contract level
- **Rate limiting** — 10 login attempts per 15 minutes
- **Helmet.js** — HTTP security headers
- **PostgreSQL transactions** — race condition prevention
- **Full audit trail** — every action logged with timestamp

### Admin Features
- **Election management** — create, activate, close elections
- **Candidate management** — add/remove candidates per position
- **Live vote counts** — real-time results dashboard
- **Voter management** — view and manage voter accounts
- **Audit log export** — full tamper-evident audit trail
- **Blockchain status** — monitor chain health

### Election Positions (Kenya General Election)
| # | Position | Level |
|---|----------|-------|
| 1 | President of Kenya | National |
| 2 | County Governor | County |
| 3 | Senator | County |
| 4 | Member of Parliament | Constituency |
| 5 | Women Representative | County |
| 6 | Member of County Assembly (MCA) | Ward |

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React.js | 18.x | Voter and admin UI |
| Backend | Node.js + Express.js | 22.x | REST API server |
| Blockchain | Solidity | 0.8.x | Smart contract |
| Web3 | Web3.js | 4.x | Blockchain interaction |
| Database | PostgreSQL | 16.x | Persistent data store |
| Auth | JWT + bcryptjs | — | Authentication |
| Dev chain | Ganache | 7.x | Local Ethereum testnet |
| AI Agent | OpenClaw + Claude | — | Civic education chatbot |

---

## 📁 Project Structure

```
IEBC-Blockchain/
├── backend/
│   ├── config/
│   │   ├── db.js                 # PostgreSQL pool
│   │   └── blockchain.js         # Web3 connection
│   ├── controllers/
│   │   ├── authController.js     # Login, register, OTP
│   │   ├── electionController.js # Election CRUD
│   │   └── voteController.js     # Cast & verify votes
│   ├── middleware/
│   │   └── auth.js               # JWT middleware
│   ├── models/
│   │   ├── Election.js           # Election model
│   │   └── vote.js               # Vote model
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── electionRoutes.js
│   │   └── voteRoutes.js
│   ├── services/
│   │   └── blockchainService.js  # Blockchain operations
│   ├── scripts/
│   │   └── seedDatabase.js       # DB seeder
│   ├── database.sql              # Schema
│   ├── server.js                 # Entry point
│   └── .env                      # Environment variables
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Voter/
│       │   │   ├── VotingBooth.jsx
│       │   │   └── VoterProfile.jsx
│       │   ├── Admin/
│       │   │   └── AdminDashboard.jsx
│       │   ├── VoterLogin.jsx
│       │   └── ResultsPage.jsx
│       ├── services/
│       │   ├── api.js            # Axios API client
│       │   └── blockchainService.js
│       └── styles/
│
├── smart-contracts/
│   ├── contracts/
│   │   └── Voting.sol            # Main smart contract
│   ├── scripts/
│   │   ├── compile.js
│   │   ├── deploy.js
│   │   └── setupElection.js
│   └── abi/
│       ├── Voting.json           # Contract ABI
│       └── contract.json         # Deployed address + ABI
│
└── README.md
```

---

## ✅ Prerequisites

Ensure the following are installed before setup:

```bash
node --version        # v22.x or higher
npm --version         # v10.x or higher
psql --version        # PostgreSQL 14+
ganache --version     # Ganache 7.x
git --version         # Any recent version
```

Install Ganache globally if not present:
```bash
npm install -g ganache
```

---

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/IEBC-Blockchain.git
cd IEBC-Blockchain
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### 4. Install smart contract dependencies
```bash
cd ../smart-contracts
npm install
```

### 5. Configure environment variables
Copy `.env.example` to `.env` in the backend folder and fill in your values:

```env
# Server
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=voting_db
DB_PASSWORD=your_password
DB_PORT=5432

# JWT
JWT_SECRET=your_long_random_secret_here

# Blockchain
BLOCKCHAIN_RPC_URL=http://127.0.0.1:7545
SERVER_ETH_ADDRESS=0xYourGanacheAccount0
SERVER_ETH_PRIVATE_KEY=0xYourGanacheAccount0PrivateKey
```

> Copy `SERVER_ETH_ADDRESS` and `SERVER_ETH_PRIVATE_KEY` from Ganache UI → Accounts tab → Account 0 (the key icon).

---

## 🗄️ Database Setup

### 1. Create the database
```bash
psql -U postgres -c "CREATE DATABASE voting_db;"
```

### 2. Run the schema
```bash
psql -U postgres -d voting_db -f backend/database.sql
```

### 3. Add OTP columns (if not in schema)
```sql
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS otp_code VARCHAR(255),
    ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;
```

### 4. Seed the database
```bash
cd backend
npm run seed
```

---

## ⛓️ Smart Contract Deployment

### 1. Start Ganache
```bash
ganache --port 7545 --deterministic
```
Or open the Ganache desktop app and start a workspace on port 7545.

### 2. Compile the contract
```bash
cd smart-contracts
node scripts/compile.js
```

### 3. Deploy to Ganache
```bash
node scripts/deploy.js
```

Note the deployed contract address in the output.

### 4. Setup election (adds positions + candidates + activates)
```bash
node scripts/setupElection.js
```

### 5. Update frontend ABI
Copy `smart-contracts/abi/contract.json` address into `frontend/src/services/contractABI.json`.

---

## ▶️ Running the System

Open three terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# App running on http://localhost:3000
```

**Terminal 3 — Ganache (if not using desktop app):**
```bash
ganache --port 7545 --deterministic
```

Verify everything is connected:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "blockchain": {
    "connected": true,
    "contractLoaded": true
  }
}
```

---

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/voter/login` | Voter login | Public |
| POST | `/api/auth/admin/login` | Admin login | Public |
| POST | `/api/auth/register` | Register voter | Public |
| POST | `/api/auth/verify-otp` | Verify OTP code | Public |
| POST | `/api/auth/verify-voter` | Check voter registration | Public |
| GET | `/api/auth/me` | Get current user | JWT |
| POST | `/api/auth/logout` | Logout | JWT |

### Elections
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/elections/active` | Get active election | JWT |
| GET | `/api/elections/:id/positions` | Get positions + candidates | JWT |
| GET | `/api/elections/results/:id` | Get results | Public |
| POST | `/api/elections` | Create election | Admin |
| PATCH | `/api/elections/:id/status` | Update status | Admin |

### Votes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/votes/cast` | Cast a vote | Voter JWT |
| POST | `/api/votes/verify` | Verify vote by code | Public |
| GET | `/api/votes/counts/:electionId` | Live vote counts | JWT |

---

## 🔐 Verification Flow

```
Register → National ID Check → OTP Verification → Account Activated
    ↓
Login → Eligibility Check → Voter Declaration → Ballot
    ↓
Vote (per position) → Backend signs blockchain TX → Receipt
    ↓
Verification Code → /verify → Blockchain confirmation
```

Every vote produces:
- A unique verification code (format: `V-XXXXXXXX`)
- A blockchain transaction hash (`0x...`)
- A block number on the Ganache testnet

---

## 🧪 Test Credentials

| Role | Identifier | Password |
|------|-----------|----------|
| Voter | `12345678` | `Voter@2027` |
| Voter 2 | `87654321` | `Voter@2027` |
| Admin | `admin@iebc.or.ke` | `Admin@2027` |

---

## 📚 Academic Context

This project was developed as a final year undergraduate research project addressing the research question:

> *"How can blockchain technology be applied to improve the security, transparency, and integrity of Kenya's multi-level electoral process?"*

**Key contributions:**
- A working prototype demonstrating blockchain-based voting for all 6 Kenyan elective positions
- Server-side transaction signing architecture that removes the need for voter wallets
- OTP-based voter verification tied to National ID validation
- Immutable audit trail combining PostgreSQL and Ethereum
- AI-powered civic education agent (OpenClaw + Claude)

**References to key literature are in the project paper** (`PROJECT_PAPER.pdf`).

---

## 🤝 Contributing

This is an academic project. Contributions, suggestions, and issue reports are welcome for educational purposes.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit your changes (`git commit -m 'Add improvement'`)
4. Push to branch (`git push origin feature/improvement`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See `LICENSE` for details.

---

<div align="center">

**Built with ❤️ for Kenya's democratic future**

*Karatina University · Department of Computer Science · 2027*

</div>
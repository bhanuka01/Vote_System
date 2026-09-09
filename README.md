# FMIS 45 Batch Representative Voting Web App

A production-quality, mobile-first, anonymous preferential voting web application built for the **Faculty of Management Information Systems (FMIS 45)** university batch representative election.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL with Row Level Security & Atomic RPC Functions)**.

---

## Key Features

1. **Strict Anonymity Guarantee**:
   - Voter authorization is completely separated from actual ballot data.
   - Private links are hashed with **SHA-256**; raw tokens are never saved to the database.
   - The `votes` table stores **zero** student names, IDs, emails, token IDs, token hashes, or IP addresses.
2. **Atomic One-Time Voting**:
   - Backed by a PostgreSQL transaction (`submit_vote`) utilizing `SELECT ... FOR UPDATE` row locking.
   - Prevents double-voting caused by concurrent requests, rapid clicking, or browser refreshes.
3. **Preferential Ballot System**:
   - Each student selects a **1st Preference** and **2nd Preference**.
   - Dual-layer validation (client & server) guarantees distinct candidate choices (`first != second`).
   - Configurable weighted scoring (Default: 1st Preference = 2 pts, 2nd Preference = 1 pt).
4. **Exactly 56 Voting Links Generator**:
   - One-click batch generation of 56 unique, cryptographically random links (`Student 01` to `Student 56`).
   - CSV export with private URLs for student distribution.
   - Status tracker showing *whether* a student link was used, without linking to vote choices.
5. **Separate Public Results Access**:
   - Results are shielded by a dedicated batch results token (`/results/[results-token]`).
   - Voting links do not grant access to the results page.
   - Live turnout statistics (Eligible voters, votes cast, remaining, turnout percentage).
   - Auto-refreshing candidate standings with rank, raw preference counts, and weighted scores.
6. **Administrator Control Portal**:
   - Protected by **Supabase Auth** at `/admin`.
   - Lifecycle management (`DRAFT` → `OPEN` → `CLOSED`).
   - Candidate management with election-lock safeguards.

---

## Anonymity Architecture

```
                    ┌────────────────────────────────────────┐
                    │       Student Private Voting Link      │
                    │         /vote/{32-char-token}          │
                    └───────────────────┬────────────────────┘
                                        │ (HTTPS POST)
                                        ▼
                    ┌────────────────────────────────────────┐
                    │       Server-Side / Next.js API        │
                    │   Compute SHA-256(token)               │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
             ┌────────────────────────────────────────────────────────┐
             │       PostgreSQL Atomic RPC: submit_vote()             │
             │       - Check Election Status == 'OPEN'                │
             │       - SELECT ... FROM voting_tokens FOR UPDATE       │
             │       - If used OR not found -> REJECT                 │
             │       - Validate candidate_1 != candidate_2            │
             │       - UPDATE voting_tokens SET used = true           │
             │       - INSERT INTO votes (first, second)              │
             └──────────────────────┬─────────────────────────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
┌──────────────────────────────┐          ┌──────────────────────────────┐
│        voting_tokens         │          │            votes             │
├──────────────────────────────┤          ├──────────────────────────────┤
│ id (uuid)                    │          │ id (uuid)                    │
│ token_hash (sha256)          │          │ first_preference (candidate) │
│ student_label ("Student 01") │          │ second_preference(candidate) │
│ used (boolean)               │          │ created_at (timestamp)       │
│ used_at (timestamp)          │          │                              │
│                              │          │ [NO student/token ID or IP]  │
└──────────────────────────────┘          └──────────────────────────────┘
```

---

## Project Structure

```text
├── app/
│   ├── layout.tsx                 # Root university layout
│   ├── page.tsx                   # Informational landing page
│   ├── globals.css                # Tailwind CSS configuration
│   ├── actions/
│   │   ├── voting.ts              # Server actions for token validation & atomic vote
│   │   ├── results.ts             # Server actions for results retrieval
│   │   └── admin.ts               # Server actions for admin lifecycle & tokens
│   ├── api/
│   │   └── vote/route.ts          # REST endpoint for voting
│   ├── vote/
│   │   └── [token]/page.tsx       # Student voting ballot
│   ├── results/
│   │   └── [token]/page.tsx       # Live preferential results view
│   └── admin/
│       ├── layout.tsx             # Admin shell navigation
│       ├── page.tsx               # Admin dashboard & election lifecycle
│       ├── login/page.tsx         # Supabase Auth admin sign-in
│       ├── candidates/page.tsx    # Candidate roster & ballot locks
│       ├── voting-links/page.tsx  # 56 Token generator & CSV export
│       └── settings/page.tsx      # Scoring weights & results token config
├── components/
│   ├── VotingForm.tsx             # Mobile-first preferential ballot component
│   ├── ResultsView.tsx            # Live results table & participation tracker
│   ├── AdminDashboard.tsx         # Election status controller & metrics
│   ├── CandidateManagement.tsx    # Candidate manager with locking
│   ├── VotingLinksManager.tsx     # Token manager & CSV downloader
│   └── SettingsManager.tsx        # Scoring weights & results token editor
├── lib/
│   ├── crypto.ts                  # SHA-256 token hashing & secure generator
│   ├── types.ts                   # TypeScript interfaces
│   └── supabase/
│       ├── client.ts              # Browser Supabase client (Anon key)
│       ├── server.ts              # Server App Router Supabase client
│       └── server-admin.ts        # Server-only administrative client
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql # Schema definition
│       ├── 002_functions_and_rpc.sql # submit_vote atomic RPC
│       ├── 003_rls_policies.sql   # Strict Row Level Security
│       └── 004_seed_data.sql      # Initial settings & sample candidates
└── tests/
    ├── crypto.test.ts             # Cryptographic tests
    └── voting-logic.test.ts       # Preference & scoring unit tests
```

---

## Quick Start Guide

### 1. Prerequisites
- **Node.js 18+** or **Node.js 20+**
- A **Supabase** project (Free tier works perfectly)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Supabase Database
In your Supabase project dashboard, open the **SQL Editor** and run the 4 migration scripts in order:

1. `supabase/migrations/001_initial_schema.sql` (Creates tables and indexes)
2. `supabase/migrations/002_functions_and_rpc.sql` (Installs atomic `submit_vote` and validation RPCs)
3. `supabase/migrations/003_rls_policies.sql` (Applies strict Row Level Security policies)
4. `supabase/migrations/004_seed_data.sql` (Seeds default election settings & 4 sample candidates)

### 4. Create Admin User
In Supabase:
1. Go to **Authentication** → **Users**.
2. Click **Add User** → **Create User**.
3. Enter your election administrator email and password (e.g. `admin@university.edu`).
4. Check **Auto Confirm User**.

### 5. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Security Note:** `SUPABASE_SERVICE_ROLE_KEY` is strictly confined to server-side executions (`lib/supabase/server-admin.ts`) and is never sent to or bundled in client browsers.

### 6. Run the Application
```bash
# Start local development server
npm run dev

# Or build for production
npm run build
npm run start
```

Visit `http://localhost:3000`.

---

## Operating the Election (Admin Walkthrough)

1. **Sign in to Admin**:
   - Go to `http://localhost:3000/admin/login`.
   - Log in with your Supabase credentials.
2. **Review Candidates**:
   - Visit `/admin/candidates`.
   - Add, edit, or deactivate candidates before voting commences.
3. **Generate 56 Voting Links**:
   - Visit `/admin/voting-links`.
   - Click **Generate 56 Links**.
   - Click **Export CSV with Private URLs** to save the file.
   - Distribute one private URL to each student (`Student 01` to `Student 56`).
4. **Share Results Link**:
   - Visit `/admin/settings`.
   - Copy the **Batch Results Access URL** (`/results/[token]`) and share it with the batch so they can follow live turnout.
5. **Open Voting**:
   - Return to `/admin`.
   - Click **Open Voting**. Status will switch to `OPEN`.
   - Ballot roster is now locked to prevent invalidating votes.
6. **Conclude Election**:
   - Once all 56 votes are recorded or the deadline passes, click **Close Election**.
   - The results page remains live and displays final official results.

---

## Automated Testing

Run the Vitest test suite:
```bash
npm test
```

Test coverage includes:
- SHA-256 hashing and 32-character hexadecimal token entropy.
- Generation of exactly 56 unique links with sequential student labels.
- Mutual exclusion of 1st and 2nd candidate preferences.
- Weighted score calculations matching official formula: `(1st × 2) + (2nd × 1)`.
- Voter turnout math: `43 / 56 = 76.8%`.
- State machine simulation of atomic token burning and double-vote rejection.
- Anonymity verification proving zero voter/token/IP fields are stored in `votes`.

---

## License
MIT License. Built for university batch representative elections.

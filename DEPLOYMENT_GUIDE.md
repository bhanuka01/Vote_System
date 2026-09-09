# Complete Setup & Deployment Guide: Supabase & Vercel

This guide walks you through setting up **Supabase** from scratch and deploying your **FMIS 45 Batch Representative Voting App** to **Vercel**.

---

## Table of Contents
1. [Part 1: Supabase Setup](#part-1-supabase-setup)
   - [1.1 Create a Free Supabase Project](#11-create-a-free-supabase-project)
   - [1.2 Run SQL Migrations](#12-run-sql-migrations)
   - [1.3 Create the Admin User](#13-create-the-admin-user)
   - [1.4 Copy Supabase API Keys](#14-copy-supabase-api-keys)
2. [Part 2: Local Verification](#part-2-local-verification)
3. [Part 3: Vercel Deployment](#part-3-vercel-deployment)
   - [3.1 Push Code to GitHub](#31-push-code-to-github)
   - [3.2 Import Project in Vercel](#32-import-project-in-vercel)
   - [3.3 Configure Environment Variables in Vercel](#33-configure-environment-variables-in-vercel)
   - [3.4 Deploy](#34-deploy)
4. [Part 4: Post-Deployment Checklist](#part-4-post-deployment-checklist)
5. [Troubleshooting & Security FAQ](#troubleshooting--security-faq)

---

## Part 1: Supabase Setup

### 1.1 Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and click **Sign in** (or **Start your project**). You can sign in using your GitHub account.
2. In the Supabase Dashboard, click **New Project**.
3. Select an organization (or create one).
4. Fill in the project details:
   - **Name**: `fmis-45-voting` (or your preferred name)
   - **Database Password**: Choose a strong password and save it safely.
   - **Region**: Choose the region closest to your students (e.g., `Singapore (ap-southeast-1)` or `Mumbai (ap-south-1)`).
   - **Pricing Plan**: Choose **Free tier**.
5. Click **Create new project** and wait 1–2 minutes for the database to provision.

---

### 1.2 Run SQL Migrations

Once your project status is active:
1. On the left sidebar of the Supabase dashboard, click on **SQL Editor** (the `>_` icon).
2. Click **New Query**.
3. You will run the 4 migration scripts located in the `supabase/migrations/` folder **in order**:

#### Step A: Schema Definition
Open [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql), copy all its contents, paste them into the SQL Editor, and click **Run**.
> This creates the `candidates`, `election_settings`, `voting_tokens`, and `votes` tables with strict privacy constraints.

#### Step B: Atomic Functions & RPCs
Open [`supabase/migrations/002_functions_and_rpc.sql`](./supabase/migrations/002_functions_and_rpc.sql), copy all its contents, paste into the SQL Editor, and click **Run**.
> This installs the `submit_vote` transaction function with row-locking (`FOR UPDATE`) to prevent double-voting.

#### Step C: Row Level Security (RLS)
Open [`supabase/migrations/003_rls_policies.sql`](./supabase/migrations/003_rls_policies.sql), copy all its contents, paste into the SQL Editor, and click **Run**.
> This blocks public access to raw tokens and votes, granting access only through the secure RPCs.

#### Step D: Initial Seed Data
Open [`supabase/migrations/004_seed_data.sql`](./supabase/migrations/004_seed_data.sql), copy all its contents, paste into the SQL Editor, and click **Run**.
> This initializes the election settings for 56 voters and adds the 4 initial candidates (Kasun, Nimal, Sahan, Chamod).

---

### 1.3 Create the Admin User

1. In the left sidebar of the Supabase dashboard, click on **Authentication** (the users icon).
2. Click on the **Users** tab at the top.
3. Click the **Add user** button → select **Create user**.
4. Fill in:
   - **User Email**: Your administrator email (e.g. `admin@university.edu`)
   - **User Password**: A strong password for the admin portal
   - Check the box: **Auto Confirm User?** (Turn this ON so you don't need to confirm via email).
5. Click **Create user**.

---

### 1.4 Copy Supabase API Keys

1. In the left sidebar, click on **Project Settings** (gear icon at the bottom).
2. Click on **API** in the settings menu.
3. Keep this page open or copy the following values:
   - **Project URL**: Under *Project URL*, copy the URL (e.g. `https://xyzcompany.supabase.co`).
   - **Anon / Public Key**: Under *Project API keys*, find the key labeled `anon` `public`. Copy this string.
   - **Service Role Secret Key**: Under *Project API keys*, find the key labeled `service_role` `secret`. Click **Reveal** and copy it.
     > ⚠️ **CRITICAL**: The `service_role` key can bypass all security rules. NEVER share it or publish it in frontend code. It is only entered in Vercel environment variables or `.env.local`.

---

## Part 2: Local Verification

Before deploying to Vercel, test your connection locally:

1. In your project root folder, open or create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000/admin/login` in your browser:
   - Sign in with the admin email and password you created in Step 1.3.
   - You should see the Admin Dashboard.
   - Go to **Voting Links** and click **Generate 56 Links**.
   - Copy one of the generated links and test casting a vote in an incognito window!

---

## Part 3: Vercel Deployment

### 3.1 Push Code to GitHub

If your code is not yet on GitHub:
1. Create a new repository on [GitHub](https://github.com/new) (e.g., `fmis-45-voting`). Make it **Private** to keep your project configurations private.
2. In your terminal, initialize and push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: FMIS 45 Anonymous Voting System"
   git branch -M main
   git remote add origin https://github.com/your-username/fmis-45-voting.git
   git push -u origin main
   ```

---

### 3.2 Import Project in Vercel

1. Go to [https://vercel.com](https://vercel.com) and log in with your GitHub account.
2. On your Vercel dashboard, click **Add New...** → **Project**.
3. Under *Import Git Repository*, locate your repository (`fmis-45-voting`) and click **Import**.

---

### 3.3 Configure Environment Variables in Vercel

In the Vercel project configuration screen:
1. **Framework Preset**: Should automatically detect **Next.js**.
2. **Root Directory**: `./` (leave default).
3. Expand the **Environment Variables** section and add the following 4 keys:

| Key | Value | Environment Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-public-key` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | Temporary placeholder (e.g. `https://fmis-45-voting.vercel.app`) | Production, Preview, Development |

> 💡 *Tip*: Once Vercel finishes deploying, it gives you the exact production URL (e.g. `https://fmis-45-voting-xyz.vercel.app`). You can update `NEXT_PUBLIC_APP_URL` with that exact domain under **Project Settings → Environment Variables** anytime.

---

### 3.4 Deploy

1. Click **Deploy**.
2. Vercel will install dependencies, compile the TypeScript code, optimize pages, and launch your site.
3. When deployment finishes, click **Continue to Dashboard** or click the preview card to view your live application!

---

## Part 4: Post-Deployment Checklist

Once your site is live on Vercel:

1. **Verify Base URL**:
   - In Vercel, check your production domain (e.g., `https://fmis-45-voting.vercel.app`).
   - If `NEXT_PUBLIC_APP_URL` was different, update it in **Vercel → Settings → Environment Variables**, and click **Redeploy**.
2. **Sign In to Admin**:
   - Go to `https://your-domain.vercel.app/admin/login`.
   - Log in with your admin credentials.
3. **Configure the Election**:
   - Review candidates at `/admin/candidates`.
   - In `/admin/settings`, copy your **Batch Results Access URL** (`/results/[token]`).
4. **Generate the 56 Private Links**:
   - Go to `/admin/voting-links`.
   - Click **Generate 56 Links**.
   - Click **Export CSV with Private URLs**.
   - Save the CSV file securely. Each line will contain:
     ```text
     "Student 01","https://your-domain.vercel.app/vote/7f8a91bc...","Not voted"
     "Student 02","https://your-domain.vercel.app/vote/a19c3b84...","Not voted"
     ...
     ```
5. **Start the Election**:
   - On the Admin Dashboard, click **Open Voting**.
   - Send each student their respective private link via student email or private message.
   - Share the results link with the batch so they can follow live turnout!

---

## Troubleshooting & Security FAQ

### Q: Why do we only store SHA-256 hashes in Supabase?
**A:** If anyone ever accessed the database, they cannot use the hash to vote or forge a link. Only the student holding the original unhashed link in their browser can authorize a vote.

### Q: Can the admin see who voted for whom?
**A:** **No.** The `voting_tokens` table and the `votes` table are completely decoupled. The admin can see *if* a student has used their link, but there is no foreign key, timestamp match, or user identifier connecting that token to a vote record in the database.

### Q: What if two students submit at the exact same millisecond?
**A:** The PostgreSQL `submit_vote` function uses `SELECT ... FOR UPDATE` row locking. Database transactions are processed sequentially and atomically. A token cannot be used twice under any circumstances.

### Q: What if a student accidentally refreshes or clicks twice?
**A:** The frontend disables the submit button immediately upon clicking, and the atomic backend rejects any duplicate attempt with `ALREADY_USED`.

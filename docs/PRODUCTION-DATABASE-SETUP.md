# PRIME APPAREL B2B ERP: PRODUCTION DATABASE SETUP GUIDE

This guide details the recommended procedures for setting up PostgreSQL across local development, cloud staging, and high-availability production environments.

---

## 💻 1. Local PostgreSQL Setup Options

For local testing and offline QA validation, choose one of these two options:

### Option A: Standard Native Installer (Windows)
1. Download the PostgreSQL Installer for Windows from [EnterpriseDB](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
2. Install with default settings, specifying a password for the `postgres` user (e.g. `postgres`).
3. Open `pgAdmin` or command-line `psql` and create the target database:
   ```sql
   CREATE DATABASE prime_apparel;
   ```
4. Set `.env` DATABASE_URL to:
   ```env
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/prime_apparel?schema=public"
   ```

### Option B: Docker Container (If Docker is installed later)
Run a PostgreSQL container instantly via PowerShell:
```powershell
docker run --name prime-postgres -e POSTGRES_PASSWORD=securepass -e POSTGRES_DB=prime_apparel -p 5432:5432 -d postgres:latest
```

---

## ☁️ 2. Neon Serverless PostgreSQL Cloud Setup (Recommended for Next.js)

[Neon](https://neon.tech) is a serverless PostgreSQL cloud provider. It is the optimal cloud database for Serverless Next.js functions because of its automatic scaling and instant branching capabilities.

### Setup Instructions
1. Register for a free account at [Neon.tech](https://neon.tech).
2. Create a new project named `prime-apparel` and select your target region.
3. Neon will generate your connection details. Copy the connection string.
4. **Important for Next.js serverless functions (Connection Pooling)**:
   Because serverless functions scale up rapidly and can exhaust PostgreSQL connection limits, Neon provides a transaction pooler (port 5432 or 6543) via `PgBouncer`.
   
   - **Main Pooler Connection (Recommended for .env)**:
     ```env
     DATABASE_URL="postgresql://neondb_owner:yourpass@ep-cool-fog-a5m0o9-pooler.us-east-2.aws.neon.tech/prime_apparel?sslmode=require"
     ```
   - **Direct Connection (Used during schema migrations/db push)**:
     When running `prisma db push` or migrations, connection pooling is not required and can cause transaction lock warnings. Append `?sslmode=require` and bypass the pooler when running migrations:
     ```env
     DATABASE_URL="postgresql://neondb_owner:yourpass@ep-cool-fog-a5m0o9.us-east-2.aws.neon.tech/prime_apparel?sslmode=require"
     ```

---

## 🏛️ 3. Enterprise Production Setup (AWS RDS / Google Cloud SQL)

For scale and maximum durability, use dedicated managed instances:

### AWS RDS PostgreSQL Configuration
1. Go to **AWS Console** -> **RDS** -> **Create Database**.
2. Select **PostgreSQL**, Standard Create, choosing **Free Tier** or **Production db.t3.medium** instance class.
3. Configure settings:
   - **Master Username**: `prime_admin`
   - **Database Name**: `prime_apparel`
   - **Virtual Private Cloud (VPC)**: Ensure Next.js deployment (e.g. AWS Amplify, Vercel, EC2) shares security groups or is allowed in the RDS Inbound rules for port 5432.
4. **SSL Requirements**: Always enforce SSL in production by appending `?sslmode=require` to your database connection string.

### Connection Pooling with AWS RDS Proxy
In High-Traffic production environments, integrate **RDS Proxy** or a local `PgBouncer` service:
- Set RDS Proxy to transaction pooling mode.
- Update `DATABASE_URL` to point to the RDS Proxy endpoint instead of the raw RDS DB instance.
- Set `connection_limit=10` or appropriate values in the URL connection query parameter to regulate Next.js connection limits.

---

## 🔒 4. Production Database Security Guidelines

1. **Least Privilege Principle**: Never connect Next.js application endpoints using the superuser account (`postgres`). Create an isolated login role with specific read-write privileges:
   ```sql
   CREATE ROLE prime_app_user WITH LOGIN PASSWORD 'strong_password';
   GRANT ALL PRIVILEGES ON DATABASE prime_apparel TO prime_app_user;
   ```
2. **Network Isolation**: Enforce VPC security groups. Limit connection capabilities so only the specific deployment IP ranges (Vercel, AWS ECS task, etc.) can contact port 5432.
3. **Automated Backups**: Enable RDS automatic backups with a minimum retention period of 7-14 days.

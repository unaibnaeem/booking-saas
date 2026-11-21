# Bookwise

Bookwise is a multi-tenant booking and scheduling SaaS for service businesses. Each organization manages its services, staff and other bookable resources, availability, customers, and bookings.

## Tech stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4
- Better Auth
- Prisma ORM 7 with `@prisma/adapter-pg`
- PostgreSQL 18
- Zod
- Docker Compose

## Current functionality

- Email/password registration and sign-in
- Organization onboarding
- Shared authenticated header and sign-out
- Forgot-password and reset-password flow
- Server-side session validation in the authenticated route-group layout
- PostgreSQL row-level security (RLS) for tenant-owned business tables
- Repeatable development and test seed modes

Password-reset and invitation emails are simulated in development: the links are printed in the server terminal. Real email delivery is not configured.

The only application API route currently implemented is Better Auth's `/api/auth/[...all]`. Booking APIs, server actions, and the booking calendar are planned for Week 2. Each future endpoint/action must independently validate the session, organization membership, and permissions.

## Architecture and tenant isolation

The database uses two PostgreSQL schemas:

- `auth`: Better Auth users, accounts, sessions, organizations, memberships, and invitations.
- `public`: organization settings and tenant-owned business records.

`auth.organization` is the tenant root. `auth.member` connects users to organizations and stores organization-scoped roles. Business tables carry `organization_id`; composite foreign keys keep related records within the same organization.

RLS is enabled and forced on tenant-owned business tables. The `bookwise_app` role is scoped by the transaction-local PostgreSQL setting `app.current_organization_id`. The application must derive this value from a verified membership and set it within the same transaction as tenant queries. Never trust an organization ID supplied only by the browser. `bookwise_migrator` is a separate migration role, not the normal runtime role.

### Authentication and membership ERD

```mermaid
erDiagram
    AUTH_USER {
        string id PK
        string name
        string email UK
    }
    AUTH_ACCOUNT {
        string id PK
        string user_id FK
        string provider_id
        string password
    }
    AUTH_SESSION {
        string id PK
        string user_id FK
        string token UK
        string active_organization_id
        timestamp expires_at
    }
    AUTH_ORGANIZATION {
        string id PK
        string name
        string slug UK
    }
    AUTH_MEMBER {
        string id PK
        string organization_id FK
        string user_id FK
        string role
    }
    AUTH_INVITATION {
        string id PK
        string organization_id FK
        string inviter_id FK
        string email
        string role
        string status
    }
    AUTH_VERIFICATION {
        string id PK
        string identifier
        string value
        timestamp expires_at
    }

    AUTH_USER ||--o{ AUTH_ACCOUNT : has
    AUTH_USER ||--o{ AUTH_SESSION : has
    AUTH_USER ||--o{ AUTH_MEMBER : joins
    AUTH_ORGANIZATION ||--o{ AUTH_MEMBER : includes
    AUTH_ORGANIZATION ||--o{ AUTH_INVITATION : receives
    AUTH_USER ||--o{ AUTH_INVITATION : invites
```

`AUTH_SESSION.active_organization_id` is shown as a scalar because the Prisma model does not declare a relation for it. `AUTH_VERIFICATION` is standalone for the same reason.

### Business and booking ERD

```mermaid
erDiagram
    AUTH_ORGANIZATION {
        string id PK
        string name
        string slug
    }
    ORGANIZATION_SETTINGS {
        string organization_id PK
        string time_zone
        string currency_code
    }
    SERVICE {
        string id PK
        string organization_id FK
        string name
        string slug
        int duration_minutes
        decimal price_amount
        string currency_code
    }
    SERVICE_RESOURCE_REQUIREMENT {
        string id PK
        string organization_id FK
        string service_id FK
        string resource_type
        int quantity
    }
    BOOKABLE_RESOURCE {
        string id PK
        string organization_id FK
        string name
        string type
    }
    SERVICE_RESOURCE {
        string organization_id PK
        string service_id PK
        string requirement_id PK
        string resource_id PK
        string resource_type
    }
    AVAILABILITY_RULE {
        string id PK
        string organization_id FK
        string resource_id FK
        int day_of_week
        int start_minute
        int end_minute
    }
    AVAILABILITY_OVERRIDE {
        string id PK
        string organization_id FK
        string resource_id FK
        timestamp starts_at
        timestamp ends_at
        boolean is_available
    }
    CUSTOMER {
        string id PK
        string organization_id FK
        string name
        string email
        string phone
    }
    BOOKING {
        string id PK
        string organization_id FK
        string customer_id FK
        string service_id FK
        string status
        timestamp starts_at
        timestamp ends_at
        decimal price_amount
    }
    BOOKING_RESOURCE {
        string organization_id PK
        string booking_id PK
        string resource_id PK
        string service_id FK
        string requirement_id FK
        timestamp reserved_starts_at
        timestamp reserved_ends_at
        timestamp released_at
    }

    AUTH_ORGANIZATION ||--o| ORGANIZATION_SETTINGS : configures
    AUTH_ORGANIZATION ||--o{ SERVICE : owns
    AUTH_ORGANIZATION ||--o{ BOOKABLE_RESOURCE : owns
    AUTH_ORGANIZATION ||--o{ CUSTOMER : owns
    AUTH_ORGANIZATION ||--o{ BOOKING : owns

    SERVICE ||--o{ SERVICE_RESOURCE_REQUIREMENT : defines
    SERVICE_RESOURCE_REQUIREMENT ||--o{ SERVICE_RESOURCE : requires
    BOOKABLE_RESOURCE ||--o{ SERVICE_RESOURCE : assigned_to

    BOOKABLE_RESOURCE ||--o{ AVAILABILITY_RULE : has
    BOOKABLE_RESOURCE ||--o{ AVAILABILITY_OVERRIDE : has

    CUSTOMER ||--o{ BOOKING : makes
    SERVICE ||--o{ BOOKING : booked_as
    BOOKING ||--o{ BOOKING_RESOURCE : allocates
    BOOKABLE_RESOURCE ||--o{ BOOKING_RESOURCE : reserved_for
    SERVICE_RESOURCE ||--o{ BOOKING_RESOURCE : validates
```

The diagrams are a readable overview. `prisma/schema.prisma` and the SQL migrations define the authoritative composite keys, constraints, and indexes.

### RLS tenant boundary

```mermaid
flowchart TD
    U[Authenticated user] --> M[Verify auth.member membership and role]
    M --> O[Derive organization from verified membership]
    O --> C[Set transaction-local app.current_organization_id]
    C --> R[bookwise_app query]
    R --> P{RLS organization_id matches context?}
    P -->|Yes| A[Allow tenant-scoped row access]
    P -->|No or missing context| D[Rows hidden or writes rejected]
    X[bookwise_migrator] --> Y[Separate migration-role policy]
```

RLS complements membership/role authorization and composite foreign keys; it does not replace them.

## Local development

### Prerequisites

- Node.js 20.9 or newer
- npm
- Docker Desktop or Docker Engine with Docker Compose

### 1. Install dependencies

```powershell
npm install
```

### 2. Configure environment

Create a root `.env` file. Do not commit it. The repository ignores `.env*` files.

Set these variables using your local credentials:

```env
# Docker Compose bootstrap database
POSTGRES_DB=bookwise
POSTGRES_USER=bookwise_bootstrap
POSTGRES_PASSWORD=replace-with-a-local-password
POSTGRES_PORT=5433

# Application runtime connection
DATABASE_URL=postgresql://bookwise_app:URL_ENCODED_PASSWORD@127.0.0.1:5433/bookwise

# Prisma CLI connections
MIGRATION_DATABASE_URL=postgresql://bookwise_migrator:URL_ENCODED_PASSWORD@127.0.0.1:5433/bookwise
SHADOW_DATABASE_URL=postgresql://bookwise_migrator:URL_ENCODED_PASSWORD@127.0.0.1:5433/bookwise_shadow

# Better Auth
BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters
BETTER_AUTH_URL=http://localhost:3000

# Seed script
SEED_DATABASE_URL=postgresql://bookwise_migrator:URL_ENCODED_PASSWORD@127.0.0.1:5433/bookwise_migration_test
SEED_DEFAULT_PASSWORD=replace-with-a-strong-local-demo-password
```

URL-encode special characters in database usernames/passwords. Generate a unique Better Auth secret; for PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 3. Start PostgreSQL

```powershell
docker compose up -d
docker compose ps
```

`compose.yaml` starts PostgreSQL 18.7, publishes it on `127.0.0.1`, persists data in a Docker volume, and includes a readiness health check.

**Database provisioning:** Compose creates only the bootstrap database and bootstrap user. The `bookwise_app` and `bookwise_migrator` roles, plus `bookwise_shadow` and `bookwise_migration_test` databases, must also be provisioned with the intended grants and ownership. The current Compose file does not create them automatically.

### 4. Generate Prisma Client and apply migrations

```powershell
npx prisma validate
npx prisma generate
npx prisma migrate deploy
```

Before running migrations, verify that `MIGRATION_DATABASE_URL` points to the intended local database. Never run local migrations against production or shared data unintentionally.

### 5. Seed data

The Prisma 7 seed command is configured in `prisma7.config.ts` to seed the development database:

```powershell
npx prisma db seed
```

To seed the separate regression-test database:

```powershell
npx tsx .\prisma\seed.ts test
```

The seed script requires `SEED_DEFAULT_PASSWORD`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`. It has strict target checks:

- `development` uses `MIGRATION_DATABASE_URL` and only accepts `bookwise`.
- `test` uses `SEED_DATABASE_URL` and only accepts `bookwise_migration_test`.

Both targets must use `bookwise_migrator` on `127.0.0.1:5433`. The script is repeatable and preserves unrelated existing records.

Demo owner accounts (both use `SEED_DEFAULT_PASSWORD`):

- `owner@harbor-dental.test` — Harbor Dental Studio
- `owner@northstar-wellness.test` — Northstar Wellness Center

Each demo organization is seeded with settings, two services, two staff resources, resource assignments, weekday availability, and two customers.

### 6. Run the application

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

# Engineering Thesis Project - 3D Model Viewer in R3F with PWA Support

<a id="readme-top"></a>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#project-structure">Project Structure</a></li>
     <li>
      <a href="#prerequisites">Prerequisites</a>
      <ul>
        <li>
        <a href="#ssl-certificates">SSL certificates</a>
        <ul>
          <li><a href="#windows">Windows</a></li>
          <li><a href="#ubuntudebian">Ubuntu/Debian</a></li>
        </ul>
        </li>
        <li><a href="#docker">Docker</a></li>
        <li><a href="#set-up-env-file">Set up .env file</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting started</a>
        <ul>
          <li><a href="#install-dependencies">Install dependencies</a></li>
          <li><a href="#starting-the-app">Starting the app</a></li>
          <li><a href="#using-docker">Using docker</a></li>
        </ul>
    </li>
  </ol>
</details>

<!-- Project Structure -->

## Project Structure

```
inzynierka/
├── backend/                      # Backend server (Node.js/Express)
│   ├── api/
│   │   ├── server.ts             # Express server with HTTPS and OpenAPI endpoints
│   │   ├── config/
│   │   │   ├── passport.ts       # Passport.js Google OAuth configuration
│   │   │   └── database.ts       # PostgreSQL connection pool
│   │   ├── middleware/
│   │   │   └── validation.ts     # Zod validation middleware
│   │   ├── schemas/
│   │   │   └── index.ts          # Zod schemas with OpenAPI metadata
│   │   ├── openapi/
│   │   │   └── index.ts          # OpenAPI 3.0 document generator
│   │   ├── utils/
│   │   │   └── email.ts          # Email verification utilities (nodemailer)
│   │   └── routes/
│   │       ├── auth.ts           # Authentication endpoints (register, login, verify-email, OAuth)
│   │       ├── users.ts          # User CRUD endpoints
│   │       └── models.ts         # Model CRUD endpoints
│   ├── db/
│   │   └── setup/                # Database initialization scripts
│   │       ├── 01_extensions.sql # PostgreSQL extensions (pg_uuidv7, pgcrypto)
│   │       ├── 02_types.sql      # Custom types
│   │       ├── 03_schema.sql     # Database schema (includes pending_registrations)
│   │       ├── 04_indexes.sql    # Database indexes
│   │       └── 06_triggers.sql   # Database triggers
│   ├── docker/
│   │   ├── Dockerfile            # Backend container
│   │   ├── Dockerfile.db         # PostgreSQL with UUID v7 support
│   │   └── docker-compose.yml    # Service orchestration
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                      # Backend configuration
│   └── API.md                    # API documentation
│
├── frontend/                     # Frontend PWA application
│   ├── public/                   # Static assets
│   │
│   ├── src/
│   │   ├── main.tsx              # Application entry point
│   │   ├── App.tsx               # Root component
│   │   ├── sw.ts                 # Service Worker configuration
│   │   │
│   │   ├── api/                  # API client layer
│   │   │   ├── client.ts         # HTTP client with auth & error handling
│   │   │   └── auth.ts           # Authentication API endpoints
│   │   ├── assets/               # Static resources
│   │   │   └── fonts/            # Self-hosted fonts (Red Hat Display, Montserrat)
│   │   ├── components/           # React components
│   │   │   ├── Button/           # Button component with variants
│   │   │   ├── CustomBox/        # Custom box component
│   │   │   ├── PWAToasts/        # PWA notification toasts
│   │   │   └── ReloadToast/      # Service worker reload prompt
│   │   ├── constants/            # App-wide constants
│   │   │   ├── envs.ts           # Environment variable validation
│   │   │   └── languages/        # i18n translations (en, pl)
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── useAuth.ts        # Authentication hook (login, register, offline mode)
│   │   ├── pages/                # Route pages/views
│   │   │   ├── Login/            # Login page (split design with offline section)
│   │   │   ├── Register/         # Registration page
│   │   │   ├── VerifyEmail/      # Email verification page
│   │   │   ├── Home/             # Home page
│   │   │   └── NotFound/         # 404 page
│   │   ├── routes/               # Routing configuration
│   │   │   ├── AppRouter.tsx     # Main router with route definitions
│   │   │   └── ProtectedRoute.tsx # Auth guard (supports offline mode)
│   │   ├── stores/               # MobX state management
│   │   │   ├── Auth.store.tsx    # Authentication state (token, user, offline mode)
│   │   │   ├── Ui.store.tsx      # UI state
│   │   │   ├── Translations.store.tsx # i18n state
│   │   │   ├── Root.store.tsx    # Root store
│   │   │   └── useStores.ts      # Store hooks
│   │   ├── styles/               # Global styles & custom theme
│   │   │   ├── index.scss        # Global styles with Red Hat Display font
│   │   │   ├── _variables.scss   # Color variables (light/dark themes)
│   │   │   ├── _themes.scss      # CSS custom properties & grayscale palette
│   │   │   └── _mixins.scss      # SCSS mixins
│   │   ├── types/                # TypeScript type definitions
│   │   │   ├── globals.d.ts      # Global type declarations
│   │   │   ├── languages.ts      # i18n types
│   │   │   └── SWNotifications.ts # Service worker notification types
│   │   └── utils/                # Utility functions
│   │       ├── index.ts          # Utility exports
│   │       └── urlBase64ToUint8Array.ts # Push notification utility
│   │
│   ├── docker/
│   │   └── docker-compose.yml    # Frontend Docker configuration
│   ├── index.html                # HTML entry point
│   ├── package.json              # Dependencies & scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── vite.config.ts            # Vite build & PWA configuration (with HMR for Docker)
│   ├── pwa-assets.config.ts      # PWA asset generation
│   ├── .env.development          # Development environment variables
│   └── .env.production           # Production environment variables
│
├── certs/                        # SSL certificates (shared by frontend and backend)
│   ├── localhost.pem             # SSL certificate
│   └── localhost-key.pem         # SSL private key
│
├── package.json                  # Root package.json
└── README.md                     # Project documentation
```

**Key Directories:**

- **`frontend/src/components/`** - Reusable React components with custom theming
- **`frontend/src/stores/`** - MobX state management
- **`frontend/src/hooks/`** - Custom React hooks for common functionality
- **`frontend/src/utils/`** - Helper functions for crypto, storage, offline mode
- **`frontend/src/api/`** - API client with typed requests/responses
- **`certs/`** - SSL certificates for HTTPS in development (shared by frontend and backend)
- **`backend/api/`** - Backend server implementation with HTTPS, Zod validation, and email verification
- **`backend/api/utils/email.ts`** - Email verification system using nodemailer
- **`backend/api/schemas/`** - Zod schemas with OpenAPI metadata for type-safe validation
- **`backend/api/routes/`** - Express routes (auth, users, models)
- **`backend/api/openapi/`** - Auto-generated OpenAPI 3.0 documentation
- **`backend/db/setup/`** - PostgreSQL initialization scripts (run in alphabetical order)
- **`backend/docker/`** - Docker configuration for backend and database services

**Important Files:**

- **`frontend/src/sw.ts`** - Service Worker for PWA offline functionality
- **`frontend/vite.config.ts`** - Build configuration with PWA plugin and HMR for Docker (file polling enabled)
- **`frontend/src/styles/index.scss`** - Global styles with Red Hat Display font (@font-face declarations)
- **`frontend/src/styles/_themes.scss`** - CSS custom properties with grayscale palette for clean UI design
- **`frontend/src/routes/ProtectedRoute.tsx`** - Auth guard supporting both authenticated and offline modes
- **`backend/api/server.ts`** - Express server with HTTPS support and OpenAPI documentation endpoints
- **`backend/api/schemas/index.ts`** - Zod schemas for validation and OpenAPI generation
- **`backend/api/middleware/validation.ts`** - Zod validation middleware
- **`backend/api/config/passport.ts`** - Passport.js Google OAuth configuration (prioritizes BACKEND_URL)
- **`backend/api/utils/email.ts`** - Email verification with nodemailer (auto-detects FRONTEND_URL from VERCEL_URL)
- **`backend/api/config/database.ts`** - PostgreSQL connection pool (supports DATABASE_URL or individual params)
- **`backend/db/setup/03_schema.sql`** - Database schema with `pending_registrations` table for email verification flow
- **`backend/docker/docker-compose.yml`** - Service orchestration with PostgreSQL healthcheck
- **`backend/API.md`** - Detailed API documentation and development guide

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- Prerequisites -->

## Prerequisites

<!--SSL Certificates-->

### SSL certificates

Install certificates for the app to work properly, you can do this by using **_mkcert_**.

#### **_Windows_**

**Step 1 (skip if you have Chocolatey already installed):** Install Chocolatey package manager (in the Powershell terminal with admin rights):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1')); [Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path','User') + ';' + [Environment]::GetEnvironmentVariable('ChocolateyInstall','Machine') + '\bin', 'User')"
```

**Step 2:** Install `mkcert` via Chocolatey (in the Powershell terminal with admin rights):

```powershell
choco install mkcert -y
```

**Step 3:** Install local CA (first time only) - **_this may NOT work for Firefox_** (click [here](https://wiki.mozilla.org/CA/AddRootToFirefox#Windows_Enterprise_Support) for Firefox solution):

```powershell
mkcert -install
```

**Step 4:** Create certificates directory in project root

```powershell
New-Item -ItemType Directory -Path .\certs -Force | Out-Null
```

**Step 5:** Navigate to the directory and generate certificate for localhost

```powershell
cd .\certs; mkcert localhost
```

#### **_Ubuntu/Debian_**

**Step 1:** Install mkcert & nss packages

```bash
apt install mkcert libnss3-tools
```

**Step 2:** Install local CA (first time only)

```bash
mkcert -install
```

**Step 3:** Create certificates directory in project root

```bash
mkdir -p ./certs/
```

**Step 4:** Navigate to the directory and generate certificate for localhost

```bash
cd ./certs/ && mkcert localhost
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!--Docker-->

### Docker

To run the app in Docker (_*recommended*_), you need to have Docker installed on your machine. You can follow the official [Docker installation guide](https://docs.docker.com/get-docker/) for your operating system.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- Set up .env file-->

### Set up .env files

#### Frontend Environment

Create a `.env.development` file in the **frontend** directory and add the following variables:

```env
# Service Worker Configuration
SW=true                          # Enable service worker
SW_DEV=true                      # Enable service worker in development mode
SW_DESTROY=false                 # Should service worker be destroyed on reload
SOURCE_MAP=false                 # Generate source maps (false for faster dev builds)

# API Configuration
VITE_API_URL=https://localhost:3000/api  # Backend API URL (uses HTTPS in development)

# Push Notifications
VITE_VAPID_PUBLIC_KEY=BFJPsiDQQ19a9V9EDeS9bDfwlDkb4gw9Z7_gnwU04bguJU-NdyCc2Xqr42QpfinAHhlt68v2VRs4viTgljK7vqk
```

For `.env.production` in the **frontend** directory:

```env
# Service Worker Configuration
SW=true                          # Enable service worker
SW_DEV=false                     # Disable service worker dev mode in production
SW_DESTROY=false                 # Should service worker be destroyed on reload
SOURCE_MAP=true                  # Generate source maps for production debugging

# API Configuration
VITE_API_URL=https://your-backend-url.vercel.app/api  # Replace with your production backend URL

# Push Notifications
VITE_VAPID_PUBLIC_KEY=BFJPsiDQQ19a9V9EDeS9bDfwlDkb4gw9Z7_gnwU04bguJU-NdyCc2Xqr42QpfinAHhlt68v2VRs4viTgljK7vqk
```

#### Backend Environment

Create a `.env` file in the **backend** directory and add the following variables:

```env
# Vercel Environment Variables (auto-injected in production)
NEXT_PUBLIC_VERCEL_ENV=development
NEXT_PUBLIC_VERCEL_URL=${VERCEL_URL:-}

# Server Configuration
PORT=3000

# Database Connection - Local (Docker)
DB_HOST=localhost
DB_PORT=5433                     # External port (Docker maps to internal 5432)
DB_NAME=your_database_name            # Note: Database name includes "_db" suffix
DB_OWNER=your_db_user        # Database owner username
DB_OWNER_PASSWORD=your_db_password       # Change in production!

# Database Connection - Production (Neon) - Uncomment and configure for production
# Use direct (non-pooled) endpoint to support all connection parameters
# DATABASE_URL=postgresql://your_db_user:password@your-db-host.cloud.provider.com:5432/your_database_name?sslmode=require

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production  # CRITICAL: Change this in production!
JWT_EXPIRES_IN=7d                                # Token expiration time

# URL Configuration
FRONTEND_URL=https://localhost:5173              # Frontend URL for email verification links
BACKEND_URL=https://localhost:3000               # Backend URL for OAuth callbacks

# Email Configuration (SMTP) - for email verification
# For Gmail: Use App Password (not regular password)
# Enable 2FA and create app password at: https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=3dmodelviewerapp@gmail.com            # Your Gmail address
SMTP_PASSWORD=your-gmail-app-password                   # Gmail App Password (16 characters)
SMTP_FROM_EMAIL=noreply@3dmodelviewer.app       # "From" email address
SMTP_FROM_NAME=3D Model Viewer Team              # "From" display name

# Google OAuth Configuration (optional)
# Get credentials from: https://console.cloud.google.com/apis/credentials
# Configure callback URL: https://your-backend-url.vercel.app/api/auth/google/callback
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Key Configuration Notes:**

- `BACKEND_URL` and `FRONTEND_URL` - Use **HTTPS** in development (both services support SSL with self-signed certificates)
- `DB_NAME=your_database_name` - Database name includes "\_db" suffix (not just `inzynierka`)
- `DB_PORT=5433` - External port (Docker maps to internal port 5432)
- `SMTP_PASSWORD` - For Gmail, use an **App Password** (16 characters), not your regular Gmail password
  - Enable 2FA on your Google account first
  - Generate App Password at: https://myaccount.google.com/apppasswords
- `DATABASE_URL` - Uncomment and configure for production deployments (Neon, Vercel, etc.)
- `JWT_SECRET` - **CRITICAL**: Change this to a secure random string in production
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` - Optional, only needed if using Google OAuth
  - Configure OAuth callback URL: `https://your-backend-url/api/auth/google/callback`
- SSL certificates in `certs/` directory are shared by both frontend and backend
- In production (Vercel), set `BACKEND_URL` explicitly to avoid OAuth redirect issues

**Backend Features:**

- **HTTPS Support**: Automatic HTTPS in development when certificates are present in `certs/` directory
- **Email Verification**: Registration requires email verification with 24-hour token expiry
  - Uses nodemailer with Gmail SMTP (or any SMTP provider)
  - Pending registrations stored in separate table until verified
  - Automatic cleanup of expired verification tokens
- **Google OAuth**: Optional social login with Passport.js
  - OAuth users have empty `password_hash` in database
  - Seamless integration with email/password authentication
- **Username-based Login**: Users log in with username (not email) and password
- **Zod Validation**: All API requests/responses validated with type-safe Zod schemas
- **OpenAPI 3.0**: Auto-generated documentation from Zod schemas
- **Swagger UI**: Interactive API testing at `/api/docs/swagger`
- **PostgreSQL 17**: TimescaleDB with UUID v7 support (pg_uuidv7 extension)
- **User Profiles**: Username-based authentication system
- **Connection Pooling**: Efficient database connection management with `pg` pool
- **Hot Module Reload (HMR)**: File watching with polling for Docker environments

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting started

> [!IMPORTANT] > **Before running the app in development or Docker mode, you must complete the [SSL certificates setup](#ssl-certificates) (in the `certs/` directory at project root) and [.env file configuration](#set-up-env-files) from the Prerequisites section above.**

### Install dependencies

-Install dependencies using **yarn**:

```bash
  yarn install
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Starting the app

#### Run Both Frontend and Backend (Recommended)

-For development mode with both services running, use:

```bash
  yarn dev
```

This will start:

- **Frontend** at [https://localhost:5173](https://localhost:5173)
- **Backend** at [https://localhost:3000](https://localhost:3000) (HTTPS enabled with self-signed certificates)

#### Run Services Individually

-To run only the frontend:

```bash
yarn dev:frontend
```

-To run only the backend:

```bash
yarn dev:backend
```

#### API Documentation

When the backend is running, you can access:

- **Interactive Swagger UI**: [https://localhost:3000/api/docs/swagger](https://localhost:3000/api/docs/swagger)
- **OpenAPI JSON**: [https://localhost:3000/api/docs](https://localhost:3000/api/docs)
- **Health Check**: [https://localhost:3000/health](https://localhost:3000/health)

> **Note:** Your browser will show a security warning for the self-signed certificate. Click "Advanced" and "Proceed" to accept it.

The API uses **Zod** for request/response validation and automatically generates **OpenAPI 3.0** documentation. See [backend/API.md](backend/API.md) for detailed API documentation.

#### Database Management

> **Note:** The database uses PostgreSQL 17 with TimescaleDB extension and runs on port 5433.

-To start the PostgreSQL database:

```bash
cd backend
yarn db:start
```

-To stop the database:

```bash
cd backend
yarn db:stop
```

-To rebuild the database (removes all data):

```bash
cd backend
yarn docker:clean
yarn db:start
```

**Database Features:**

- PostgreSQL 17 with UUID v7 support (pg_uuidv7 extension)
- Email verification workflow with `pending_registrations` table
- Automatic cleanup of expired pending registrations
- Secure password hashing with bcrypt
- Session management and login attempt tracking
- Google OAuth user support (empty password_hash for OAuth-only accounts)

#### Testing PWA Functions

> [!WARNING] > **For PWA to work properly you need to run built version of the app. At this time the Firefox and Safari browsers do not support PWA on desktop [read more here](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable#browser_support)**

-For testing PWA functions, run the following command:

```bash
  yarn preview:frontend
```

The app will be available at port 4173: [https://localhost:4173](https://localhost:4173)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Using Docker

> [!IMPORTANT] > **Ensure SSL certificates are generated in `certs/` directory at project root and `.env` files are configured for both frontend and backend before running Docker commands. See [SSL certificates setup](#ssl-certificates) and [.env file configuration](#set-up-env-files) sections.**

#### Development Mode

-To run both frontend and backend services in Docker:

```bash
  yarn docker:dev
```

This will start:

- **Frontend** at [https://localhost:5173](https://localhost:5173)
- **Backend** at [https://localhost:3000](https://localhost:3000) (HTTPS with self-signed certificate)
- **PostgreSQL Database** on port 5433

#### Production Mode

-For production mode:

```bash
  yarn docker:prod
```

The app will be available at:

- **Port 443 (HTTPS)**: [https://localhost](https://localhost)
- **Port 80 (HTTP)**: Redirects to HTTPS
- **Backend API**: [https://localhost:3000](https://localhost:3000)

#### Docker Management

-To stop all Docker containers:

```bash
yarn docker:down
```

-To rebuild Docker containers (use this after making changes to Dockerfile or docker-compose.yml):

```bash
# For frontend
yarn docker:rebuild

# For backend (includes database)
cd backend
yarn docker:rebuild
```

-To clean and rebuild the database (removes all data):

```bash
cd backend
yarn docker:clean
yarn docker:rebuild
yarn db:start
```

-To start only the database:

```bash
cd backend
yarn db:start
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

Readme by: [zsobecki-futurum](https://github.com/zsobecki-futurum) aka [dziwuj](https://github.com/dziwuj)

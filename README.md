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
│   │   ├── server.ts             # Express server with OpenAPI endpoints
│   │   ├── config/
│   │   │   └── database.ts       # PostgreSQL connection pool
│   │   ├── middleware/
│   │   │   └── validation.ts     # Zod validation middleware
│   │   ├── schemas/
│   │   │   └── index.ts          # Zod schemas with OpenAPI metadata
│   │   ├── openapi/
│   │   │   └── index.ts          # OpenAPI 3.0 document generator
│   │   └── routes/
│   │       ├── auth.ts           # Authentication endpoints
│   │       ├── users.ts          # User CRUD endpoints
│   │       └── models.ts         # Model CRUD endpoints
│   ├── db/
│   │   └── setup/                # Database initialization scripts
│   │       ├── 00_init_users.sql # User initialization
│   │       ├── 01_extensions.sql # PostgreSQL extensions
│   │       ├── 02_types.sql      # Custom types
│   │       ├── 03_schema.sql     # Database schema
│   │       ├── 04_indexes.sql    # Database indexes
│   │       ├── 05_timescale_init.sql # TimescaleDB setup
│   │       └── 06_triggers.sql   # Database triggers
│   ├── docker/
│   │   ├── Dockerfile            # Backend container
│   │   ├── Dockerfile.db         # PostgreSQL + TimescaleDB
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
│   │   ├── assets/               # Static resources (fonts, icons, images)
│   │   ├── certs/                # SSL certificates
│   │   ├── components/           # React components
│   │   ├── constants/            # App-wide constants
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # Route pages/views
│   │   ├── routes/               # Routing configuration
│   │   ├── stores/               # MobX state management
│   │   ├── styles/               # Global styles & custom theme
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Utility functions
│   │
│   ├── index.html                # HTML entry point
│   ├── package.json              # Dependencies & scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── vite.config.ts            # Vite build & PWA configuration
│   └── pwa-assets.config.ts      # PWA asset generation
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
- **`frontend/src/certs/`** - SSL certificates for HTTPS in development
- **`backend/api/`** - Backend server implementation with Zod validation
- **`backend/api/schemas/`** - Zod schemas with OpenAPI metadata for type-safe validation
- **`backend/api/routes/`** - Express routes (auth, users, models)
- **`backend/api/openapi/`** - Auto-generated OpenAPI 3.0 documentation
- **`backend/db/setup/`** - PostgreSQL initialization scripts (run in alphabetical order)
- **`backend/docker/`** - Docker configuration for backend and database services

**Important Files:**

- **`frontend/src/sw.ts`** - Service Worker for PWA offline functionality
- **`frontend/vite.config.ts`** - Build configuration with PWA plugin
- **`backend/api/server.ts`** - Express server with OpenAPI documentation endpoints
- **`backend/api/schemas/index.ts`** - Zod schemas for validation and OpenAPI generation
- **`backend/api/middleware/validation.ts`** - Zod validation middleware
- **`backend/api/config/database.ts`** - PostgreSQL connection pool
- **`backend/db/setup/00_init_users.sql`** - Database user initialization (reads from .env)
- **`backend/docker/docker-compose.yml`** - Service orchestration for backend, database, and development containers
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

**Step 4:** Create certificates directory

```powershell
New-Item -ItemType Directory -Path .\frontend\src\certs -Force | Out-Null
```

**Step 5:** Navigate to the directory and generate certificate for localhost

```powershell
cd .\frontend\src\certs; mkcert localhost
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

**Step 3:** Create certificates directory

```bash
mkdir -p ./frontend/src/certs/
```

**Step 4:** Navigate to the directory and generate certificate for localhost

```bash
cd ./frontend/src/certs/ && mkcert localhost
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
SW=true           #is the service worker enabled
SW_DEV=true       #is the service worker in development mode
SW_DESTROY=false   #should the service worker be destroyed on reload
SOURCE_MAP=false  #should the source map be generated
VITE_API_URL=http://localhost:3000/api  #API URL (default server uses http://localhost:3000/api)
VITE_VAPID_PUBLIC_KEY= <enter your VAPID PUBLIC KEY here> #key for push notifications
```

For `.env.production` in the **frontend** directory:

```env
SW=true           #is the service worker enabled
SW_DEV=false       #is the service worker in development mode
SW_DESTROY=false   #should the service worker be destroyed on reload
SOURCE_MAP=true  #should the source map be generated
VITE_API_URL= <enter your API URL here> #API URL (default server uses http://localhost:3000/api)
VITE_VAPID_PUBLIC_KEY= <enter your VAPID PUBLIC KEY here> #key for push notifications
```

#### Backend Environment

Create a `.env` file in the **backend** directory and add the following variables:

```env
# Server Configuration
PORT=3000
CORS_ORIGIN=https://localhost:5173

# Database Owner (created by initialization script and used by application)
DB_OWNER=your_db_user
DB_OWNER_PASSWORD=your_db_password

# Database Connection
DB_HOST=localhost
DB_PORT=5433
DB_NAME=inzynierka

# PostgreSQL Port
PG_PORT=5433
```

**Key Configuration Notes:**

- `DB_OWNER` and `DB_OWNER_PASSWORD` - Used to create the database user during PostgreSQL initialization and for application connections
- `DB_PORT=5433` - External port (mapped from container's internal port 5432)
- `CORS_ORIGIN` - Frontend URL for CORS policy

**Backend Features:**

- **Zod Validation**: All requests validated with type-safe Zod schemas
- **OpenAPI 3.0**: Auto-generated documentation from Zod schemas
- **Swagger UI**: Interactive API testing at `/api/docs/swagger`
- **PostgreSQL**: Type-safe database queries with connection pooling

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting started

> [!IMPORTANT] > **Before running the app in development or Docker mode, you must complete the [SSL certificates setup](#ssl-certificates) and [.env file configuration](#set-up-env-files) from the Prerequisites section above.**

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
- **Backend** at [http://localhost:3000](http://localhost:3000)

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

- **Interactive Swagger UI**: [http://localhost:3000/api/docs/swagger](http://localhost:3000/api/docs/swagger)
- **OpenAPI JSON**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

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

- PostgreSQL 17 with TimescaleDB for time-series data
- Automatic user creation from `.env` (`DB_OWNER` variable)
- Hypertables for analytics, login attempts, session history, and model access tracking
- UUID v7 support via pg_uuidv7 extension

#### Testing PWA Functions

> [!WARNING] > **For PWA to work properly you need to run built version of the app. At this time the Firefox and Safari browsers do not support PWA on desktop [read more here](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable#browser_support)**

-For testing PWA functions, run the following command:

```bash
  yarn preview:frontend
```

The app will be available at port 4173: [https://localhost:4173](https://localhost:4173)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Using Docker

> [!IMPORTANT] > **Ensure SSL certificates are generated in `frontend/src/certs/` and `.env` files are configured for both frontend and backend before running Docker commands. See [SSL certificates setup](#ssl-certificates) and [.env file configuration](#set-up-env-files) sections.**

#### Development Mode

-To run both frontend and backend services in Docker:

```bash
  yarn docker:dev
```

This will start:

- **Frontend** at [https://localhost:5173](https://localhost:5173)
- **Backend** at [http://localhost:3000](http://localhost:3000)
- **PostgreSQL Database** (if configured)

#### Production Mode

-For production mode:

```bash
  yarn docker:prod
```

The app will be available at:

- **Port 443 (HTTPS)**: [https://localhost](https://localhost)
- **Port 80 (HTTP)**: Redirects to HTTPS
- **Backend API**: [http://localhost:3000](http://localhost:3000)

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

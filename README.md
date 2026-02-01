# AddisIdeas

A modern platform for sharing and collaborating on ideas, migrating from a legacy PHP stack to a TypeScript monorepo.

## 🚀 Getting Started (Local Development)

The easiest way to get the project running locally is using **Docker**. This sets up the database, backend API, and frontend application automatically without needing to install Node.js or PostgreSQL on your host machine.

### Prerequisites

- **Docker Desktop**: [Download and install here](https://www.docker.com/products/docker-desktop/)
- **Git**: To clone the repository.

### Running the App

1. **Open your terminal** (Command Prompt or PowerShell on Windows, Terminal on macOS/Linux).
2. **Navigate to the project folder**:
   ```bash
   cd Addis-Test
   ```
3. **Start the application**:
   ```bash
   docker-compose up --build
   ```
   *Note: The first time you run this, it will take a few minutes to download the necessary images and build the project.*

### 🛠 How to Use

Once the terminal shows that the services are running, you can access the platform at the following addresses:

- **Frontend (Website)**: [http://localhost:3000](http://localhost:3000)
- **Backend (API)**: [http://localhost:3001](http://localhost:3001)
- **Database**: Accessible via any PostgreSQL client at `localhost:5432`
  - **User**: `user`
  - **Password**: `password`
  - **Database Name**: `addisideas`

### 💡 What's Happening Under the Hood?

- **Automatic Database Setup**: Docker starts a PostgreSQL 16 database and creates the `addisideas` database for you.
- **Instant Migrations**: Every time you start the app, it checks for any new database changes and applies them automatically.
- **Monorepo Structure**: The project uses `pnpm` workspaces to manage the Fastify API (`apps/api`) and Next.js Frontend (`apps/web`) in a single environment.

---

## 📂 Project Structure

- `apps/api`: Fastify-based TypeScript REST API.
- `apps/web`: Next.js (React 19) frontend application.
- `packages/db`: Shared database schema and migrations using Drizzle ORM.
- `packages/shared`: Shared validation logic and TypeScript types.
- `archive/`: Legacy PHP/jQuery application (for reference).

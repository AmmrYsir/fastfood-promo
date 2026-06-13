# Malaysia Fast Food Promotions Aggregator

A blazingly fast, standalone web service that autonomously tracks, indexes, and displays the latest fast-food promotions in Malaysia. 

Powered by **Bun**, **Hono**, and the **Tavily AI Search API**, this project automatically executes web searches every 12 hours, storing the results in a native SQLite database, and serving them via an ultra-premium Tailwind CSS glassmorphism dashboard.

## 🚀 Features

- **Automated Background Scheduler**: A built-in, lightweight cron-like scheduler perfectly synced to run every 12 hours. It seamlessly picks up right where it left off, even if the server restarts.
- **Tavily AI Integration**: Leverages Tavily's advanced search depth capabilities to scour the web for deals with high relevancy scoring (≥40% match required).
- **Standalone SQLite Database**: Uses `bun:sqlite` for an embedded, zero-configuration database that handles persistent history and promotion indexing.
- **Ultra-Premium Dashboard**: A beautifully designed server-side rendered (SSR) web UI using Hono JSX, Tailwind CSS, custom Google Fonts, and Phosphor Icons.
- **Advanced Query Engine**: Instantly paginate, search by keyword, filter by brand, and isolate results by exact timestamp right from the dashboard.
- **Native Execution Transcripts**: View the health and transcript history of the background scheduler inside a sleek HTML5 modal overlay.

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Hono](https://hono.dev/)
- **Database**: SQLite (`bun:sqlite`)
- **Search API**: [Tavily](https://tavily.com/)
- **Frontend**: Tailwind CSS (CDN), Alpine/Vanilla HTML5 interactions

---

## ⚙️ Prerequisites

You must have **Bun** installed on your system.
You will also need an API key from **Tavily** to execute live web searches.

## 📦 Installation & Setup

1. **Install Dependencies**
   ```bash
   bun install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory and add the following:
   ```env
   # Your Tavily Developer API Key (required for live searches)
   TAVILY_API_KEY=tvly-dev-********************************

   # Optional: Set to true to bypass Tavily and use mock data (saves API credits during UI work)
   DRY_RUN=false
   ```

3. **Initialize the Database**
   Before running the server for the first time, safely bootstrap the SQLite database tables:
   ```bash
   bun run init
   ```
   *This command creates the `data.db` file and generates the `searches`, `promotions`, and `pull_history` tables.*

---

## 🚀 Running the Project

Start the development server with hot-reloading enabled:

```bash
bun run dev
```

The application will start, the background scheduler will fire its first check, and the web dashboard will become available at:
👉 **http://localhost:3000**

## 📂 Project Structure

- `src/index.ts`: The main Hono application and API route definitions.
- `src/db.ts`: SQLite table creation, raw SQL queries, and pagination logic.
- `src/tavily.ts`: Integration with the `@tavily/core` SDK and data normalization.
- `src/scheduler.ts`: The 12-hour background worker and state management logic.
- `src/init.ts`: Standalone CLI script for database bootstrapping.
- `src/views/`: Hono JSX components (`layout.tsx` and `Dashboard.tsx`) containing the Tailwind CSS UI.

## 🛡️ License

This project is intended for educational and demonstration purposes.

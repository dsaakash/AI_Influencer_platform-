# InfluenceIQ — Influencer Affiliate & Payment Tracking Platform

InfluenceIQ is a high-performance, full-stack dashboard for managing influencer marketing campaigns. It allows brands to track affiliate sales in real-time, manage payouts, and leverage AI to analyze performance and detect fraud.

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Hosted on Neon)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5](https://next-auth.js.org/)
- **Styling**: Tailwind CSS + Custom Glassmorphism UI
- **AI Integration**: 
  - **Primary**: Google Gemini 2.0 Flash
  - **Fallback**: Groq (Llama 3.3 70B)
- **Charts**: Recharts

---

## 🏗️ Architecture

The project follows a modern Next.js 14 architecture:

- **`/app`**: Contains the App Router structure.
  - **`(dashboard)/admin`**: Protected routes for brand administrators.
  - **`(dashboard)/influencer`**: Protected routes for creators.
  - **`/api`**: Backend endpoints for AI generation, data tracking, and auth.
- **`/components`**: Reusable UI components (Sidebar, Charts, KPI Cards).
- **`/lib`**: Core utilities, database client, and AI fallback logic.
- **`/prisma`**: Database schema definition and seed scripts.

### AI Fallback System
The platform features an intelligent AI fallback mechanism located in `lib/ai.ts`. If the primary Gemini API hits rate limits (429) or fails, the system automatically switches to **Groq** to ensure uninterrupted insights and fraud detection.

---

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js 18+
- A Neon PostgreSQL database (or any PostgreSQL instance)
- API keys for Gemini and Groq

### 2. Environment Configuration
Create a `.env` file in the root directory and add the following:

```env
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### 3. Installation
```bash
npm install
```

### 4. Database Setup
Push the schema to your database and generate the Prisma client:
```bash
npx prisma db push
```

### 5. Seeding Data
Populate the database with 90 days of realistic demo data (influencers, clicks, and sales):
```bash
node prisma/seed.js
```

### 6. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Roles & Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@demo.com` | `admin123` |
| **Influencer** | `priya@demo.com` | `influencer123` |

---

## ✨ Key Features

- **Real-time KPI Tracking**: Monitor Revenue, Clicks, and Payouts.
- **AI Performance Insights**: Automated analysis of influencer sales patterns.
- **AI Fraud Detection**: Detects suspicious IP concentration and bot-like behavior.
- **Affiliate Link Management**: Automatic generation of unique referral links.
- **Payment Workflow**: Track commissions from "Pending" to "Paid".
- **Responsive Design**: Fully optimized for desktop and mobile viewing.

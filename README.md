# DataLens - Automated EDA Report Generator

> **Transform raw data into actionable insights with AI-powered Exploratory Data Analysis**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-blue)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-green)](https://www.python.org/)

## 🚀 Overview

DataLens is an automated Exploratory Data Analysis (EDA) platform that transforms raw CSV/Excel files into comprehensive, professional reports with AI-generated insights. Built with a serverless architecture for scalability and ease of deployment.

## ✨ Features

- **📁 Smart File Upload**: Upload CSV/Excel files up to 50MB with drag-and-drop
- **🔍 Comprehensive Analysis**: 
  - Data quality assessment (missing values, duplicates, outliers)
  - Univariate analysis (distributions, statistics, visualizations)
  - Correlation analysis (Pearson, Spearman, Kendall)
  - Target variable analysis (classification/regression detection)
  - ML readiness assessment with recommendations
- **🤖 AI-Powered Insights**: Gemini API generates narrative insights and recommendations
- **📊 Interactive Visualizations**: Plotly charts for all analysis types
- **📄 Professional Reports**: Generate PDF/HTML reports with customizable sections
- **⚡ Real-time Updates**: Live job status tracking with Supabase Real-time
- **🔒 Enterprise Security**: File validation, RLS, encrypted storage

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   React Frontend (Vercel)                   │
│                    - Free hosting                           │
│                    - Global CDN                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Supabase                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │   Storage    │  │     Auth     │     │
│  │              │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Auto-generated REST & GraphQL APIs            │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Railway Services                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Service 1: Data Processing                          │  │
│  │  - File upload validation                           │  │
│  │  - Data profiling (pandas)                          │  │
│  │  - Statistical analysis (scipy)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Service 2: AI Insights                              │  │
│  │  - Gemini API integration                           │  │
│  │  - Narrative generation                             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Service 3: Report Generation                       │  │
│  │  - PDF generation (weasyprint)                      │  │
│  │  - HTML templating (Jinja2)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Gemini API  │
                     └─────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS, Radix UI components
- **Data Fetching**: TanStack React Query
- **Charts**: Plotly.js
- **Auth**: Supabase Auth
- **Deployment**: Vercel

### Backend
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Processing**: Railway Workers (Python)
- **Data Analysis**: pandas, scipy, numpy
- **AI**: Google Gemini API
- **Reports**: Jinja2, WeasyPrint

## 📦 Project Structure

```
DataLens/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── lib/             # Utilities (Supabase client, etc.)
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # TypeScript type definitions
│   └── public/              # Static assets
├── workers/                  # Railway Python services
│   ├── data_processor/      # Service 1: Data processing
│   ├── ai_insights/         # Service 2: AI insights
│   └── report_generator/    # Service 3: Report generation
├── shared/                   # Shared utilities and types
├── tests/                    # Test files
├── docs/                     # Documentation
├── .gitignore
├── .env.example
├── README.md
└── tasks.md                 # Implementation tasks
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Git
- Accounts:
  - [Supabase](https://supabase.com) (free tier)
  - [Railway](https://railway.app) (free tier + $5 credits/month)
  - [Vercel](https://vercel.com) (free tier)
  - [Google Cloud](https://cloud.google.com) (for Gemini API)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd DataLens
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Install worker dependencies**
   ```bash
   cd ../shared
   pip install -r requirements.txt
   ```

### Development

1. **Start frontend dev server**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Run workers locally** (for testing)
   ```bash
   cd workers/data_processor
   python main.py
   ```

## 📊 Usage

1. **Upload Data**: Drag and drop CSV/Excel files (max 50MB)
2. **Automatic Analysis**: System processes data and generates insights
3. **Explore Results**: Interactive dashboard with visualizations
4. **Generate Reports**: Export professional PDF/HTML reports
5. **AI Insights**: Get intelligent recommendations and interpretations

## 🔒 Security

- ✅ File upload validation (type, size, content scanning)
- ✅ Row Level Security (RLS) on all Supabase tables
- ✅ API key management via environment variables
- ✅ Rate limiting on all endpoints
- ✅ CORS configuration
- ✅ Webhook signature verification
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ HTTPS enforcement

See [tasks.md](tasks.md) Phase 1.5 for comprehensive security implementation details.

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test

# Worker tests
cd workers
pytest

# Security scanning
pip-audit --desc
bandit -r workers/
npm audit
```

## 📈 Deployment

### Frontend (Vercel)
```bash
vercel --prod
```

### Workers (Railway)
Connected via GitHub - automatic deployment on push to main branch.

## 💰 Cost Breakdown

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| **Supabase** | Free | $0 |
| **Vercel** | Hobby (Free) | $0 |
| **Railway** | Free tier + credits | $5-20 |
| **Gemini API** | Free tier | $0 |
| **Total** | | **$5-20/month** |

## 🗺️ Roadmap

- [x] Phase 1: Foundation & Account Setup
- [ ] Phase 2: Supabase Integration & Data Model
- [ ] Phase 3: Data Processing Worker
- [ ] Phase 4: AI Insights Worker
- [ ] Phase 5: Report Generation Worker
- [ ] Phase 6: Frontend Development
- [ ] Phase 7: Testing & Quality Assurance
- [ ] Phase 8: Deployment & Production
- [ ] Phase 9: Polish & Portfolio Preparation

See [tasks.md](tasks.md) for detailed implementation plan.

## 🤝 Contributing

This is a portfolio project. Feel free to fork and customize for your own use!

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

Built as a portfolio project demonstrating full-stack development, data engineering, and AI integration.

## 🙏 Acknowledgments

- Supabase for the excellent backend infrastructure
- Railway for the simple deployment experience
- Google for the Gemini API
- The open-source community for amazing tools and libraries

---

**Status**: 🚧 In Development

**Last Updated**: 2025-04-18

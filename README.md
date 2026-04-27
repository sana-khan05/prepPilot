# 🚀 InterviewIQ — AI Interview & Resume Intelligence Platform

> **Full-stack AI SaaS** | NLP-powered resume analysis | Adaptive AI interview engine | Real-time performance analytics

![Phase](https://img.shields.io/badge/Phase-1%20Complete-green?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20MongoDB-blue?style=flat-square)
![AI](https://img.shields.io/badge/AI-OpenAI%20GPT--4o%20%2B%20Whisper-purple?style=flat-square)

---

## 🎯 What is InterviewIQ?

InterviewIQ is an **AI-driven adaptive interview system** and **ATS-based resume intelligence engine** that helps candidates ace interviews and helps recruiters find the right fit.

| Feature | Status |
|---|---|
| User Auth (JWT) + Role-based access | ✅ Phase 1 |
| Resume Upload + Version Control | ✅ Phase 1 |
| Candidate & Recruiter Dashboard | ✅ Phase 1 |
| ATS Score + Skill Gap Analysis (NLP) | 🔧 Phase 2 |
| AI Interview Engine (GPT-4o) | 🔧 Phase 3 |
| Performance Analytics Dashboard | 🔧 Phase 4 |
| AI Resume Builder + Learning Engine | 🔧 Phase 5 |

---

## 🏗️ Tech Stack

**Frontend:** React 18 + Vite, Tailwind CSS, React Router v6, Recharts  
**Backend:** Node.js + Express, JWT Auth, Multer  
**Database:** MongoDB Atlas (Mongoose)  
**AI Layer:** OpenAI GPT-4o, Whisper (Phase 3+)  
**Deploy:** Vercel (frontend) + Railway (backend)

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- Git

### 1. Clone the repo
```bash
git clone https://github.com/sana-khan05/prepPilot.git
cd prepPilot
```

### 2. Setup Backend
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and fill in:
#   MONGODB_URI=your_mongodb_atlas_connection_string
#   JWT_SECRET=any_long_random_string_32_chars_min

npm run dev
# API running at http://localhost:5000
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
# App running at http://localhost:5173
```

### 4. Test it!
- Open `http://localhost:5173`
- Click "Create Account"
- Register as a Candidate or Recruiter
- Upload a resume PDF
- Explore the dashboard!

---

## 📁 Project Structure

```
interviewiq/
├── backend/
│   ├── src/
│   │   ├── config/          # DB + Multer config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, validation, errors
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── utils/           # JWT helpers
│   │   └── server.js        # Express app entry
│   ├── uploads/             # Uploaded resumes (gitignored)
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── api/             # Axios API client
    │   ├── components/      # Reusable UI (Sidebar, Layout, etc.)
    │   ├── context/         # React Context (Auth)
    │   ├── pages/           # Route pages
    │   └── main.jsx         # Entry point
    └── index.html
```

---

## 🔌 API Endpoints (Phase 1)

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login + get JWT |
| GET  | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/auth/logout` | Logout |
| PUT  | `/api/v1/auth/update-profile` | Update profile |
| PUT  | `/api/v1/auth/change-password` | Change password |
| POST | `/api/v1/auth/refresh` | Refresh access token |

### Resumes
| Method | Route | Description |
|---|---|---|
| POST | `/api/v1/resumes/upload` | Upload resume (multipart) |
| GET  | `/api/v1/resumes` | Get all my resumes |
| GET  | `/api/v1/resumes/:id` | Get single resume |
| DELETE | `/api/v1/resumes/:id` | Delete resume |
| GET  | `/api/v1/resumes/:id/download` | Download file |
| GET  | `/api/v1/resumes/stats` | Resume stats |

### Dashboard
| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/dashboard` | Candidate dashboard data |
| GET | `/api/v1/dashboard/recruiter` | Recruiter dashboard |

---

## 🗺️ Build Roadmap

```
Phase 1 (Wk 1-2)  ✅  Foundation: Auth, File Upload, Dashboard
Phase 2 (Wk 3-4)  🔧  AI Resume: ATS Score, Skill Gap, Bias Detection
Phase 3 (Wk 5-7)  🔧  AI Interview: Adaptive Questions, Voice Input
Phase 4 (Wk 8-9)  🔧  Analytics: Charts, Reports, Recruiter View
Phase 5 (Wk 10-11) 🔧  Smart Add-ons: AI Resume Builder, Learning Engine
Phase 6 (Wk 12)   🔧  Deploy: Vercel + Railway + GitHub README
```

---

## 🔑 Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill these required vars:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_32_char_minimum_secret
```

For Phase 2+ you'll also need:
```env
OPENAI_API_KEY=sk-...
```

---

## 👤 Author

Built with ❤️ by [Sana]  
LinkedIn: [https://www.linkedin.com/in/imsanakhan/]  




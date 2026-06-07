# ResumeAI — AI-Powered Resume Reviewer

Upload a PDF resume and get instant AI feedback: ATS score, gap analysis, keyword density, and prioritized improvements — powered by Claude Sonnet.

## Stack

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | React 18 | Fast, component-based UI |
| Backend | Flask + gunicorn | Lightweight Python API |
| AI | Google Gemini 1.5 Flash | Free tier, no credit card needed |
| PDF Parsing | pypdf | Pure-Python, no system deps |
| Deployment | Render (free tier) | Free, zero-config deploys |

---

## Quick Start (Local Dev)

### 1. Clone & enter
```bash
git clone <your-repo>
cd ai-resume-reviewer
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

Get a **free** Gemini API key (no credit card) at: https://aistudio.google.com/app/apikey

```bash
python app.py
# Backend runs on http://localhost:5000
```

### 3. Frontend setup (new terminal)
```bash
cd frontend
npm install

cp .env.example .env
# REACT_APP_API_URL=http://localhost:5000

npm start
# Frontend runs on http://localhost:3000
```

---

## Deployment (Free — No Credit Card Required)

### Backend → Render.com (Free tier)

1. Push your code to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo, set **Root Directory** to `backend`
4. Settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
   - **Environment**: Python 3
5. Add environment variable: `GEMINI_API_KEY = your_key_here`
6. Deploy — you get a URL like `https://resumeai-backend.onrender.com`

### Frontend → Vercel (Free tier)

1. Go to https://vercel.com → New Project → Import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Add environment variable: `REACT_APP_API_URL = https://resumeai-backend.onrender.com`
4. Deploy — done!

### Alternative: Railway.app (also free)
- Both frontend and backend can be deployed to Railway
- Add `ANTHROPIC_API_KEY` as an environment variable
- Railway auto-detects Python/Node and uses the Procfile

---

## Project Structure

```
ai-resume-reviewer/
├── backend/
│   ├── app.py              # Flask API — PDF parsing + Claude integration
│   ├── requirements.txt    # Python dependencies
│   ├── Procfile            # For Railway/Render deployment
│   ├── runtime.txt         # Python version pin
│   └── .env.example        # Environment variable template
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx         # Main React component + all UI
│   │   ├── App.css         # Styles
│   │   ├── index.js        # Entry point
│   │   └── index.css       # Global styles
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## API Reference

### `POST /analyze`

Accepts `multipart/form-data`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resume` | File (PDF) | Yes | The resume PDF |
| `job_description` | String | No | Target job description for ATS matching |

**Response:**
```json
{
  "success": true,
  "data": {
    "ats_score": 74,
    "overall_grade": "B+",
    "summary": "...",
    "sections": { "contact": {...}, "experience": {...}, ... },
    "gaps": [{ "type": "critical", "title": "...", "description": "..." }],
    "improvements": [{ "priority": "high", "category": "...", "suggestion": "..." }],
    "keywords": { "found": [...], "missing": [...], "density_score": 68 },
    "strengths": ["...", "...", "..."],
    "job_match": { "best_roles": [...], "industries": [...] }
  }
}
```

### `GET /health`
Returns `{"status": "ok"}` — use for uptime monitoring.

---

## Features

- **ATS Score (0–100)** — Real compatibility scoring based on keyword density, section structure, and formatting
- **6-Section Analysis** — Contact, Summary, Experience, Education, Skills, Formatting
- **Gap Detection** — Critical, warning, and informational gaps with explanations
- **Improvement Suggestions** — High/medium/low priority with concrete examples
- **Keyword Analysis** — Found vs missing keywords, density score
- **Job Match** — Best-fit roles and industries
- **Optional JD Upload** — Paste a job description for tailored ATS scoring

---

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key (required) |
| `PORT` | Server port (default: 5000) |
| `DEBUG` | Enable Flask debug mode (default: false) |

### Frontend
| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend API URL (empty = same origin) |

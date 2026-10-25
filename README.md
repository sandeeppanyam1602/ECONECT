# ECONECT — Bringing the Informal Collector into the Formal Recycling Chain (SIH 2026)

Full-stack digital platform connecting **Citizens**, **Informal Collectors (Kabadiwalas)**, **Collection Centres**, **Authorized Recyclers**, and **Administrators** with transparent pricing snapshots, verified digital weighing, and chronological waste traceability.

---

## Project Structure

```text
ECONECT_FullStack_SIH2026/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── ai_classifier.py      # Safe image validation & demo fallback classifier
│   │   ├── auth.py               # JWT & RBAC security
│   │   ├── config.py             # Environment configuration
│   │   ├── database.py           # SQLAlchemy engine & session
│   │   ├── main.py               # FastAPI REST endpoints & lifecycle rules
│   │   ├── models.py             # Database tables & enums
│   │   ├── schemas.py            # Pydantic request/response contracts
│   │   └── seed.py               # 15 waste categories & 5 demo accounts
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_econect.py       # End-to-end Pytest suite
│   ├── .env.example
│   └── requirements.txt
├── src/
│   ├── services/
│   │   └── api.ts                # Frontend-to-FastAPI service layer
│   ├── i18n.ts                   # Multilingual dictionary (EN, HI, TE, TA, MR)
│   ├── App.tsx                   # Role-based dashboards & live traceability UI
│   ├── index.css
│   └── main.tsx
├── docker-compose.yml            # Optional PostgreSQL 16 container
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Quick Start (Local Setup)

### 1. Run the Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Run automated tests
pytest -v

# Start API server on http://localhost:8000
uvicorn app.main:app --reload --port 8000
```

### 2. Run the Frontend (React + Vite)
Open a second terminal in the project root:
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Seeded Demo Accounts

| Role | Email | Mobile Number (+91) | Password | Default Badge |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@econect.in` | `9876543210` | `demo123` | *Verified Citizen* |
| **Collector (Kabadiwala)** | `collector@econect.in` | `9876543211` | `demo123` | `ECO-COL-2026-001` |
| **Collection Centre** | `centre@econect.in` | `9876543212` | `demo123` | `ECO-CTR-2026-010` |
| **Authorized Recycler** | `recycler@econect.in` | `9876543213` | `demo123` | `ECO-REC-2026-099` |
| **Administrator** | `admin@econect.in` | `9876543214` | `admin123` | `ECO-ADM-001` |

---

## Added Features

### 1. User Validation via Email & Mobile Number
- **Format Validation**: Strict validation for valid email syntax and standard 10-digit Indian mobile numbers (`^[6-9]\d{9}$`, supporting optional `+91` / `0` prefix).
- **Identity & Verification Lookup**: Validates if user exists, verifies mobile binding, checks verification status (`VERIFIED`, `PENDING`), and issues `ECO-XXX` badges.
- **OTP Verification Flow**: Built-in 6-digit OTP verification simulation (`/auth/send-otp` and `/auth/verify-otp`) to verify accounts on the spot.
- **Visual Integrity**: The UI theme, layout, and colors are completely preserved, adding a clean tabbed panel inside the authentication area.

### 2. AI Chatbot with User Navigation
- **Floating Bot Symbol**: Interactive bot button in the bottom-right corner with a live status indicator.
- **Interactive Navigation Actions**: Clicking navigation buttons inside the bot (e.g. `👉 Go to Book Pickup`, `👉 Go to Collector Queue`, `🔍 Track Waste Journey`, `📱 Validate User`, `🔄 Switch Demo Account`) smoothly scrolls and highlights the target section on the page with an animated focus ring.
- **Domain Assistance**: Answers questions on scrap pricing snapshots, e-waste hazards, digital weighing flows, and chain of custody.

### 3. Complete 1-Click Executable Launchers
- `start_all.bat`: Launches frontend and backend in two separate windows.
- `run_frontend.bat`: Installs dependencies and runs Vite on `http://localhost:5173`.
- `run_backend.bat`: Launches FastAPI on `http://localhost:8000` with Swagger docs at `/docs`.
- **Zero-Crash Standalone Mode**: Frontend features a resilient local engine that works even without starting the backend.

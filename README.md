# MediFlow — AI Smart Patient Onboarding & Pre-Visit Intelligence System

MediFlow is a full-stack web application that streamlines patient onboarding for clinics. Patients complete an AI-driven symptom interview before their appointment, and doctors receive a structured clinical brief — saving 5–7 minutes per consultation.

## Tech Stack

- **Frontend**: React 18 + Vite, Zustand, React Hook Form + Zod, Recharts, Lucide React
- **Backend**: Node.js + Express.js, REST API, MVC pattern
- **Database**: MongoDB + Mongoose
- **AI**: Groq API with Llama 3.3 70B (adaptive interview + brief generation) - Fast, reliable, generous free tier
  - Alternative: Google Gemini 1.5 Flash (configurable)
- **Auth**: JWT (access + refresh tokens), bcrypt
- **File Uploads**: Cloudinary
- **Email**: Nodemailer + Gmail SMTP

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (free M0 tier)
- Groq API key (free - recommended) OR Google Gemini API key
- Cloudinary account (free)
- Gmail account for SMTP (or any SMTP service)

## Setup

```bash
# 1. Clone and install
git clone <repo>
cd mediflow
npm run install:all

# 2. Configure environment
# Edit .env with your credentials (already created)

# 3. Seed the database
cd server && node src/scripts/seed.js

# 4. Run
cd ..
npm run dev
```

Client runs on http://localhost:5173  
Server runs on http://localhost:5000

## Environment Variables

| Variable | Description |
|---|---|
| `AI_PROVIDER` | AI provider to use: 'groq' (recommended) or 'gemini' |
| `GROQ_API_KEY` | Groq API key (get from console.groq.com) |
| `GEMINI_API_KEY` | Google Gemini API key (alternative) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random 64-byte hex string |
| `JWT_EXPIRES_IN` | Access token expiry (15m) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (7d) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port (587) |
| `SMTP_USER` | SMTP login email |
| `SMTP_PASS` | SMTP password/key |
| `WHATSAPP_ENABLED` | Set to false (disabled) |
| `PORT` | Server port (5000) |
| `CLIENT_URL` | Frontend URL |

## Seed Credentials

After running `node src/scripts/seed.js`:

| Role | Email | Password |
|---|---|---|
| Admin | admin@mediflow.health | Admin@123 |
| Doctor 1 | dr.priya@mediflow.health | Doctor@123 |
| Doctor 2 | dr.rajan@mediflow.health | Doctor@123 |
| Receptionist | reception@mediflow.health | Recept@123 |
| Patient | kavitha@example.com | Patient@123 |

## How the AI Intake Works

1. Patient opens their intake link (`/intake/:appointmentId`)
2. Gemini conducts a conversational symptom interview (8–12 questions)
3. Questions adapt based on patient responses
4. On completion, Gemini generates a structured JSON clinical brief
5. Doctor receives an email alert and sees the brief on their dashboard

## API Summary

| Method | Route | Description |
|---|---|---|
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/register | Register patient |
| GET | /api/v1/appointments/today | Today's appointments |
| GET | /api/v1/appointments/queue | Current queue |
| POST | /api/v1/intake/start | Start intake session |
| POST | /api/v1/intake/:id/message | Send message, get AI response |
| GET | /api/v1/briefs/:appointmentId | Get patient brief |
| GET | /api/v1/admin/stats | Clinic statistics |

## Folder Structure

```
mediflow/
  client/          # React frontend (Vite)
  server/          # Node.js + Express backend
  .env             # Environment variables
  package.json     # Root with concurrently scripts
```

## Deployment

- **Frontend**: Deploy `client/` to Vercel or Netlify
- **Backend**: Deploy `server/` to Railway, Render, or Fly.io
- Set `CLIENT_URL` to your frontend domain in production
- Set `NODE_ENV=production`

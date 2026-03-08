# 🧠 HireGenius — AI-Powered Interview Platform

A full-stack platform for conducting **AI-proctored, automated interviews**. HireGenius enables organizations to create interview templates, invite candidates, and conduct interviews with real-time AI proctoring, speech-to-text transcription, and automated scoring.

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **AI Interview Engine** | Gemini AI generates role-specific interview questions, evaluates candidate responses, and produces detailed scoring reports |
| **Resume-Based Questions** | Upload a candidate's resume (PDF) during scheduling — AI generates personalized questions based on both the resume and the job description |
| **Real-Time Proctoring** | Python/OpenCV-powered proctoring detects face presence, tab-switching, and suspicious activity during interviews |
| **Speech-to-Text** | Groq Whisper API transcribes candidate audio responses in real-time |
| **Email OTP Verification** | 6-digit verification code sent on signup for secure account creation |
| **Calendar Integration** | Interview invitations include `.ics` calendar files for Google Calendar / Outlook |
| **Automated Reports** | AI generates detailed interview reports with scores, feedback, and recommendation |
| **Role-Based Access** | Admin, HR Manager, and Interviewer roles with secure JWT authentication |

## 🏗️ Tech Stack

### Frontend
- **React** with React Router
- **Material-UI (MUI)** for UI components
- **date-fns** + MUI X Date Pickers

### Backend
- **Node.js / Express** — REST API, authentication, interview logic
- **MongoDB / Mongoose** — Data persistence
- **Gemini AI** — Question generation, response evaluation, report generation
- **Groq Whisper** — Audio transcription
- **Nodemailer** — Email invitations with .ics attachments
- **Multer** — File upload handling (resumes, audio)
- **Helmet + Express Rate Limit** — Security

### Proctoring Microservice
- **Python / Flask** — Real-time video frame analysis
- **OpenCV / MediaPipe** — Face and gaze detection

## 📁 Project Structure

```
├── interview-frontend/        # React SPA
│   ├── public/                # Static assets + logo
│   └── src/
│       ├── components/        # Reusable UI (DashboardLayout, AdminPanel)
│       ├── pages/             # All page components
│       └── services/          # API client
│
├── interview-backend/         # Node.js API + Python proctoring
│   ├── public/                # Static assets (logo for emails)
│   ├── uploads/               # User-generated files (audio, etc.)
│   ├── proctor_api.py         # Python Flask proctoring server
│   └── src/
│       ├── config/            # App configuration
│       ├── controllers/       # Route handlers
│       ├── middleware/        # Auth, error handling, rate limiting
│       ├── models/            # Mongoose schemas
│       ├── routes/            # Express routes
│       ├── services/          # Business logic
│       └── utils/             # Mail, logger, helpers
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Python 3](https://www.python.org/) (v3.8+)
- [MongoDB](https://www.mongodb.com/) (Atlas or local instance)

### 1. Clone the Repository

```bash
git clone https://github.com/iamasmigupta/hiregenius-ai-platform.git
cd hiregenius-ai-platform
```

### 2. Backend Setup

```bash
cd interview-backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key
SENDER_EMAIL=your_email@gmail.com
SENDER_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm start
```

> Backend runs at `http://localhost:5000`

### 3. Proctoring Server

In a **new terminal**:

```bash
cd interview-backend
pip install -r requirements.txt
python proctor_api.py
```

> Proctoring runs at `http://localhost:5001`

### 4. Frontend Setup

In a **third terminal**:

```bash
cd interview-frontend
npm install
npm start
```

> Frontend runs at `http://localhost:3000`

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for JWT token signing |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for AI features |
| `GROQ_API_KEY` | ✅ | Groq API key for Whisper transcription |
| `SENDER_EMAIL` | ✅ | Gmail address for sending emails |
| `SENDER_PASSWORD` | ✅ | Gmail App Password |
| `PORT` | ❌ | Backend port (default: 5000) |
| `FRONTEND_URL` | ❌ | Frontend URL (default: http://localhost:3000) |

## 📧 Email Features

All emails include the HireGenius logo and are styled with a premium dark theme:
- **Interview Invitation** — with .ics calendar attach
- **Report Ready** — notification when AI report is generated
- **Decision Notification** — approval/rejection with feedback
- **Password Reset** — OTP-based password recovery
- **Email Verification** — 6-digit OTP on signup

---

Made with ❤️ by **Asmi Gupta**

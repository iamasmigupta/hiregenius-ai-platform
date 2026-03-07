# Interview AI Application

This is a full-stack application for conducting AI-proctored interviews. The platform allows creating interview templates, inviting candidates, and conducting interviews with real-time AI proctoring to detect cheating.

## Project Structure

- `interview-frontend/`: The React frontend application.
- `interview-backend/`: The backend services, which include:
  - A **Node.js/Express** server for the main application logic (authentication, database management, etc.).
  - A **Python/Flask** microservice for the real-time AI proctoring.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (which includes npm)
- [Python](https://www.python.org/) (which includes pip)
- [MongoDB](https://www.mongodb.com/): A running instance of MongoDB is required for the main backend.

## Getting Started

Follow these steps to get the application up and running on your local machine.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Interview-AI-App
```

### 2. Backend Setup

The backend consists of two separate services that need to be run concurrently.

**A. Node.js Main Server**

This server handles all the core application logic.

```bash
# Navigate to the backend directory
cd interview-backend

# Install dependencies
npm install

# Create a .env file in the interview-backend directory
# and add the following environment variables:
# MONGO_URI=<your_mongodb_connection_string>
# JWT_SECRET=<your_jwt_secret>
# SENDER_EMAIL=<your_email_for_sending_invites>
# SENDER_PASSWORD=<your_email_password_or_app_password>
# GEMINI_API_KEY=<your_google_gemini_api_key>

# Start the server
npm start
```

By default, this server will run on `http://localhost:5000`.

**B. Python Proctoring Server**

This Flask server handles the AI video analysis. Open a **new terminal** for this service.

```bash
# Navigate to the backend directory from the root
cd interview-backend

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask API
# On Windows
python proctor_api.py
# On macOS/Linux
python3 proctor_api.py
```

This server will run on `http://localhost:8000`.

<!-- ### 3. Frontend Setup -->

This is the React user interface. Open a **third terminal** for this service.

```bash
# Navigate to the frontend directory from the root
cd interview-frontend

# Install dependencies
npm install

# Start the React development server
npm start
```

The application will be accessible at `http://localhost:3000`.

## Pushing to GitHub

To save your changes to your GitHub repository, use the following commands:

```bash
# Stage all changes
git add .

# Commit the changes with a descriptive message
git commit -m "feat: Ready for deployment with README and requirements"

# Push the changes to your main branch
git push origin main
```

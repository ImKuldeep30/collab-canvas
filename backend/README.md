# CoCanvas Backend ⚙️

Welcome to the backend server of **CoCanvas**—a robust Node.js Express server configured with Socket.io real-time drawing synchronization, Mongoose ODM schemas, and modern Resend API integration for high-fidelity transactional emails.

---

## 🚀 Tech Stack & Libraries
* **Server Framework**: Node.js & Express.
* **Real-time Gateway**: Socket.io (WebSocket protocol) with low-latency drawing packet relays.
* **Database & ORM**: MongoDB Atlas integration via Mongoose schemas.
* **Email System**: Official **Resend API SDK** (replaces old Gmail SMTP transporters).
* **Security & Tokens**: JSON Web Tokens (JWT) for session management and verification, `crypto` for URL tokenization, and `bcrypt` for secure password salting.
* **Containerization**: Docker-compatible deployment setup.

---

## 🛠️ Local Installation & Setup

To run the backend server on your local machine:

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **Docker Desktop** installed.

### 2. Install Dependencies
Navigate to the `backend/` directory and install the required modules:
```bash
cd backend
npm install
```

### 3. Configure `.env` File
Create a `.env` file in your `backend/` directory:
```env
# MongoDB Connection String (Atlas or Local)
MONGO_URI=mongodb+srv://kuldpkohli2003_db_user:YOUR_NEW_PASSWORD@cluster0.dmurao1.mongodb.net/authdb?retryWrites=true&w=majority

# JWT Encryption Keys
JWT_SECRET=kuldeepkohli
JWT_REFRESH_SECRET=kohlikuldeep

# Modern Transactional Email Service
RESEND_API_KEY=re_your_secret_resend_api_key

# Redirect Target for verification and reset links (Defaults to Vite local dev)
FRONTEND_URL=http://localhost:5173
```
> [!IMPORTANT]
> **Email Security Sandbox Policy**: When using Resend's default free sandbox sender (`onboarding@resend.dev`), you can **only** send verification emails to the email address you registered your Resend account with (e.g., `kuldpkohli2003@gmail.com`). To send verification emails to anyone, verify your custom domain in Resend's domain settings!

---

## 🐳 Docker Deployment & Commands

Your backend is fully dockerized for fast building and isolated container orchestration.

### 1. Build the Docker Image
Compile your backend code, dependencies, and environments into a new local image:
```bash
docker build -t mybackend .
```

### 2. Run the Container
Spin up your backend container in detached mode, exposing port `3000`:
```bash
docker run -d -p 3000:3000 --name authserver mybackend
```

### 3. Stop and Remove Container
To clean up your running container instance:
```bash
docker stop authserver && docker rm authserver
```

---

## 📂 Backend Architecture & Folders

```
backend/
├── config/
│   └── db.js                  # Mongoose MongoDB connectivity setup
├── controllers/
│   └── authController.js      # Register, verify-email, login, & password resets
├── models/
│   ├── User.js                # Core Mongoose User profile schema
│   ├── Team.js                # Mongoose Collaborative Team schema
│   └── SessionData.js         # Active Drawing state & Chat records schema
├── routes/
│   ├── authroutes.js          # REST API endpoints for user validation
│   └── teamRoutes.js          # REST API endpoints for team workspaces
├── server.js                  # Socket.io gateway & server port orchestration
├── Dockerfile                 # Docker configuration parameters
└── package.json               # Backend configuration and dependency manifest
```

---

## ☁️ Production Hosting (Render or Heroku)

### Hosting on Render.com (100% Free, Recommended)
Render hosts Express apps completely card-free:
1. Log in to [Render](https://render.com) using your GitHub account.
2. Select **New +** -> **Web Service** and connect your `collab-canvas` repository.
3. Configure settings:
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
4. Expand **Advanced** and map your `.env` variables (`MONGO_URI`, `JWT_SECRET`, `RESEND_API_KEY`, etc.).
5. Click **Create Web Service**.

### Hosting on Heroku (Requires Payment Verification)
Since `backend` is a monorepo folder, deploy using the **Heroku Subdirectory Buildpack**:
1. Go to Heroku settings -> Add Buildpack -> Add: `https://github.com/negrienko/heroku-buildpack-subdir.git`.
2. Scroll to Config Vars -> Add: `PROJECT_PATH` = `backend`.
3. Add the default Node.js buildpack: `heroku/nodejs`.
4. Add all your `.env` Config Vars in Settings.
5. Deploy the repository from the Heroku Deploy tab!

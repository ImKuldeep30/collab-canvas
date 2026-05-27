# CoCanvas Frontend 🎨

Welcome to the frontend of **CoCanvas**—a premium, high-fidelity, glassmorphic real-time collaborative drawing workspace. This codebase handles the visual canvas boards, collaborative group chat interface, interactive participant management, team dashboards, and the security onboarding flow.

---

## 🚀 Tech Stack & Design Aesthetics
* **Core Framework**: React 19 (TypeScript/JS) powered by Vite.
* **Canvas Engine**: Integrated Excalidraw SDK for high-performance responsive vector rendering.
* **Styling**: Vanilla CSS combined with custom glassmorphic Tailwind CSS patterns.
* **Real-time Engine**: Socket.io-Client for sub-millisecond drawing synchronization and team coordination.
* **Typography**: Modern typography utilizing Google Fonts (Inter, Outfit, sans-serif).
* **Iconography**: Lucide React.
* **API Requests**: Axios.

---

## 🛠️ Local Installation & Development

To spin up the frontend on your local development machine:

### 1. Prerequisites
Ensure you have **Node.js (v18 or higher)** installed.

### 2. Install Dependencies
Navigate to the `frontend/` directory and install the required modules:
```bash
cd frontend
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in your `frontend/` directory:
```env
# URL where your Express backend server is running (Local dev IP or localhost)
VITE_BACKEND_URL=http://192.168.1.10:3000
```
> [!NOTE]
> Setting this dynamic environment variable allows the compiled React code to fetch the correct backend address during local testing and deployment automatically.

### 4. Run Development Server
Launch the development server with host configuration so other devices on your local network (e.g., tablet, iPad) can test it:
```bash
npm run dev -- --host
```
* Your console will output:
  * Local: `http://localhost:5173/`
  * Network: `http://192.168.1.10:5173/`

---

## 📂 Project Structure Directory

```
frontend/
├── src/
│   ├── components/            # Reusable UI Components
│   │   ├── CanvasBoard.jsx     # Drawing board viewport
│   │   ├── ChatPanel.jsx       # Collaborative session chat
│   │   ├── CreateTeamModal.jsx # New collaborative team interface
│   │   ├── JoinTeamModal.jsx   # Join active team session modal
│   │   ├── MyTeamsModal.jsx    # User's active team workspace list
│   │   └── Navbar.jsx          # Glassmorphic global navigation bar
│   ├── pages/                 # Full Page Routing targets
│   │   ├── Landing.jsx         # Signature immersive dashboard landing
│   │   ├── Login.jsx           # Glassmorphic login authentication
│   │   ├── Register.jsx        # Glassmorphic user signup onboarding
│   │   ├── Forget.jsx          # Secure password reset trigger
│   │   └── Home.jsx            # Dynamic workspace dashboard page
│   ├── index.css               # Global theme styles
│   └── main.jsx               # Application entry point
├── package.json               # Package dependencies & scripts
└── vite.config.js             # Vite compiler config parameters
```

---

## 📖 Available Package Scripts

Inside the `frontend/` directory, you can run:

* `npm run dev`: Starts Vite local server in watch-mode.
* `npm run build`: Compiles and optimizes your React code into modular JS and CSS inside the `dist/` directory for production deployment.
* `npm run lint`: Analyzes and resolves code syntax and warning anomalies with ESLint.
* `npm run preview`: Runs a local server to test the production build directory (`dist/`) before web hosting.

---

## ☁️ Production Deployment (Vercel)

The frontend is fully optimized to be deployed to **Vercel** with a single click:

1. Connect your GitHub repository to your **Vercel** account.
2. In the import settings:
   * **Root Directory**: Select the `frontend` folder.
   * **Framework Preset**: Select **Vite** (detected automatically).
3. **Environment Variables**: Add your backend target server URL:
   * **Key**: `VITE_BACKEND_URL`
   * **Value**: `https://your-backend.onrender.com` (Use `http://[Your-Local-IP]:3000` for local hybrid testing).
4. Click **Deploy**!

---

## 🔒 Mixed Content & Browser Security Tip
When hosting your frontend on Vercel over `HTTPS`:
* Browsers will block insecure standard `HTTP` connections (Mixed Content block).
* Ensure your backend is hosted over `HTTPS` (Render.com provides this out of the box), or test fully locally on your browser via `http://localhost:5173` to prevent network call rejections!

# 🚀 DevDeploy — Premium Cloud Deployment Platform

DevDeploy is a high-performance, developer-centric cloud deployment platform inspired by Vercel and Netlify. It provides a sleek, modern dashboard for uploading project ZIP files and deploying them instantly with live URLs.

---

## ✨ Features

- **💎 Premium Dashboard:** Beautiful React dashboard with glassmorphism design, indigo-to-purple gradients, and smooth animations.
- **📦 Instant ZIP Deployment:** Upload your static or Node.js project .zip file and get a live URL in seconds.
- **🛠️ Service Isolation:** Dynamic Docker integration allows building isolated container environments for each deployment.
- **📜 Live Logs Viewer:** A dark-themed terminal-style log viewer for tracking deployment progress in real-time.
- **🔐 Robust Auth:** JWT-based user authentication (Signup/Login) for managing private projects.
- **🔄 GitHub Integration:** Webhook support for automatic redeployment on push events.
- **🌑 Elegant Dark Mode:** Built-in premium appearance with "Obsidian Edge" design tokens.
- **🌐 Reverse Proxy Routing:** Dynamic port allocation and smart NGINX-style routing through a unified preview engine.

---

## 📂 Project Structure

```text
/
├── backend/            # Express.js REST API
│   ├── models/        # MongoDB schemas
│   ├── routes/        # Auth, Deploy, & Webhook endpoints
│   ├── utils/         # Docker, NGINX, and Zip managers
│   └── server.js      # Main entry point
├── client/             # React + Vite + Tailwind v4 + Lucide Icons
│   ├── src/components/ # Reusable UI pieces & layout
│   ├── src/pages/      # Dashboard, Projects, Logs, Settings, etc.
│   └── src/lib/api.js  # Centralized API service
├── workdir/           # Physical storage for extracted deployments
└── nginx_temp/        # Temporary storage for generated NGINX configs
```

---

## 🚀 Quick Start Instructions

Follow these steps to get DevDeploy up and running on your local machine.

### 1. Prerequisites
- **Node.js**: v18 or later
- **MongoDB**: A running instance (local or MongoDB Atlas)
- **Docker Desktop**: Required for containerized deployments

### 2. Environment Setup
Configure your environment by creating a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/devdeploy
JWT_SECRET=your_super_secret_key_here
HOST_IP=localhost
NGINX_CONF_DIR=C:/path/to/your/DevDeploy/nginx_temp
WORK_DIR=C:/path/to/your/DevDeploy/workdir
```

### 3. Install & Build
Run the following commands in the root directory:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies and build
cd ../client
npm install
npm run build
```

### 4. Start the Platform
Launch the unified server (serves both API and the built React app):
```bash
cd ../backend
npm start
```
Visit **`http://localhost:5000`** to access the dashboard.

---

## 🛠️ Developer Mode
To run the frontend and backend in development mode with Hot Module Replacement (HMR):

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd client
npm run dev
```
Vite will proxy API requests automatically.

---

## 🤝 Contribution
DevDeploy is designed to be easily extensible. Contributions to deployment engines, log filtering, or new UI components are welcome! 

Built with love by **DevDeploy Engineering**.

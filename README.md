# DevDeploy — Cloud Deployment Platform

A full-stack, automated cloud deployment platform (like Vercel/Netlify) for static websites and Node.js applications, deployed on AWS EC2 using Docker containers and NGINX reverse proxy.

---

## ✨ Features

| Feature | Description |
|---|---|
| **JWT Authentication** | Secure signup & login with bcrypt password hashing |
| **ZIP Upload & Deploy** | Upload a `.zip` → auto-extract → Docker build → run → live URL |
| **Dynamic Dockerfiles** | Auto-generates Dockerfiles based on project type (static HTML or Node.js) |
| **Auto Port Allocation** | Checks both DB and TCP to find conflict-free ports (range 8001–9999) |
| **NGINX Reverse Proxy** | Per-project location blocks generated automatically, NGINX reloaded |
| **Live URL System** | Each project gets `http://<EC2-IP>/<project-name>` |
| **ZIP Validation** | Blocks path traversal, dangerous file types, and zip bombs |
| **GitHub Webhooks** | Optional CI/CD: auto-redeploy on push via webhook |
| **Project Management** | List, view status, delete deployments via dashboard |
| **Premium UI** | Glassmorphism, animated blobs, gradient buttons, micro-animations |

---

## 📁 Project Structure

```
DevDeploy/
├── .gitignore
├── README.md
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── server.js                   # Express entry point
│   ├── middleware/
│   │   └── auth.js                 # JWT authentication middleware
│   ├── models/
│   │   ├── User.js                 # User schema (username, password)
│   │   └── Project.js              # Project schema (name, port, url, status)
│   ├── routes/
│   │   ├── auth.js                 # POST /api/auth/signup, /api/auth/login
│   │   ├── deploy.js               # POST /api/deploy, GET/DELETE /api/projects
│   │   └── webhook.js              # POST /api/webhook/github (CI/CD)
│   └── utils/
│       ├── dockerManager.js        # Docker build &    run helpers
│       ├── nginxManager.js         # Write/remove NGINX configs, reload
│       ├── portManager.js          # Findático free portsesty (DB + TCP check)
│       └── zipValidator.js         # Security validation for uploaded ZIPs
├── frontend/
│   ├── index.html                  # Main SPA template
│   ├── style.css                   # Premium dark UI with animations
│   └── app.js                      # Auth, deploy, dashboard logic
├── nginx/
│   ├── devdeploy.conf              # Main NGINX server block config
│   └── project.conf.template       # Per-project location template
├── docker/
│   ├── Dockerfile.static           # Template for static sites
│   └── Dockerfile.node             # Template for Node.js apps
└── scripts/
    ├── setup-ec2.sh                # Full EC2 provisioning script
    ├── start-backend.sh            # Start backend with PM2
    ├── deploy-frontend.sh          # Copy frontend to NGINX web root
    └── cleanup.sh                  # Prune Docker resources
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Docker Desktop running
- MongoDB (Atlas free tier or local)

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET at minimum
npm install
npm run dev
```

### 2. Frontend
```bash
cd frontend
# Use any static server:
npx -y http-server . -p 8080
# Open http://localhost:8080
```

---

## ☁️ EC2 Production Deployment

### Step 1: Provision EC2
- Launch **Ubuntu 24.04 LTS** instance (t2.micro or larger)
- Attach an **Elastic IP**
- Security Group: open ports **22, 80, 443, 5000**

### Step 2: Run Setup Script
```bash
ssh ubuntu@<YOUR-ELASTIC-IP>
git clone <your-repo-url> DevDeploy
cd DevDeploy
bash scripts/setup-ec2.sh
# Log out and back in to apply Docker group
```

### Step 3: Configure & Start Backend
```bash
cd backend
cp .env.example .env
nano .env   # Set MONGO_URI, JWT_SECRET, HOST_IP=<Elastic-IP>
bash ../scripts/start-backend.sh
```

### Step 4: Deploy Frontend
```bash
bash scripts/deploy-frontend.sh
```

### Step 5: Configure NGINX
```bash
sudo cp nginx/devdeploy.conf /etc/nginx/sites-enabled/devdeploy
sudo mkdir -p /etc/nginx/devdeploy-sites
sudo nginx -t && sudo systemctl reload nginx
```

### Step 6: Access
Open `http://<YOUR-ELASTIC-IP>` in your browser. Sign up, upload a ZIP, and watch it deploy! 🎉

---

## 🔗 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | ❌ | Register a new user |
| `POST` | `/api/auth/login` | ❌ | Login, receive JWT |
| `POST` | `/api/deploy` | ✅ | Upload ZIP & deploy (multipart/form-data) |
| `GET` | `/api/projects` | ✅ | List user's deployments |
| `DELETE` | `/api/projects/:id` | ✅ | Delete a deployment |
| `POST` | `/api/webhook/github` | ❌* | GitHub push webhook |
| `GET` | `/api/health` | ❌ | Server health check |

*Secured via HMAC signature if `GITHUB_WEBHOOK_SECRET` is set.

---

## 🔒 Security

- **ZIP Validation**: Path traversal (`../`) detection, blocked file extensions (`.exe`, `.bat`, `.sh`, etc.), zip-bomb size limits (200 MB / 500 files).
- **Auth**: All deploy/project routes require valid JWT.
- **Docker Isolation**: Each project runs in its own container with `--restart unless-stopped`.
- **Input Sanitization**: Project names stripped to `[a-zA-Z0-9-]` only.

---

## 📝 License

MIT — Use freely, deploy anywhere.

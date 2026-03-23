# Deployment Guide - Campaign Operations Hub

## Option 1: Railway.app (Recommended - Easiest Full-Stack)

### Prerequisites
- GitHub account
- Railway account (free at railway.app)

### Steps

1. **Push to GitHub**
   ```bash
   cd /path/to/ops-planner
   git init
   git add .
   git commit -m "Initial commit - COH Full MVP"
   git remote add origin https://github.com/yourusername/coh.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `coh` repository
   - Railway auto-detects Node.js and deploys

3. **Configure Environment (Optional)**
   - In Railway dashboard, go to Variables
   - Add: `PORT=3003` (if needed)
   - Railway provides public URL automatically

4. **Access Your App**
   - Railway provides a URL like: `https://coh-production.up.railway.app`
   - Share this URL with your boss!

**Cost:** Free $5/month credit (enough for demo/testing)

---

## Option 2: Render.com (Good Alternative)

### Steps

1. **Create Web Service (Backend)**
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect GitHub repo
   - Build Command: `npm install`
   - Start Command: `node server/index.js`
   - Environment: Node
   - Plan: Free

2. **Create Static Site (Frontend)**
   - New → Static Site
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add environment variable: `VITE_API_URL=<your-backend-url>`

3. **Update API URL**
   - Edit `src/lib/constants.js`
   - Change `API_BASE_URL` to your Render backend URL

**Cost:** Free tier available

---

## Option 3: Vercel (Frontend) + Railway (Backend)

### Backend on Railway
1. Deploy as described in Option 1
2. Note the Railway API URL

### Frontend on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Framework: Vite
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   - `VITE_API_URL=<railway-backend-url>`

**Cost:** Both free tiers

---

## Option 4: Docker + Any Cloud Provider

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5175 3003

CMD ["npm", "run", "dev"]
```

Deploy to:
- **DigitalOcean App Platform** ($5/month)
- **AWS Lightsail** ($3.50/month)
- **Google Cloud Run** (pay per use)

---

## Option 5: Quick Demo - ngrok (Temporary Sharing)

For immediate sharing without deployment:

1. **Install ngrok**
   ```bash
   brew install ngrok  # macOS
   # or download from ngrok.com
   ```

2. **Start your app locally**
   ```bash
   npm run dev  # Already running on localhost:5175
   ```

3. **Expose with ngrok**
   ```bash
   ngrok http 5175
   ```

4. **Share the URL**
   - ngrok provides a public URL like: `https://abc123.ngrok.io`
   - Share this with your boss
   - Valid for current session only

**Cost:** Free (temporary URLs)

---

## Recommended Approach for Your Boss

### For Quick Demo (Today):
**Use ngrok** - Share immediately, no setup needed

### For Persistent Sharing (This Week):
**Use Railway** - One-click deploy, handles everything, free tier

### For Production (Later):
**Vercel + Railway** - Best performance, scalable, professional

---

## Important Notes

### Database Persistence
- **Railway/Render:** SQLite file persists (use volumes)
- **Vercel:** Frontend only, needs separate backend
- **ngrok:** Local database (your machine)

### Jira Configuration
- Jira credentials stored in SQLite `config` table
- Your boss will need to enter their own Jira credentials in Settings
- Or you can pre-configure and share

### Security Considerations
- Don't commit Jira credentials to GitHub
- Use environment variables for sensitive data
- Enable HTTPS (automatic on Railway/Vercel/Render)

---

## Quick Deploy Script

Save this as `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying Campaign Operations Hub..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Option 1: Deploy to Railway (if railway CLI installed)
if command -v railway &> /dev/null; then
    echo "🚂 Deploying to Railway..."
    railway up
else
    echo "⚠️  Railway CLI not installed"
    echo "📝 Manual steps:"
    echo "   1. Push to GitHub"
    echo "   2. Connect repo to Railway"
    echo "   3. Deploy automatically"
fi

echo "✅ Deployment initiated!"
```

---

## Need Help?

1. **Railway Issues:** Check Railway logs in dashboard
2. **Build Errors:** Ensure all dependencies in package.json
3. **API Connection:** Update CORS settings in server/index.js
4. **Database:** Railway provides persistent volumes

Choose the option that fits your timeline and share the URL with your boss! 🎉

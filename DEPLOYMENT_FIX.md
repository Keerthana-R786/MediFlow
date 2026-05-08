# 🚀 DEPLOYMENT FIX GUIDE

## Current Status
- ✅ Backend deployed on Render: https://mediflow-0n85.onrender.com
- ✅ Frontend deployed on Vercel
- ❌ CORS errors blocking communication
- ❌ Database empty (needs seeding)

---

## STEP 1: Push Fixed Code to GitHub

```bash
git add .
git commit -m "Fix CORS configuration for production deployment"
git push origin main
```

---

## STEP 2: Configure Render (Backend)

### Environment Variables in Render Dashboard:
Go to your Render service → Environment → Add these variables:

```
AI_PROVIDER=groq
GROQ_API_KEY=<your-groq-api-key-from-local-env>
GEMINI_API_KEY=<your-gemini-api-key-from-local-env>
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret-from-local-env>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-gmail-address>
SMTP_PASS=<your-gmail-app-password>
WHATSAPP_ENABLED=false
PORT=5000
NODE_ENV=production
```

**Note:** Copy the actual values from your local `.env` file

**CRITICAL:** Set `CLIENT_URL` to your actual Vercel URL (you'll get this in Step 3)

Example: `CLIENT_URL=https://mediflow-abc123.vercel.app`

### Redeploy Backend:
After adding environment variables, click "Manual Deploy" → "Deploy latest commit"

---

## STEP 3: Configure Vercel (Frontend)

### Get Your Vercel URL:
1. Go to your Vercel project dashboard
2. Copy the production URL (e.g., `https://mediflow-abc123.vercel.app`)

### Environment Variables in Vercel:
Go to Project Settings → Environment Variables → Add:

```
VITE_API_URL=https://mediflow-0n85.onrender.com/api/v1
```

### Redeploy Frontend:
Go to Deployments → Click "..." on latest → "Redeploy"

---

## STEP 4: Update Render CLIENT_URL

Now that you have your Vercel URL:
1. Go back to Render dashboard
2. Update `CLIENT_URL` environment variable with your actual Vercel URL
3. Click "Manual Deploy" again

---

## STEP 5: Seed the Database

### Option A: Using Render Shell (Recommended)
1. Go to Render dashboard → Your service
2. Click "Shell" tab
3. Run:
```bash
cd server
node src/scripts/seed.js
```

### Option B: Run Locally
```bash
cd server
node src/scripts/seed.js
```

---

## STEP 6: Test the Deployment

1. Open your Vercel URL
2. Login with: `dr.priya@mediflow.health` / `Doctor@123`
3. Check if dashboard loads with data
4. Test chatbot functionality

---

## Test Credentials After Seeding:

```
Admin:        admin@mediflow.health       / Admin@123
Doctor 1:     dr.priya@mediflow.health    / Doctor@123
Doctor 2:     dr.rajan@mediflow.health    / Doctor@123
Receptionist: reception@mediflow.health   / Recept@123
Patient 1:    kavitha@example.com         / Patient@123
```

---

## Troubleshooting

### If CORS errors persist:
1. Check browser console for the exact origin being blocked
2. Verify `CLIENT_URL` in Render matches your Vercel URL exactly (no trailing slash)
3. Check Render logs for "CORS blocked origin:" messages

### If database is empty:
1. Run seed script again
2. Check MongoDB Atlas → Network Access → IP Whitelist includes `0.0.0.0/0`

### If page refresh shows 404:
- This is already fixed with `client/vercel.json` rewrite rules

---

## Summary of Changes Made:

1. ✅ Fixed CORS configuration in `server/src/app.js`
2. ✅ Removed conflicting root `vercel.json`
3. ✅ Kept `client/vercel.json` for SPA routing
4. ✅ API URL configuration already correct in `client/src/services/api.js`

---

## Next Steps After Deployment:

1. Monitor Render logs for any errors
2. Test all features (login, appointments, prescriptions, chatbot)
3. Verify email notifications work
4. Test patient intake flow via email link

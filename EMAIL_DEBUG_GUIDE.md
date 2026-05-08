# 📧 EMAIL DEBUGGING GUIDE

## ✅ Local Testing: PASSED
Email system is working perfectly locally. Test confirmed:
- SMTP connection successful
- Patient data retrieved correctly
- Email sent successfully to: k94276873@gmail.com

## 🔍 Production Debugging Steps

### Step 1: Check Render Logs
After creating an appointment, check Render logs for these messages:

**Expected Success Flow:**
```
[MAILER] ✅ SMTP server is ready to send emails
[APPOINTMENT] Creating appointment for patient: <id>
[APPOINTMENT] Created appointment: <id>
[EMAIL] ⏰ Background email task started for appointment: <id>
[EMAIL] 👤 Patient found: <id> User: <id>
[EMAIL] 👨‍⚕️ Doctor found: <id> <email>
[EMAIL] 📧 Sending to: patient@example.com
[EMAIL] 🔗 Intake link: https://your-app.vercel.app/intake/<id>
[MAIL] Preparing appointment confirmation email
[MAIL] ✅ Email sent successfully. Message ID: <id>
[EMAIL] ✅ Email sent successfully to: patient@example.com
```

**If Email Not Sent, Look For:**
```
[EMAIL] ❌ Patient not found: <id>
[EMAIL] ❌ Patient userId not populated: <id>
[EMAIL] ⚠️ No email found for patient user: <id>
[EMAIL] ❌ Failed to send email: <error>
[MAILER] ❌ SMTP connection failed: <error>
```

### Step 2: Verify Environment Variables in Render

Go to Render Dashboard → Your Service → Environment

**Required Variables:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=keerthu191106@gmail.com
SMTP_PASS=<your-gmail-app-password>
CLIENT_URL=<your-vercel-url>
```

**Critical:** Make sure `CLIENT_URL` is set to your actual Vercel URL (not localhost)

### Step 3: Test SMTP Connection

If you see `[MAILER] ❌ SMTP connection failed`, the issue is with Gmail credentials.

**Possible Causes:**
1. Gmail App Password expired or incorrect
2. Gmail account security settings blocking access
3. SMTP_USER or SMTP_PASS not set in Render

**Solution:**
1. Go to Google Account → Security → 2-Step Verification → App Passwords
2. Generate a new app password
3. Update `SMTP_PASS` in Render environment variables
4. Redeploy

### Step 4: Check Patient Data

If you see `[EMAIL] ⚠️ No email found for patient user`, the patient doesn't have an email.

**Solution:**
Run seed script in Render shell:
```bash
cd server
node src/scripts/seed.js
```

This creates patients with proper email addresses.

### Step 5: Manual Email Test

In Render Shell, run:
```bash
cd server
node src/scripts/test-appointment-flow.js
```

This will:
- Test database connection
- Find a patient with email
- Create a test appointment
- Send email
- Show detailed logs

## 🐛 Common Issues

### Issue 1: Background Task Not Running
**Symptom:** Logs show appointment created but no email logs
**Cause:** setTimeout might not execute in serverless environments
**Solution:** Already implemented - using setTimeout with 100ms delay

### Issue 2: CLIENT_URL is localhost
**Symptom:** Email sent but link doesn't work
**Cause:** CLIENT_URL environment variable not set in Render
**Solution:** Set CLIENT_URL to your Vercel URL in Render

### Issue 3: Gmail Blocking Access
**Symptom:** `[MAILER] ❌ SMTP connection failed: Invalid login`
**Cause:** Gmail app password expired or 2FA not enabled
**Solution:** Generate new app password in Google Account settings

### Issue 4: Patient Has No Email
**Symptom:** `[EMAIL] ⚠️ No email found for patient user`
**Cause:** Patient record doesn't have userId.email
**Solution:** Re-run seed script or manually add email to patient's user record

## 📊 Monitoring Checklist

After deployment, verify:
- [ ] Render logs show `[MAILER] ✅ SMTP server is ready to send emails`
- [ ] CLIENT_URL is set to Vercel URL (not localhost)
- [ ] SMTP credentials are correct in Render
- [ ] Create test appointment and check logs
- [ ] Patient receives email within 10 seconds
- [ ] Intake link in email works

## 🔧 Quick Fixes

### If SMTP Not Ready:
```bash
# In Render, check environment variables
echo $SMTP_HOST
echo $SMTP_PORT
echo $SMTP_USER
# Don't echo SMTP_PASS for security
```

### If Patient Has No Email:
```bash
# In Render shell
cd server
node src/scripts/seed.js
```

### If Background Task Not Running:
Check Render logs immediately after creating appointment. If no `[EMAIL]` logs appear within 5 seconds, the background task isn't executing.

## 📝 Test Credentials (After Seeding)

```
Patient: kavitha@example.com / Patient@123
```

Create appointment for this patient and check if email is received.

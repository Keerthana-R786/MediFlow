# 🔧 SMTP CONNECTION TIMEOUT FIX

## Problem Identified:
From your Render logs:
```
[MAILER] ❌ SMTP connection failed: Connection timeout
[MAIL] ❌ Failed to send email: Connection timeout
```

Render's network was blocking the manual SMTP configuration (host/port).

## Solution Applied:

### 1. Changed to Gmail Service
**Before:**
```javascript
{
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  ...
}
```

**After:**
```javascript
{
  service: 'gmail', // Uses Gmail's built-in configuration
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  ...
}
```

### 2. Added Connection Pooling
- Reuses connections instead of creating new ones
- Handles 5 concurrent connections
- Rate limiting to prevent Gmail blocking

### 3. Added Retry Logic
- 3 attempts to send each email
- Exponential backoff (2s, 4s delays)
- Detailed logging for each attempt

### 4. Increased Timeouts
- Connection timeout: 60 seconds
- Socket timeout: 60 seconds
- Greeting timeout: 30 seconds

## What Changed:

**Files Modified:**
1. `server/src/config/mailer.js` - Gmail service + connection pooling
2. `server/src/services/mail.service.js` - Retry logic with 3 attempts

## Testing:

✅ **Local Test Passed:**
```
[MAILER] ✅ SMTP server is ready to send emails
[MAIL] Attempt 1/3 to send email
[MAIL] ✅ Email sent successfully. Message ID: <...>
```

## Deployment:

✅ Code pushed to GitHub
✅ Render will auto-deploy (2-3 minutes)

## What to Expect in Render Logs:

**On Startup:**
```
[MAILER] ✅ SMTP server is ready to send emails
```

**When Creating Appointment:**
```
[APPOINTMENT] Creating appointment for patient: <id>
[APPOINTMENT] Created appointment: <id>
[EMAIL] ⏰ Background email task started for appointment: <id>
[EMAIL] 👤 Patient found: <id> User: <id>
[EMAIL] 👨‍⚕️ Doctor found: <id> <email>
[EMAIL] 📧 Sending to: patient@example.com
[MAIL] Preparing appointment confirmation email
[MAIL] Attempt 1/3 to send email
[MAIL] ✅ Email sent successfully. Message ID: <id>
[EMAIL] ✅ Email sent successfully to: patient@example.com
```

**If First Attempt Fails (Retry):**
```
[MAIL] Attempt 1/3 to send email
[MAIL] ❌ Attempt 1/3 failed: <error>
[MAIL] Retrying in 2000ms...
[MAIL] Attempt 2/3 to send email
[MAIL] ✅ Email sent successfully. Message ID: <id>
```

## Environment Variables Needed in Render:

Only these two are needed now:
```
SMTP_USER=keerthu191106@gmail.com
SMTP_PASS=<your-gmail-app-password>
```

You can remove these (no longer needed):
- ~~SMTP_HOST~~
- ~~SMTP_PORT~~

## Why This Works:

1. **Gmail Service**: Nodemailer has built-in Gmail configuration that handles all the connection details
2. **Connection Pooling**: Reuses connections, more reliable on cloud platforms
3. **Retry Logic**: If first attempt fails, tries 2 more times
4. **Longer Timeouts**: Gives more time for slow networks

## Next Steps:

1. ⏳ Wait 2-3 minutes for Render to deploy
2. 🔍 Check Render logs for `[MAILER] ✅ SMTP server is ready`
3. 📝 Create a test appointment
4. 📧 Patient should receive email within 10 seconds
5. ✅ Check Render logs for success message

## If Still Not Working:

Check these in order:

1. **SMTP Credentials Wrong:**
   - Verify `SMTP_USER` and `SMTP_PASS` in Render
   - Generate new Gmail App Password if needed

2. **Gmail Blocking:**
   - Check Gmail account for security alerts
   - Enable "Less secure app access" (if needed)

3. **Network Issue:**
   - Run test in Render Shell: `node server/src/scripts/test-appointment-email.js`
   - Check if Render can reach Gmail servers

## Success Indicators:

- ✅ Render logs show `[MAILER] ✅ SMTP server is ready`
- ✅ Appointment creates in < 2 seconds
- ✅ Email logs show `[MAIL] ✅ Email sent successfully`
- ✅ Patient receives email
- ✅ No timeout errors

---

**Status:** Deployed and ready to test!

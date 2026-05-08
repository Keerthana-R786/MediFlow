# 🚀 BREVO EMAIL SETUP GUIDE

## Why Brevo?
Brevo (formerly Sendinblue) is a cloud-based email service that works perfectly on platforms like Render where SMTP ports might be blocked. It's free for up to 300 emails/day.

## Setup Steps:

### 1. Create Brevo Account
1. Go to https://www.brevo.com/
2. Click "Sign up free"
3. Complete registration
4. Verify your email

### 2. Get API Key
1. Login to Brevo dashboard
2. Go to: Settings → SMTP & API → API Keys
3. Click "Generate a new API key"
4. Name it: "MediFlow Production"
5. Copy the API key (starts with `xkeysib-...`)

### 3. Verify Sender Email
1. Go to: Senders & IP → Senders
2. Add sender email: `keerthu191106@gmail.com`
3. Verify via email confirmation link
4. Wait for approval (usually instant)

### 4. Add to Render Environment Variables
Go to Render Dashboard → Your Service → Environment

Add this variable:
```
BREVO_API_KEY=xkeysib-your-api-key-here
```

Keep existing variables:
```
SMTP_USER=keerthu191106@gmail.com  (used as sender email)
CLIENT_URL=<your-vercel-url>
```

You can remove these (no longer needed):
- ~~SMTP_HOST~~
- ~~SMTP_PORT~~
- ~~SMTP_PASS~~

### 5. Redeploy
Click "Manual Deploy" in Render

### 6. Test
Create an appointment and check Render logs for:
```
[MAILER] ✅ Using Brevo API for email delivery
[MAIL] Using: Brevo API
[MAIL] Sending via Brevo API...
[MAIL] ✅ Email sent successfully via Brevo. Message ID: <id>
```

## Benefits:

✅ **No SMTP Ports** - Uses HTTPS API (port 443)
✅ **Fast** - Typically sends in < 1 second
✅ **Reliable** - 99.9% uptime
✅ **Free Tier** - 300 emails/day (enough for most clinics)
✅ **Cloud-Friendly** - Works on all cloud platforms
✅ **Tracking** - See delivery status in Brevo dashboard

## Fallback:

If Brevo API key is not set, the system automatically falls back to Gmail SMTP (current setup).

## Monitoring:

Check email delivery in Brevo Dashboard:
- Statistics → Email → Transactional
- See sent, delivered, opened, clicked stats

## Troubleshooting:

### If emails still not sending:

1. **Check API Key**: Make sure it's correct in Render
2. **Verify Sender**: Email must be verified in Brevo
3. **Check Logs**: Look for Brevo API error messages
4. **Check Quota**: Free tier = 300 emails/day

### Common Errors:

**"Sender not verified"**
- Solution: Verify sender email in Brevo dashboard

**"API key invalid"**
- Solution: Generate new API key and update in Render

**"Daily quota exceeded"**
- Solution: Upgrade Brevo plan or wait 24 hours

## Cost:

- **Free**: 300 emails/day
- **Starter**: $25/month for 20,000 emails/month
- **Business**: $65/month for 100,000 emails/month

For a small clinic, free tier is usually sufficient.

---

## Quick Setup Checklist:

- [ ] Create Brevo account
- [ ] Get API key
- [ ] Verify sender email
- [ ] Add `BREVO_API_KEY` to Render
- [ ] Redeploy
- [ ] Test appointment creation
- [ ] Check Render logs for success
- [ ] Verify patient receives email

---

**Status**: Code is ready. Just need to add BREVO_API_KEY to Render!

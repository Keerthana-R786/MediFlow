# MediFlow - Testing Guide

## Quick Start Testing

### Prerequisites
```bash
# Make sure MongoDB is running and connected
# Make sure .env file has all required variables
# Make sure both server and client are running
npm run dev
```

---

## Test 1: Digital Prescription System

### Step 1: Create Test Appointment
1. Login as receptionist (or use existing account)
2. Go to Queue page
3. Click "New Walk-in" button
4. Fill in appointment details
5. Submit

### Step 2: Complete Intake (Optional)
1. Copy the intake link from appointment email
2. Open in new tab
3. Complete the AI interview
4. Submit

### Step 3: Write Prescription
1. Login as doctor
2. Go to Dashboard
3. Click on a patient
4. Click "Prescription" button in header
5. Fill in:
   ```
   Diagnosis: Common Cold
   
   Medication 1:
   - Name: Paracetamol
   - Dosage: 500mg
   - Frequency: 3 times daily
   - Timing: After meals
   - Duration: 5 days
   - Instructions: Take with water
   
   Medication 2:
   - Name: Cetirizine
   - Dosage: 10mg
   - Frequency: Once daily
   - Timing: Before bed
   - Duration: 7 days
   
   Lab Tests: Complete Blood Count (CBC)
   
   Advice: Rest well, drink plenty of fluids, avoid cold drinks
   
   Follow-up: 7 days from now
   ```
6. Click "Issue Prescription"
7. Check success message

### Step 4: Verify Email
1. Check patient's email inbox
2. Verify prescription email received
3. Check formatting and all details

### Step 5: Patient View
1. Login as patient
2. Click "Prescriptions" in sidebar
3. Verify prescription appears
4. Click on prescription to view details
5. Try print functionality

**Expected Result:** ✅ Prescription created, emailed, and viewable by patient

---

## Test 2: Lab Reports Upload & AI Analysis

### Step 1: Access Lab Reports
1. Login as doctor
2. Go to any patient brief
3. Click "Lab Reports" button

### Step 2: Upload Report
1. Click upload area or drag file
2. Upload a PDF or image (test with any medical report or document)
3. Wait for upload to complete
4. Verify report appears in list

### Step 3: Add Test Results (Optional)
1. Select the uploaded report
2. Manually add test results if you want:
   ```
   Test Name: Hemoglobin
   Value: 11.5
   Unit: g/dL
   Reference Range: 12-16 g/dL
   Mark as Abnormal: Yes
   ```

### Step 4: AI Analysis
1. Click "Analyze with AI" button
2. Wait for analysis (10-20 seconds)
3. Verify AI generates:
   - Summary
   - Abnormal findings
   - Recommendations

### Step 5: Delete Report
1. Click trash icon
2. Confirm deletion
3. Verify report removed

**Expected Result:** ✅ Report uploaded, analyzed, and manageable

---

## Test 3: Voice-to-Text Doctor Notes

### Step 1: Access Voice Notes
1. Login as doctor
2. Go to any patient brief
3. Click "Voice Notes" button

### Step 2: Record Audio
1. Click microphone icon
2. Allow microphone access if prompted
3. Speak clearly for 10-15 seconds:
   ```
   "Patient presents with fever and cough for 3 days.
   Temperature is 101 degrees Fahrenheit.
   Chest is clear on auscultation.
   Diagnosed with upper respiratory tract infection.
   Prescribed antibiotics and advised rest."
   ```
4. Click stop button

### Step 3: View Transcription
1. Wait for upload and processing
2. Verify transcription appears
3. Check SOAP notes generated:
   - Subjective section
   - Objective section
   - Assessment section
   - Plan section

### Step 4: Edit Transcription
1. Click "Edit" button
2. Modify text
3. Click "Save"
4. Verify changes saved

### Step 5: Delete Note
1. Click trash icon
2. Confirm deletion
3. Verify note removed

**Expected Result:** ✅ Audio recorded, transcribed, and SOAP notes generated

**Note:** Transcription is currently placeholder. In production, integrate real Whisper API.

---

## Test 4: Multi-Language Support

### Step 1: Switch to Hindi
1. Login as any user
2. Look at sidebar bottom
3. Click language dropdown
4. Select "हिं (Hindi)"
5. Verify interface changes:
   - Dashboard → डैशबोर्ड
   - Appointments → अपॉइंटमेंट
   - Patients → मरीज़
   - Logout → लॉग आउट

### Step 2: Switch to Tamil
1. Click language dropdown again
2. Select "த (Tamil)"
3. Verify interface changes:
   - Dashboard → டாஷ்போர்டு
   - Appointments → சந்திப்புகள்
   - Patients → நோயாளிகள்
   - Logout → வெளியேறு

### Step 3: Verify Persistence
1. Refresh the page
2. Verify language remains selected
3. Logout and login again
4. Verify language still persists

### Step 4: Switch Back to English
1. Click language dropdown
2. Select "EN (English)"
3. Verify interface back to English

**Expected Result:** ✅ Language switches work and persist across sessions

---

## Test 5: Integration Test (Full Workflow)

### Complete Patient Journey:
1. **Receptionist:** Create appointment
2. **Patient:** Complete intake via email link
3. **Doctor:** View patient brief with AI-generated summary
4. **Doctor:** Record voice notes during consultation
5. **Doctor:** Upload lab reports
6. **Doctor:** Analyze lab reports with AI
7. **Doctor:** Write and issue prescription
8. **Patient:** Receive prescription email
9. **Patient:** View prescription in dashboard
10. **Patient:** Switch language to Hindi/Tamil

**Expected Result:** ✅ Complete workflow works seamlessly

---

## Common Issues & Solutions

### Issue: "Microphone access denied"
**Solution:** 
- Check browser permissions
- Use HTTPS in production
- Try different browser

### Issue: "File upload failed"
**Solution:**
- Check file size (max 10MB for lab reports, 25MB for audio)
- Check file format (PDF/JPG/PNG for reports, audio formats for voice)
- Check server uploads directory exists

### Issue: "Email not received"
**Solution:**
- Check spam folder
- Verify SMTP settings in .env
- Check server logs for email errors
- Test with different email provider

### Issue: "AI analysis taking too long"
**Solution:**
- Check Groq API key is valid
- Check internet connection
- Check API rate limits
- View server logs for errors

### Issue: "Language not changing"
**Solution:**
- Clear browser cache
- Check localStorage
- Verify translations.js file exists
- Check browser console for errors

---

## Performance Testing

### Load Testing:
```bash
# Test with multiple concurrent users
# Upload large files (near limits)
# Record long audio files
# Generate multiple prescriptions quickly
```

### Expected Performance:
- Page load: < 2 seconds
- File upload: < 5 seconds for 5MB file
- AI analysis: 10-20 seconds
- Prescription email: < 3 seconds
- Voice transcription: 5-15 seconds (with real API)

---

## Security Testing

### Test These:
1. Try accessing doctor routes as patient
2. Try accessing other patient's data
3. Try uploading malicious files
4. Try SQL injection in forms
5. Try XSS attacks in text fields
6. Try CSRF attacks
7. Check JWT token expiration
8. Check password hashing

**Expected Result:** ✅ All security measures working

---

## Browser Compatibility

### Test On:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ⚠️ Mobile browsers (responsive design)

---

## Accessibility Testing

### Test These:
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus indicators
- Alt text for images
- ARIA labels

---

## Test Checklist

### Backend:
- [ ] All API endpoints respond correctly
- [ ] Authentication works
- [ ] Authorization works (role-based access)
- [ ] File uploads work
- [ ] Email sending works
- [ ] AI integration works
- [ ] Database operations work
- [ ] Error handling works

### Frontend:
- [ ] All pages load correctly
- [ ] All forms submit correctly
- [ ] All buttons work
- [ ] Navigation works
- [ ] Responsive design works
- [ ] Loading states show
- [ ] Error messages display
- [ ] Success messages display

### Features:
- [ ] Prescription system works end-to-end
- [ ] Lab reports upload and analysis works
- [ ] Voice notes recording and transcription works
- [ ] Multi-language switching works
- [ ] Email notifications work
- [ ] File downloads work
- [ ] Print functionality works

### Integration:
- [ ] All features accessible from Patient Brief
- [ ] All routes configured correctly
- [ ] All components render correctly
- [ ] No console errors
- [ ] No network errors
- [ ] No memory leaks

---

## Reporting Issues

### When Reporting Bugs:
1. Describe what you were trying to do
2. Describe what happened
3. Describe what you expected to happen
4. Include screenshots if possible
5. Include browser console errors
6. Include server logs if available
7. Include steps to reproduce

### Example Bug Report:
```
Title: Prescription email not sending

Steps to Reproduce:
1. Login as doctor
2. Go to patient brief
3. Click Prescription button
4. Fill in all fields
5. Click Issue Prescription

Expected: Email sent to patient
Actual: Success message shown but no email received

Browser: Chrome 120
Error in console: None
Server logs: "SMTP connection failed"
```

---

## Success Criteria

### All Tests Pass When:
✅ Prescriptions can be written and emailed  
✅ Lab reports can be uploaded and analyzed  
✅ Voice notes can be recorded and transcribed  
✅ Languages can be switched  
✅ No errors in console  
✅ No errors in server logs  
✅ All features work together  
✅ Performance is acceptable  
✅ Security is maintained  

---

## Next Steps After Testing

1. Fix any bugs found
2. Optimize performance issues
3. Improve UI/UX based on feedback
4. Add more translations if needed
5. Integrate real Whisper API
6. Set up cloud file storage
7. Deploy to production
8. Monitor in production
9. Gather user feedback
10. Iterate and improve

**Happy Testing! 🧪**

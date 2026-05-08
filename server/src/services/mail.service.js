const { transporter, isMailerReady, useBrevo, sendEmailViaBrevo } = require('../config/mailer');

const FROM = `"MediFlow" <${process.env.SMTP_USER}>`;

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Inter, Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; }
    .header { background: #0F172A; padding: 24px 32px; }
    .header h1 { color: #fff; font-size: 20px; font-weight: 500; margin: 0; }
    .header span { color: #0EA5E9; }
    .body { padding: 32px; color: #334155; font-size: 14px; line-height: 1.6; }
    .body h2 { font-size: 16px; font-weight: 500; color: #0F172A; margin-top: 0; }
    .detail-row { display: flex; gap: 8px; margin: 8px 0; }
    .label { color: #94A3B8; min-width: 120px; }
    .btn { display: inline-block; background: #0EA5E9; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-top: 16px; }
    .footer { padding: 16px 32px; border-top: 1px solid #F1F5F9; color: #94A3B8; font-size: 12px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
    .badge-high { background: #FEE2E2; color: #991B1B; }
    .badge-moderate { background: #FEF9C3; color: #854D0E; }
    .badge-low { background: #DCFCE7; color: #166534; }
    .badge-critical { background: #450A0A; color: #FCA5A5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>Medi<span>Flow</span></h1></div>
    <div class="body">${content}</div>
    <div class="footer">MediFlow — AI Smart Patient Onboarding System. This is an automated message.</div>
  </div>
</body>
</html>`;

const sendAppointmentConfirmation = async (patientUser, doctor, appointment, intakeLink) => {
  console.log('[MAIL] Preparing appointment confirmation email');
  console.log('[MAIL] To:', patientUser.email);
  console.log('[MAIL] Patient:', patientUser.firstName, patientUser.lastName);
  console.log('[MAIL] Doctor:', doctor.firstName, doctor.lastName);
  console.log('[MAIL] Intake Link:', intakeLink);
  console.log('[MAIL] Using:', useBrevo ? 'Brevo API' : 'Gmail SMTP');
  
  const html = baseTemplate(`
    <h2>Appointment Confirmed</h2>
    <p>Hello ${patientUser.firstName},</p>
    <p>Your appointment has been scheduled successfully.</p>
    <div class="detail-row"><span class="label">Doctor</span><span>Dr. ${doctor.firstName} ${doctor.lastName}</span></div>
    <div class="detail-row"><span class="label">Date</span><span>${new Date(appointment.appointmentDate).toDateString()}</span></div>
    <div class="detail-row"><span class="label">Time</span><span>${appointment.slot.startTime}</span></div>
    <div class="detail-row"><span class="label">Type</span><span>${appointment.type}</span></div>
    <p style="margin-top:24px;">Please complete your pre-visit check-in before your appointment to help your doctor prepare:</p>
    <a href="${intakeLink}" class="btn">Complete Pre-Visit Check-in</a>
    <p style="margin-top:16px;color:#94A3B8;font-size:12px;">This link expires after your appointment time.</p>
  `);

  // Use Brevo API if configured
  if (useBrevo) {
    try {
      console.log('[MAIL] Sending via Brevo API...');
      const result = await sendEmailViaBrevo({
        to: patientUser.email,
        subject: 'Appointment Confirmed — MediFlow',
        htmlContent: html,
      });
      console.log('[MAIL] ✅ Email sent successfully via Brevo. Message ID:', result.messageId);
      return result;
    } catch (error) {
      console.error('[MAIL] ❌ Brevo API failed:', error.message);
      throw error;
    }
  }

  // Gmail SMTP fallback
  if (!isMailerReady()) {
    console.log('[MAIL] ⚠️ Gmail SMTP not ready - skipping email');
    console.log('[MAIL] 📋 Email would have been sent to:', patientUser.email);
    console.log('[MAIL] 🔗 Intake link:', intakeLink);
    return { skipped: true, reason: 'Mailer not ready' };
  }

  // Retry logic with shorter timeouts
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[MAIL] Attempt ${attempt}/2 to send via Gmail SMTP`);
      const info = await transporter.sendMail({ 
        from: FROM, 
        to: patientUser.email, 
        subject: 'Appointment Confirmed — MediFlow', 
        html 
      });
      console.log('[MAIL] ✅ Email sent successfully via Gmail. Message ID:', info.messageId);
      return info;
    } catch (error) {
      lastError = error;
      console.error(`[MAIL] ❌ Attempt ${attempt}/2 failed:`, error.message);
      if (attempt < 2) {
        const delay = 1000; // 1 second
        console.log(`[MAIL] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('[MAIL] ❌ All Gmail attempts failed. Last error:', lastError.message);
  console.log('[MAIL] 📋 Email details saved for manual follow-up:');
  console.log('[MAIL]    To:', patientUser.email);
  console.log('[MAIL]    Intake Link:', intakeLink);
  throw lastError;
};

const sendIntakeReminder = async (patientUser, doctor, appointment, intakeLink) => {
  const html = baseTemplate(`
    <h2>Reminder: Complete Your Pre-Visit Check-in</h2>
    <p>Hello ${patientUser.firstName},</p>
    <p>Your appointment with Dr. ${doctor.firstName} ${doctor.lastName} is in 2 hours. Please complete your pre-visit check-in so your doctor can prepare.</p>
    <a href="${intakeLink}" class="btn">Complete Check-in Now</a>
  `);

  await transporter.sendMail({ from: FROM, to: patientUser.email, subject: 'Reminder: Pre-Visit Check-in Pending — MediFlow', html });
};

const sendBriefReadyAlert = async (doctor, patientUser, appointment, brief) => {
  const badgeClass = `badge-${brief.urgencyLevel}`;
  const html = baseTemplate(`
    <h2>Patient Brief Ready</h2>
    <p>Hello Dr. ${doctor.firstName},</p>
    <p>The pre-visit brief for your next patient is ready.</p>
    <div class="detail-row"><span class="label">Patient</span><span>${patientUser.firstName} ${patientUser.lastName}</span></div>
    <div class="detail-row"><span class="label">Time</span><span>${appointment.slot.startTime}</span></div>
    <div class="detail-row"><span class="label">Chief Complaint</span><span>${brief.chiefComplaint || 'See brief'}</span></div>
    <div class="detail-row"><span class="label">Urgency</span><span class="badge ${badgeClass}">${brief.urgencyLevel}</span></div>
    <a href="${process.env.CLIENT_URL}/doctor/brief/${appointment._id}" class="btn">View Full Brief</a>
  `);

  await transporter.sendMail({ from: FROM, to: doctor.email, subject: `Brief Ready: ${patientUser.firstName} ${patientUser.lastName} — MediFlow`, html });
};

const sendCriticalAlert = async (doctor, patientUser, appointment) => {
  const html = baseTemplate(`
    <h2 style="color:#EF4444;">Critical Urgency Patient Incoming</h2>
    <p>Hello Dr. ${doctor.firstName},</p>
    <p><strong>Immediate attention required.</strong> A patient with critical urgency indicators is scheduled.</p>
    <div class="detail-row"><span class="label">Patient</span><span>${patientUser.firstName} ${patientUser.lastName}</span></div>
    <div class="detail-row"><span class="label">Time</span><span>${appointment.slot.startTime}</span></div>
    <a href="${process.env.CLIENT_URL}/doctor/brief/${appointment._id}" class="btn" style="background:#EF4444;">View Brief Now</a>
  `);

  await transporter.sendMail({ from: FROM, to: doctor.email, subject: `CRITICAL: ${patientUser.firstName} ${patientUser.lastName} — MediFlow`, html });
};

const sendPrescription = async (patientUser, doctor, prescription, appointment) => {
  console.log('[MAIL] Preparing prescription email');
  console.log('[MAIL] To:', patientUser.email);
  console.log('[MAIL] Using:', useBrevo ? 'Brevo API' : 'Gmail SMTP');
  
  const medicationsHtml = prescription.medications.map(med => `
    <div style="background:#F8FAFC;padding:16px;border-radius:8px;margin:8px 0;border-left:4px solid #14B8A6;">
      <div style="font-weight:600;color:#0F172A;margin-bottom:4px;">${med.name} — ${med.dosage}</div>
      <div style="color:#64748B;font-size:13px;margin-bottom:2px;">
        <strong>Frequency:</strong> ${med.frequency}${med.timing ? ` (${med.timing})` : ''}
      </div>
      <div style="color:#64748B;font-size:13px;margin-bottom:2px;">
        <strong>Duration:</strong> ${med.duration}
      </div>
      ${med.instructions ? `<div style="color:#64748B;font-size:13px;"><strong>Instructions:</strong> ${med.instructions}</div>` : ''}
    </div>
  `).join('');

  const labTestsHtml = prescription.labTests && prescription.labTests.length > 0 ? `
    <h3 style="font-size:15px;color:#0F172A;margin-top:24px;margin-bottom:12px;">Recommended Lab Tests</h3>
    <ul style="color:#475569;margin:0;padding-left:20px;">
      ${prescription.labTests.map(test => `<li style="margin:4px 0;">${test}</li>`).join('')}
    </ul>
  ` : '';

  const adviceHtml = prescription.advice ? `
    <h3 style="font-size:15px;color:#0F172A;margin-top:24px;margin-bottom:12px;">General Advice</h3>
    <p style="color:#475569;background:#F1F5F9;padding:12px;border-radius:8px;margin:0;">${prescription.advice}</p>
  ` : '';

  const followUpHtml = prescription.followUpDate ? `
    <div style="background:#DBEAFE;padding:16px;border-radius:8px;margin-top:24px;border-left:4px solid:#0EA5E9;">
      <div style="font-weight:600;color:#0F172A;margin-bottom:4px;">Follow-up Appointment</div>
      <div style="color:#1E40AF;font-size:13px;">
        <strong>Date:</strong> ${new Date(prescription.followUpDate).toDateString()}
      </div>
      ${prescription.followUpInstructions ? `<div style="color:#1E40AF;font-size:13px;margin-top:4px;">${prescription.followUpInstructions}</div>` : ''}
    </div>
  ` : '';

  const html = baseTemplate(`
    <h2>Your Prescription</h2>
    <p>Hello ${patientUser.firstName},</p>
    <p>Dr. ${doctor.firstName} ${doctor.lastName} has issued your prescription following your consultation on ${new Date(appointment.appointmentDate).toDateString()}.</p>
    
    <div style="background:#FEF9C3;padding:12px;border-radius:8px;margin:16px 0;border-left:4px solid #F59E0B;">
      <div style="font-weight:600;color:#854D0E;margin-bottom:4px;">Diagnosis</div>
      <div style="color:#854D0E;">${prescription.diagnosis}</div>
    </div>

    <h3 style="font-size:15px;color:#0F172A;margin-top:24px;margin-bottom:12px;">Medications</h3>
    ${medicationsHtml}

    ${labTestsHtml}
    ${adviceHtml}
    ${followUpHtml}

    <div style="background:#F8FAFC;padding:16px;border-radius:8px;margin-top:24px;border:1px solid #E2E8F0;">
      <div style="font-size:12px;color:#64748B;line-height:1.6;">
        <strong>Important:</strong><br>
        • Take medications as prescribed<br>
        • Do not stop medication without consulting your doctor<br>
        • Contact your doctor if you experience any side effects<br>
        • Keep this prescription for your records
      </div>
    </div>

    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E2E8F0;color:#94A3B8;font-size:12px;">
      <strong>Prescription Details:</strong><br>
      Issued by: Dr. ${doctor.firstName} ${doctor.lastName}${doctor.specialization ? `, ${doctor.specialization}` : ''}<br>
      Date: ${new Date(prescription.issuedAt).toLocaleString()}<br>
      Valid until: ${new Date(prescription.validUntil).toDateString()}<br>
      Prescription ID: ${prescription._id}
    </div>

    <p style="margin-top:24px;color:#64748B;font-size:13px;">
      If you have any questions about your prescription, please contact the clinic or your doctor.
    </p>
  `);

  // Use Brevo API if configured
  if (useBrevo) {
    try {
      console.log('[MAIL] Sending prescription via Brevo API...');
      const result = await sendEmailViaBrevo({
        to: patientUser.email,
        subject: `Your Prescription from Dr. ${doctor.lastName} — MediFlow`,
        htmlContent: html,
      });
      console.log('[MAIL] ✅ Prescription email sent successfully via Brevo');
      return result;
    } catch (error) {
      console.error('[MAIL] ❌ Brevo API failed:', error.message);
      throw error;
    }
  }

  // Gmail SMTP fallback
  if (!isMailerReady()) {
    console.log('[MAIL] ⚠️ Gmail SMTP not ready - skipping prescription email');
    return { skipped: true, reason: 'Mailer not ready' };
  }

  try {
    console.log('[MAIL] Sending prescription via Gmail SMTP...');
    const info = await transporter.sendMail({ 
      from: FROM, 
      to: patientUser.email, 
      subject: `Your Prescription from Dr. ${doctor.lastName} — MediFlow`, 
      html 
    });
    console.log('[MAIL] ✅ Prescription email sent successfully via Gmail');
    return info;
  } catch (error) {
    console.error('[MAIL] ❌ Gmail SMTP failed:', error.message);
    throw error;
  }
};

module.exports = { 
  sendAppointmentConfirmation, 
  sendIntakeReminder, 
  sendBriefReadyAlert, 
  sendCriticalAlert,
  sendPrescription 
};

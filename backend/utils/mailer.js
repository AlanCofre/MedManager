// src/utils/mailer.js
const nodemailer = require('nodemailer');

async function makeTransport() {
  // Si no hay SMTP en .env, usar Ethereal en DEV (muestra link de vista previa)
  if (!process.env.SMTP_HOST) {
    const test = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: test.user, pass: test.pass },
    });
  }

  // SMTP real desde tu .env
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === 'true', // true para 465, false para 587
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

async function sendPasswordResetEmail(toEmail, code) {
  const transporter = await makeTransport();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@medleave.local',
    to: toEmail,
    subject: 'Restablecer contraseña',
    text: `Tu código es: ${code}. Si no fuiste tú, ignora este mensaje.`,
    html: `<p>Tu código:</p>
           <p style="font-size:20px;font-weight:bold;letter-spacing:2px">${code}</p>
           <p>Si no fuiste tú, ignora este mensaje.</p>`,
  });

  // Con Ethereal imprime link de vista previa en consola
  const url = nodemailer.getTestMessageUrl(info);
  if (url) console.log('📧 Vista previa del correo:', url);
}

module.exports = { sendPasswordResetEmail };

'use strict';
const nodemailer = require('nodemailer');
const prisma = require('../lib/prisma');

/** Dev default — logs the rendered email instead of sending it, so the app
 * (and its tests) run with zero email credentials configured. */
class ConsoleEmailProvider {
  async send({ to, subject, html }) {
    // eslint-disable-next-line no-console
    console.log(`[email:console] -> ${to} | ${subject}\n${html.slice(0, 200)}…`);
    return { status: 'sent', provider: 'console' };
  }
}

class SmtpEmailProvider {
  constructor() {
    this.transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  async send({ to, subject, html }) {
    await this.transport.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
    return { status: 'sent', provider: 'smtp' };
  }
}

function getProvider() {
  return process.env.EMAIL_PROVIDER === 'smtp' ? new SmtpEmailProvider() : new ConsoleEmailProvider();
}

/** Sends one report email and always writes an EmailReport row, whether it
 * succeeded or not — this is what the scheduler and the /reports endpoints
 * both read to know "was this already sent today". */
async function sendReportEmail({ userId, email, date, kind, subject, html }) {
  try {
    await getProvider().send({ to: email, subject, html });
    return prisma.emailReport.create({ data: { userId, date: new Date(date), kind, status: 'sent', sentAt: new Date() } });
  } catch (err) {
    return prisma.emailReport.create({ data: { userId, date: new Date(date), kind, status: 'failed', error: String(err.message || err) } });
  }
}

module.exports = { sendReportEmail };

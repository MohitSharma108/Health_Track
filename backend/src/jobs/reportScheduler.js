'use strict';
const cron = require('node-cron');
const prisma = require('../lib/prisma');
const reportService = require('../services/reportService');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const { toDateStr, addDays } = require('../utils/dateUtils');

/**
 * This is the production replacement for the frontend demo's tab-must-stay-open
 * reminder loop: a real background scheduler, independent of any open browser
 * tab. Runs every 5 minutes and, for each user whose configured report_time
 * (or a fixed reminder time) just passed, does the real thing — push
 * notification, and email if enabled — exactly once per day per user.
 */
function startReportScheduler() {
  if (process.env.NODE_ENV === 'test') return; // tests drive these functions directly
  cron.schedule('*/5 * * * *', () => {
    runDueDailyReports().catch((err) => {
      if (err && (err.code === 'P1000' || err.code === 'P1001' || (err.message && err.message.includes('Authentication failed')))) return;
      console.error('daily report job failed', err); // eslint-disable-line no-console
    });
  });
  cron.schedule('*/5 * * * *', () => {
    runDueWeeklyReports().catch((err) => {
      if (err && (err.code === 'P1000' || err.code === 'P1001' || (err.message && err.message.includes('Authentication failed')))) return;
      console.error('weekly report job failed', err); // eslint-disable-line no-console
    });
  });
  // eslint-disable-next-line no-console
  console.log('Report scheduler started (checks every 5 minutes).');
}

async function runDueDailyReports() {
  const now = new Date();
  const hm = now.toTimeString().slice(0, 5);
  const today = toDateStr();

  const profiles = await prisma.profile.findMany({ where: { reportTime: { gte: hm, lte: addMinutes(hm, 5) } } });
  for (const profile of profiles) {
    const already = await prisma.emailReport.findFirst({ where: { userId: profile.userId, date: new Date(today), kind: 'daily' } });
    if (already) continue;

    const pref = await prisma.notificationPreference.findUnique({ where: { userId_type: { userId: profile.userId, type: 'dailyReport' } } });
    if (pref && pref.enabled === false) continue;

    const meals = await prisma.meal.count({ where: { userId: profile.userId, date: new Date(today), deletedAt: null } });
    if (meals === 0) continue; // nothing to report

    await notificationService.notify(profile.userId, 'dailyReport', 'Your daily nutrition report is ready 📊', 'Tap to view today\'s report.');

    const emailPref = await prisma.notificationPreference.findUnique({ where: { userId_type: { userId: profile.userId, type: 'dailyReport' } } });
    if (!emailPref || emailPref.enabled !== false) {
      const user = await prisma.user.findUnique({ where: { id: profile.userId } });
      const { html } = await reportService.buildDailyReport(profile.userId, today);
      await emailService.sendReportEmail({ userId: profile.userId, email: user.email, date: today, kind: 'daily', subject: `Your Daily Nutrition Report — ${today}`, html });
    }
  }
}

async function runDueWeeklyReports() {
  const now = new Date();
  if (now.getUTCDay() !== 0) return; // Sundays only
  const hm = now.toTimeString().slice(0, 5);
  const today = toDateStr();
  const start = addDays(today, -6);

  const profiles = await prisma.profile.findMany({ where: { reportTime: { gte: hm, lte: addMinutes(hm, 5) } } });
  for (const profile of profiles) {
    const already = await prisma.emailReport.findFirst({ where: { userId: profile.userId, date: new Date(today), kind: 'weekly' } });
    if (already) continue;
    const pref = await prisma.notificationPreference.findUnique({ where: { userId_type: { userId: profile.userId, type: 'weeklyReport' } } });
    if (pref && pref.enabled === false) continue;

    await notificationService.notify(profile.userId, 'weeklyReport', 'Your weekly report is ready 📈', 'See this week\'s nutrition trends.');
    const user = await prisma.user.findUnique({ where: { id: profile.userId } });
    const { html } = await reportService.buildWeeklyReport(profile.userId, today, start);
    await emailService.sendReportEmail({ userId: profile.userId, email: user.email, date: today, kind: 'weekly', subject: 'Your Weekly Nutrition Report', html });
  }
}

function addMinutes(hm, mins) {
  const [h, m] = hm.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = String(Math.floor((total / 60) % 24)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

module.exports = { startReportScheduler, runDueDailyReports, runDueWeeklyReports };

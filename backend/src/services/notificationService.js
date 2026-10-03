'use strict';
const prisma = require('../lib/prisma');

/**
 * Push provider abstraction — same pattern as NutritionProvider. The
 * "console" provider (default) just logs, so the app is fully runnable
 * without push credentials; swap in FcmPushProvider for real delivery.
 */
class ConsolePushProvider {
  async send(device, { title, body }) {
    // eslint-disable-next-line no-console
    console.log(`[push:console] -> ${device.platform}/${device.pushToken.slice(0, 8)}…: ${title} — ${body}`);
    return { delivered: true, provider: 'console' };
  }
}

// class FcmPushProvider { async send(device, {title, body}) { /* firebase-admin messaging().send(...) */ } }

const pushProvider = new ConsolePushProvider();

/** Create an in-app notification row and best-effort push to every
 * registered device, respecting the user's per-type preference. */
async function notify(userId, type, title, body) {
  const pref = await prisma.notificationPreference.findUnique({ where: { userId_type: { userId, type } } });
  if (pref && pref.enabled === false) return null;

  const notification = await prisma.notification.create({ data: { userId, type, title, body } });

  const devices = await prisma.userDevice.findMany({ where: { userId } });
  await Promise.all(
    devices.map((d) =>
      pushProvider.send(d, { title, body }).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('push failed', d.id, err.message);
      })
    )
  );
  return notification;
}

async function listForUser(userId, { limit = 50 } = {}) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit });
}

async function markRead(userId, notificationId) {
  return prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { read: true } });
}

async function markAllRead(userId) {
  return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}

module.exports = { notify, listForUser, markRead, markAllRead };

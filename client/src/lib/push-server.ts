import webpush from 'web-push';
import { prisma } from '@/lib/db';

const publicKey = process.env.WEB_PUSH_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
const contactEmail = process.env.WEB_PUSH_CONTACT_EMAIL ?? 'notifications@expenseasy.com';

if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(`mailto:${contactEmail}`, publicKey, privateKey);
  } catch (error) {
    console.error('Failed to initialize web push VAPID details', error);
  }
} else {
  console.warn('WEB_PUSH_PUBLIC_KEY and WEB_PUSH_PRIVATE_KEY must be set to enable push notifications.');
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
};

export async function sendPushNotification(userId: string, payload: PushPayload) {
  if (!publicKey || !privateKey) {
    return;
  }

  const subscriptions = await prisma.webPushSubscription.findMany({ where: { userId } });
  if (!subscriptions.length) {
    return;
  }

  const notificationPayload = JSON.stringify(payload);

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          expirationTime: null,
          keys: subscription.keys as { p256dh: string; auth: string },
        },
        notificationPayload,
        { TTL: 60 }
      );
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        // Subscription expired or is no longer valid; remove from DB.
        await prisma.webPushSubscription.delete({ where: { endpoint: subscription.endpoint } }).catch(() => undefined);
      } else {
        console.error('Failed to send web push notification', error);
      }
    }
  }
}

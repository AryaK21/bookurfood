import { NextResponse } from 'next/server';
import webPush from 'web-push';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BNG537UsV9LSw6rsxzYHNX4gzkSA4HEZOBgXS6z12R_wlbXtUW6rtCp2l9Vxr43egBUsDXYkobb8ttizRU8SqaA';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'cWRNMJeEyW4JWawUkbDlTXOT-FYJ-8NFKfyxcwtHBOk';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@pgcanteen.local';

webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, payload } = body;

    const pushPayload = JSON.stringify(
      payload || {
        title: "Tap to book tonight's dinner! 🍛",
        body: "Hot Biryani is on the menu! Lock in your headcount before 5:00 PM cutoff.",
        url: '/',
      }
    );

    if (subscription) {
      await webPush.sendNotification(subscription, pushPayload);
    }

    return NextResponse.json({ success: true, message: 'Notification dispatched' });
  } catch (error: any) {
    console.error('Push error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

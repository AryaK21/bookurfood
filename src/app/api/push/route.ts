import { NextResponse } from 'next/server';
import webPush from 'web-push';
import type { MealType } from '@/types/database.types';

const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BNG537UsV9LSw6rsxzYHNX4gzkSA4HEZOBgXS6z12R_wlbXtUW6rtCp2l9Vxr43egBUsDXYkobb8ttizRU8SqaA';
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY || 'cWRNMJeEyW4JWawUkbDlTXOT-FYJ-8NFKfyxcwtHBOk';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@pgcanteen.local';

webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const MEAL_PRESETS: Record<MealType, { title: string; body: string }> = {
  breakfast: {
    title: "Breakfast 🍳",
    body: "South Indian Idli & Vada",
  },
  lunch: {
    title: "Lunch 🍛",
    body: "North Indian Veg Thali",
  },
  dinner: {
    title: "Dinner 🍲",
    body: "Special Dum Biryani Feast",
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, mealType, payload, profileId, menuId, phone } = body as {
      subscription?: any;
      mealType?: MealType;
      payload?: any;
      profileId?: string;
      menuId?: string;
      phone?: string;
    };

    const targetMeal: MealType = mealType || 'dinner';
    const preset = MEAL_PRESETS[targetMeal] || MEAL_PRESETS.dinner;

    const notificationPayload = JSON.stringify({
      title: payload?.title || preset.title,
      body: payload?.body || preset.body,
      url: `/?meal=${targetMeal}`,
      mealType: targetMeal,
      menuId: menuId,
      profileId: profileId,
      phone: phone,
    });

    if (subscription) {
      await webPush.sendNotification(subscription, notificationPayload);
    }

    return NextResponse.json({
      success: true,
      mealType: targetMeal,
      message: `${targetMeal.toUpperCase()} reminder dispatched with 1-tap Tick/Cross actions`,
    });
  } catch (error: any) {
    console.error('Push dispatch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

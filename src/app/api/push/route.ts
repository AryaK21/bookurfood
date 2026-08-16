import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { createClient } from '@/lib/supabase/server';
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
    body: "Poha / Upma / Vada Pav",
  },
  lunch: {
    title: "Lunch 🍛",
    body: "Veg Thali / Non-Veg Thali",
  },
  dinner: {
    title: "Dinner 🍲",
    body: "Veg Thali / Non-Veg Thali",
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, subscription, mealType, payload, profileId, menuId, phone, broadcast } = body as {
      action?: string;
      subscription?: any;
      mealType?: MealType;
      payload?: any;
      profileId?: string;
      menuId?: string;
      phone?: string;
      broadcast?: boolean;
    };

    // 1. Action: Save new Web Push Subscription
    if (action === 'subscribe') {
      if (!subscription || !subscription.endpoint) {
        return NextResponse.json(
          { success: false, error: 'Invalid push subscription payload' },
          { status: 400 }
        );
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.includes('sample-pg-canteen')) {
        try {
          const supabase = await createClient();
          await (supabase.from('push_subscriptions') as any).upsert(
            {
              endpoint: subscription.endpoint,
              p256dh: subscription.keys?.p256dh || '',
              auth: subscription.keys?.auth || '',
              profile_id: profileId || null,
            },
            { onConflict: 'endpoint' }
          );
        } catch (dbErr: any) {
          console.error('Failed to store push subscription:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Push subscription stored successfully',
      });
    }

    const targetMeal: MealType = mealType || 'lunch';
    const preset = MEAL_PRESETS[targetMeal] || MEAL_PRESETS.lunch;

    const mealName = payload?.body || preset.body;
    const notificationPayload = JSON.stringify({
      title: payload?.title || `${targetMeal.charAt(0).toUpperCase() + targetMeal.slice(1)} 🍽️`,
      body: mealName,
      url: `/?meal=${targetMeal}`,
      mealType: targetMeal,
      menuId: menuId,
      profileId: profileId,
      phone: phone,
    });

    // 2. Broadcast mode: Dispatch to all registered push subscriptions
    if (broadcast) {
      let sentCount = 0;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (supabaseUrl && !supabaseUrl.includes('sample-pg-canteen')) {
        try {
          const supabase = await createClient();
          const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*');

          if (subscriptions && subscriptions.length > 0) {
            const pushPromises = subscriptions.map((sub: any) => {
              const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              };
              return webPush
                .sendNotification(pushSubscription, notificationPayload)
                .then(() => {
                  sentCount++;
                })
                .catch((err) => {
                  console.error('Failed push to subscription:', sub.id, err?.statusCode);
                });
            });
            await Promise.allSettled(pushPromises);
          }
        } catch (dbErr) {
          console.error('Broadcast fetch error:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        broadcast: true,
        sentCount,
        mealType: targetMeal,
        message: `Notification broadcast sent to ${sentCount} devices for ${targetMeal.toUpperCase()}`,
      });
    }

    // 3. Direct single subscription push
    if (subscription) {
      await webPush.sendNotification(subscription, notificationPayload);
    }

    return NextResponse.json({
      success: true,
      mealType: targetMeal,
      message: `${targetMeal.toUpperCase()} reminder dispatched`,
    });
  } catch (error: any) {
    console.error('Push dispatch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

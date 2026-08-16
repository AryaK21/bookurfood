import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { createClient } from '@supabase/supabase-js';
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
    title: 'Breakfast Alert 🍳',
    body: 'Breakfast is ready in the dining hall! Confirm your attendance.',
  },
  lunch: {
    title: 'Lunch Alert 🍛',
    body: 'Lunch is ready in the dining hall! Confirm your attendance.',
  },
  dinner: {
    title: 'Dinner Alert 🍲',
    body: 'Dinner is ready in the dining hall! Confirm your attendance.',
  },
};

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  if (!supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

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

    const supabase = getSupabaseServerClient();

    // 1. Action: Save new Web Push Subscription
    if (action === 'subscribe') {
      if (!subscription || !subscription.endpoint) {
        return NextResponse.json(
          { success: false, error: 'Invalid push subscription payload' },
          { status: 400 }
        );
      }

      if (supabase) {
        try {
          const { error: dbErr } = await supabase.from('push_subscriptions').upsert(
            {
              endpoint: subscription.endpoint,
              p256dh: subscription.keys?.p256dh || '',
              auth: subscription.keys?.auth || '',
              profile_id: profileId || null,
            },
            { onConflict: 'endpoint' }
          );

          if (dbErr) {
            console.error('Failed to store push subscription:', dbErr);
          }
        } catch (dbErr: any) {
          console.error('Failed to store push subscription:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Push subscription stored successfully in database',
      });
    }

    const targetMeal: MealType = mealType || 'lunch';
    const preset = MEAL_PRESETS[targetMeal] || MEAL_PRESETS.lunch;

    const mealName = payload?.body || preset.body;
    const notificationPayload = JSON.stringify({
      title: payload?.title || `${targetMeal.charAt(0).toUpperCase() + targetMeal.slice(1)} Alert 🍽️`,
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
      let failedCount = 0;

      if (supabase) {
        try {
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
                  failedCount++;
                  console.error('Push delivery failure:', sub.id, err?.statusCode);
                  if (err?.statusCode === 410 || err?.statusCode === 404) {
                    supabase.from('push_subscriptions').delete().eq('id', sub.id).then();
                  }
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
        failedCount,
        mealType: targetMeal,
        message: `Notification broadcast dispatched to ${sentCount} device(s) for ${targetMeal.toUpperCase()}`,
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

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

const MEAL_CONFIG: Record<MealType, { title: string; defaultBody: string }> = {
  breakfast: {
    title: 'Breakfast Alert 🍳',
    defaultBody: 'Breakfast is ready in the dining hall! Tap to confirm or skip.',
  },
  lunch: {
    title: 'Lunch Alert 🍛',
    defaultBody: 'Lunch is ready in the dining hall! Tap to confirm or skip.',
  },
  dinner: {
    title: 'Dinner Alert 🍲',
    defaultBody: 'Dinner is ready in the dining hall! Tap to confirm or skip.',
  },
};

// Determines active meal based on India Standard Time (IST, UTC+5:30)
function getISTMealType(): MealType {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + 3600000 * 5.5);
  const hour = istTime.getHours();
  const minute = istTime.getMinutes();

  const totalMinutes = hour * 60 + minute;

  // 6:00 AM - 10:00 AM -> Breakfast
  if (totalMinutes >= 360 && totalMinutes < 600) {
    return 'breakfast';
  }
  // 10:00 AM - 3:30 PM -> Lunch
  if (totalMinutes >= 600 && totalMinutes < 930) {
    return 'lunch';
  }
  // 3:30 PM onwards -> Dinner
  return 'dinner';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryMeal = searchParams.get('meal') as MealType | null;

    const targetMeal: MealType =
      queryMeal && ['breakfast', 'lunch', 'dinner'].includes(queryMeal)
        ? queryMeal
        : getISTMealType();

    const config = MEAL_CONFIG[targetMeal] || MEAL_CONFIG.lunch;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '';

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('sample-pg-canteen')) {
      return NextResponse.json({
        success: false,
        error: 'Supabase configuration not active for cron dispatch',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // 1. Fetch today's menu for the target meal
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: menuRow } = await supabase
      .from('menus')
      .select('*')
      .eq('date', todayStr)
      .eq('meal_type', targetMeal)
      .single();

    const mealTitle =
      menuRow?.title && menuRow.title !== 'Menu not added yet'
        ? menuRow.title
        : config.defaultBody;

    const notificationPayload = JSON.stringify({
      title: config.title,
      body: mealTitle,
      url: `/?meal=${targetMeal}`,
      mealType: targetMeal,
      menuId: menuRow?.id,
    });

    // 2. Fetch all registered push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subError) {
      console.error('Cron sub fetch error:', subError);
      return NextResponse.json({ success: false, error: subError.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        mealType: targetMeal,
        sentCount: 0,
        message: 'No registered push subscriptions in database yet.',
      });
    }

    // 3. Broadcast notifications in parallel
    let sentCount = 0;
    let failedCount = 0;

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
          // If subscription has expired / unsubscribed, optionally remove it
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            supabase.from('push_subscriptions').delete().eq('id', sub.id).then();
          }
        });
    });

    await Promise.allSettled(pushPromises);

    return NextResponse.json({
      success: true,
      mealType: targetMeal,
      sentCount,
      failedCount,
      totalSubscribers: subscriptions.length,
      menu: mealTitle,
      timestamp: new Date().toISOString(),
      message: `Automated scheduled notification broadcast sent for ${targetMeal.toUpperCase()} to ${sentCount} devices.`,
    });
  } catch (err: any) {
    console.error('Scheduled meal alert cron error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

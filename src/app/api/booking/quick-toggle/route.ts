import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DataStore, isSupabaseConfigured } from '@/lib/data/data-store';
import type { BookingStatus } from '@/types/database.types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { menuId, profileId, phone, status, selectedOption } = body as {
      menuId?: string;
      profileId?: string;
      phone?: string;
      status?: BookingStatus;
      selectedOption?: string | null;
    };

    if (!status || (status !== 'eating' && status !== 'skipping')) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be "eating" or "skipping".' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '';

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('sample-pg-canteen') && profileId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });

        let targetMenuId = menuId;

        // Auto-resolve placeholder menu IDs (e.g. unconfigured-2026-08-16-dinner)
        if (!targetMenuId || targetMenuId.startsWith('unconfigured-')) {
          const parts = (targetMenuId || '').split('-');
          const mealType = parts.pop() || 'dinner';
          const date = parts.length > 1 ? parts.slice(1).join('-') : new Date().toISOString().split('T')[0];

          const schedules: Record<string, { cutoffH: number; cutoffM: number; start: string; end: string }> = {
            breakfast: { cutoffH: 7, cutoffM: 0, start: '08:00', end: '10:30' },
            lunch: { cutoffH: 11, cutoffM: 30, start: '12:30', end: '15:00' },
            dinner: { cutoffH: 18, cutoffM: 30, start: '19:30', end: '21:30' },
          };
          const schedule = schedules[mealType] || schedules.dinner;
          const [y, m, d] = date.split('-').map(Number);
          const cutoffDate = new Date(y, (m || 1) - 1, d || 1, schedule.cutoffH, schedule.cutoffM, 0);

          const { data: menuRow } = await supabase
            .from('menus')
            .upsert(
              {
                date,
                meal_type: mealType,
                title: 'Daily Meal (Menu updating)',
                items: [],
                cutoff_time: cutoffDate.toISOString(),
                serving_start: schedule.start,
                serving_end: schedule.end,
                is_published: false,
              },
              { onConflict: 'date,meal_type' }
            )
            .select()
            .single();

          if (menuRow) {
            targetMenuId = menuRow.id;
          }
        }

        if (targetMenuId) {
          const payload: any = {
            menu_id: targetMenuId,
            profile_id: profileId,
            status,
            updated_at: new Date().toISOString(),
          };
          if (selectedOption || status === 'eating') {
            payload.selected_option = selectedOption || 'Veg';
          }

          let { data, error } = await supabase
            .from('bookings')
            .upsert(payload, { onConflict: 'menu_id,profile_id' })
            .select()
            .single();

          if (error && error.message.includes('selected_option')) {
            delete payload.selected_option;
            const retry = await supabase
              .from('bookings')
              .upsert(payload, { onConflict: 'menu_id,profile_id' })
              .select()
              .single();
            data = retry.data;
            error = retry.error;
          }

          if (error) throw error;
          return NextResponse.json({
            success: true,
            status,
            booking: data,
            message: status === 'eating' ? `You're booked to eat (${payload.selected_option || 'Meal'})! 🍽️` : "Marked skipping 🛑",
          });
        }
      } catch (err: any) {
        console.error('Supabase quick booking error:', err);
      }
    }

    // Fallback DataStore
    const result = await DataStore.quickToggleBooking({
      menuId,
      profileId,
      phone,
      status,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update booking' },
        { status: 400 }
      );
    }

    const mealName = result.menu?.meal_type.toUpperCase() || 'MEAL';
    return NextResponse.json({
      success: true,
      status,
      mealType: result.menu?.meal_type,
      menuTitle: result.menu?.title,
      residentName: result.profile?.name,
      message:
        status === 'eating'
          ? `✅ Confirmed: You are eating ${mealName} (${result.menu?.title})!`
          : `🛑 Skipping: Marked absent for ${mealName}.`,
    });
  } catch (error: any) {
    console.error('Quick toggle API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

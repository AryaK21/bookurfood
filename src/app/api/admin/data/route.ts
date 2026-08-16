import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side admin handler that handles database operations safely
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '';

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // 1. ADD PROFILE
    if (action === 'addProfile') {
      const cleanPhone = payload.phone_number.replace(/\s+/g, '');
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            phone_number: cleanPhone,
            name: payload.name.trim(),
            room_number: payload.room_number ? payload.room_number.trim() : null,
            role: payload.role || 'resident',
            is_active: payload.is_active ?? true,
          },
          { onConflict: 'phone_number' }
        )
        .select()
        .single();

      if (error) {
        console.error('API addProfile error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, profile: data });
    }

    // 2. REMOVE PROFILE
    if (action === 'removeProfile') {
      const { error } = await supabase.from('profiles').delete().eq('id', payload.id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    // 3. SAVE MENU (Supports meal_options like Veg / Non-Veg choices)
    if (action === 'saveMenu') {
      const isPlaceholder = payload.id?.startsWith('unconfigured-');
      const insertData: any = {
        date: payload.date,
        meal_type: payload.meal_type,
        title: payload.title,
        items: payload.items || [],
        cutoff_time: payload.cutoff_time,
        serving_start: payload.serving_start || null,
        serving_end: payload.serving_end || null,
        notes: payload.notes || null,
        is_published: payload.is_published ?? true,
      };

      if (payload.meal_options && Array.isArray(payload.meal_options)) {
        insertData.meal_options = payload.meal_options;
      }

      if (!isPlaceholder && payload.id) {
        insertData.id = payload.id;
      }

      let { data, error } = await supabase
        .from('menus')
        .upsert(insertData, { onConflict: 'date,meal_type' })
        .select()
        .single();

      // Graceful fallback if meal_options column is not yet migrated in DB
      if (error && error.message.includes('meal_options')) {
        delete insertData.meal_options;
        const retry = await supabase
          .from('menus')
          .upsert(insertData, { onConflict: 'date,meal_type' })
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('API saveMenu error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, menu: data });
    }

    // 4. DELETE MENU
    if (action === 'deleteMenu') {
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('date', payload.date)
        .eq('meal_type', payload.meal_type);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    // 5. TOGGLE BOOKING (Supports selected_option like Veg / Non-Veg)
    if (action === 'toggleBooking') {
      let targetMenuId = payload.menu_id;

      // If booking a placeholder slot (e.g. unconfigured-2026-08-16-dinner)
      if (targetMenuId && typeof targetMenuId === 'string' && targetMenuId.startsWith('unconfigured-')) {
        const parts = targetMenuId.split('-');
        const mealType = parts.pop() || 'lunch';
        const date = parts.slice(1).join('-');

        const schedules: Record<string, { cutoffH: number; cutoffM: number; start: string; end: string }> = {
          breakfast: { cutoffH: 7, cutoffM: 0, start: '08:00', end: '10:30' },
          lunch: { cutoffH: 11, cutoffM: 30, start: '12:30', end: '15:00' },
          dinner: { cutoffH: 18, cutoffM: 30, start: '19:30', end: '21:30' },
        };
        const schedule = schedules[mealType] || schedules.lunch;

        const [y, m, d] = date.split('-').map(Number);
        const cutoffDate = new Date(y, (m || 1) - 1, d || 1, schedule.cutoffH, schedule.cutoffM, 0);

        const { data: menuRow, error: menuErr } = await supabase
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

        if (menuErr || !menuRow) {
          console.error('Failed to initialize meal slot for booking:', menuErr);
          return NextResponse.json(
            { success: false, error: menuErr?.message || 'Failed to initialize meal slot' },
            { status: 400 }
          );
        }

        targetMenuId = menuRow.id;
      }

      const bookingPayload: any = {
        menu_id: targetMenuId,
        profile_id: payload.profile_id,
        status: payload.status,
        updated_at: new Date().toISOString(),
      };

      if (payload.selected_option) {
        bookingPayload.selected_option = payload.selected_option;
      }

      let { data, error } = await supabase
        .from('bookings')
        .upsert(bookingPayload, { onConflict: 'menu_id,profile_id' })
        .select()
        .single();

      // Graceful fallback if selected_option column is not yet migrated in DB
      if (error && error.message.includes('selected_option')) {
        delete bookingPayload.selected_option;
        if (payload.selected_option) {
          bookingPayload.notes = `Option: ${payload.selected_option}`;
        }
        const retry = await supabase
          .from('bookings')
          .upsert(bookingPayload, { onConflict: 'menu_id,profile_id' })
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('API toggleBooking error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, booking: data, menuId: targetMenuId });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

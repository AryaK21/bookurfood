import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { DataStore, isSupabaseConfigured } from '@/lib/data/data-store';
import type { BookingStatus } from '@/types/database.types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { menuId, profileId, phone, status } = body as {
      menuId?: string;
      profileId?: string;
      phone?: string;
      status?: BookingStatus;
    };

    if (!status || (status !== 'eating' && status !== 'skipping')) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be "eating" or "skipping".' },
        { status: 400 }
      );
    }

    // In Supabase mode
    if (isSupabaseConfigured() && menuId && profileId) {
      try {
        const supabase = createClient();
        const payload: any = {
          menu_id: menuId,
          profile_id: profileId,
          status,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
          .from('bookings')
          .upsert(payload, { onConflict: 'menu_id,profile_id' })
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({
          success: true,
          status,
          booking: data,
          message: status === 'eating' ? "You're booked to eat! 🍽️" : "Marked skipping 🛑",
        });
      } catch (err: any) {
        console.error('Supabase quick booking error:', err);
      }
    }

    // Fallback or preview DataStore
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

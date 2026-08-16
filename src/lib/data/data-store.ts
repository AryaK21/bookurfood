import { createClient } from '@/lib/supabase/client';
import type { Profile, Menu, Booking, BookingStatus, UserRole, MenuItem, MealType } from '@/types/database.types';

// Default mock state for immediate offline/preview testing if Supabase is unconfigured
const INITIAL_PROFILES: Profile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    user_id: 'admin-01',
    phone_number: '+919876543210',
    name: 'Admin Manager',
    room_number: 'Office',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const getTodayDateString = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export const MEAL_SCHEDULES: Record<MealType, {
  name: string;
  servingTime: string;
  servingStart: string;
  servingEnd: string;
  cutoffTime: string;
  cutoffHour: number;
  cutoffMinute: number;
  optimalNotificationTime: string;
  iconName: 'Sun' | 'SunMedium' | 'Moon';
}> = {
  breakfast: {
    name: 'Breakfast',
    servingTime: '8:00 AM - 10:30 AM',
    servingStart: '08:00',
    servingEnd: '10:30',
    cutoffTime: '7:00 AM',
    cutoffHour: 7,
    cutoffMinute: 0,
    optimalNotificationTime: '6:00 AM (or 9:00 PM night before)',
    iconName: 'SunMedium',
  },
  lunch: {
    name: 'Lunch',
    servingTime: '12:30 PM - 2:00 PM',
    servingStart: '12:30',
    servingEnd: '14:00',
    cutoffTime: '11:30 AM',
    cutoffHour: 11,
    cutoffMinute: 30,
    optimalNotificationTime: '10:00 AM',
    iconName: 'Sun',
  },
  dinner: {
    name: 'Dinner',
    servingTime: '7:30 PM - 9:30 PM',
    servingStart: '19:30',
    servingEnd: '21:30',
    cutoffTime: '6:30 PM',
    cutoffHour: 18,
    cutoffMinute: 30,
    optimalNotificationTime: '5:00 PM',
    iconName: 'Moon',
  },
};

const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const getIsoTimeForDate = (dateOffsetDays: number, hours: number, minutes: number) => {
  const d = new Date();
  d.setDate(d.getDate() + dateOffsetDays);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const INITIAL_MENUS: Menu[] = [];

const INITIAL_BOOKINGS: Booking[] = [];

const STORAGE_KEYS = {
  PROFILES: 'foodbook_profiles_prod_v1',
  MENUS: 'foodbook_menus_prod_v1',
  BOOKINGS: 'foodbook_bookings_prod_v1',
  SESSION: 'foodbook_session_user_prod_v1',
};

export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes('sample-pg-canteen') && !url.includes('your-project-id'));
};

export class DataStore {
  // -------------------------------------------------------------
  // Whitelist Verification
  // -------------------------------------------------------------
  static async verifyWhitelist(phoneNumber: string): Promise<{
    isWhitelisted: boolean;
    profile?: Profile;
    error?: string;
  }> {
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    const last10 = cleanPhone.slice(-10);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error } = await (supabase.rpc as any)('verify_whitelist_phone', {
          phone_input: cleanPhone,
        });

        if (error) throw error;
        if (data && Array.isArray(data) && data.length > 0 && data[0].is_whitelisted) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone_number', cleanPhone)
            .single();

          if (profile) {
            return { isWhitelisted: true, profile: profile as unknown as Profile };
          }
        }
        return { isWhitelisted: false, error: 'Phone number not found in resident whitelist.' };
      } catch (err: unknown) {
        console.error('Supabase whitelist check error:', err);
      }
    }

    // Fallback Mock store
    const profiles = this.getProfiles();
    const match = profiles.find(
      (p) =>
        p.is_active &&
        (p.phone_number === cleanPhone || p.phone_number.slice(-10) === last10)
    );

    if (match) {
      return { isWhitelisted: true, profile: match };
    }

    return {
      isWhitelisted: false,
      error:
        'This number is not on the resident whitelist. Only pre-authorized PG residents can log in. Contact your PG Admin.',
    };
  }

  // -------------------------------------------------------------
  // Profiles Management (Admin)
  // -------------------------------------------------------------
  static getProfiles(): Profile[] {
    if (typeof window === 'undefined') return INITIAL_PROFILES;
    try {
      const item = localStorage.getItem(STORAGE_KEYS.PROFILES);
      return item ? JSON.parse(item) : INITIAL_PROFILES;
    } catch {
      return INITIAL_PROFILES;
    }
  }

  static saveProfiles(profiles: Profile[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  }

  static async addProfile(newProfile: {
    phone_number: string;
    name: string;
    room_number?: string | null;
    role?: UserRole;
    is_active?: boolean;
  }): Promise<Profile> {
    const cleanPhone = newProfile.phone_number.replace(/\s+/g, '');

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const insertPayload: any = {
        phone_number: cleanPhone,
        name: newProfile.name,
        room_number: newProfile.room_number || null,
        role: newProfile.role || 'resident',
        is_active: newProfile.is_active ?? true,
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Profile;
    }

    const profiles = this.getProfiles();
    const exists = profiles.some(
      (p) => p.phone_number === cleanPhone || p.phone_number.slice(-10) === cleanPhone.slice(-10)
    );
    if (exists) {
      throw new Error('A resident with this phone number already exists in the whitelist.');
    }

    const created: Profile = {
      phone_number: cleanPhone,
      name: newProfile.name,
      room_number: newProfile.room_number || null,
      role: newProfile.role || 'resident',
      is_active: newProfile.is_active ?? true,
      id: crypto.randomUUID(),
      user_id: null,
      created_at: new Date().toISOString(),
    };

    const updated = [created, ...profiles];
    this.saveProfiles(updated);
    return created;
  }

  static async removeProfile(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      return;
    }

    const profiles = this.getProfiles().filter((p) => p.id !== id);
    this.saveProfiles(profiles);
  }

  // -------------------------------------------------------------
  // Menus Management
  // -------------------------------------------------------------
  static getMenus(): Menu[] {
    if (typeof window === 'undefined') return INITIAL_MENUS;
    try {
      const item = localStorage.getItem(STORAGE_KEYS.MENUS);
      return item ? JSON.parse(item) : INITIAL_MENUS;
    } catch {
      return INITIAL_MENUS;
    }
  }

  static saveMenus(menus: Menu[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(menus));
  }

  static getMealsForDate(dateStr: string): Menu[] {
    const allMenus = this.getMenus();
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];

    return mealTypes.map((mealType) => {
      const existing = allMenus.find((m) => m.date === dateStr && m.meal_type === mealType);
      if (existing) {
        return existing;
      }

      const schedule = MEAL_SCHEDULES[mealType];
      const [y, m, d] = dateStr.split('-').map(Number);
      const cutoffDate = new Date(y, m - 1, d, schedule.cutoffHour, schedule.cutoffMinute, 0);

      return {
        id: `unconfigured-${dateStr}-${mealType}`,
        date: dateStr,
        meal_type: mealType,
        title: 'Menu not added yet',
        items: [],
        cutoff_time: cutoffDate.toISOString(),
        serving_start: schedule.servingStart,
        serving_end: schedule.servingEnd,
        is_published: false,
        notes: 'The kitchen will post today\'s dishes shortly. You can still confirm your attendance!',
        created_at: new Date().toISOString(),
      };
    });
  }

  static async saveMenu(menuData: {
    id?: string;
    date: string;
    meal_type: MealType;
    title: string;
    items: MenuItem[];
    cutoff_time: string;
    serving_start?: string;
    serving_end?: string;
    notes?: string | null;
    is_published?: boolean;
  }): Promise<Menu> {
    const isPlaceholderId = menuData.id?.startsWith('unconfigured-');
    const effectiveId = isPlaceholderId ? crypto.randomUUID() : (menuData.id || crypto.randomUUID());

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const upsertPayload: any = {
        id: effectiveId,
        date: menuData.date,
        meal_type: menuData.meal_type,
        title: menuData.title,
        items: menuData.items,
        cutoff_time: menuData.cutoff_time,
        serving_start: menuData.serving_start || null,
        serving_end: menuData.serving_end || null,
        is_published: menuData.is_published ?? true,
        notes: menuData.notes ?? null,
      };

      const { data, error } = await supabase
        .from('menus')
        .upsert(upsertPayload)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Menu;
    }

    const menus = this.getMenus();
    const index = menus.findIndex((m) => m.date === menuData.date && m.meal_type === menuData.meal_type);

    let updatedMenu: Menu;
    if (index >= 0) {
      updatedMenu = {
        ...menus[index],
        title: menuData.title,
        items: menuData.items,
        cutoff_time: menuData.cutoff_time,
        serving_start: menuData.serving_start ?? menus[index].serving_start,
        serving_end: menuData.serving_end ?? menus[index].serving_end,
        notes: menuData.notes ?? null,
        is_published: menuData.is_published ?? true,
      };
      menus[index] = updatedMenu;
    } else {
      updatedMenu = {
        id: effectiveId,
        date: menuData.date,
        meal_type: menuData.meal_type,
        title: menuData.title,
        items: menuData.items,
        cutoff_time: menuData.cutoff_time,
        serving_start: menuData.serving_start || '08:00',
        serving_end: menuData.serving_end || '10:30',
        is_published: menuData.is_published ?? true,
        notes: menuData.notes ?? null,
        created_at: new Date().toISOString(),
      };
      menus.unshift(updatedMenu);
    }

    // Migrate any placeholder bookings to the new menu ID
    if (isPlaceholderId && menuData.id) {
      const bookings = this.getBookings();
      const updatedBookings = bookings.map((b) =>
        b.menu_id === menuData.id ? { ...b, menu_id: updatedMenu.id } : b
      );
      this.saveBookings(updatedBookings);
    }

    this.saveMenus(menus);
    return updatedMenu;
  }

  static async deleteMenu(date: string, mealType: MealType): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('date', date)
        .eq('meal_type', mealType);
      if (error) throw error;
      return;
    }

    const menus = this.getMenus().filter(
      (m) => !(m.date === date && m.meal_type === mealType)
    );
    this.saveMenus(menus);
  }

  // -------------------------------------------------------------
  // Bookings & Headcount
  // -------------------------------------------------------------
  static getBookings(): Booking[] {
    if (typeof window === 'undefined') return INITIAL_BOOKINGS;
    try {
      const item = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return item ? JSON.parse(item) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  }

  static saveBookings(bookings: Booking[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }

  static async toggleBooking(menuId: string, profileId: string, status: BookingStatus): Promise<Booking> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const bookingPayload: any = {
        menu_id: menuId,
        profile_id: profileId,
        status,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('bookings')
        .upsert(bookingPayload, { onConflict: 'menu_id,profile_id' })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Booking;
    }

    const bookings = this.getBookings();
    const existingIndex = bookings.findIndex((b) => b.menu_id === menuId && b.profile_id === profileId);

    let resultBooking: Booking;
    if (existingIndex >= 0) {
      resultBooking = {
        ...bookings[existingIndex],
        status,
        updated_at: new Date().toISOString(),
      };
      bookings[existingIndex] = resultBooking;
    } else {
      resultBooking = {
        id: crypto.randomUUID(),
        menu_id: menuId,
        profile_id: profileId,
        status,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      bookings.push(resultBooking);
    }

    this.saveBookings(bookings);
    return resultBooking;
  }

  // Quick toggle helper for Service Worker background fetch or direct API
  static async quickToggleBooking({
    menuId,
    profileId,
    phone,
    status,
  }: {
    menuId?: string;
    profileId?: string;
    phone?: string;
    status: BookingStatus;
  }): Promise<{ success: boolean; booking?: Booking; menu?: Menu; profile?: Profile; error?: string }> {
    const menus = this.getMenus();
    let targetMenu = menuId ? menus.find((m) => m.id === menuId) : undefined;

    // If no menuId specified, find current or next upcoming meal
    if (!targetMenu) {
      const now = new Date().getTime();
      targetMenu = menus.find((m) => new Date(m.cutoff_time).getTime() > now) || menus[0];
    }

    if (!targetMenu) {
      return { success: false, error: 'No active meal menu found.' };
    }

    // Resolve profile
    const profiles = this.getProfiles();
    let targetProfile = profileId ? profiles.find((p) => p.id === profileId) : undefined;
    if (!targetProfile && phone) {
      const cleanPhone = phone.replace(/\s+/g, '');
      targetProfile = profiles.find((p) => p.phone_number === cleanPhone || p.phone_number.slice(-10) === cleanPhone.slice(-10));
    }
    if (!targetProfile) {
      // Default to first active resident if testing offline
      targetProfile = profiles.find((p) => p.role === 'resident' && p.is_active);
    }

    if (!targetProfile) {
      return { success: false, error: 'Resident profile not identified.' };
    }

    const booking = await this.toggleBooking(targetMenu.id, targetProfile.id, status);
    return { success: true, booking, menu: targetMenu, profile: targetProfile };
  }

  // Headcount calculation helper
  static getHeadcount(menuId: string, totalResidentsCount?: number) {
    const bookings = this.getBookings().filter((b) => b.menu_id === menuId);
    const profiles = this.getProfiles().filter((p) => p.role === 'resident' && p.is_active);
    const total = totalResidentsCount ?? profiles.length;

    const eatingCount = bookings.filter((b) => b.status === 'eating').length;
    const skippingCount = bookings.filter((b) => b.status === 'skipping').length;
    const unbookedCount = Math.max(0, total - (eatingCount + skippingCount));

    return {
      eating: eatingCount,
      skipping: skippingCount,
      unbooked: unbookedCount,
      total,
      percentage: total > 0 ? Math.round((eatingCount / total) * 100) : 0,
      bookings,
    };
  }
}

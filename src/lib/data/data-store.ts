import { createClient } from '@/lib/supabase/client';
import type { Profile, Menu, Booking, BookingStatus, UserRole, MenuItem } from '@/types/database.types';

// Default mock state for immediate offline/preview testing if Supabase is unconfigured
const INITIAL_PROFILES: Profile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    user_id: 'user-admin-01',
    phone_number: '+919876543210',
    name: 'Manager Rao',
    room_number: 'Office',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    user_id: 'user-res-01',
    phone_number: '+919876543211',
    name: 'Aarav Sharma',
    room_number: '204-A',
    role: 'resident',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    user_id: 'user-res-02',
    phone_number: '+919876543212',
    name: 'Rohan Verma',
    room_number: '108-B',
    role: 'resident',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    user_id: 'user-res-03',
    phone_number: '+919876543213',
    name: 'Ananya Iyer',
    room_number: '312-A',
    role: 'resident',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    user_id: 'user-res-04',
    phone_number: '+919876543214',
    name: 'Vikram Patel',
    room_number: '105-C',
    role: 'resident',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    user_id: 'user-res-05',
    phone_number: '+919876543215',
    name: 'Priya Nair',
    room_number: '210-B',
    role: 'resident',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const getTodayDateString = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getIsoTimeForToday = (hours: number, minutes: number) => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const INITIAL_MENUS: Menu[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    date: getTodayDateString(),
    meal_type: 'lunch',
    title: 'North Indian Thali Feast',
    items: [
      { id: '1', name: 'Paneer Butter Masala', category: 'curry', is_veg: true },
      { id: '2', name: 'Dal Tadka Special', category: 'curry', is_veg: true },
      { id: '3', name: 'Butter Phulka (3 pcs)', category: 'bread', is_veg: true },
      { id: '4', name: 'Jeera Rice & Pickle', category: 'rice', is_veg: true },
      { id: '5', name: 'Boondi Raita & Salad', category: 'side', is_veg: true },
      { id: '6', name: 'Warm Gulab Jamun (2 pcs)', category: 'dessert', is_veg: true },
    ],
    cutoff_time: getIsoTimeForToday(11, 30),
    is_published: true,
    notes: 'Hot lunch served fresh from 12:30 PM - 2:30 PM.',
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    date: getTodayDateString(),
    meal_type: 'dinner',
    title: 'Special Dum Biryani Night',
    items: [
      { id: '7', name: 'Hyderabadi Dum Biryani (Chicken/Paneer)', category: 'main', is_veg: false },
      { id: '8', name: 'Mirchi Ka Salan (Rich Gravy)', category: 'curry', is_veg: true },
      { id: '9', name: 'Crisp Onion & Cucumber Raita', category: 'side', is_veg: true },
      { id: '10', name: 'Double Ka Meetha', category: 'dessert', is_veg: true },
    ],
    cutoff_time: getIsoTimeForToday(17, 0), // 5:00 PM cutoff
    is_published: true,
    notes: 'Dinner served hot from 8:00 PM - 10:00 PM. Cutoff strictly at 5:00 PM.',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    menu_id: '22222222-2222-2222-2222-222222222222',
    profile_id: '00000000-0000-0000-0000-000000000002',
    status: 'eating',
    notes: null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'b2',
    menu_id: '22222222-2222-2222-2222-222222222222',
    profile_id: '00000000-0000-0000-0000-000000000003',
    status: 'eating',
    notes: null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'b3',
    menu_id: '22222222-2222-2222-2222-222222222222',
    profile_id: '00000000-0000-0000-0000-000000000004',
    status: 'skipping',
    notes: null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'b4',
    menu_id: '22222222-2222-2222-2222-222222222222',
    profile_id: '00000000-0000-0000-0000-000000000005',
    status: 'eating',
    notes: null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

const STORAGE_KEYS = {
  PROFILES: 'foodbook_profiles_v1',
  MENUS: 'foodbook_menus_v1',
  BOOKINGS: 'foodbook_bookings_v1',
  SESSION: 'foodbook_current_user_v1',
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

  static async saveMenu(menuData: {
    id?: string;
    date: string;
    meal_type: 'lunch' | 'dinner';
    title: string;
    items: MenuItem[];
    cutoff_time: string;
    notes?: string | null;
    is_published?: boolean;
  }): Promise<Menu> {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const upsertPayload: any = {
        ...(menuData.id ? { id: menuData.id } : {}),
        date: menuData.date,
        meal_type: menuData.meal_type,
        title: menuData.title,
        items: menuData.items,
        cutoff_time: menuData.cutoff_time,
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
        notes: menuData.notes ?? null,
        is_published: menuData.is_published ?? true,
      };
      menus[index] = updatedMenu;
    } else {
      updatedMenu = {
        id: menuData.id || crypto.randomUUID(),
        date: menuData.date,
        meal_type: menuData.meal_type,
        title: menuData.title,
        items: menuData.items,
        cutoff_time: menuData.cutoff_time,
        is_published: menuData.is_published ?? true,
        notes: menuData.notes ?? null,
        created_at: new Date().toISOString(),
      };
      menus.unshift(updatedMenu);
    }

    this.saveMenus(menus);
    return updatedMenu;
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

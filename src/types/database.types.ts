export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'resident' | 'admin';
export type MealType = 'lunch' | 'dinner';
export type BookingStatus = 'eating' | 'skipping';

export interface Profile {
  id: string;
  user_id: string | null;
  phone_number: string;
  name: string;
  room_number: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'main' | 'curry' | 'bread' | 'rice' | 'dessert' | 'side';
  is_veg?: boolean;
}

export interface Menu {
  id: string;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  title: string;
  items: MenuItem[];
  cutoff_time: string; // ISO timestamptz
  is_published: boolean;
  notes: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  menu_id: string;
  profile_id: string;
  status: BookingStatus;
  notes: string | null;
  updated_at: string;
  created_at: string;
  profile?: Profile;
  menu?: Menu;
}

export interface PushSubscriptionRecord {
  id: string;
  profile_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id?: string;
          user_id?: string | null;
          phone_number: string;
          name: string;
          room_number?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          phone_number?: string;
          name?: string;
          room_number?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      menus: {
        Row: Menu;
        Insert: {
          id?: string;
          date: string;
          meal_type: MealType;
          title: string;
          items?: Json;
          cutoff_time: string;
          is_published?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          meal_type?: MealType;
          title?: string;
          items?: Json;
          cutoff_time?: string;
          is_published?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: Booking;
        Insert: {
          id?: string;
          menu_id: string;
          profile_id: string;
          status: BookingStatus;
          notes?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_id?: string;
          profile_id?: string;
          status?: BookingStatus;
          notes?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubscriptionRecord;
        Insert: {
          id?: string;
          profile_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      verify_whitelist_phone: {
        Args: { phone_input: string };
        Returns: {
          is_whitelisted: boolean;
          profile_name: string | null;
          profile_role: string | null;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      meal_type: MealType;
      booking_status: BookingStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

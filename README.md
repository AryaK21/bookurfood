# 🍛 FoodBook — PG Canteen Meal Booking & Headcount PWA

> **A tactile, invite-only Progressive Web App designed to replace messy WhatsApp polls with a crystal-clean meal attendance and canteen headcount system.**

Built with **Next.js (App Router)**, **Tailwind CSS**, **Framer Motion**, **Supabase (PostgreSQL + RLS + Realtime)**, and **Web Push API**.

---

## 🎨 UI/UX Design System: "Dark Spotify meets Duolingo"

- **Palette**: Deep rich dark mode (`#121212` backgrounds, `#1a1a1a` / `#222222` elevated cards) paired with vibrant neon greens (`#22c55e`), warm oranges (`#f97316`), and rich red accents.
- **Shape Language**: Organic and ultra-rounded (`rounded-[2rem]`, `rounded-[2.5rem]`, and pill shapes). Strictly **no** sharp rectangular "AI slop" UI.
- **Tactile Physical Buttons**: Physical 3D bottom borders (`border-b-[5px]`, `border-b-[6px]`) with spring compression on click (`whileTap={{ scale: 0.96, y: 3 }}`) mimicking Duolingo's satisfying tactile presses.
- **Celebration Confetti**: Dynamic multi-angle confetti explosion upon confirming meal booking.
- **Minimalist Flow**: Huge, satisfying toggle switch (**"I'LL EAT"** vs **"SKIPPING"**) paired with an appetizing display of today's menu and live cutoff countdown timer.

---

## 🔒 Strict "Anti-Spam" Whitelist Security Flow

1. **Admin Provisioning**: Only the PG Admin can add resident phone numbers and room numbers to the `profiles` table.
2. **Whitelist Pre-Validation**: Before sending any OTP, the database verifies if the phone number is on the pre-approved whitelist (`verify_whitelist_phone` RPC function).
3. **Aggressive Rejection**: If an un-whitelisted phone number attempts to log in, they are immediately rejected with a clear, friendly error explaining how to contact the PG Manager to be added. **No open sign-ups.**
4. **Row Level Security (RLS)**:
   - Residents can only read/update their own profile and bookings.
   - Database trigger (`trigger_booking_cutoff`) automatically rejects meal changes after the cutoff deadline (e.g. 5:00 PM for dinner).
   - Admins have full access to view live headcount summaries, edit menus, and manage the whitelist.

---

## ⚡ Core Application Features

### 1. Resident Flow
* **Upcoming Meal Card**: Appetizing menu breakdown (Main dish, Curries, Breads, Rice, Desserts, Sides with Veg/Non-Veg indicators).
* **Massive Tactile Toggle Switch**:
  - **`I'LL EAT`** (Vibrant Neon Green with fork & knife, 3D bottom border, celebratory confetti).
  - **`SKIPPING`** (Tactile Warm Orange/Red with skip icon).
* **Cutoff Countdown**: Real-time timer showing time remaining before the kitchen locks the headcount.
* **Meal Switcher**: 1-tap toggle between **Lunch** and **Tonight's Dinner**.
* **Web Push Notifications**: 1-tap browser notification permission to receive the daily 3:00 PM alert: *"Tap to book tonight's dinner! 🍛"*

### 2. Admin Portal (`/admin`)
* **Live Headcount Hero**: Big typography (`24 / 30 Eating Today`), progress bar percentage, and breakdown (`Eating`, `Skipping`, `Pending`).
* **WhatsApp Kitchen Export**: One-tap `Copy WhatsApp Report` generating a formatted headcount summary for the PG cook.
* **Menu Manager**: Set daily themes, food items, custom cutoff times (e.g., 5:00 PM), and serving hours.
* **Resident Whitelist Directory**: Add new resident phone numbers, assign room numbers, search by name/room, or revoke access.

---

## 📂 Project Structure

```
food-book/
├── public/
│   ├── icons/                 # High-res tactile PWA icons (192, 512, apple-touch, favicon)
│   ├── manifest.json          # PWA Web Manifest (standalone, theme #121212)
│   └── sw-push.js             # Web Push service worker listener
├── src/
│   ├── app/
│   │   ├── admin/page.tsx     # Admin Portal with headcount & whitelist management
│   │   ├── api/push/route.ts  # Web Push notification dispatcher (web-push)
│   │   ├── login/page.tsx     # OTP Login with Anti-Spam Whitelist verification
│   │   ├── globals.css        # Spotify dark tokens & Duolingo tactile button utilities
│   │   ├── layout.tsx         # PWA meta tags & Plus Jakarta Sans typography
│   │   └── page.tsx           # Home resident meal booking experience
│   ├── components/
│   │   ├── admin/             # Admin dashboard & management components
│   │   ├── auth/              # OTP login form & anti-spam rejection state
│   │   ├── pwa/               # Web push notification prompt card & simulator
│   │   ├── resident/          # Resident meal hero card & massive toggle buttons
│   │   ├── ui/                # TactileButton, TactileCard, Badge, Confetti, Navbar
│   │   └── providers/         # Client context wrappers
│   ├── lib/
│   │   ├── auth/              # Auth context & session provider
│   │   ├── data/              # DataStore adapter (Supabase live + offline fallback)
│   │   └── supabase/          # Browser, server, admin, and middleware clients
│   ├── middleware.ts          # Route protection and session refresher
│   └── types/database.types.ts# Strict TypeScript definitions for PostgreSQL tables
├── supabase/
│   └── schema.sql             # Full database schema, RLS policies, triggers, & seed data
├── next.config.ts             # PWA wrapper (@ducanh2912/next-pwa) + Turbopack support
└── package.json
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

### 3. Run Supabase Schema
Execute the SQL script in `supabase/schema.sql` inside your Supabase project's **SQL Editor**. This will:
- Create `profiles`, `menus`, `bookings`, and `push_subscriptions` tables.
- Set up RLS policies and cutoff enforcement triggers.
- Seed the default admin (`+919876543210`), sample residents, and today's menus.

### 4. Start Local Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing with 1-Click Demo Accounts

For instant testing, use the built-in quick login personas:
* **Aarav Sharma (Resident)**: `+919876543211` (Room 204-A)
* **Rohan Verma (Resident)**: `+919876543212` (Room 108-B)
* **Manager Rao (Admin)**: `+919876543210` (Full Admin Portal Access)
* **Unregistered Number**: `+919999999999` (Demonstrates the strict anti-spam rejection banner)

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub:
   ```bash
   git push -u origin main
   ```
2. Import the repository into [Vercel](https://vercel.com).
3. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
4. Click **Deploy**. Vercel will automatically build the optimized production bundle with PWA service workers and server routes.

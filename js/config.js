// ============================================================
//  🔧 Life OS — Personal Configuration
//  ============================================================
//  This is the only file you need to edit to make Life OS your own.
//  Set your name, app title, storage key, and optional Supabase
//  credentials below. Everything else is data-driven from Settings.
// ============================================================

const APP_CONFIG = {
  // ─── Identity ─────────────────────────────────────────
  userName: 'Pranav',
  userInitials: 'pr',
  userTagline: 'Designing disciplined systems',
  appName: 'TelOS',
  appSubtitle: 'Goal Operating System',

  // ─── Local Storage ────────────────────────────────────
  // All your data is saved in your browser under this key.
  // Change it only if you know what you're doing.
  storageKey: 'telos_data',

  // ─── Supabase Cloud Sync (optional) ──────────────────
  // Leave these empty for local-only mode.
  // Create a free Supabase account at https://supabase.com
  // then create a table called 'life_os_sync' with columns:
  //   id (text, primary key), data (jsonb), updated_at (timestamptz)
  supabaseUrl: '',
  supabaseKey: '',
};

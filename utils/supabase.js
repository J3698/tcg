import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csmoekhvptevicvpndrp.supabase.co';
const supabasePublishableKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbW9la2h2cHRldmljdnBuZHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjg3OTUsImV4cCI6MjA3Nzk0NDc5NX0.ggPGpmqdt3xPBkYieh7xedveJLFAEDGrGUVezVOCkrE';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

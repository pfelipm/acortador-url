import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

// Polyfill para soporte de WebSocket en Node 20
globalThis.WebSocket = ws;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan las variables de entorno de Supabase (SUPABASE_URL, SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY).');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

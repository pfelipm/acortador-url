import { supabase } from './lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('allow_user_registration, allow_custom_slugs, enable_qr_generation, enable_background_image')
      .eq('id', 1)
      .single();

    const allowRegistration = error ? true : settings.allow_user_registration;
    const allowCustomSlugs = error ? true : settings.allow_custom_slugs;
    const enableQrGeneration = error ? true : settings.enable_qr_generation;
    const enableBackgroundImage = error ? true : settings.enable_background_image;

    return res.status(200).json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      allowUserRegistration: allowRegistration,
      allowCustomSlugs: allowCustomSlugs,
      enableQrGeneration: enableQrGeneration,
      enableBackgroundImage: enableBackgroundImage
    });
  } catch (err) {
    console.error('Error al obtener configuraciones:', err);
    return res.status(200).json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      allowUserRegistration: true,
      allowCustomSlugs: true,
      enableQrGeneration: true,
      enableBackgroundImage: true
    });
  }
}

import { supabase } from './lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let settings = null;
    let minPasswordLength = 6;
    let allowRegistration = true;
    let allowCustomSlugs = true;
    let enableQrGeneration = true;
    let enableBackgroundImage = true;

    // Primer intento con min_password_length
    const { data, error } = await supabase
      .from('app_settings')
      .select('allow_user_registration, allow_custom_slugs, enable_qr_generation, enable_background_image, min_password_length')
      .eq('id', 1)
      .single();

    if (!error && data) {
      settings = data;
      allowRegistration = data.allow_user_registration;
      allowCustomSlugs = data.allow_custom_slugs;
      enableQrGeneration = data.enable_qr_generation;
      enableBackgroundImage = data.enable_background_image;
      minPasswordLength = data.min_password_length || 6;
    } else {
      // Fallback si la columna no existe o hay error
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('app_settings')
        .select('allow_user_registration, allow_custom_slugs, enable_qr_generation, enable_background_image')
        .eq('id', 1)
        .single();
      
      if (!fallbackError && fallbackData) {
        allowRegistration = fallbackData.allow_user_registration;
        allowCustomSlugs = fallbackData.allow_custom_slugs;
        enableQrGeneration = fallbackData.enable_qr_generation;
        enableBackgroundImage = fallbackData.enable_background_image;
      }
    }

    return res.status(200).json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      allowUserRegistration: allowRegistration,
      allowCustomSlugs: allowCustomSlugs,
      enableQrGeneration: enableQrGeneration,
      enableBackgroundImage: enableBackgroundImage,
      minPasswordLength: minPasswordLength
    });
  } catch (err) {
    console.error('Error al obtener configuraciones:', err);
    return res.status(200).json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      allowUserRegistration: true,
      allowCustomSlugs: true,
      enableQrGeneration: true,
      enableBackgroundImage: true,
      minPasswordLength: 6
    });
  }
}

import { supabase } from './lib/supabase.js';

// Generador de slug aleatorio
function generateRandomSlug(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(req, res) {
  // Configurar cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido. Use POST.' });
  }

  const { url, slug: customSlug, expiry } = req.body || {};

  if (!url) {
    return res.status(400).json({ success: false, error: 'La propiedad "url" es requerida.' });
  }

  // Validar formato de URL
  try {
    new URL(url);
  } catch (_) {
    return res.status(400).json({ success: false, error: 'La URL proporcionada no es válida.' });
  }

  // Obtener configuraciones globales de Supabase
  let settings = null;
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('max_urls_per_user, anon_url_expiry_days, allow_custom_slugs, forbidden_slugs, default_slug_length')
      .eq('id', 1)
      .single();
    settings = data;
  } catch (err) {
    console.error('Error al leer app_settings:', err);
  }

  const maxUrls = settings?.max_urls_per_user ?? 100;
  const anonExpiryDays = settings?.anon_url_expiry_days ?? 30;
  const allowCustomSlugs = settings?.allow_custom_slugs ?? true;
  const forbiddenSlugs = settings?.forbidden_slugs ?? ['admin', 'api', 'login', 'signup', 'dashboard', 'settings', 'shorten'];
  const defaultSlugLength = settings?.default_slug_length ?? 6;

  let slug = customSlug ? customSlug.trim() : '';

  // Validar slug personalizado si se proporciona
  if (slug) {
    if (!allowCustomSlugs) {
      return res.status(403).json({ success: false, error: 'La personalización de alias (slugs) está deshabilitada en este momento.' });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return res.status(400).json({
        success: false,
        error: 'El slug personalizado solo puede contener letras, números, guiones y guiones bajos.'
      });
    }

    if (forbiddenSlugs.includes(slug.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `El alias "/${slug}" está reservado por el sistema y no puede utilizarse.`
      });
    }
  }

  // Verificar autenticación opcional del usuario
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    } catch (e) {
      console.error('Error al verificar autenticación:', e);
    }
  }

  // Controlar límite de URLs para usuarios registrados
  if (userId) {
    try {
      const { count, error: countError } = await supabase
        .from('urls')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!countError && count >= maxUrls) {
        return res.status(403).json({
          success: false,
          error: `Has alcanzado el límite máximo de ${maxUrls} enlaces permitidos para tu cuenta.`
        });
      }
    } catch (limitErr) {
      console.error('Error al verificar límite de enlaces:', limitErr);
    }
  }

  // Calcular fecha de expiración
  let expiresAt = null;
  if (userId) {
    // Usuario registrado
    if (expiry === '24h') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else if (expiry === '48h') {
      expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    } else if (expiry === '7d') {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (expiry === '30d') {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (expiry === '3m') {
      expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    } else if (expiry === '1y') {
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      expiresAt = null; // Indefinido
    }
  } else {
    // Invitado (caducidad por defecto configurada en base de datos)
    expiresAt = new Date(Date.now() + anonExpiryDays * 24 * 60 * 60 * 1000).toISOString();
  }

  try {
    let attempts = 0;
    const maxAttempts = 5;
    let success = false;
    let data = null;

    while (!success && attempts < maxAttempts) {
      // Si no hay slug, generamos uno aleatorio con el largo configurado
      const activeSlug = slug || generateRandomSlug(defaultSlugLength);

      const { data: inserted, error } = await supabase
        .from('urls')
        .insert([{ slug: activeSlug, url: url, user_id: userId, expires_at: expiresAt }])
        .select()
        .single();

      if (error) {
        // Si el error es por clave duplicada (código 23505 en PostgreSQL)
        if (error.code === '23505') {
          if (slug) {
            // Si el usuario eligió un slug personalizado que ya existe
            return res.status(409).json({ success: false, error: 'El slug personalizado ya está en uso.' });
          }
          // Si era aleatorio, reintentamos con otro
          attempts++;
          continue;
        }
        throw error;
      }

      data = inserted;
      success = true;
    }

    if (!success) {
      return res.status(500).json({ success: false, error: 'No se pudo generar un slug único. Inténtelo de nuevo.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        slug: data.slug,
        url: data.url,
        shortUrl: `https://${req.headers.host}/${data.slug}`,
        expiresAt: data.expires_at
      }
    });

  } catch (error) {
    console.error('Error al guardar en base de datos:', error);
    return res.status(500).json({ success: false, error: 'Error interno del servidor al procesar la solicitud.' });
  }
}

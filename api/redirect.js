import { supabase } from './lib/supabase.js';

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.redirect(302, '/');
  }

  try {
    // Buscar la URL original correspondiente al slug
    const { data, error } = await supabase
      .from('urls')
      .select('url, clicks, expires_at')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      // Si no existe el slug, redirigir a la principal con aviso
      return res.redirect(302, '/?error=not-found');
    }

    // Comprobar si ha expirado (enlaces temporales de 30 días)
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return res.redirect(302, '/?error=expired');
    }

    // Incrementar el contador de clics de forma asíncrona (no bloqueante)
    supabase
      .from('urls')
      .update({ clicks: (data.clicks || 0) + 1 })
      .eq('slug', slug)
      .then(({ error: updateError }) => {
        if (updateError) console.error('Error al actualizar el contador de clics:', updateError);
      });

    // Desactivar caché para asegurar que cada clic pase por nuestro servidor
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Redirección HTTP 302
    return res.redirect(302, data.url);

  } catch (error) {
    console.error('Error durante la redirección:', error);
    return res.redirect(302, '/?error=server-error');
  }
}

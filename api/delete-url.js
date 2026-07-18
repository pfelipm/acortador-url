import { supabase } from './lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Método no permitido. Use DELETE.' });
  }

  const { slug } = req.body || req.query || {};

  if (!slug) {
    return res.status(400).json({ success: false, error: 'El parámetro "slug" es requerido.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No autorizado. Se requiere token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Token inválido o expirado.' });
    }

    // Comprobar propiedad antes de borrar (seguridad extra en backend)
    const { data: existing, error: findError } = await supabase
      .from('urls')
      .select('user_id')
      .eq('slug', slug)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ success: false, error: 'El enlace no existe.' });
    }

    if (existing.user_id !== user.id) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para eliminar este enlace.' });
    }

    const { error: deleteError } = await supabase
      .from('urls')
      .delete()
      .eq('slug', slug);

    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true, message: 'Enlace eliminado con éxito.' });

  } catch (error) {
    console.error('Error al eliminar URL:', error);
    return res.status(500).json({ success: false, error: 'Error al eliminar el enlace.' });
  }
}

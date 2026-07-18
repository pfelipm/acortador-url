import 'dotenv/config';
import express from 'express';
import shortenHandler from './api/shorten.js';
import redirectHandler from './api/redirect.js';
import configHandler from './api/config.js';
import myUrlsHandler from './api/my-urls.js';
import deleteUrlHandler from './api/delete-url.js';

const app = express();
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static('public'));

// Endpoints API
app.get('/api/config', configHandler);
app.get('/api/my-urls', myUrlsHandler);
app.delete('/api/delete-url', deleteUrlHandler);
app.post('/api/shorten', shortenHandler);

// Ruta para la redirección dinámica (ej: localhost:3000/slug)
app.get('/:slug', (req, res, next) => {
  // Ignorar peticiones de archivos estáticos (con puntos, ej: favicon.ico, style.css)
  if (req.params.slug.includes('.')) {
    return next();
  }
  // Vercel inyecta el slug en req.query.slug, lo emulamos aquí
  req.query.slug = req.params.slug;
  return redirectHandler(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor local de desarrollo listo!`);
  console.log(`🔗 Abre http://localhost:${PORT} en tu navegador para probar la aplicación.`);
});

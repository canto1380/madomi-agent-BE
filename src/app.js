import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { env } from './config/env.js';
import { getEstadoMongo, isMongoHabilitado } from './mongo/connection.js';

function cabecerasArchivoLocal(res, filePath) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (String(filePath).toLowerCase().endsWith('.pdf')) {
    res.setHeader('Cache-Control', 'private, no-cache');
    return;
  }
  res.setHeader('Cache-Control', 'public, max-age=604800');
}

const app = express();
const origenesDev = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const permitidos = new Set([env.CORS_ORIGIN, ...(env.NODE_ENV !== 'production' ? origenesDev : [])]);
      callback(null, permitidos.has(origin));
    },
    credentials: true,
  }),
);

app.use(express.json());

if (env.STORAGE_DRIVER === 'local') {
  app.use(
    env.STORAGE_PUBLIC_PREFIX,
    express.static(env.STORAGE_LOCAL_DIR, {
      index: false,
      dotfiles: 'deny',
      redirect: false,
      setHeaders: cabecerasArchivoLocal,
    }),
  );
  app.use(env.STORAGE_PUBLIC_PREFIX, (_req, res) => {
    res.status(404).json({
      data: null,
      error: 'NOT_FOUND',
      message: 'Archivo no encontrado',
    });
  });
}

app.get('/health', (_req, res) => {
  res.status(200).json({
    data: {
      status: 'ok',
      postgres: 'ok',
      asistente: isMongoHabilitado(),
      asistenteRuntime: env.ASISTENTE_RUNTIME,
      mongo: getEstadoMongo(),
    },
    error: null,
    message: 'API funcionando',
  });
});

app.use('/api', routes);

app.use(errorMiddleware);

export default app;

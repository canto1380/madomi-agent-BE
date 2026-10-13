import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { env } from './config/env.js';
import { getEstadoMongo, isMongoHabilitado } from './mongo/connection.js';

const app = express();
console.log('cors: ', env.CORS_ORIGIN);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json());

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

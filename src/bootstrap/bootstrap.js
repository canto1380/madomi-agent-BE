import app from '../app.js';
import { env } from '../config/env.js';
import { validarConfigAuth } from '../config/auth.config.js';
import { initializeDatabase } from '../startup/database.js';
import { initializeMongo } from '../startup/mongo.js';
import { isSupabaseConfigured } from '../services/storage.service.js';

export async function bootstrap() {
  console.log('🚀 Iniciando Madomi Landing API...\n');

  validarConfigAuth();

  if (isSupabaseConfigured()) {
    console.log(`📦 Supabase Storage: configurado (bucket: ${env.SUPABASE_STORAGE_BUCKET})`);
  } else {
    console.warn('⚠️  Supabase Storage: no configurado — reiniciá el backend tras editar backend/.env');
  }

  console.log('🗄️  Verificando base de datos...');
  await initializeDatabase();
  console.log('✅ Conexión a DB correcta.\n');

  await initializeMongo();
  console.log('');

  const port = env.PORT;

  app.listen(port, () => {
    console.log(`✅ Servidor escuchando en http://localhost:${port}`);
  });
}

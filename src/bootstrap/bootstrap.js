import app from '../app.js';
import { env } from '../config/env.js';
import { validarConfigAuth } from '../config/auth.config.js';
import { initializeDatabase } from '../startup/database.js';
import { initializeMongo } from '../startup/mongo.js';
import { validarAsistenteProduccion } from '../startup/validarAsistenteProduccion.js';
import { isStorageConfigured, isSupabaseConfigured, prepararStorage } from '../services/storage.service.js';

export async function bootstrap() {
  console.log('🚀 Iniciando Madomi Landing API...\n');

  validarConfigAuth();

  if (env.STORAGE_DRIVER === 'local') {
    if (isStorageConfigured()) {
      await prepararStorage();
      console.log(`📦 Storage local: ${env.STORAGE_LOCAL_DIR}`);
      console.log(`   Público en ${env.STORAGE_PUBLIC_BASE_URL}${env.STORAGE_PUBLIC_PREFIX}/`);
    } else {
      console.warn('⚠️  Storage local: falta STORAGE_PUBLIC_BASE_URL — las subidas van a fallar');
    }
  } else if (isSupabaseConfigured()) {
    console.log(`📦 Supabase Storage: configurado (bucket: ${env.SUPABASE_STORAGE_BUCKET})`);
  } else {
    console.warn('⚠️  Supabase Storage: no configurado — reiniciá el backend tras editar backend/.env');
  }

  console.log('🗄️  Verificando base de datos...');
  await initializeDatabase();
  console.log('✅ Conexión a DB correcta.\n');

  await initializeMongo();
  validarAsistenteProduccion();
  console.log('');

  const port = env.PORT;

  app.listen(port, () => {
    console.log(`✅ Servidor escuchando en http://localhost:${port}`);
  });
}

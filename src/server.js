import { bootstrap } from './bootstrap/bootstrap.js';

bootstrap().catch((error) => {
  console.error('Error durante el inicio de la app:', error);
  process.exit(1);
});

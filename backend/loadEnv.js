// Este módulo DEBE ser el primer import en server.js.
// Los imports de ES modules se evalúan en orden de declaración,
// por lo que este módulo garantiza que process.env esté cargado
// antes de que cualquier otro módulo lea variables de entorno.
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';

const __dir = dirname(fileURLToPath(import.meta.url));

// Prioridad: backend/.env (configuración guardada por el usuario desde la app)
// Fallback: ../.env (raíz del proyecto — configuración inicial)
config({ path: resolve(__dir, '.env') });
config({ path: resolve(__dir, '..', '.env') });

// IMPORTANTE: loadEnv.js debe ser el primer import para que JWT_SECRET y las
// variables SQL estén disponibles cuando los demás módulos se evalúen.
import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from './middleware/auth.js';

const __dir = path.dirname(fileURLToPath(import.meta.url));

// Importar rutas
import auditRoutes from './routes/audit.routes.js';
import authRoutes from './routes/auth.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import usersRoutes from './routes/users.routes.js';
import systemRoutes from './routes/system.routes.js';
import assetsRoutes from './routes/assets.routes.js';
import suppliersRoutes from './routes/suppliers.routes.js';
import filesRoutes from './routes/files.routes.js';
import workOrdersRoutes from './routes/workOrders.routes.js';
import maintenancesRoutes from './routes/maintenances.routes.js';
import maintenancePlansRoutes from './routes/maintenancePlans.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import movementsRoutes from './routes/movements.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import employeesRoutes from './routes/employees.routes.js';
import maintenanceScopesRoutes from './routes/maintenanceScopes.routes.js';
import areasRoutes from './routes/areas.routes.js';
import roomsRoutes from './routes/rooms.routes.js';
import infrastructureRoutes from './routes/infrastructure.routes.js';
import formsRoutes from './routes/forms.routes.js';
import reportsRoutes from './routes/reports.routes.js';

const app = express();

// CORS: solo permite orígenes definidos en el .env
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, cb) => {
    // Permite requests sin Origin (apps móviles, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos subidos (fotos de activos, facturas PDF)
app.use('/uploads', express.static(path.resolve(__dir, 'uploads')));

const PORT = process.env.PORT || 5000;

// ── Rutas públicas (sin token) ──────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Middleware de autenticación — todas las rutas siguientes lo requieren ──
app.use(requireAuth);

// ── Rutas protegidas ────────────────────────────────────────────
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', systemRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/work-orders', workOrdersRoutes);
app.use('/api/maintenances', maintenancesRoutes);
app.use('/api/maintenance-plans', maintenancePlansRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/maintenance-scopes', maintenanceScopesRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/infrastructure', infrastructureRoutes);
app.use('/api/assets', uploadRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/reports', reportsRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SCAF Backend operando en el puerto http://0.0.0.0:${PORT}`);
  console.log('Esperando peticiones del Frontend y dispositivos de red local...');
});

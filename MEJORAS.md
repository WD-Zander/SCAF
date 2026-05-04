# SCAF — Registro de Mejoras Pre-Deploy

Documento generado tras revisión técnica completa del proyecto. Cubre seguridad, escalabilidad, calidad de código y funcionalidad del Dashboard.

---

## 1. Seguridad — Autenticación JWT real en todas las rutas

**Problema:** El backend tenía 44 endpoints completamente públicos. El token JWT se almacenaba en `localStorage` pero nunca se enviaba en ninguna petición. Los roles se validaban usando un header `x-user-role` que el cliente podía falsificar libremente.

**Solución:**
- Creado `backend/middleware/auth.js` con `requireAuth` y `requireRole`.
- `server.js` aplica `requireAuth` globalmente a todas las rutas excepto `POST /api/auth/login`.
- El payload del JWT ahora incluye `{ id, nombre, rol, permisos }`.
- Todos los controllers reemplazaron `req.headers['x-user-role']` por `req.user.rol`.
- `auditLogger.js` ahora obtiene el usuario del token (`req.user`).

**Cómo configurar:**
1. En `backend/.env`, cambia `JWT_SECRET` por una cadena aleatoria larga (mínimo 32 caracteres).
2. Reinicia el backend.

---

## 2. Seguridad — CORS restringido por origen

**Problema:** `app.use(cors())` sin configuración acepta peticiones de cualquier dominio, exponiendo la API a ataques CSRF.

**Solución:**
- CORS configurado en `server.js` para leer orígenes desde `CORS_ORIGINS` en el `.env`.
- Solo se aceptan peticiones de los orígenes listados.

**Cómo configurar:** En `backend/.env`:
```
CORS_ORIGINS=http://localhost:5173,http://tu-dominio-produccion.com
```

---

## 3. Seguridad — Endpoints peligrosos protegidos por rol

**Problema:** `POST /api/factory-reset`, `POST /api/db/save` y `POST /api/db/test` eran accesibles sin autenticación.

**Solución:**
- `system.routes.js` aplica `requireRole('SUPERADMIN')` a `factory-reset` y `db/save`.
- `db/test` requiere al menos `ROL-ADMIN`.
- `PUT /api/settings` requiere `SUPERADMIN` o `ROL-ADMIN`.

---

## 4. Seguridad — Credenciales sin fallback hardcodeado

**Problema:** `db.js` y `auth.controller.js` tenían contraseñas y claves secretas como valores por defecto en el código fuente.

**Solución:**
- Eliminados todos los fallbacks (`|| 'Master6034'`, `|| 'scaf_super_secret_key_2026'`, etc.).
- Si falta una variable de entorno crítica, el servidor falla en arranque de forma explícita.

**Variables requeridas en `backend/.env`:**
```
SQL_SERVER=<IP o hostname del servidor>
SQL_USER=<usuario SQL>
SQL_PASSWORD=<contraseña SQL>
SQL_DATABASE=SCAF_DB
SQL_PORT=1433
JWT_SECRET=<clave aleatoria larga>
PORT=5000
CORS_ORIGINS=http://localhost:5173
```

---

## 5. Frontend — URL del API centralizada

**Problema:** La URL `http://${window.location.hostname}:5000` y `http://localhost:5000` aparecían hardcodeadas en más de 30 lugares en 17 archivos. Cambiar el servidor o puerto requería editar decenas de archivos.

**Solución:**
- Creado `src/api.js` — cliente centralizado que:
  - Lee `VITE_API_BASE_URL` del archivo `.env` del frontend.
  - Agrega automáticamente `Authorization: Bearer <token>` a todas las peticiones.
  - Redirige al login si recibe un 401.
- Creado `.env` en la raíz del proyecto con `VITE_API_BASE_URL=http://localhost:5000`.
- Todos los archivos actualizados para importar `api` desde `../../api` en lugar de usar fetch directo.

**Archivos modificados:**
`AppContext.jsx`, `Login.jsx`, `Topbar.jsx`, `ConfigEmpresa.jsx`, `UsersList.jsx`, `AuditLogs.jsx`, `Files.jsx`, `MaintenanceRoutines.jsx`, `OperatorDailySchedule.jsx`, `ScheduleForm.jsx`, `WorkOrdersList.jsx`, `MaintenanceView.jsx`, `PlanForm.jsx`, `ImportMappings.jsx`, `WorkOrderPlanner.jsx`.

**Cómo configurar para producción:** En `.env` (raíz del proyecto):
```
VITE_API_BASE_URL=http://192.168.1.100:5000
```
Luego ejecutar `npm run build`. El build compilará la URL correcta.

---

## 6. Dashboard — Datos reales en tiempo real

**Problema:** El Dashboard importaba datos estáticos de `mockData.js`. Los 4 KPIs, las alertas y la actividad reciente eran completamente ficticios y nunca cambiaban.

**Solución:**
- Creado `backend/controllers/dashboard.controller.js` con endpoint `GET /api/dashboard`.
- El endpoint devuelve en un solo viaje a la BD:
  - **KPIs:** valor total de adquisición, valor neto estimado, depreciación, total activos, activos en mantenimiento, mantenimientos vencidos, órdenes activas.
  - **Activos por estado:** conteo agrupado por ESTADO para mostrar distribución.
  - **Mantenimientos próximos:** tickets sin completar con fecha de fin en los próximos 15 días.
  - **Actividad reciente:** últimas 10 acciones registradas en la tabla AUDITORIA.
- `Dashboard.jsx` reescrito para consumir este endpoint con estado de carga y manejo de error.
- Eliminada la importación de `mockData.js`.

---

## 7. Escalabilidad — Paginación en endpoints principales

**Problema:** Todos los GETs devolvían todos los registros sin límite. Con miles de activos o millones de logs de auditoría, el servidor se agota de memoria.

**Solución:** Paginación implementada en:
- `GET /api/assets?page=1&limit=50&search=texto`
- `GET /api/audit?page=1&limit=50`

**Formato de respuesta:**
```json
{
  "data": [...],
  "total": 1250,
  "page": 1,
  "pages": 25
}
```

**Nota para el frontend:** Las páginas que consumen estos endpoints deben actualizar el estado para manejar `data` en lugar de esperar el array directamente. `AppContext` aún carga la lista completa al inicio (sin paginación), lo que es aceptable para volumenes pequeños-medianos. Para inventarios muy grandes, se recomienda que cada vista haga su propia petición paginada.

---

## 8. Escalabilidad — Índices SQL

**Problema:** El schema solo tenía primary keys. Las búsquedas más frecuentes (por estado, por categoría, por fecha, filtros con `WHERE BORRADO=0`) hacían full table scans.

**Solución:** Script `Necesarios para instalacion/add_indexes_and_config.sql` con 14 índices:

| Índice | Tabla | Columnas |
|--------|-------|----------|
| `IX_ACTIVOS_BORRADO` | ACTIVOS | BORRADO INCLUDE(NOMBRE, ESTADO, COSTO_ACQ, VALOR_ACT) |
| `IX_ACTIVOS_ESTADO` | ACTIVOS | ESTADO (WHERE BORRADO=0) |
| `IX_ACTIVOS_ID_CAT` | ACTIVOS | ID_CAT (WHERE BORRADO=0) |
| `IX_ACTIVOS_FEC_CREA` | ACTIVOS | FEC_CREA DESC |
| `IX_TICKETS_ID_ACT` | TICKETS | ID_ACT |
| `IX_TICKETS_ESTADO` | TICKETS | ESTADO |
| `IX_TICKETS_FEC_FIN` | TICKETS | FEC_FIN |
| `IX_TICKETS_ID_PLAN` | TICKETS | ID_PLAN |
| `IX_USUARIOS_ID_ROL` | USUARIOS | ID_ROL |
| `IX_AUDITORIA_FECHA` | AUDITORIA | FECHA DESC |
| `IX_AUDITORIA_ENTIDAD` | AUDITORIA | ENTIDAD, FECHA DESC |
| `IX_TAREAS_PLAN_ID_PLAN` | TAREAS_PLAN | ID_PLAN |
| `IX_TAREAS_TICK_ID_TICKET` | TAREAS_TICK | ID_TICKET |
| `IX_ORDENES_ESTADO` | ORDENES_TRAB | ESTADO |

**Cómo aplicar:** Ejecutar `add_indexes_and_config.sql` en SQL Server Management Studio sobre `SCAF_DB`.

---

## 9. Configurabilidad — Extensión de CONFIG_EMP

**Problema:** El sistema tenía poca configuración accesible desde la UI. El usuario tenía que modificar código o archivos internos para cambiar comportamientos básicos.

**Solución:** Nuevas columnas en `CONFIG_EMP` (incluidas en `add_indexes_and_config.sql`):

| Columna | Tipo | Defecto | Descripción |
|---------|------|---------|-------------|
| `DIAS_ALERTA_MANT` | INT | 15 | Días de anticipación para alertas de mantenimiento |
| `ITEMS_POR_PAGINA` | INT | 50 | Registros por página en listados |
| `MONEDA_SIMBOLO` | VARCHAR(10) | `$` | Símbolo monetario para mostrar en la UI |
| `PERMITIR_BORRADO` | BIT | 1 | Si los gestores pueden eliminar registros |

Estos campos se exponen en `GET /api/settings` y se guardan con `PUT /api/settings`.

---

## 10. Nuevos archivos creados

| Archivo | Descripción |
|---------|-------------|
| `backend/middleware/auth.js` | Middleware JWT: `requireAuth` y `requireRole` |
| `backend/controllers/dashboard.controller.js` | Estadísticas reales para el Dashboard |
| `backend/routes/dashboard.routes.js` | Ruta `GET /api/dashboard` |
| `src/api.js` | Cliente HTTP centralizado con JWT automático |
| `.env` | Variables de entorno del frontend (Vite) |
| `Necesarios para instalacion/add_indexes_and_config.sql` | Índices SQL y extensión de CONFIG_EMP |

---

## Guía de deploy rápido

### 1. Configurar variables de entorno

**`backend/.env`** — completar con los datos reales:
```env
SQL_SERVER=<IP del servidor SQL>
SQL_USER=<usuario>
SQL_PASSWORD=<contraseña>
SQL_DATABASE=SCAF_DB
SQL_PORT=1433
JWT_SECRET=<genera una clave aleatoria larga aquí>
PORT=5000
CORS_ORIGINS=http://<IP-del-servidor>:4173,http://localhost:5173
```

**`.env`** (raíz del proyecto) — para el build del frontend:
```env
VITE_API_BASE_URL=http://<IP-del-servidor>:5000
```

### 2. Aplicar SQL

En SQL Server Management Studio, ejecutar en orden:
1. `scaf_optimized_schema_v2.sql` (si es instalación nueva)
2. `add_indexes_and_config.sql` (siempre — es idempotente)

### 3. Compilar el frontend

```bash
npm run build
```

### 4. Iniciar el sistema

```bash
# Backend
node backend/server.js

# Frontend (desde la carpeta dist compilada)
npx serve dist --listen 4173
```

O usar `INICIAR_APP_MOVIL.bat` que hace ambos pasos automáticamente.

---

## Pendientes recomendados (siguiente fase)

| Mejora | Impacto | Complejidad |
|--------|---------|-------------|
| Actualizar `AuditLogs.jsx` para manejar respuesta paginada `{data, total, pages}` | Alto | Bajo |
| Agregar controles de paginación en `InventoryList.jsx` | Alto | Medio |
| Transacciones SQL en creación de tickets con tareas | Alto | Medio |
| Reemplazar IDs `Date.now()+random` por UUID en todos los controllers | Medio | Bajo |
| Configurar `encrypt: true` en `db.js` para conexión TLS con SQL Server | Alto | Bajo |
| Agregar controles UI en `ConfigEmpresa` para los nuevos campos (`AlertDays`, `ItemsPerPage`) | Medio | Bajo |
| Rate limiting en el API (paquete `express-rate-limit`) | Alto | Bajo |
| Crear `.env.example` sin valores reales para documentar variables requeridas | Bajo | Mínimo |

# SCAF - Guia Rapida de Instalacion

## Requisitos
- Node.js v18+ (https://nodejs.org)
- SQL Server 2019+ (Express Edition sirve)
- SQL Server Management Studio (SSMS)

## Pasos

### 1. Base de Datos
1. Abrir SSMS y conectarse al servidor
2. Abrir `SCAF_SCHEMA_COMPLETO.sql` y ejecutar (F5)
3. Verificar que la BD `SCAF` fue creada

### 2. Configurar Conexion
Crear archivo `backend/.env`:
```
SQL_SERVER=localhost
SQL_USER=sa
SQL_PASSWORD=TU_PASSWORD
SQL_DATABASE=SCAF
SQL_PORT=1433
JWT_SECRET=clave_secreta_aleatoria_min_32_caracteres
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Crear Usuario Admin
```bash
cd backend
node create-superadmin.js
```
Credenciales: `admin` / `Admin2026`

### 5. Iniciar
**Desarrollo:**
```bash
npm start          # Backend (puerto 5000)
npm run dev        # Frontend (puerto 5173)
```

**Produccion (Windows):**
Doble clic en `SCAF_INIT.bat`

### 6. Acceder
- Local: http://localhost:5173
- Red: http://TU_IP:4173 (produccion)

## Estructura de archivos necesarios
```
Proyecto/
├── backend/          # Servidor (no borrar)
├── src/              # Frontend (no borrar)
├── public/           # Assets estaticos
├── package.json      # Dependencias
├── vite.config.js    # Config build
├── index.html        # HTML raiz
└── SCAF_INIT.bat     # Inicio rapido Windows
```

## Archivos que NO se deben incluir en la copia
- `node_modules/` (se regenera con `npm install`)
- `dist/` (se regenera con `npm run build`)
- `backend/.env` (contiene credenciales, crear manualmente)
- `backend/uploads/` (fotos/facturas del entorno anterior)

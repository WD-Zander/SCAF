# SCAF - Sistema de Control y Administración de Flotas / Activos
**Dossier de Presentación Comercial y Técnica**

---

## 1. ¿Qué es SCAF y por qué es vital para su empresa?
En la era industrial moderna, la pérdida de información, la mala programación de mantenimientos y la falta de trazabilidad cuestan miles de dólares anuales en maquinaria detenida y penalizaciones por incumplimiento (como ISO 9001 o auditorías de seguridad).

**SCAF** no es solo un software de inventario; es un **cerebro operativo** diseñado para:
1. **Prevenir en lugar de Apagar Incendios**: Automatiza la programación de mantenimientos (mensuales, semestrales, etc.) evitando que las máquinas lleguen al fallo crítico.
2. **Blindar la Auditoría**: Cada acción (desde registrar una tuerca hasta cancelar un ticket) queda grabada con fecha, hora y usuario. Cumplir con las normas ISO ahora es automático.
3. **Control Financiero**: Rastrea cuánto costó comprar la máquina y cuánto se ha gastado en mantenerla, permitiendo calcular su depreciación real.

### ¿Qué nos hace diferentes de la competencia?
- **Interfaz "Glassmorphism" Ultra Moderna**: A diferencia de los sistemas ERP grises y aburridos de los años 90 (como SAP básico o Maximo antiguo), SCAF está diseñado con principios de UI/UX de 2026. Es tan intuitivo que los operadores no necesitan semanas de capacitación.
- **Arquitectura de Cero Pérdida de Datos (Soft-Delete)**: Ningún registro crítico se borra físicamente. Si alguien "elimina" un mantenimiento, el sistema lo archiva para los auditores, asegurando transparencia absoluta.
- **Despliegue Local o Nube (Híbrido)**: Funciona perfectamente en la intranet de una fábrica sin internet, o conectado a la nube para acceso gerencial mundial.

---

## 2. Recorrido por los Módulos Principales (Demo Recomendada)

### A. Dashboard (Centro de Mando)
- **Qué mostrar:** La vista inicial del gerente.
- **Ejemplo en Vivo:** Muestra las tarjetas superiores con el total de activos y las alertas circulares.
- **Pitch de Ventas:** *"Aquí, en 3 segundos, el Director de Planta sabe exactamente si la fábrica está sana o si hay máquinas en peligro de fallo."*

### B. Inventario Inteligente (Activos y Códigos QR)
- **Qué mostrar:** La tabla de activos y el generador de Códigos QR.
- **Ejemplo en Vivo:** Selecciona un activo (ej. Compresor Atlas Copco) y dale clic al botón de "Código QR". Simula cómo un técnico escanea ese código en planta con su celular y le abre la hoja de vida de la máquina.
- **Pitch de Ventas:** *"Se acabaron las carpetas de papel manchadas de aceite. El técnico escanea la máquina y SCAF le dice qué le duele y cuándo fue su última revisión."*

### C. Mantenimientos (El Corazón de SCAF)
Este módulo se divide en 3 áreas clave para la demo:
1. **Programación (Rutinas):** 
   - **Ejemplo:** Muestra cómo se crea un "Plan Anual de Lubricación" y se le asigna a 10 máquinas a la vez. 
2. **Mi Agenda Diaria (Para el Operador):**
   - **Ejemplo:** Entra como técnico. Muestra cómo SCAF le agrupa sus tareas del día sin confundirlo con configuraciones complejas. El técnico solo hace clic en "Completar Tarea".
3. **Planes en Marcha (Work Orders):**
   - **Ejemplo:** Muestra las barras de progreso.
   - **Pitch de Ventas:** *"El supervisor no tiene que ir máquina por máquina preguntando cómo van. La barra verde le dice que el mantenimiento preventivo mensual ya va al 80%."*

### D. Seguridad y Auditoría (Protección de Datos)
- **Qué mostrar:** El módulo de Auditoría y el panel de Usuarios.
- **Ejemplo en Vivo:** Muestra la lista de logs (Auditoría) donde dice "El usuario X actualizó el activo Y". Luego, intenta eliminar un Activo que ya tenga mantenimientos completados; deja que el sistema te lance la pantalla roja de advertencia.
- **Pitch de Ventas:** *"SCAF protege a la empresa incluso de errores humanos internos. Si una máquina ya tiene historial, el sistema no permite que un operador la borre por accidente. Esto es garantía ISO 9001 automática."*

### E. Configuración de Empresa (Puesta en Marcha)
- **Qué mostrar:** La zona de personalización y la conexión SQL.
- **Ejemplo en Vivo:** Muestra el botón rojo de "Inicializar Software a 0".
- **Pitch de Ventas:** *"El sistema se entrega listo para usar. Hacemos las pruebas que usted guste con datos falsos (Demo), y cuando esté convencido, apretamos este botón rojo. El sistema se limpia por completo en 1 segundo y queda virgen, listo para empezar a facturar y registrar su empresa real."*

---

## 3. Próximos Pasos para Producción (Roadmap Técnico)

Para llevar este proyecto a nivel empresarial (Venta Final), se recomienda la siguiente estructura:

1. **Empaquetado Completo (.exe)**
   - Utilizaremos tecnologías como `Electron.js` o scripts `PowerShell` avanzados para empaquetar el servidor de Node y el frontend de React en un solo instalador `.exe`.
   - El cliente solo dará "Siguiente -> Siguiente" y el sistema instalará la base de datos SQL, conectará los puertos y abrirá el navegador automáticamente.

2. **Organización de Carpetas (Entregable Final)**
   - Se entregará una carpeta llamada `Necesarios para instalacion/` que contendrá el script final de SQL (`scaf_optimized_schema_v2.sql`), los manuales en PDF y el instalador maestro.

SCAF no es un gasto, es un seguro de vida para la maquinaria de la empresa.

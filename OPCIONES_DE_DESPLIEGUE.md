# Opciones de Despliegue (Hosting Gratuito) para SCAF

Dado el stack tecnológico del proyecto (Frontend en **React/Vite**, Backend en **Node.js/Express**, y Base de Datos **Microsoft SQL Server**), poner todo en línea de manera 100% gratuita tiene un pequeño reto: **SQL Server casi nunca es gratis en la nube** debido a las licencias de Microsoft (a diferencia de MySQL o PostgreSQL).

Sin embargo, aquí tienes las **3 mejores opciones** para tener tu demo funcional sin gastar un centavo ahora mismo.

---

## Opción 1: Arquitectura 100% Cloud (Recomendado para Demo 24/7)

En esta opción, subirás cada pieza a un servicio gratuito diferente. El sistema estará siempre disponible para que el cliente lo pruebe a cualquier hora.

### 1. Frontend (React/Vite) ➡️ Vercel o Netlify (Gratis para siempre)
*   **Vercel (Recomendado):** Es la mejor plataforma para React. Solo tienes que subir tu código a GitHub, conectar tu cuenta de GitHub a Vercel, y automáticamente construirá y publicará tu página con un dominio seguro (ej. `scaf-demo.vercel.app`).
*   **Qué debes cambiar:** En el frontend, deberás cambiar la variable de entorno `VITE_API_BASE_URL` para que apunte a la URL de tu backend en la nube.

### 2. Backend (Node.js) ➡️ Render.com o Koyeb (Gratis)
*   **Render:** Ofrece un "Web Service" gratuito para Node.js. Conectas tu GitHub y se despliega solo.
*   **Consideración:** En la capa gratuita, si la API no recibe peticiones durante 15 minutos, se "duerme". Cuando el cliente intente entrar, la primera petición tardará unos 30-50 segundos en despertar el servidor. Después de eso, funcionará rápido.
*   **Qué debes cambiar:** Configurar las variables de entorno (`SQL_SERVER`, `SQL_USER`, `JWT_SECRET`, etc.) en el panel de control de Render.

### 3. Base de Datos (SQL Server) ➡️ Amazon RDS (AWS) o Somee.com
*   **AWS RDS (Gratis por 12 meses):** Amazon ofrece una capa gratuita (Free Tier) que incluye SQL Server Express Edition (750 horas al mes, es decir, 24/7). Es la mejor opción a nivel de rendimiento. Tendrás que crear una cuenta en AWS (piden tarjeta, pero no cobran si te mantienes en el nivel gratuito).
*   **Somee.com (Gratis para siempre):** Es un servicio de hosting que ofrece bases de datos SQL Server gratis de hasta 15MB. Es muy poco espacio, pero para una demo con datos de prueba, es más que suficiente.

---

## Opción 2: Híbrido (Nube + DB Local) - La más rápida de implementar

Si migrar la base de datos a AWS o Somee es muy tedioso, puedes mantener **tu propia base de datos SQL Server en tu computadora local** y conectar la nube a ella.

1.  **Frontend:** Se sube a Vercel (Gratis).
2.  **Backend:** Se sube a Render (Gratis).
3.  **Base de Datos:** Se queda en tu PC (la que actualmente tiene la IP `100.67.97.89`).
    *   **¿Cómo se conecta el backend?** Instalas una herramienta gratuita llamada **Ngrok** o **Cloudflare Tunnels (Zero Trust)** en tu PC. Esto crea un "túnel" seguro hacia tu SQL Server (puerto 1433) y te da una URL pública.
    *   En Render, configuras la variable `SQL_SERVER` con la URL que te dio Ngrok.
*   *Condición:* Tu PC debe estar encendida para que el sistema funcione.

---

## Opción 3: Exponer toda tu máquina local (Túneles) - Cero configuraciones en la Nube

Si tienes una reunión hoy mismo o el cliente solo va a probarlo unas horas mientras tú estás supervisando, **no subas nada a la nube.**

Puedes usar **Cloudflare Tunnels** (completamente gratis y seguro) o **Ngrok** para crear URLs públicas de los puertos que ya estás corriendo en tu computadora.

**Pasos:**
1.  Corres tu backend en tu PC (`npm run dev` en el puerto 5000).
2.  Corres tu frontend en tu PC (`npm run dev` en el puerto 5173).
3.  Abres un túnel hacia tu frontend (Ej. `ngrok http 5173`). Ngrok te dará un link como `https://scaf-demo.ngrok-free.app`.
4.  Abres un túnel hacia tu backend (Ej. `ngrok http 5000`).
5.  Actualizas el `.env` de tu frontend para que apunte a la URL pública del backend.
6.  Le envías el link del Frontend al cliente. Todo correrá usando el poder de tu PC, pero será accesible desde cualquier parte del mundo.

---

## Resumen del Plan de Acción (Mi sugerencia para una demo seria)

Si quieres dejarle el sistema al cliente unos días para que juegue con él sin depender de tu computadora encendida:

1. Crea una cuenta en **Somee.com** y migra la estructura de tu BD (`SCAF_DB`) usando un script SQL.
2. Sube el código fuente a un repositorio privado de **GitHub**.
3. Entra a **Render.com**, conecta el repo de GitHub y despliega la carpeta `backend`. (Coloca los datos de Somee en las variables de entorno).
4. Entra a **Vercel.com**, conecta el mismo repo de GitHub, elige la carpeta frontend, pon la URL de Render como `VITE_API_BASE_URL` y despliega.

¡Cualquiera de estas opciones te permitirá mostrar tu software sin tener que pagar servidores costosos!

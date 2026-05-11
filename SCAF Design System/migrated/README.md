# SCAF Migrated — listo para `WD-Zander/scaf_demo`

Esta carpeta contiene archivos **listos para arrastrar a tu repo** `scaf_demo`. Componentes ya convertidos a:

- `lucide-react` (ya está en tu `package.json`)
- ES modules (`import` / `export default`)
- Hook `useIsMobile()` para responsividad
- Tokens CSS centralizados en `src/styles/tokens.css`

## Estructura

```
migrated/
├── public/
│   └── favicon.svg                            ← reemplaza el favicon de Vite
├── src/
│   ├── styles/
│   │   └── tokens.css                         ← variables CSS (light + dark)
│   ├── assets/brand/
│   │   ├── wordmark.svg
│   │   └── wordmark-dark.svg
│   ├── hooks/
│   │   └── useIsMobile.js
│   ├── components/UI/
│   │   ├── Button.jsx
│   │   ├── Badge.jsx
│   │   ├── Card.jsx
│   │   ├── Field.jsx
│   │   └── index.js
│   ├── components/Layout/
│   │   ├── Sidebar.jsx                       ← reemplaza el actual (lucide-react + secciones)
│   │   ├── Topbar.jsx                        ← popovers de búsqueda y notificaciones
│   │   ├── MobileBottomNav.jsx               ← FAB central + badges
│   │   └── Layout.css                        ← drop-in para el Layout.css existente
│   └── pages/
│       ├── Dashboard/Dashboard.jsx           ← reemplaza el actual
│       ├── Inventory/InventoryList.jsx       ← reemplaza el actual
│       ├── Maintenance/OperatorDailySchedule.jsx  ← reemplaza el actual
│       └── Audit/AuditLogs.jsx               ← reemplaza el actual
```

## Cómo aplicarlo (3 pasos)

```bash
# 1. desde la raíz de scaf_demo
git checkout -b feat/design-system-v2

# 2. copia los archivos (preserva la estructura)
cp -r design-system/migrated/public/*  public/
cp -r design-system/migrated/src/*     src/

# 3. en src/main.jsx (o donde importas estilos), añade ARRIBA de index.css:
#    import './styles/tokens.css';
```

Eso es todo. Tras `pnpm dev` deberías ver:

- ✅ Dashboard con KPIs en grid 2-up en móvil, 4-up en desktop.
- ✅ Inventario alterna entre tabla (≥ 769px) y cards (≤ 768px) sin CSS magic.
- ✅ Mi Agenda con tarjeta destacada para la tarea "en curso".
- ✅ Botones, badges, cards y campos centralizados — borrar estilos inline duplicados de tu código viejo.

## Migrar más páginas

Sigue el mismo patrón:

1. `import { Button, Badge, Card, Field } from '@/components/UI'`
2. `import { Wrench, Plus, ... } from 'lucide-react'`
3. `const isMobile = useIsMobile();` y branchea el JSX donde haga falta.
4. Usa los tokens (`var(--accent-primary)`, `var(--success)`, etc.) en lugar de hex literales.

## Riesgos conocidos

- Si tu `lucide-react` está en `^1.8.0`, algunos íconos de este kit (`CalendarClock`, `CirclePlus`) requieren `^0.300.0+`. Ejecuta `pnpm up lucide-react@latest`.
- `tokens.css` define `:root` y puede colisionar con variables de tu `index.css` actual. Importa `tokens.css` **antes** de `index.css` para que tus overrides ganen, o limpia los duplicados de `index.css`.
- Tus selectores existentes (`.glass-panel`, `.eyebrow`, `.code-font`) siguen funcionando — `tokens.css` los mantiene.

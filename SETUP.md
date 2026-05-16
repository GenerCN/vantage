# Setup del Proyecto - Vantage CRUD

## 📋 Pasos para clonar y configurar

### 1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd vantage
```

### 2. Instalar dependencias
```bash
pnpm install
```

### 3. Configurar variables de entorno

- Copia el archivo `.env.example` y renómbralo a `.env.local`
- Obtén las credenciales de Supabase del responsable del proyecto:
  - `EXPO_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase
  - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Clave pública del proyecto
- Pega estas credenciales en tu `.env.local`

**Importante:** `.env.local` nunca se sube a git, es personal para cada miembro del equipo.

### 4. Ejecutar la aplicación

```bash
pnpm start
```

Luego selecciona tu plataforma (iOS, Android o web).

---

## 📁 Estructura del proyecto

```
vantage/
├── app/                      # Pantallas y navegación
│   ├── (tabs)/
│   │   ├── productos.tsx     # CRUD de productos (CREATE, READ, UPDATE, DELETE)
│   │   ├── home.tsx
│   │   ├── Movimientos.tsx
│   │   ├── profile.tsx
│   │   └── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   └── _layout.tsx
├── components/               # Componentes reutilizables
├── services/                 # Lógica de negocio
│   └── productosService.ts   # CRUD + sincronización con Supabase
├── lib/                      # Utilidades
│   ├── supabase.ts          # Cliente de Supabase
│   ├── database.ts          # SQLite local
│   └── sqlite/
│       └── productosDb.ts   # Operaciones de BD local
├── hooks/                    # Custom hooks
│   └── useNetworkState.ts   # Monitoreo de conexión
├── styles/                   # Estilos personalizados
├── .env.example             # Template de variables (compartir)
├── .env.local               # Variables reales (NO compartir)
├── .gitignore               # Archivos ignorados
└── package.json
```

---

## 🔄 Características implementadas

### ✅ CRUD Completo de Productos
- **CREATE**: Agregar nuevos productos
- **READ**: Listar y buscar productos
- **UPDATE**: Editar productos existentes
- **DELETE**: Eliminar productos

### ✅ Sincronización Offline-First
- Los cambios se guardan primero en SQLite (funciona offline)
- Se sincronizan automáticamente con Supabase cuando hay conexión
- Si pierdes conexión, los cambios se guardan en una cola y se sincronizan después

### ✅ Tecnologías utilizadas
- **React Native + Expo**: Framework mobile
- **TypeScript**: Tipado estricto
- **SQLite**: Base de datos local (offline)
- **Supabase**: Base de datos en la nube
- **react-native-netinfo**: Detección de conexión

---

## 🚀 Flujo de trabajo para el equipo

### Traer cambios del repositorio
```bash
git pull origin main
pnpm install  # Si hay nuevas dependencias
```

### Subir tus cambios
```bash
git add .
git commit -m "Descripción de los cambios"
git push origin <tu-rama>
```

---

## ⚙️ Configuración de Supabase

**Solo el responsable necesita hacer esto.** El resto del equipo usa las credenciales proporcionadas.

### Usuarios autorizados para configurar Supabase:
- Tu nombre/usuario del proyecto

### Qué está configurado:
- Tabla `productos` con columnas: id, nombre, peso_individual_gramos, stock_minimo, creado_en
- Tabla `sync_queue` para manejar cambios offline
- RLS (Row Level Security) configurado para permitir operaciones CRUD públicas

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@/lib/supabase'"
- Reinicia el TypeScript server: Ctrl+Shift+P → "Restart TypeScript Server"
- O reinicia VS Code completamente

### La app no se conecta a Supabase
- Verifica que `.env.local` tiene las credenciales correctas
- Verifica que tienes conexión a internet
- Revisa la consola de Expo para errores

### SQLite no está guardando datos
- En desarrollo, usa `pnpm start` en lugar de construir
- SQLite solo funciona en simuladores iOS/Android, no en web

### Los datos no sincronizamos con Supabase
- Verifica que tienes conexión a internet
- Revisa la consola para mensajes de sincronización
- Si estás offline, los cambios se sincronizarán cuando vuelva la conexión

---

## 📞 Contacto

Para preguntas o problemas, contacta al responsable del proyecto o consulta los logs de la app.

---

## ✨ Próximas mejoras
- [ ] Agregar autenticación de usuarios
- [ ] Sistema de roles y permisos
- [ ] Histórico de movimientos
- [ ] Reportes de inventario

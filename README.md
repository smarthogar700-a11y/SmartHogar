# VIP MLM Platform

Plataforma web MLM con diseño futurista premium (oscuro + dorado).

## Stack Tecnológico

- **Frontend**: Next.js 14+ (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Base de datos**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Autenticación**: JWT
- **Almacenamiento**: Supabase Storage

## Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase

## Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Ya existe `.env.local` con las credenciales configuradas. Para producción, copia `.env.example` y actualiza:

```bash
DATABASE_URL="tu_url_de_postgres"
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_anon_key
JWT_SECRET=tu_secret_seguro
```

### 3. Configurar Supabase Storage

1. Ve a tu proyecto en Supabase
2. Navega a Storage
3. Crea un bucket llamado `receipts`
4. Haz el bucket público (Settings → Public bucket: ON)

### 4. Configurar Base de Datos

```bash
# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Poblar datos iniciales (VIP packages, bonus rules, banners)
npm run prisma:seed
```

### 5. Crear usuario administrador

Después de correr las migraciones, necesitas crear un usuario admin manualmente:

```bash
npx prisma studio
```

1. Abre la tabla `User`
2. Crea un nuevo registro con:
   - `role`: ADMIN
   - `user_code`: único (ej: ADMIN001)
   - `username`: admin
   - `email`: admin@vip.com
   - `password_hash`: usa bcrypt para hashear una contraseña
   - `full_name`: Administrador

O registra un usuario normal vía `/signup` y luego cambia su rol a ADMIN en Prisma Studio.

## Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
appruben/
├── prisma/
│   ├── schema.prisma       # Esquema de base de datos
│   └── seed.ts             # Datos iniciales
├── src/
│   ├── app/
│   │   ├── (pages)         # Páginas públicas y protegidas
│   │   └── api/            # API endpoints
│   ├── components/
│   │   └── ui/             # Componentes reutilizables
│   └── lib/
│       ├── auth/           # Autenticación y JWT
│       ├── db.ts           # Cliente Prisma
│       └── supabaseClient.ts
├── .env.local              # Variables de entorno
└── README.md
```

## Funcionalidades Principales

### Usuario Normal

- **Registro**: Con código de patrocinador opcional
- **Login**: Username o email + contraseña
- **Dashboard**: Ganancias, bonos, red de referidos
- **Paquetes VIP**: Ver y comprar paquetes (1-7)
- **Compras**: Subir comprobante de pago
- **Retiros**: Solicitar retiro con QR de destino
- **Historial**: Ver compras realizadas

### Administrador

- **Compras Pendientes**: Aprobar/rechazar con visualización de comprobante
- **Retiros Pendientes**: Pagar/rechazar retiros
- **Ganancias Diarias**: Ejecutar proceso manual para asignar ganancias diarias

## Sistema de Bonos

Al aprobar una compra, se pagan bonos automáticamente:

- **Nivel 1** (patrocinador directo): 12%
- **Nivel 2**: 5%
- **Nivel 3**: 1%

## Paquetes VIP

| Nivel | Inversión | Ganancia Diaria | Porcentaje |
|-------|-----------|-----------------|------------|
| VIP 1 | Bs 100    | Bs 4            | 4%         |
| VIP 2 | Bs 300    | Bs 10           | 3.33%      |
| VIP 3 | Bs 500    | Bs 17           | 3.4%       |
| VIP 4 | Bs 1000   | Bs 35           | 3.5%       |
| VIP 5 | Bs 2000   | Bs 70           | 3.5%       |
| VIP 6 | Bs 3000   | Bs 105          | 3.5%       |
| VIP 7 | Bs 4000   | Bs 135          | 3.375%     |

## Reglas de Negocio

- **1 VIP activo por usuario**: Solo se puede tener un paquete activo a la vez
- **Ganancias diarias**: Se ejecutan manualmente por admin cada 24h
- **Cálculos en backend**: Todas las operaciones financieras se procesan en el servidor
- **Retiros**: Requieren saldo suficiente y aprobación del admin

## API Endpoints

### Públicos
- `POST /api/auth/signup` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Recuperar contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña
- `GET /api/packages` - Listar paquetes VIP

### Protegidos (requieren JWT)
- `GET /api/dashboard` - Dashboard del usuario
- `GET /api/packages/[id]` - Detalle de paquete
- `POST /api/purchases` - Crear compra
- `GET /api/purchases/my` - Mis compras
- `GET /api/withdrawals` - Mis retiros
- `POST /api/withdrawals` - Solicitar retiro
- `POST /api/upload` - Subir archivo

### Admin (requieren rol ADMIN)
- `GET /api/admin/purchases` - Compras pendientes
- `POST /api/admin/purchases/[id]/approve` - Aprobar compra
- `POST /api/admin/purchases/[id]/reject` - Rechazar compra
- `GET /api/admin/withdrawals` - Retiros pendientes
- `POST /api/admin/withdrawals/[id]/pay` - Marcar retiro como pagado
- `POST /api/admin/withdrawals/[id]/reject` - Rechazar retiro
- `POST /api/admin/run-daily-profit` - Ejecutar ganancias diarias

## Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build para producción
npm run start        # Ejecutar producción
npm run lint         # Linter

npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:seed      # Poblar datos iniciales
npm run prisma:studio    # Abrir Prisma Studio
```

## Diseño

### Tipografía: Montserrat
- **Títulos/números**: 700 (bold)
- **Subtítulos**: 300 (light) uppercase con letter-spacing
- **Textos UI**: 500 (medium)
- **Párrafos**: 400 (regular)

### Colores
- `#0B0B0B` - Fondo principal
- `#2B2B2B` - Cards
- `#C9A24D` - Dorado principal
- `#E6C87A` - Dorado brillo
- `#FFFFFF` - Texto principal
- `#D9D9D9` - Texto secundario
- `#5A4A2F` - Sombra cálida

### Estilos
- **Glassmorphism** en cards
- **Glow dorado** en botones y números importantes
- **Rounded**: 16px cards, 14px inputs/botones
- **Bottom Nav fija**: Siempre visible, no se mueve

## Producción

1. Configura las variables de entorno en tu servicio de hosting
2. Ejecuta `npm run build`
3. Configura un cron job para ejecutar `/api/admin/run-daily-profit` cada 24h
4. Asegúrate de que el bucket de Supabase Storage esté correctamente configurado

## Soporte

Para problemas o preguntas, revisa la documentación de:
- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [Supabase](https://supabase.com/docs)
- [TailwindCSS](https://tailwindcss.com/docs)

---

**Desarrollado con Next.js 14, Prisma, Supabase y TailwindCSS**

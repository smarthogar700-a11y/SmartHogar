# Funcionamiento y logica del sistema ULTRON

Este documento describe en detalle la logica funcional, los flujos principales y los puntos criticos del sistema.

## 1) Arquitectura general
- Frontend y backend en Next.js (App Router).
- API interna con rutas `/api/**`.
- Base de datos Postgres (Supabase) usando Prisma.
- Storage de comprobantes en Supabase (bucket `receipts`).
- Autenticacion con JWT.

## 2) Autenticacion y sesiones
- Token JWT generado en login y guardado en cookie `auth_token`.
- Cada request protegido usa `Authorization: Bearer <token>` o cookie.
- Si el token falta o es invalido, el backend responde 401.
- Si el usuario no es admin, responde 403 en endpoints admin.

## 3) Roles
- `USER`: acceso a home, paks, tabla, retiros, mis compras.
- `ADMIN`: acceso a panel admin y endpoints administrativos.
- El middleware bloquea rutas de usuario si no hay sesion.

## 4) Registro de usuarios
- Campos requeridos: nombre, usuario, email, password.
- Se genera `user_code` unico por usuario.
- Si el registro viene con `sponsor_code`, se asigna `sponsor_id`.
- El link de referido es `.../signup?ref=CODIGO`.

## 5) Paquetes VIP
- Cada paquete se guarda en `VipPackage`.
- Atributos clave:
  - `investment_bs`: inversion
  - `daily_profit_bs`: ganancia diaria
  - `is_enabled`: habilitado/deshabilitado
  - `qr_image_url`: QR global (configuracion admin)
- El usuario puede comprar cualquier VIP, pero no puede repetir el mismo nivel.

## 6) Flujo de compra
- Usuario elige VIP y sube comprobante.
- Se sube el comprobante a Storage, se guarda `receipt_url`.
- Se crea `Purchase` con estado **ACTIVE**.
- Se registran `activated_at` y `last_profit_at`.
- Se ejecuta el pago de bonos de patrocinio en ese momento.

## 7) Bonos de patrocinio
- Se aplican por niveles (1 a 7).
- Cada nivel usa el porcentaje de `ReferralBonusRule`.
- Se registra en `WalletLedger` con tipo `REFERRAL_BONUS`.
- Si un pak activo se desactiva o elimina, se crea un ledger negativo para revertir esos bonos.

## 8) Ganancias diarias
- Las ganancias diarias se calculan sobre compras **ACTIVAS**.
- Se crea ledger `DAILY_PROFIT` y se suma a `total_earned_bs`.
- Hay dos formas de ejecutar:
  - Manual desde panel admin.
  - Cron externo (Supabase cron recomendado).
- Se evita repetir el mismo dia con `DailyProfitRun`.

## 9) Ledger y saldos
- El saldo disponible se calcula sumando todo `WalletLedger`.
- Tipos principales:
  - `DAILY_PROFIT`: ganancia diaria
  - `REFERRAL_BONUS`: bono de referido
  - `WITHDRAW_REQUEST`: retiro solicitado (monto negativo)
  - `WITHDRAW_REJECT`: retiro rechazado (monto positivo)
  - `ADJUSTMENT`: ajustes manuales y reversos
- Todo saldo visible en home y retiros proviene del ledger.

## 10) Retiros
- El usuario solicita retiro con:
  - Banco, numero de cuenta, metodo, telefono.
- Se crea `Withdrawal` en PENDING y un ledger negativo.
- Admin puede:
  - Marcar como pagado (solo cambia estado).
  - Rechazar (crea ledger positivo y devuelve saldo).

## 11) Panel admin (modulos)
- **Billetera**
  - Lista compras y muestra comprobantes.
  - Permite activar/desactivar/eliminar compras.
  - Total de inversiones sumadas solo usa compras ACTIVAS.
- **Activos**
  - Muestra usuarios con compras y paquetes activos.
  - Incluye buscador.
- **Retiros**
  - Lista solicitudes con todos los datos.
  - Botones para pagar o rechazar.
- **Ajustes**
  - Agrega o quita saldo directo (ledger ADJUSTMENT).
- **Configuracion**
  - Ajuste de paquetes VIP, bonos, QR global.
- **Noticias**
  - Publica un anuncio visible en home.
  - Si se crea una nueva, se elimina la anterior automaticamente.

## 12) Comprobantes
- Se guardan en Storage `receipts`.
- Si Storage falla, se devuelve un placeholder.
- Al desactivar o eliminar compra activa:
  - Se limpia el URL en la compra.
  - Se intenta borrar el archivo usando `SUPABASE_SERVICE_ROLE_KEY`.

## 13) Home (dashboard)
- Carga datos desde `/api/dashboard`.
- Usa cache corto (8s) para reducir carga.
- Muestra:
  - Ganancia diaria total.
  - Lista de VIP activos.
  - Bonos de patrocinio (total y por nivel).
  - Ganancias totales (ledger).
  - Red de referidos.

## 14) Endpoints principales
- `/api/purchases`: crea compra activa.
- `/api/upload`: sube comprobante.
- `/api/dashboard`: datos para home.
- `/api/admin/purchases`: lista compras + total activo.
- `/api/admin/purchases/[id]/approve`: activa y paga bonos.
- `/api/admin/purchases/[id]/reject`: desactiva y revierte.
- `/api/admin/purchases/[id]/delete`: elimina y revierte.
- `/api/cron/daily-profit`: cron externo de ganancias.

## 15) Variables de entorno
- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `CRON_SECRET`

## 16) Consideraciones operativas
- Rate limit y cache son en memoria por instancia.
- En alta concurrencia se recomienda cache externo (Redis).
- Cron interno solo si `ENABLE_INTERNAL_CRON=true` (no recomendado en prod).
- Para despliegues en Azure/Render usa pooler si la red es IPv4.

## 17) Reglas de integridad
- Un usuario no puede comprar el mismo VIP dos veces.
- Desactivar o eliminar compras activas revierte ganancias y bonos.
- Todo saldo mostrado sale del ledger.

Si necesitas mas detalle en una seccion, dime y la amplio.

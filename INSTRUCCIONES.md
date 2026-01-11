# ✅ INSTRUCCIONES FINALES - TODO LISTO

## 🎯 Estado del Proyecto

✅ Base de datos configurada y sincronizada
✅ Datos iniciales cargados (VIP packages, bonos, banners)
✅ Usuario administrador creado
✅ Servidor de desarrollo corriendo en http://localhost:3000

---

## 🔐 CREDENCIALES

### Usuario Administrador
- **Username**: `admin`
- **Email**: `admin@vip.com`
- **Password**: `admin123`
- **Código de usuario**: `ADMIN001`

### URLs del Sistema
- **App**: http://localhost:3000
- **Panel Admin**: http://localhost:3000/admin (requiere login como admin)

---

## ⚙️ CONFIGURACIÓN PENDIENTE (IMPORTANTE)

### 1. Configurar Supabase Storage

Para que las subidas de archivos funcionen (comprobantes de pago, QR), necesitas configurar el bucket en Supabase:

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard/project/nleosupwdvxkgskqplpp
2. Ve a **Storage** en el menú lateral
3. Haz clic en **Create a new bucket**
4. Nombre del bucket: `receipts`
5. Marca como **Public bucket**: `ON`
6. Haz clic en **Create bucket**

**Políticas de acceso (RLS):**

En el bucket `receipts`, ve a **Policies** y agrega estas políticas:

**Policy 1 - INSERT (para uploads):**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');
```

**Policy 2 - SELECT (para ver archivos):**
```sql
CREATE POLICY "Allow public access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'receipts');
```

O simplemente marca el bucket como público en Settings.

---

## 🚀 CÓMO PROBAR EL SISTEMA

### Paso 1: Registro de Usuario Normal

1. Ve a http://localhost:3000
2. Haz clic en **Registrarse**
3. Completa el formulario:
   - **Código de patrocinador**: Déjalo vacío (o usa `ADMIN001`)
   - **Nombre completo**: Tu nombre
   - **Usuario**: Elige un username
   - **Email**: Tu email
   - **Contraseña**: Mínimo 6 caracteres
4. Haz clic en **Registrarse**
5. Inicia sesión con tu usuario

### Paso 2: Comprar un Paquete VIP

1. En el dashboard, ve a la pestaña **Paks** (bottom nav)
2. Selecciona un paquete VIP (ej: VIP 1 - Bs 100)
3. Haz clic en **Comprar**
4. Verás un QR de pago (placeholder por ahora)
5. Sube un comprobante de pago (cualquier imagen)
6. Haz clic en **Confirmar Compra**
7. La compra quedará en estado **PENDIENTE**

### Paso 3: Aprobar Compra como Admin

1. Cierra sesión (botón "Salir" en Home)
2. Inicia sesión como **admin** / **admin123**
3. Ve a http://localhost:3000/admin
4. Verás la compra pendiente con el comprobante
5. Haz clic en **Aprobar**
6. La compra pasa a **ACTIVO** y se pagan los bonos de referido automáticamente

### Paso 4: Solicitar Retiro

1. Cierra sesión del admin
2. Inicia sesión con tu usuario normal
3. Ve a la pestaña **Retiros** (bottom nav)
4. Verás tu saldo disponible
5. Ingresa el monto a retirar
6. Sube una imagen de tu QR de destino
7. Haz clic en **Solicitar Retiro**

### Paso 5: Procesar Retiro como Admin

1. Inicia sesión como admin
2. Ve a http://localhost:3000/admin
3. Haz clic en **Retiros Pendientes**
4. Verás el retiro solicitado con el QR
5. Haz clic en **Marcar Pagado** o **Rechazar**

### Paso 6: Ejecutar Ganancias Diarias

1. Como admin, en http://localhost:3000/admin
2. Haz clic en **Ganancias Diarias**
3. Haz clic en **Ejecutar Proceso**
4. Esto agregará las ganancias diarias a todos los usuarios con VIP activos

---

## 📊 PAQUETES VIP DISPONIBLES

| Nivel | Inversión | Ganancia Diaria | ROI Diario |
|-------|-----------|-----------------|------------|
| VIP 1 | Bs 100    | Bs 4            | 4%         |
| VIP 2 | Bs 300    | Bs 10           | 3.33%      |
| VIP 3 | Bs 500    | Bs 17           | 3.4%       |
| VIP 4 | Bs 1000   | Bs 35           | 3.5%       |
| VIP 5 | Bs 2000   | Bs 70           | 3.5%       |
| VIP 6 | Bs 3000   | Bs 105          | 3.5%       |
| VIP 7 | Bs 4000   | Bs 135          | 3.375%     |

---

## 💰 SISTEMA DE BONOS

Cuando se aprueba una compra, se pagan bonos automáticamente:

- **Nivel 1** (patrocinador directo): 12% de la inversión
- **Nivel 2**: 5% de la inversión
- **Nivel 3**: 1% de la inversión

---

## 🎨 CARACTERÍSTICAS IMPLEMENTADAS

✅ **Autenticación completa**: Registro, login, recuperar contraseña
✅ **Sistema MLM**: Códigos de referido, árbol de patrocinio
✅ **7 Paquetes VIP**: Con ganancias diarias automáticas
✅ **Dashboard premium**: Diseño futurista dorado/oscuro
✅ **Carruseles**: Banners superior e inferior (HOME_TOP, HOME_BOTTOM)
✅ **Bottom Navigation**: Navegación fija en móvil
✅ **Compras VIP**: Con subida de comprobante y aprobación admin
✅ **Sistema de retiros**: Solicitud y aprobación
✅ **Wallet/Ledger**: Registro completo de todas las transacciones
✅ **Bonos automáticos**: Se pagan al aprobar compras
✅ **Ganancias diarias**: Proceso manual desde admin panel
✅ **Panel admin completo**: Gestión de compras, retiros y ganancias
✅ **1 VIP activo por usuario**: Validación en backend
✅ **Cálculos en backend**: Toda la lógica de negocio es segura
✅ **Responsive**: Funciona en desktop y móvil
✅ **Tipografía Montserrat**: Google Fonts integrada

---

## 🛠️ COMANDOS ÚTILES

```bash
# Iniciar servidor de desarrollo
npm run dev

# Ver base de datos en navegador
npx prisma studio

# Regenerar cliente Prisma (si modificas schema.prisma)
npx prisma generate

# Sincronizar cambios de schema
npx prisma db push

# Ver logs del servidor
# (En la terminal donde corre npm run dev)
```

---

## 📝 NOTAS IMPORTANTES

1. **Contraseña admin**: Cambia `admin123` en producción
2. **JWT_SECRET**: Cambia el valor en `.env.local` para producción
3. **Supabase Storage**: DEBES configurar el bucket `receipts` para que funcionen las subidas
4. **Ganancias diarias**: En producción, configura un cron job para ejecutar `/api/admin/run-daily-profit` cada 24h
5. **Variables de entorno**: Nunca subas `.env` o `.env.local` a git
6. **Producción**: Usa un servidor PostgreSQL dedicado o mantén Supabase con mejor plan

---

## 🔧 PERSONALIZACIÓN

### Cambiar colores del QR de pago

Edita en Prisma Studio o vía SQL:

```sql
UPDATE "VipPackage"
SET qr_image_url = 'https://tu-url-de-qr.com/imagen.png'
WHERE level = 1;
```

### Agregar/editar banners

Ve a Prisma Studio → tabla `Banner` → Agrega nuevos registros con:
- `location`: HOME_TOP o HOME_BOTTOM
- `image_url`: URL de la imagen
- `order`: Orden de aparición
- `is_active`: true

### Cambiar bonos de referido

Ve a Prisma Studio → tabla `ReferralBonusRule` → Edita los porcentajes

---

## ✅ CHECKLIST FINAL

- [x] Base de datos configurada
- [x] Prisma schema sincronizado
- [x] Seed ejecutado (VIP packages, bonos, banners)
- [x] Usuario admin creado
- [x] Servidor corriendo
- [ ] **PENDIENTE**: Configurar bucket `receipts` en Supabase Storage

---

## 🚨 SI ALGO NO FUNCIONA

1. Revisa la consola del navegador (F12)
2. Revisa los logs del servidor (terminal donde corre `npm run dev`)
3. Verifica que el bucket `receipts` esté creado y público en Supabase
4. Verifica que las variables de entorno estén correctas en `.env.local`

---

## 📞 SOPORTE

El proyecto está completamente funcional. Solo falta configurar el bucket de Supabase Storage para las subidas de archivos.

**¡Todo listo para probar!** 🎉

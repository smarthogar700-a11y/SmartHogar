# 🔗 ACCESOS RÁPIDOS

## 📍 URLs DEL SISTEMA

### Frontend
- **Página Principal**: http://localhost:3000
- **Registro**: http://localhost:3000/signup
- **Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/home
- **Paquetes VIP**: http://localhost:3000/paks
- **Retiros**: http://localhost:3000/withdrawals
- **Mis Compras**: http://localhost:3000/my-purchases

### Panel Administrador
- **🔐 PANEL ADMIN**: http://localhost:3000/admin

## 👤 CREDENCIALES ADMIN

```
Usuario:    admin
Password:   admin123
```

---

## ⚠️ CONFIGURAR BUCKET SUPABASE (OBLIGATORIO)

**PROBLEMA ACTUAL:**
El error "Error al subir comprobante" es porque el bucket no existe en Supabase.

**SOLUCIÓN TEMPORAL:**
He configurado un fallback para que la app funcione, pero las imágenes serán placeholders.

**SOLUCIÓN DEFINITIVA (5 minutos):**

### Paso 1: Ir a Supabase
Abre: https://supabase.com/dashboard/project/nleosupwdvxkgskqplpp

### Paso 2: Crear el Bucket
1. Click en **"Storage"** en el menú lateral izquierdo
2. Click en botón **"Create a new bucket"** (verde, arriba a la derecha)
3. En el modal que aparece:
   - **Name**: `receipts` (exactamente así, sin mayúsculas)
   - **Public bucket**: ✅ Activar (muy importante)
   - **Allowed MIME types**: Dejar vacío o poner `image/*`
4. Click en **"Create bucket"**

### Paso 3: Configurar Políticas (Opcional pero recomendado)
1. Click en el bucket `receipts` recién creado
2. Ve a la pestaña **"Policies"**
3. Click en **"New Policy"**
4. Selecciona **"For full customization"**

**Política 1 - Permitir subidas:**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');
```

**Política 2 - Permitir lectura pública:**
```sql
CREATE POLICY "Allow public access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'receipts');
```

O más fácil: En la configuración del bucket, marca **"Public bucket"** como `ON`.

### Paso 4: Verificar
1. En Supabase Storage, deberías ver el bucket `receipts`
2. Intenta subir un comprobante desde la app
3. Ahora debería funcionar correctamente

---

## 🎯 FLUJO COMPLETO DE PRUEBA

### Como Usuario Normal:
1. Ve a http://localhost:3000/signup
2. Registra un nuevo usuario (guarda tus credenciales)
3. Inicia sesión con tu usuario
4. Ve a **Paks** (bottom nav)
5. Selecciona **VIP 1** (Bs 100)
6. Click en **Comprar**
7. Sube cualquier imagen como comprobante
8. Click en **Confirmar Compra**
9. Ve a **Mis Compras** para ver tu compra en estado PENDING

### Como Admin:
1. Cierra sesión del usuario normal
2. Ve a http://localhost:3000/login
3. Inicia sesión como **admin** / **admin123**
4. Automáticamente te redirige a http://localhost:3000/home
5. **Ir al panel admin**: http://localhost:3000/admin
6. Verás la compra pendiente con el comprobante
7. Click en **Aprobar**
8. La compra pasa a ACTIVO y se pagan bonos automáticamente

### Ejecutar Ganancias Diarias:
1. En http://localhost:3000/admin (como admin)
2. Click en tab **"Ganancias Diarias"**
3. Click en **"Ejecutar Proceso"**
4. Verás cuántas ganancias se procesaron

### Procesar Retiros:
1. En http://localhost:3000/admin (como admin)
2. Click en tab **"Retiros Pendientes"**
3. Verás los retiros solicitados con su QR
4. Click en **"Marcar Pagado"** o **"Rechazar"**

---

## 🔧 COMANDOS ÚTILES

```bash
# Iniciar servidor
npm run dev

# Ver base de datos en navegador
npx prisma studio

# Ver logs en tiempo real
# (En la terminal donde corre npm run dev)
```

---

## 📱 ACCESO MÓVIL

Para probar desde tu teléfono en la misma red:

1. Encuentra tu IP local:
   ```bash
   # En Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # O simplemente
   ipconfig getifaddr en0
   ```

2. En tu teléfono, abre el navegador y ve a:
   ```
   http://TU_IP_LOCAL:3000
   ```
   Ejemplo: `http://192.168.1.100:3000`

---

## 🎨 IMÁGENES CONFIGURADAS

### Carrusel Superior (HOME_TOP):
- ✅ Mesa-de-trabajo-6.png
- ✅ Mesa-de-trabajo-6.png (v2)
- ✅ Mesa-de-trabajo-3.jpg
- ✅ Mesa-de-trabajo-7.jpg

### Carrusel Inferior (HOME_BOTTOM):
- ✅ Mesa-de-trabajo-1.jpg

### QR de Pago:
- ✅ Mesa-de-trabajo-3.jpg (configurado en todos los VIP)

---

## ✅ CHECKLIST RÁPIDO

- [x] Base de datos funcionando
- [x] Usuario admin creado
- [x] Paquetes VIP configurados
- [x] Imágenes personalizadas
- [x] QR de pago configurado
- [x] Servidor corriendo
- [ ] **PENDIENTE: Crear bucket "receipts" en Supabase**

---

**Panel Admin:** http://localhost:3000/admin
**Credenciales:** admin / admin123

¡Todo listo para probar! 🚀

# 📖 INSTRUCCIONES DE USO - Panel de Administración

## 🚀 INICIO RÁPIDO

### 1. Abrir el Panel Admin:
```
URL: http://localhost:3001/admin
Usuario: admin
Contraseña: admin123
```

### 2. Ubicar las Tablas de Configuración:
- Las tablas están **al final de la página**
- Después de los botones de tabs
- **Haz scroll down** para verlas

---

## 📊 TABLA 1: Paquetes VIP

### Ubicación:
Scroll down hasta ver el título dorado:
```
⚙️ Paquetes VIP
```

### Campos Editables:

| Campo | Cómo Editar | Ejemplo |
|-------|-------------|---------|
| **Inversión (Bs)** | Click en el número → Escribe nuevo valor | `100` → `150` |
| **Ganancia/Día (Bs)** | Click en el número → Escribe nuevo valor | `3` → `5` |
| **Estado** | Click en checkbox ☑ | Activo ↔ Inactivo |

### Campos Automáticos:

| Campo | Descripción |
|-------|-------------|
| **% Diario** | Se calcula solo: (Ganancia ÷ Inversión) × 100 |

### Ejemplo de Edición:

**PASO 1:** Busca la fila de VIP 1
```
VIP 1 │ Inversión: 100 │ Ganancia: 3 │ % Diario: 3.00%
```

**PASO 2:** Haz click en el campo "100" (Inversión)
```
VIP 1 │ Inversión: [150]← escribes aquí │ Ganancia: 3 │ % Diario: 3.00%
```

**PASO 3:** Haz click en el campo "3" (Ganancia/Día)
```
VIP 1 │ Inversión: 150 │ Ganancia: [5]← escribes aquí │ % Diario: 3.33%
                                                                      ↑ se actualiza solo
```

**PASO 4:** Haz click en el botón "Guardar" de esa fila
```
VIP 1 │ Inversión: 150 │ Ganancia: 5 │ % Diario: 3.33% │ [Guardar] ← CLICK AQUÍ
```

**PASO 5:** Verás el mensaje:
```
✅ Paquete actualizado correctamente
```

---

## 🎁 TABLA 2: Bonos de Patrocinio

### Ubicación:
Debajo de la Tabla de Paquetes VIP, verás:
```
🎁 Bonos de Patrocinio
```

### Campos Editables:

| Campo | Cómo Editar | Ejemplo |
|-------|-------------|---------|
| **Porcentaje (%)** | Click en el número → Escribe nuevo valor | `12` → `15` |

### Ejemplo de Edición:

**PASO 1:** Busca la fila de Nivel 1
```
Nivel 1 │ Patrocinador directo │ 12.00% │ [Guardar]
```

**PASO 2:** Haz click en el campo "12.00"
```
Nivel 1 │ Patrocinador directo │ [15]← escribes aquí % │ [Guardar]
```

**PASO 3:** Haz click en "Guardar"
```
Nivel 1 │ Patrocinador directo │ 15.00% │ [Guardar] ← CLICK AQUÍ
```

**PASO 4:** Verás el mensaje:
```
✅ Bono actualizado correctamente. Aplica a todos los usuarios.
```

---

## ⚠️ IMPORTANTE: Aplicación de Cambios

### ✅ Los cambios SE APLICAN a:
- Todas las **futuras compras** que se aprueben
- Todos los **nuevos usuarios**
- **Cálculos futuros** de ganancias y bonos

### ❌ Los cambios NO afectan:
- Compras **ya aprobadas**
- Ganancias **ya calculadas**
- Bonos **ya pagados**

### 📝 Ejemplo Real:

**Situación:**
```
Usuario "Juan" compró VIP 1 ayer
- Inversión: Bs 100
- Ganancia: Bs 3/día
```

**Hoy cambias:**
```
VIP 1: Inversión Bs 150, Ganancia Bs 5/día
```

**Resultado:**
```
✅ Juan sigue con Bs 3/día (su compra antigua)
✅ María (compra hoy) recibirá Bs 5/día (valores nuevos)
✅ En /paks se muestra: VIP 1 - Bs 150 (valor nuevo)
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Aumentar la ganancia diaria del VIP 3

```
1. Scroll down hasta "⚙️ Paquetes VIP"
2. Busca la fila "VIP 3"
3. Click en el campo de "Ganancia/Día" (actual: 17.00)
4. Escribe: 20
5. Observa que "% Diario" se actualiza automáticamente
6. Click en "Guardar"
7. Espera el mensaje: ✅ Paquete actualizado correctamente
```

### Caso 2: Cambiar el bono del nivel 1 de 12% a 15%

```
1. Scroll down hasta "🎁 Bonos de Patrocinio"
2. Busca la fila "Nivel 1"
3. Click en el campo "12.00"
4. Escribe: 15
5. Click en "Guardar"
6. Espera el mensaje: ✅ Bono actualizado correctamente. Aplica a todos los usuarios.
```

### Caso 3: Desactivar temporalmente un paquete VIP

```
1. Scroll down hasta "⚙️ Paquetes VIP"
2. Busca la fila del paquete que quieres desactivar
3. Click en el checkbox ☑ (quitarle el check)
4. El sistema guarda automáticamente
5. El estado cambia a: ✗ Inactivo (rojo)
6. Los usuarios YA NO verán ese paquete en /paks
```

---

## 🔍 Verificar que los Cambios se Aplicaron

### Opción 1: Ver en la lista de paquetes (usuario)
```
1. Abre: http://localhost:3001/paks
2. Verifica que los nuevos valores aparezcan
```

### Opción 2: Ver en la base de datos
```
1. Ejecuta: npm run prisma:studio
2. Abre: http://localhost:5555
3. Click en "vip_package" o "referral_bonus_rules"
4. Verifica los valores
```

---

## 🚨 Solución de Problemas

### Problema 1: "No veo las tablas"
**Solución:**
- Haz **scroll down** en la página admin
- Las tablas están al final, después de los tabs
- Busca el título dorado "Configuración del Sistema"

### Problema 2: "Al hacer click en Guardar no pasa nada"
**Solución:**
- Verifica que estés logueado como admin
- Refresca la página (F5)
- Verifica la consola del navegador (F12) para ver errores

### Problema 3: "El porcentaje no se calcula"
**Solución:**
- El % Diario se calcula automáticamente al editar
- No necesitas hacer nada, solo edita Inversión o Ganancia/Día
- Si no se actualiza, refresca la página

### Problema 4: "Dice 'Error al actualizar'"
**Solución:**
- Verifica que el servidor esté corriendo
- Verifica que los valores sean números válidos
- No uses valores negativos
- Para porcentajes, usa valores entre 0 y 100

---

## 📱 Acceso Rápido

| Acción | URL |
|--------|-----|
| Panel Admin | http://localhost:3001/admin |
| Ver paquetes (usuario) | http://localhost:3001/paks |
| Base de datos visual | http://localhost:5555 (después de `npm run prisma:studio`) |

---

## ✅ Checklist Antes de Modificar

Antes de hacer cambios importantes, verifica:

- [ ] Estoy logueado como admin
- [ ] He hecho scroll down hasta ver las tablas
- [ ] Entiendo que los cambios afectan futuras operaciones
- [ ] He revisado los valores actuales
- [ ] Los nuevos valores son números válidos
- [ ] Tengo un motivo claro para el cambio

---

## 🎓 Tips y Mejores Prácticas

1. **Haz cambios pequeños:** No cambies todos los valores a la vez
2. **Prueba primero:** Haz un cambio pequeño y verifica que funcione
3. **Documenta:** Anota qué cambios hiciste y cuándo
4. **Comunica:** Avisa a los usuarios si cambias valores importantes
5. **Monitorea:** Revisa que los nuevos valores tengan sentido económico
6. **Backup:** Considera hacer backup de la base de datos antes de cambios grandes

---

¡Listo para usar! 🚀

Si tienes dudas, revisa el archivo [RESUMEN-FINAL.md](RESUMEN-FINAL.md)

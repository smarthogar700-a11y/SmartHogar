# 📊 GUÍA: Cómo Usar las Tablas de Configuración

## 🚀 PASO 1: Abrir el Panel Admin

1. Abre tu navegador (Chrome, Firefox, etc.)
2. Ve a: **http://localhost:3001/admin**
3. Login:
   - Usuario: `admin`
   - Contraseña: `admin123`

---

## 🔧 PASO 2: Click en "Configuración"

Verás 6 tabs en la parte superior:
```
[ Compras ] [ Retiros ] [ Ganancias ] [ Usuarios ] [ Configuración ] [ Ajustes Manuales ]
```

**Haz click en el tab "Configuración"** (el 5to tab)

---

## ⚙️ TABLA 1: Paquetes VIP

Verás una tabla como esta:

```
┌──────────┬──────────┬────────────────┬──────────────────┬──────────┬─────────┐
│ ESTADO   │ PAQUETE  │ INVERSIÓN (Bs) │ GANANCIA/DÍA (Bs)│ % DIARIO │ ACCIÓN  │
├──────────┼──────────┼────────────────┼──────────────────┼──────────┼─────────┤
│ ☑ Activo │ VIP 1    │ [   100.00  ] │ [     3.00    ] │  3.00%   │[Guardar]│
│ ☑ Activo │ VIP 2    │ [   250.00  ] │ [     8.00    ] │  3.20%   │[Guardar]│
│ ☑ Activo │ VIP 3    │ [   500.00  ] │ [    17.00    ] │  3.40%   │[Guardar]│
│ ☑ Activo │ VIP 4    │ [  1000.00  ] │ [    36.00    ] │  3.60%   │[Guardar]│
│ ☑ Activo │ VIP 5    │ [  1500.00  ] │ [    56.00    ] │  3.73%   │[Guardar]│
│ ☑ Activo │ VIP 6    │ [  2500.00  ] │ [    95.00    ] │  3.80%   │[Guardar]│
│ ☑ Activo │ VIP 7    │ [  4000.00  ] │ [   156.00    ] │  3.90%   │[Guardar]│
└──────────┴──────────┴────────────────┴──────────────────┴──────────┴─────────┘
```

### ✏️ Cómo Editar:

1. **INVERSIÓN**: Haz click en el campo `[ 100.00 ]`
   - Borra el número
   - Escribe el nuevo monto (Ej: `150`)

2. **GANANCIA/DÍA**: Haz click en el campo `[ 3.00 ]`
   - Borra el número
   - Escribe la nueva ganancia diaria (Ej: `5`)

3. **% DIARIO**: Se calcula automáticamente
   - Fórmula: (Ganancia ÷ Inversión) × 100
   - Ejemplo: (5 ÷ 150) × 100 = 3.33%

4. **GUARDAR**: Haz click en el botón `[Guardar]` de esa fila
   - Verás: "✅ Paquete actualizado correctamente"

### 📝 Ejemplo de Edición:

**Antes:**
```
VIP 1 │ Inversión: 100 │ Ganancia: 3 │ % Diario: 3.00%
```

**Editando:**
```
VIP 1 │ Inversión: [150← escribes aquí] │ Ganancia: [5← escribes aquí] │ % Diario: 3.33%
                                                                              ↑ se calcula solo
```

**Después de guardar:**
```
VIP 1 │ Inversión: 150 │ Ganancia: 5 │ % Diario: 3.33% │ [✅ Guardado]
```

---

## 🎁 TABLA 2: Bonos de Patrocinio

Verás una tabla como esta:

```
┌─────────┬──────────────────────────────────────────┬──────────────┬─────────┐
│ NIVEL   │ DESCRIPCIÓN                              │ PORCENTAJE (%)│ ACCIÓN  │
├─────────┼──────────────────────────────────────────┼──────────────┼─────────┤
│ Nivel 1 │ 👤 Patrocinador directo (quien invitó)  │ [  12.00  ]% │[Guardar]│
│ Nivel 2 │ 👥 Segundo nivel (padrino del padrino)   │ [   5.00  ]% │[Guardar]│
│ Nivel 3 │ 👨‍👩‍👧 Tercer nivel (padrino del nivel 2) │ [   1.00  ]% │[Guardar]│
└─────────┴──────────────────────────────────────────┴──────────────┴─────────┘
```

### ✏️ Cómo Editar:

1. **PORCENTAJE**: Haz click en el campo `[ 12.00 ]`
   - Borra el número
   - Escribe el nuevo porcentaje (Ej: `15`)
   - El símbolo `%` aparece automáticamente

2. **GUARDAR**: Haz click en `[Guardar]`
   - Verás: "✅ Bono actualizado correctamente. Aplica a todos los usuarios."

### 📝 Ejemplo de Edición:

**Antes:**
```
Nivel 1 │ Patrocinador directo │ 12.00% │ [Guardar]
```

**Editando:**
```
Nivel 1 │ Patrocinador directo │ [15← escribes aquí]% │ [Guardar]
```

**Después de guardar:**
```
Nivel 1 │ Patrocinador directo │ 15.00% │ [✅ Guardado]
```

---

## 💰 Ejemplo de Cálculo de Bonos

Debajo de la tabla verás un ejemplo práctico:

```
💡 Ejemplo: Si un usuario compra VIP de Bs 1000 y el Nivel 1 tiene 12%:

→ Su patrocinador directo recibe: 1000 × 12% = Bs 120
→ El nivel 2 recibe: 1000 × 5% = Bs 50
→ El nivel 3 recibe: 1000 × 1% = Bs 10

⚠️ IMPORTANTE: Los cambios se aplican a TODAS las nuevas compras aprobadas.
⚠️ Las compras anteriores mantienen el porcentaje con el que fueron calculadas.
```

---

## ⚠️ IMPORTANTE

### ✅ Los cambios que hagas:
- Se guardan **inmediatamente** en la base de datos
- Se aplican a **todas las futuras compras**
- Afectan a **todos los usuarios** del sistema
- Son **permanentes**

### ❌ Los cambios NO afectan:
- Compras ya aprobadas anteriormente
- Ganancias diarias ya generadas
- Bonos ya pagados

---

## 🔍 Verificar que las Tablas Funcionan

### 1. Abre la Consola del Navegador:
- **Chrome/Edge**: Presiona `F12` o `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Firefox**: Presiona `F12` o `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)

### 2. Ve a la pestaña "Console"

### 3. Deberías ver estos mensajes:
```
Paquetes VIP cargados: (7) [{…}, {…}, {…}, {…}, {…}, {…}, {…}]
Bonos cargados: (3) [{…}, {…}, {…}]
Packages: 7 (7) [{…}, {…}, {…}, {…}, {…}, {…}, {…}]
Bonus Rules: 3 (3) [{…}, {…}, {…}]
```

### 4. Si ves errores:
- Anota el mensaje de error
- Compártelo conmigo para ayudarte

---

## 🐛 Solución de Problemas

### Problema 1: No veo las tablas
**Solución:**
```bash
# En la terminal, ejecuta:
npm run prisma:seed

# Luego recarga la página en el navegador (F5)
```

### Problema 2: Los campos de entrada no aparecen
**Solución:**
- Limpia el caché del navegador
- Presiona `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac) para recargar sin caché

### Problema 3: Al guardar dice "Error"
**Solución:**
- Verifica que estés logueado como admin
- Verifica en la consola del navegador (F12) el error exacto

### Problema 4: "No hay paquetes VIP en la base de datos"
**Solución:**
```bash
npm run prisma:seed
```

---

## 📸 Cómo Debería Verse

### Vista Completa:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ⚙️ Paquetes VIP                                                │
│  Modifica la inversión, ganancia diaria y porcentaje...        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           TABLA DE PAQUETES VIP                         │  │
│  │  (con 7 filas editables)                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  💡 Inversión: Monto que el usuario debe pagar                 │
│  💡 Ganancia/Día: Monto que el usuario recibe diariamente      │
│  💡 % Diario: Porcentaje de retorno calculado automáticamente  │
│  ⚠️ Los cambios se aplican inmediatamente a nuevas compras     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎁 Bonos de Patrocinio                                         │
│  Modifica el porcentaje de bono que recibe cada nivel...      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           TABLA DE BONOS                                │  │
│  │  (con 3 filas editables)                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  💡 Ejemplo: Si un usuario compra VIP de Bs 1000...            │
│  ⚠️ Los cambios se aplican a TODAS las nuevas compras          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Final

Antes de hacer cambios, verifica:

- [ ] Estoy logueado como admin
- [ ] Estoy en el tab "Configuración"
- [ ] Veo las 2 tablas (Paquetes VIP y Bonos)
- [ ] Puedo hacer click en los campos de entrada
- [ ] Entiendo que los cambios son permanentes
- [ ] He probado con un valor pequeño primero

---

¿Necesitas ayuda? Comparte una captura de pantalla de lo que ves.

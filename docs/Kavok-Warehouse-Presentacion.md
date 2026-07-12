# Kavok Warehouse

### Sistema de control de almacén aeronáutico

Presentación de la primera versión (MVP)

---

## En resumen

**Kavok Warehouse** es un sistema web para llevar el control del almacén de partes aeronáuticas: qué partes existen, cuántas hay, dónde están, en qué estado se encuentran y todo lo que entra y sale.

Reemplaza el registro en papel por un sistema centralizado, accesible desde el navegador, que deja rastro de cada operación y protege contra errores comunes (despachar más de lo que hay, entregar una parte vencida, etc.).

Todo el sistema está **100 % en español** y usa el catálogo de partes tal como lo maneja el fabricante.

---

## Qué incluye el sistema

El sistema se organiza en módulos, accesibles desde un menú lateral:

### 1. Panel (Dashboard)
Pantalla de inicio con el estado del almacén de un vistazo:
- Cantidad de partes en catálogo
- Ítems en stock
- Partes por vencer en los próximos 30 días
- Partes marcadas como no serviciables

### 2. Catálogo de partes
El "diccionario" de todo lo que el almacén puede manejar. Cada parte guarda:
- Número de parte (P/N) y descripción
- Fabricante y unidad de medida
- Categoría: rotable, consumible o expendible
- Capítulo ATA
- Tipo de seguimiento: por **número de serie** o por **lote**
- Vida útil (para calcular vencimientos automáticamente)
- **Partes alternas** (números de parte equivalentes): se pueden vincular **al momento de crear la parte** o más tarde desde su ficha. La vinculación es **bidireccional** (si A es alterna de B, B lo es de A). Al elegir la primera alterna del catálogo, el sistema **propone su misma clasificación** (descripción, categoría, seguimiento, unidad de medida, vida útil) para agilizar la carga, sin pisar lo que ya se haya escrito y dejándolo editable.

### 3. Stock
El inventario real: cada existencia física registrada en el almacén, con su ubicación (zona y estante), cantidad, estado y fecha de vencimiento. Permite:
- Buscar y filtrar por texto, estado, categoría, zona o vencimiento
- Ver por pestañas según categoría
- Ocultar o mostrar ítems agotados
- Registrar **inventario inicial** (para digitalizar lo que hoy está en papel) y **recepciones** de nueva mercancía
- Cambiar el estado de una parte (serviciable / no serviciable / desecho) dejando el motivo registrado
- **Exportar a Excel/CSV**

### 4. Despacho
Para entregar partes fuera del almacén, en una sola orden:
- Se indica quién solicita y quién recibe
- El destino puede ser una **aeronave** (matrícula) u otro destino libre
- Se pueden incluir **varias partes en un mismo despacho**
- Cada despacho genera un número correlativo

### 5. Movimientos
El historial completo del almacén. Cada entrada, salida, traslado o cambio de estado queda registrado de forma permanente, con fecha, usuario responsable y detalle. Se puede filtrar y **exportar a Excel/CSV**.

### 6. Aeronaves *(admin)*
Registro de las aeronaves (matrícula y modelo) a las que se despachan partes.

### 7. Usuarios *(admin)*
Administración de las personas que usan el sistema, con dos niveles de acceso:
- **Operador**: opera el día a día (stock, despachos, movimientos)
- **Administrador**: además gestiona usuarios, aeronaves y configuración

---

## Reglas que protegen el inventario

El sistema no es solo un registro: aplica reglas de negocio para evitar errores:

| Situación | Qué hace el sistema |
|---|---|
| Intentar despachar más de lo que hay | **Lo bloquea** |
| Despachar una parte no serviciable o de desecho | Permite continuar, pero **exige un motivo** |
| Despachar una parte vencida | **Advierte**, sin bloquear |
| Cambiar el estado de una parte | **Exige un motivo** |
| Corregir un movimiento ya registrado | Los movimientos son **inmutables**; se corrige con un movimiento inverso, nunca borrando |

Los vencimientos se calculan **automáticamente** a partir de la fecha de recepción y la vida útil de la parte.

---

## Trazabilidad

Cada existencia registrada mantiene su propia identidad: cada recepción o inventario inicial queda como una fila auditable independiente. Nada se sobrescribe ni se pierde. En cualquier momento se puede saber **qué pasó, cuándo y quién lo hizo**.

---

## Alcance de esta entrega

Esta primera versión (MVP) está pensada para **un almacén y un cliente**, y cubre el flujo completo del día a día:

> Catálogo → Ingreso de stock → Consulta y control → Despacho → Historial

Está diseñada para **arrancar desde cero**: se digitaliza el inventario actual con el tipo de movimiento "inventario inicial", y a partir de ahí el sistema queda vivo.

### Qué queda para fases siguientes

Para mantener esta primera entrega enfocada y sólida, dejamos para versiones futuras:

- Certificados y documentos adjuntos (PDF) de las partes
- Reportes e informes predefinidos con formato formal
- Alertas y notificaciones automáticas (correo) por vencimientos
- Importación masiva desde archivos Excel/CSV
- Múltiples almacenes / ubicaciones
- Permisos más detallados por función

Estas funciones **no forman parte de esta entrega**, pero el sistema está construido para poder incorporarlas de forma ordenada más adelante, a medida que el uso lo requiera.

---

## Acceso

El sistema funciona **desde el navegador**, sin necesidad de instalar nada. Cada usuario ingresa con su nombre de usuario y contraseña. Se entrega con un usuario administrador inicial cuya contraseña debe cambiarse en el primer ingreso.

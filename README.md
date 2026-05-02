# Monitor Lite — README de Proyecto

> Documento de referencia completo para el desarrollo de Monitor Lite.
> Cualquier herramienta de desarrollo (Claude Code, v0, Cursor, Lovable, etc.) debe leer este documento **completo** antes de comenzar a trabajar en cualquier módulo.
> El desarrollador no debe tomar decisiones de arquitectura, diseño o funcionalidad que no estén especificadas aquí sin consultarlo primero con el usuario.

---

## 0. Metodología de desarrollo — LEER PRIMERO

Esta sección define cómo debe trabajar Claude Code (o cualquier herramienta de desarrollo) en este proyecto. **Estas instrucciones tienen prioridad sobre cualquier criterio propio del desarrollador.**

### Flujo de desarrollo en tres capas

El proyecto se construye en este orden estricto. No se avanza a la siguiente capa hasta que el usuario lo confirme explícitamente.

```
Capa 1 — Estructura y pantallas (PRIMERO)
  └── Construir todas las pantallas de la app con datos de prueba ficticios.
      El objetivo es que el usuario pueda navegar por toda la app,
      ver todas las pantallas y validar que la estructura es correcta.
      NO se implementa lógica real todavía.

Capa 2 — Funcionalidad y lógica (SEGUNDO)
  └── Una vez aprobada la estructura, hacer la app realmente funcional:
      cálculos, conexiones entre módulos, base de datos, importaciones,
      exportaciones, alertas, flujos de estado, etc.

Capa 3 — Estética y diseño visual (TERCERO)
  └── Una vez que todo funciona correctamente, trabajar en la estética:
      colores, tipografía, espaciado, animaciones, experiencia visual.
```

### Reglas de trabajo para Claude Code

**Durante la Capa 1 — Estructura:**
- Construir todas las pantallas y navegación entre ellas.
- Usar datos ficticios (hardcoded) para poblar las pantallas. No conectar base de datos todavía.
- La estética debe ser **funcional y limpia, sin trabajo de diseño**: usar componentes base de shadcn/ui con estilos por defecto. No personalizar colores, tipografías ni espaciados. No añadir animaciones.
- Cada pantalla debe mostrar todos los elementos que tendrá en producción (tablas, campos, botones, gráficos placeholder), aunque sean estáticos.
- Al terminar cada pantalla, mostrar al usuario qué se ha construido y esperar confirmación antes de continuar.

**Durante la Capa 2 — Funcionalidad:**
- No cambiar la estructura visual de las pantallas. Solo añadir lógica.
- Conectar base de datos, implementar cálculos, flujos y conexiones entre módulos.
- Seguir el orden de fases definido en la sección 10 de este documento.
- Al terminar cada fase, verificar que funciona antes de pasar a la siguiente.

**Durante la Capa 3 — Estética:**
- No alterar la estructura ni la lógica. Solo trabajar la apariencia visual.
- Recibir instrucciones específicas del usuario sobre colores, estilo y preferencias.

### Reglas generales que aplican siempre

- **No añadir funcionalidades no solicitadas.** Si el desarrollador detecta algo que podría ser útil, lo menciona pero no lo implementa sin aprobación.
- **No refactorizar código que no esté relacionado con la tarea actual.**
- **No tomar decisiones de diseño por cuenta propia.** Ante cualquier duda, preguntar.
- **Trabajar módulo por módulo, pantalla por pantalla.** Nunca trabajar en paralelo en varios módulos.
- **El README es la fuente de verdad.** Si hay contradicción entre el README y una instrucción verbal, señalarlo al usuario antes de proceder.

### Cómo iniciar cada sesión de trabajo

Al comenzar cualquier sesión, Claude Code debe:
1. Confirmar en qué fase y capa se encuentra el proyecto.
2. Confirmar qué tarea concreta se va a realizar en esa sesión.
3. Ejecutar solo esa tarea.
4. Al terminar, describir brevemente qué se ha hecho y qué sigue a continuación.

---

## 1. Identidad del proyecto

**Nombre:** Monitor Lite
**Tipo:** Aplicación web responsive (funciona en navegador de escritorio y móvil)
**Idioma de la interfaz:** Español
**Estado actual:** En definición / inicio de desarrollo
**Uso:** Interno — constructora pyme española

---

## 2. Propósito y filosofía

Monitor Lite es una herramienta de gestión y control de obras de construcción diseñada para jefes de obra de pymes. Su objetivo es **estandarizar el rol del jefe de obra** y reducir al mínimo el factor humano y el tiempo invertido en oficina haciendo cálculos manuales, detectando desvíos y sacando conclusiones.

### Principio central
La funcionalidad core de la app es la **comparativa constante entre lo planificado y lo ejecutado**. Todo el sistema gira en torno a esta comparativa.

### Dos modos de trabajo
La función **"Comenzar obra"** separa dos estados con interfaces y funcionalidades distintas:

- **Modo pre-obra (planificación):** El jefe de obra dedica tiempo a preparar toda la información antes de que empiece la obra. Es la fase más laboriosa. Define medición, precios, costes, unidades de obra, planificación, rendimientos y tareas previas.
- **Modo en ejecución (registro):** Una vez comenzada la obra, el usuario simplemente registra lo que ocurre. El sistema analiza, compara y alerta automáticamente. El objetivo es que esta fase consuma el mínimo tiempo posible.

### Público objetivo
- Usuario principal: jefe de obra, sin conocimientos de programación, familiarizado con Presto y Excel.
- Perfil de usuario mayor: sector construcción, media de edad +45 años. La curva de aprendizaje debe ser mínima. Con 1-2 horas de formación, el usuario debe poder empezar a usarla.
- Uso individual: el jefe gestiona ~3 obras simultáneas.
- Tipo de obras: residencial (viviendas, edificios) y reformas integrales.

---

## 3. Arquitectura general

### Pantalla de inicio (global)
Al abrir la app, el usuario ve tres áreas:

1. **Listado de obras** — todas las obras del jefe de obra (en planificación, activas, archivadas).
2. **Base de datos global** — compartida entre todas las obras (ver sección 7).
3. **Calendario general** — vista multi-obra con filtros.

### Dentro de cada obra
Cada obra contiene 6 módulos (más el Módulo 04 pendiente de definición detallada):

| Módulo | Nombre | Estado |
|--------|--------|--------|
| M01 | Dashboard | Definido |
| M02 | Medición | Definido |
| M03 | Planificación | Definido |
| M04 | Control | Pendiente de definición detallada |
| M05 | Económico | Definido |
| M06 | Registro | Definido |

---

## 4. Flujo de trabajo estándar

### Pre-obra (orden obligatorio recomendado)
1. Crear obra (datos generales: nombre, cliente, dirección, fechas previstas)
2. Importar medición (.bc3 o .xlsx exportado desde Presto)
3. Revisar y completar partidas: asignar PVP, coste estimado y coste objetivo
4. Crear orden personalizado y agrupar partidas en Unidades de Obra (UO)
5. Asignar rendimientos a partidas o UO (desde base de rendimientos o manualmente)
6. Armar planificación en tabla PERT: definir dependencias y tiempos
7. Revisar: márgenes, facturación por mes, plazos, coherencia general
8. Asignar tareas previas y recordatorios
9. **Pulsar "Comenzar obra"** → cambia el estado de la obra y activa el modo ejecución

### En ejecución (rutina diaria)
1. Revisar dashboard (alertas, desvíos, plazos)
2. Registrar avance físico del día (Módulo 04 — Control)
3. Registrar presencia y horas de trabajadores (Módulo 04 — Control)
4. Imputar facturas recibidas si las hay (Módulo 05 — Económico)
5. Registrar incidencias o acuerdos relevantes (Módulo 06 — Registro)
6. Actualizar planificación si hay cambios

---

## 5. Módulos — descripción detallada

---

### M01 — Dashboard

**Propósito:** Vista general de la obra al entrar. Es el primer punto de contacto cada vez que el jefe abre una obra. Debe permitir entender el estado de la obra de un vistazo, sin necesidad de entrar a ningún módulo.

**Contenido:**
- Estado actual vs planificado (avance físico % y avance económico %)
- Alertas de desvíos de plazo (UO retrasadas o en riesgo)
- Alertas de desvíos de coste (partidas que superan coste objetivo o estimado)
- Plazos próximos (UO que comienzan o terminan en los próximos X días)
- Tareas pendientes dentro de la app (acciones que el sistema detecta que faltan)
- Recordatorios de tareas previas programadas (ej: "en 5 días debes pedir el material de X")
- Margen actual (PVP total vs coste real acumulado)
- Notificaciones de Órdenes de Cambio pendientes de firma
- Resumen de certificaciones (última certificación, próxima prevista, estado de cobro)

**Exportación:** PDF del dashboard completo.

**Comportamiento según modo:**
- Pre-obra: muestra el estado de la planificación, lo que falta por completar y proyecciones.
- En ejecución: muestra la comparativa real planificado vs ejecutado.

---

### M02 — Medición

**Propósito:** Gestión completa del presupuesto de la obra. Funciona de forma similar a Presto (el usuario lo conoce y lo usa habitualmente) pero añade funcionalidades clave: orden personalizado, Unidades de Obra, etiquetas y vistas personalizadas.

#### Importación
- Formato `.bc3` (formato nativo de intercambio de presupuestos en construcción)
- Formato `.xlsx` exportado desde Presto para Excel

#### Estructura de la medición
La medición se organiza jerárquicamente:
```
Capítulo
  └── Partida
        └── Líneas de medición (opcional)
```

#### Campos por partida
| Campo | Descripción |
|-------|-------------|
| Código | Código de la partida (heredado del presupuesto) |
| Descripción | Texto descriptivo de la partida |
| Unidad | Unidad de medida (m², ml, ud, kg, etc.) |
| Medición | Cantidad total |
| PVP unitario | Precio de venta al cliente por unidad |
| PVP total | Calculado automáticamente |
| Coste estimado unitario | Coste previsto por unidad (en fase de estudio) |
| Coste objetivo unitario | Coste que no se debe superar |
| Coste real unitario | Coste real registrado durante la ejecución |
| Coste real total | Calculado automáticamente |
| Margen estimado | PVP total − Coste estimado total |
| Margen real | PVP total − Coste real total |
| Etiquetas | Una o varias etiquetas asignadas a la partida |
| UO asignada | Unidad de Obra a la que pertenece esta partida |

#### Orden personalizado y Unidades de Obra (UO)
Esta es la funcionalidad más diferencial del módulo.

- Por defecto, la medición importada mantiene la estructura original (capítulos por oficio, como en Presto).
- El usuario puede crear un **orden personalizado**: reorganizar las partidas cronológicamente, agrupándolas en **Unidades de Obra (UO)**.
- Una UO es un bloque de partidas que se ejecutan juntas en el tiempo (ej: "Estructura planta baja", "Instalación fontanería baños", "Acabados dormitorios").
- **Importante:** El orden personalizado NO modifica ni la medición ni los precios. Es una capa de organización encima de la medición original.
- Las UO son la unidad de trabajo del Módulo de Planificación y la unidad de certificación del Módulo Económico.

#### Etiquetas
Sistema de etiquetado libre sobre las partidas. Usos principales:
- Clasificación por tipo de recurso: `mano de obra`, `material`, `maquinaria`, `subcontrata`
- Estado de gestión: `pendiente de precio`, `pendiente de definir`, `adjudicada`
- Clasificación temática: `exterior`, `estructura`, `acabados`, etc.
- Cualquier etiqueta personalizada que el usuario defina

Las etiquetas permiten:
- Filtrar la medición por etiqueta
- Exportar únicamente las partidas filtradas
- Analizar costes y márgenes por grupo de etiquetas

#### Vistas personalizadas
El usuario puede guardar combinaciones de filtros como vistas con nombre (ej: "Partidas de subcontrata", "Estructura sin certificar", etc.).

#### Órdenes de Cambio (OC)
Solo disponibles una vez comenzada la obra (modo ejecución).

Una OC es una modificación del presupuesto fuera de lo firmado originalmente con el cliente.

**Campos de una OC:**
| Campo | Descripción |
|-------|-------------|
| Número | Numeración automática correlativa |
| Fecha | Fecha de la solicitud |
| Descripción | Descripción del cambio |
| Solicitante | Cliente / Dirección Facultativa / Jefe de obra |
| Partidas afectadas | Partidas que se añaden, eliminan o modifican (en cantidad o precio) |
| Impacto en coste | Diferencia económica respecto al presupuesto original |
| Impacto en plazo | Días de más o menos que implica el cambio |
| Estado | `Pendiente de firma` / `Aprobada` / `Rechazada` |

**Regla clave sobre OC y certificaciones:**
Lo certificado es inamovible (representa trabajo ya ejecutado). Si algo certificado debe eliminarse (demolición, error, cambio de criterio), se gestiona con una OC que incluye esa partida en cantidad negativa o se crea una nueva partida de demolición valorada. Las OC pueden afectar a cualquier partida del presupuesto, independientemente de su estado de certificación.

**Exportación:** PDF y Excel de la medición completa o filtrada.

---

### M03 — Planificación

**Propósito:** Generación y seguimiento del planning de obra. Las UO del módulo Medición se importan automáticamente con su información de precio y rendimiento, generando la planificación de plazos y costes sin trabajo manual adicional.

#### Tabla PERT
La herramienta central del módulo. Cada fila es una UO.

**Columnas de la tabla PERT:**

| Campo | Descripción |
|-------|-------------|
| UO | Nombre de la Unidad de Obra (importado de Medición) |
| Dependencias | UO predecesoras (qué debe estar terminado antes de que empiece esta) |
| TP | Tiempo pesimista (días) |
| TE | Tiempo esperado (días) — si se rellena directamente, sobrescribe TP y TO |
| TO | Tiempo optimista (días) |
| Tiempo estimado | Calculado: (TP + 4·TE + TO) / 6 — o igual a TE si se introdujo directamente |
| Fecha inicio | Calculada automáticamente según dependencias y fecha de inicio de obra |
| Fecha fin | Calculada automáticamente |
| Rendimiento asignado | Rendimiento de la UO (importado de partidas o introducido manualmente) |
| Coste previsto/mes | Calculado automáticamente a partir de precio y duración de la UO |

**Modo simple vs modo PERT completo:**
- El usuario puede ocultar las columnas TP y TO con un botón "Mostrar/Ocultar PERT".
- En modo simple, solo ve y rellena el campo TE (tiempo esperado).
- En modo completo, ve TP, TE y TO y el sistema calcula el tiempo estimado por la fórmula PERT.
- Si el usuario escribe directamente en TE, ese valor sobrescribe cualquier cálculo de TP/TO.

#### Salidas generadas automáticamente
A partir de la tabla PERT, el sistema genera:

1. **Diagrama GANTT** — cronograma visual de todas las UO con sus dependencias
2. **Diagrama PERT** — diagrama de red de dependencias entre UO
3. **Calendario de obra** — vista de calendario mensual con las UO activas en cada semana
4. **Agenda de hitos** — lista cronológica de inicio y fin de cada UO, más eventos y tareas previas
5. **Curva de costes prevista** — gráfico de costes y facturación acumulados por mes, calculados automáticamente a partir de precio × medición × rendimiento de cada UO

#### Tareas previas
El usuario puede asociar tareas previas a cada UO con un plazo de antelación.

Ejemplo: "40 días antes del inicio de 'Instalación fontanería', realizar pedido de materiales a proveedor X."

El sistema genera recordatorios automáticos en el Dashboard cuando se acercan estas fechas.

#### Eventos
Una vez comenzada la obra, el usuario puede registrar eventos vinculados a fechas del planning (incidencias, paradas, visitas de obra, etc.). Los eventos quedan reflejados en el calendario y en la agenda.

#### Modo en ejecución
Una vez comenzada la obra, el módulo activa la comparativa:
- Fecha de inicio real vs planificada por UO
- Fecha de fin real vs planificada por UO
- Porcentaje de avance real vs previsto en cada fecha
- Alertas cuando una UO se retrasa y arrastra dependientes

**Exportación:** PDF del GANTT, PERT, calendario y agenda.

---

### M04 — Control

**Estado: pendiente de definición detallada.**

Este módulo se definirá una vez que los módulos M01, M02, M03, M05 y M06 estén construidos y funcionando. Se desarrollará en una fase posterior.

**Lo que se sabe hasta ahora:**
- Tendrá al menos tres secciones: Producción, Personal y Costes.
- **Producción:** registro diario del avance físico por UO/partida (m², ml, ud ejecutadas ese día).
- **Personal:** parte diario de presencia y horas trabajadas, con distinción entre trabajadores propios y subcontratas.
- **Costes:** comparativa de coste previsto vs real, rendimientos reales vs previstos, coste real de mano de obra por partida.

**No implementar este módulo hasta recibir instrucciones específicas.**

---

### M05 — Económico

**Propósito:** Gestión financiera de la obra. Agrupa certificaciones, facturas recibidas e imputación de gastos en un único módulo.

#### Certificaciones

Una certificación es la presentación formal al cliente o a la Dirección Facultativa (DF) del trabajo ejecutado, para solicitar su pago.

**Flexibilidad de certificación:** El usuario puede certificar de tres maneras, pudiendo mezclarlas dentro de la misma certificación:
- Por cantidad ejecutada de una partida (ej: "he colocado 45 m² de solado de los 120 m² totales")
- Por porcentaje de avance de una partida (ej: "la instalación eléctrica está al 60%")
- Por porcentaje de avance de un capítulo o UO completa (ej: "la UO Estructura está al 100%")

**Estados de una certificación:**

```
En proceso → Enviada → Confirmada → Pago recibido
                ↑____________↓
         (reversible si la DF la rechaza)
```

- **En proceso:** La certificación se está preparando. El jefe puede modificarla libremente.
- **Enviada:** Presentada al cliente o DF. Ya no se modifica directamente (hay que volver a "En proceso" si se rechaza).
- **Confirmada:** El cliente o DF la ha aprobado.
- **Pago recibido:** El importe ha sido cobrado.

**Regla clave:** Lo certificado es inamovible en términos de trabajo ejecutado. Ver regla de OC en M02.

**Numeración:** Las certificaciones se numeran correlativamente (Certificación 1, Certificación 2...). Cada certificación es acumulativa o independiente según lo defina el usuario.

#### Facturas recibidas

Introducción manual de facturas de proveedores y subcontratas.

**Campos por factura:**
| Campo | Descripción |
|-------|-------------|
| Número de factura | Número del documento |
| Proveedor | Seleccionable desde la base de proveedores |
| Fecha | Fecha de la factura |
| Importe | Importe total (con o sin IVA, configurable) |
| Concepto | Descripción libre |
| UO / Partida | A qué UO o partida se imputa este gasto |
| Estado de pago | Pendiente / Pagada |

**Nota sobre roles futuros:** En versiones futuras existirá un rol "Contable" que podrá introducir facturas sin acceso al resto de la obra.

**Exportación:** PDF de certificaciones (formato presentable al cliente), PDF y Excel de facturas e imputaciones.

---

### M06 — Registro

**Propósito:** Libro de incidencias y acuerdos digitales. El objetivo es eliminar la ambigüedad en los acuerdos verbales y dejar constancia de todo lo determinado con los agentes de la obra (cliente, DF, subcontratas, proveedores, etc.).

**Premisa:** La app NO almacena archivos. Solo almacena referencias escritas a archivos externos (rutas locales, URLs de Google Drive, Dropbox, etc.). Esto mantiene los costes de almacenamiento en cero.

#### Campos de una entrada de registro

| Campo | Descripción |
|-------|-------------|
| Título | Título breve de la entrada |
| Tipo | `Incidencia` / `Acuerdo` / `Reunión de obra` / `Otro` |
| Fecha | Fecha en que ocurrió |
| Agente | Con quién se produjo (DF, cliente, subcontrata X, proveedor Y, etc.) |
| Descripción | Texto libre detallando lo ocurrido o acordado |
| Referencia externa | Texto libre indicando dónde queda registrado el respaldo (ej: "WhatsApp a Pedro López el 15/04/2025 a las 10:23", "C:/Obras/Edificio Cervantes/Reuniones/Acta3.pdf", "https://drive.google.com/...") |

#### Tipo especial: Reunión de obra
- Se numera automáticamente (Reunión de obra Nº 1, Nº 2, etc.)
- Incluye lista de asistentes
- Campo de "Puntos tratados" estructurado
- Campo de referencia al acta firmada (ruta o URL externa)

**Exportación:** PDF de entradas individuales o del historial completo filtrado.

---

## 6. Base de datos global

Accesible desde la pantalla de inicio (no está dentro de ninguna obra). Es compartida entre todas las obras del usuario.

### Base de precios
- Alimentada manualmente por el usuario
- Importable desde bases de precios externas: CYPE, PREOC, Precio Centro, Sismat (y similares en formato estándar)
- También se puede nutrir con los resultados de obras ejecutadas con Monitor Lite (el usuario selecciona partidas de obras anteriores y las añade a la base)
- Estructura: código, descripción, unidad, precio, fecha de referencia, zona geográfica, notas

### Base de proveedores
- Nombre, CIF, teléfono, email, especialidad, notas
- Reutilizable entre obras
- Vinculable a facturas y tareas del planning

### Base de rendimientos
- Alimentada manualmente por el usuario
- Puede nutrirse de los rendimientos reales obtenidos en obras anteriores gestionadas con Monitor Lite
- **Campos por entrada de rendimiento:**
  - Descripción de la tarea
  - Unidad (m², ml, ud, etc.)
  - Rendimiento (unidades por hora o horas por unidad)
  - Obra de origen (seleccionable desde un desplegable con las obras registradas)
  - Fecha
  - Zona geográfica
  - Notas libres (tipo de obra, condiciones, calidad, etc.)

---

## 7. Exportación e informes

La exportación es un eje transversal de toda la app, no una función secundaria.

**Principio:** Lo que el usuario ve en pantalla es lo que se exporta. Si filtra la medición por etiqueta "subcontrata", el PDF exportado contiene solo esas partidas.

**Formatos disponibles por módulo:**

| Módulo | PDF | Excel |
|--------|-----|-------|
| Dashboard | Sí | No |
| Medición (completa o filtrada) | Sí | Sí |
| Planificación (GANTT, PERT, calendario) | Sí | No |
| Económico (certificaciones, facturas) | Sí | Sí |
| Registro (entradas individuales o historial) | Sí | No |

**El PDF de certificación** debe tener un formato presentable al cliente: membrete de obra, número de certificación, tabla de partidas certificadas con precios, importes parciales y total.

---

## 8. Roles de usuario

### Versión Lite (actual)
Un único rol: **Jefe de obra**. Acceso completo a todas las obras que ha creado.

### Roles futuros (NO implementar en versión Lite)
Se documentan aquí solo como referencia para no tomar decisiones arquitectónicas que los imposibiliten en el futuro.

| Rol | Permisos |
|-----|----------|
| Administrador | Crea obras propias + lectura de obras de otros jefes |
| Encargado de obra | Lectura: planning, atrasos, rendimientos |
| Contable | Solo acceso a Módulo 05 (Económico): introduce facturas |
| Cliente | Lectura: planning de su obra |

**Recomendación arquitectónica:** Diseñar el sistema de autenticación con roles desde el principio, aunque en la versión Lite solo exista uno. Esto facilitará la expansión futura.

---

## 9. Requisitos técnicos

### Plataforma
- Aplicación web (se abre en el navegador, sin instalación)
- Totalmente responsive: funciona en escritorio (uso principal) y en móvil (consulta y registro rápido en obra)
- Los datos se almacenan en la nube

### Rendimiento
- La app debe ser fluida. La prioridad es la experiencia de usuario limpia y sin latencias perceptibles.
- En móvil, las acciones más comunes (registrar avance, parte de presencia, añadir entrada al registro) deben completarse en menos de 30 segundos.

### Almacenamiento de archivos
- La app NO almacena archivos adjuntos. Solo referencias de texto a archivos externos.
- Esto es una decisión deliberada para mantener costes de infraestructura bajos.

### Stack recomendado (orientativo — el desarrollador puede proponer alternativas)
- Frontend: React con TypeScript, Tailwind CSS, shadcn/ui
- Backend: Node.js o equivalente
- Base de datos: PostgreSQL (via Supabase recomendado por facilidad de despliegue)
- Autenticación: Supabase Auth o similar
- Exportación PDF: librería del lado servidor (ej: Puppeteer, jsPDF, o similar)

---

## 10. Plan de desarrollo por fases

El desarrollo sigue este orden. Cada fase debe estar verificada y funcional antes de iniciar la siguiente.

### Fase 0 — Infraestructura base
- Crear proyecto web con estructura de carpetas
- Configurar base de datos
- Autenticación básica (registro e inicio de sesión)
- Navegación entre pantallas (routing)
- Pantalla de inicio con listado de obras vacío
- Creación básica de una obra (nombre, cliente, dirección, fechas)

**Verificación:** La app abre en el navegador. Se puede crear un usuario, iniciar sesión y crear una obra vacía.

### Fase 1 — M02: Medición
- Importación de .bc3 y .xlsx de Presto
- Visualización de partidas en tabla
- Edición de campos (PVP, costes, etiquetas)
- Orden personalizado y creación de UO
- Vistas personalizadas y filtros
- Exportación a PDF y Excel

**Verificación:** Se puede importar una medición real, reordenarla, agrupar en UO y exportarla.

### Fase 2 — M03: Planificación
- Tabla PERT con modo simple y modo completo
- Definición de dependencias entre UO
- Cálculo automático de fechas
- Generación de GANTT y calendario
- Curva de costes por mes
- Tareas previas con recordatorios
- Exportación a PDF

**Verificación:** A partir de las UO de Fase 1, se genera un planning funcional con GANTT y costes por mes.

### Fase 3 — M01: Dashboard
- Resumen de estado de obra
- Alertas de desvíos (plazo y coste)
- Recordatorios de tareas previas
- Exportación a PDF

**Verificación:** Al entrar a una obra con datos, el dashboard muestra información real y coherente.

### Fase 4 — M05: Económico
- Certificaciones con estados y flujo de aprobación
- Facturas recibidas (introducción manual)
- Imputación de gastos a UO/partidas
- Órdenes de Cambio (en coordinación con M02)
- Exportación a PDF y Excel

**Verificación:** Se puede crear una certificación, enviarla, confirmarla y registrar el cobro.

### Fase 5 — M06: Registro
- Entradas de registro con todos sus campos
- Tipo especial "Reunión de obra"
- Filtros por agente, tipo y fecha
- Exportación a PDF

**Verificación:** Se puede crear una entrada de registro y exportarla en PDF.

### Fase 6 — Pantalla de inicio y base de datos global
- Listado de obras con estado y métricas básicas
- Calendario general multi-obra
- Base de precios (manual + importación)
- Base de proveedores
- Base de rendimientos

**Verificación:** Desde la pantalla de inicio se gestionan varias obras y se reutilizan datos entre ellas.

### Fase 7 — M04: Control
- A definir en detalle cuando las fases anteriores estén completas.
- No implementar hasta recibir especificaciones adicionales.

### Fase 8 — Exportación e informes (refinamiento)
- Mejorar plantillas de PDF en todos los módulos
- Plantilla de certificación presentable al cliente
- Ajustes de formato y branding

---

## 11. Decisiones de diseño importantes

- **Orden personalizado no altera la medición.** Es una capa de organización encima. La medición original siempre se conserva intacta.
- **Las UO son la unidad de trabajo central.** Conectan medición, planificación, control y certificación. Cualquier funcionalidad que dependa de "qué se está haciendo" usa UO como referencia.
- **Lo certificado es inamovible.** Las modificaciones posteriores a trabajo ya certificado se gestionan siempre mediante Órdenes de Cambio.
- **Sin almacenamiento de archivos.** Solo referencias de texto. Es una decisión de coste, no una limitación técnica.
- **El PERT es opcional.** El usuario puede planificar solo con tiempos directos (TE) sin necesidad de usar TP y TO. El modo PERT avanzado se puede ocultar.
- **Exportación = lo que ves.** Los filtros aplicados en pantalla determinan el contenido exportado.
- **Roles preparados para el futuro.** Aunque la versión Lite solo tiene un rol, la arquitectura debe soportar roles múltiples desde el principio.

---

## 12. Glosario

| Término | Definición |
|---------|------------|
| UO | Unidad de Obra. Agrupación cronológica de partidas creada por el jefe de obra para organizar la planificación y la certificación. |
| Partida | Línea individual del presupuesto con código, descripción, unidad, medición y precios. |
| PERT | Program Evaluation and Review Technique. Método de planificación que usa tiempos pesimista, esperado y optimista para calcular la duración probable de cada tarea. |
| GANTT | Diagrama de barras que representa el calendario de ejecución de las tareas. |
| OC | Orden de Cambio. Modificación del presupuesto original acordada durante la ejecución. |
| DF | Dirección Facultativa. El arquitecto o ingeniero que supervisa técnicamente la obra. |
| PVP | Precio de Venta al Público. El precio que se cobra al cliente. |
| Coste estimado | Coste previsto en la fase de estudio, antes de comenzar la obra. |
| Coste objetivo | Coste máximo que no se debe superar. |
| Coste real | Coste efectivamente incurrido durante la ejecución. |
| Certificación | Documento que acredita el trabajo ejecutado y solicita su pago al cliente. |
| Rendimiento | Medida de productividad: unidades producidas por hora de trabajo (o horas necesarias por unidad). |
| Presto | Software de presupuestos de construcción ampliamente usado en España. Monitor Lite importa sus exportaciones. |
| BC3 | Formato estándar de intercambio de presupuestos de construcción en España. |
| Modo pre-obra | Estado de la obra antes de pulsar "Comenzar obra". Se usa para planificar. |
| Modo ejecución | Estado de la obra después de pulsar "Comenzar obra". Se usa para registrar y comparar. |

---

*Versión del documento: 1.0 — Fecha: abril 2026*
*Este documento debe actualizarse cada vez que se definan nuevas funcionalidades o se modifiquen las existentes.*

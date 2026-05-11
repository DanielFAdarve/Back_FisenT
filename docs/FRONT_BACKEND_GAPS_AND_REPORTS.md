# Ajustes de documentación por comentarios frontend y módulo de reportes

Este documento consolida las brechas detectadas entre pantallas frontend y contrato backend, más el requerimiento de reportes agregados. Su objetivo es dejar claro qué endpoints ya existen, cuáles requieren paginación/filtros, cuáles faltan y cómo debe evolucionar el módulo de reportes para evitar cargas masivas en cliente.

## 1) Principios de compatibilidad backend/frontend

- Preservar el contrato global `status`, `message`, `response`.
- Mantener los arrays en `response` para no romper pantallas existentes.
- Agregar metadata de paginación en una propiedad hermana `pagination`, no dentro de `response`.
- Reutilizar helpers/modelos de paginación para que pacientes, paquetes, citas, pagos, CIE10 y profesionales tengan el mismo shape.
- Evitar requests innecesarios: cuando una pantalla requiere resumen o conteos, exponer endpoints agregados.
- La fuente de verdad de rutas y servicios debe estar alineada con `docs/ENDPOINTS_NEGOCIO_LLM.md`.

Shape recomendado para listados paginados:

```json
{
  "status": 200,
  "message": "Listado consultado",
  "response": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## 2) Endpoints incompletos: ajuste aplicado

| Endpoint | Problema | Ajuste backend aplicado |
| --- | --- | --- |
| `GET /quotes/all` | No documenta paginación, `limit`, `search`, filtros por fecha/profesional/paciente ni metadata `pagination`. | Se agregaron `page`, `limit`, `search`, `fecha`, `fechaInicio`, `fechaFin`, `id_profesional`, `id_paciente` y metadata `pagination`. Se mantiene `response` como `Appointment[]`. |
| `GET /payments/` | No documenta paginación, búsqueda ni filtros por paquete/cita. | Se agregaron `page`, `limit`, `search`, `id_paquete`, `id_cita` y metadata `pagination`. Se mantiene `response` como `Payment[]`. |
| `GET /cie10/all` | Soporta `q` y `codigo`, pero no documenta paginación para catálogos grandes. | Se agregaron `page`, `limit` y `pagination` manteniendo `response` como `Cie10[]`. |
| `GET /professionals/get-all` | No documenta paginación/búsqueda; puede ser aceptable solo si el catálogo es pequeño. | Se agregaron `page`, `limit`, `search` y `pagination`. Para métricas/rankings usar endpoints de reportes. |
| `GET /packages/get-packages` | Devuelve catálogo de tipos de paquete, no paquetes asignados. No documenta paginación para catálogos grandes. | Se mantiene como catálogo y se agregaron `page`, `limit`, `search` y `pagination` sin cambiar `response`. |

## 3) Endpoints faltantes por pantalla: ajuste aplicado

| Página | Endpoint faltante | Método | Motivo | Ajuste aplicado |
| --- | --- | --- | --- | --- |
| `PackagesPage` | `/packages/get-assigned?page=1&limit=20&search=...` o equivalente | `GET` | La pantalla lista paquetes asignados a pacientes, pero la documentación indica que `/packages/get-packages` devuelve solo catálogo de tipos de paquete. | Se creó `GET /packages/get-assigned` con filtros y paginación. |
| `AppointmentsPage` | `/quotes/:id` | `PUT` | La pantalla permite editar citas, pero la documentación/ruta actual usa `/quotes/update/:id`. | Se agregó alias `PUT /quotes/:id` y se conserva `PUT /quotes/update/:id`. |
| `HistoryPage` | `/history/get-by-patient/:id` | `GET` | La pantalla filtra historia por paciente; actualmente se resuelve con agregación en cliente usando citas + historias por cita. | Se creó `GET /history/get-by-patient/:id`. |
| `Cie10Page` | `/cie10/:id` | `PUT` | La pantalla permite editar CIE10, pero docs solo documentan crear y consultar. | Se implementó actualización con normalización de `codigo`, validación de duplicados y respuesta estándar. |
| `PaymentsPage` | `/payments/appointment-summary/:id` | `GET` | La pantalla pide resumen por cita; docs solo tienen resumen por paquete. | Se creó resumen por cita con total, abonado, saldo, estado y cantidad de abonos. |

## 4) Buenas prácticas aplicadas/requeridas

- Contrato backend/frontend preservado: no crear `response.data`; los arrays siguen en `response` y la metadata queda en `pagination`.
- Reutilización: la paginación debe abstraerse en modelos/helpers para evitar shapes distintos entre módulos.
- Menos requests innecesarios: los hooks frontend deben poder cancelar requests anteriores y usar debounce en búsquedas; backend debe responder con filtros reales.
- Compatibilidad: métodos existentes como `patientService.getAll()` pueden seguir devolviendo solo el array para pantallas antiguas, mientras métodos nuevos tipo `getPaginated()` consumen `{ response, pagination }`.
- Fuente de verdad: las rutas de servicios frontend deben contrastarse contra la documentación backend para pacientes, paquetes, citas, historia, pagos y CIE10.

## 5) Requerimiento backend: Reports Page

### Objetivo

Optimizar el módulo de reportes para evitar que el frontend descargue todos los registros completos mediante:

- `patientService.getAll()`
- `packageService.getAll()`
- `appointmentService.getAll()`
- `paymentService.getAll()`
- `professionalService.getAll()`

El frontend solo debe consumir resúmenes y datasets ya agrupados, y limitarse a renderizar cards y gráficas.

### Problema actual

- Se descargan listas completas.
- Se hacen `reduce`, `filter`, `map` y agrupaciones en frontend.
- No hay filtros reales por periodo en backend.
- El selector `week`, `month`, `quarter` no impacta backend.
- Hay alto consumo de memoria y múltiples requests innecesarios.

### Parámetros globales

Todos los endpoints de reportes deben soportar:

- `period=week|month|quarter`
- `startDate=YYYY-MM-DD` opcional
- `endDate=YYYY-MM-DD` opcional

Si `startDate` y `endDate` están presentes, deben tener prioridad sobre `period`.

## 6) Endpoints recomendados para reportes

### Prioridad alta

| Endpoint | Uso |
| --- | --- |
| `GET /reports/dashboard` | Cards KPI, resumen general, overview dashboard. |
| `GET /reports/revenue` | Gráfica de ingresos y evolución mensual. |
| `GET /reports/appointments/status-distribution` | Barras/progreso por estado de cita. |

### Prioridad media

| Endpoint | Uso |
| --- | --- |
| `GET /reports/professionals/top?limit=5&period=month` | Ranking de profesionales. |
| `GET /reports/packages/by-type` | Distribución de paquetes. |
| `GET /reports/packages/near-completion?threshold=70&limit=5` | Alertas de paquetes próximos a terminar. |
| `GET /reports/payments/recent?limit=5` | Feed de actividad reciente. |

### Prioridad baja/media

| Endpoint | Uso |
| --- | --- |
| `GET /reports/sessions/summary` | Gráfico circular de progreso de sesiones. |
| Endpoints analíticos avanzados | Comparativas históricas y tendencias. |

## 7) Respuesta principal esperada: `GET /reports/dashboard`

```json
{
  "status": 200,
  "message": "Dashboard report",
  "response": {
    "patients": {
      "active": 120,
      "inactive": 15,
      "total": 135
    },
    "appointments": {
      "completed": 230,
      "scheduled": 40,
      "cancelled": 20,
      "noShow": 10,
      "attendanceRate": 88
    },
    "sessions": {
      "completed": 480,
      "pending": 120,
      "total": 600,
      "completionRate": 80
    },
    "revenue": {
      "total": 25000000,
      "byMonth": [
        {
          "month": "2026-01",
          "amount": 5000000
        }
      ],
      "byPaymentMethod": [
        {
          "method": "EFECTIVO",
          "amount": 12000000
        },
        {
          "method": "TRANSFERENCIA",
          "amount": 8000000
        }
      ]
    },
    "packages": {
      "total": 80,
      "byType": [
        {
          "type": "REHABILITACION",
          "count": 40
        }
      ],
      "nearCompletion": [
        {
          "id": 1,
          "nombre": "Paquete Rodilla",
          "completionPercentage": 85,
          "sesionesRealizadas": 17,
          "cantidadSesiones": 20,
          "paciente": {
            "id": 5,
            "nombres": "Ana",
            "apellidos": "Perez"
          }
        }
      ]
    },
    "professionals": {
      "top": [
        {
          "id": 2,
          "nombres": "Carlos",
          "apellidos": "Lopez",
          "appointments": 42
        }
      ]
    },
    "recentPayments": [
      {
        "id": 1,
        "tipo": "ABONO",
        "valor": 200000,
        "metodo_pago": "EFECTIVO",
        "fecha_pago": "2026-05-10T10:00:00"
      }
    ]
  }
}
```

## 8) Optimizaciones obligatorias para reportes

- Usar agregaciones SQL (`COUNT`, `SUM`, `GROUP BY`, funciones de fecha) en servicios/repositorios.
- Evitar retornar listas completas para que el frontend calcule métricas.
- Soportar filtros por periodo y por rango de fecha explícito.
- Optimizar joins y seleccionar solo campos necesarios.
- Limitar feeds recientes con `limit`.
- Validar y normalizar `period`, `startDate`, `endDate`, `limit` y `threshold`.

## 9) No hacer

- No retornar miles de pagos, citas o paquetes en endpoints de reportes.
- No obligar al frontend a hacer cálculos pesados con `reduce`, `map`, `groupBy` o filtros complejos.
- No reutilizar endpoints CRUD masivos como fuente de datos del dashboard.

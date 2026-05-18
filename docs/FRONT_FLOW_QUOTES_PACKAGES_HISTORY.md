# Flujo frontend: paquetes, citas e historia clínica

Este documento describe el flujo recomendado para el frontend entre **paquetes**, **citas** e **historia clínica**, incluyendo el modelo JSON esperado en cada endpoint mencionado, respuestas de error conocidas y consideraciones de integración.

## Convenciones generales

Base de rutas:

- Paquetes: `/packages`
- Citas: `/quotes`
- Historias clínicas: `/history`

Todas las respuestas JSON del backend usan un envelope estándar:

```json
{
  "status": 200,
  "message": "Mensaje",
  "response": {}
}
```

Los endpoints paginados agregan `pagination`:

```json
{
  "status": 200,
  "message": "Mensaje",
  "response": [],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

> Nota: en varios `catch` el backend responde HTTP `400`, pero dentro del envelope puede venir `status: 500`. En frontend conviene validar tanto el HTTP status como `body.status`.

### Modelo de error estándar

```json
{
  "status": 400,
  "message": "Mensaje de error",
  "response": null
}
```

Errores transversales frecuentes:

| HTTP | `status` envelope | Caso | Mensaje típico |
| --- | ---: | --- | --- |
| 400 | 400 | Validación de negocio | `id_pacientes e id_paquetes_atenciones son obligatorios` |
| 400 | 400 | Recurso relacionado no existe | `Paciente no encontrado para asignar el paquete` |
| 400 | 400 | Paquete/cita inválida | `Paquete no encontrado`, `Cita no encontrada` |
| 400 | 500 | Error capturado por algunos controladores | Mensaje original del error |
| 500 | 500 | Error no controlado en eliminación/disponibilidad | Mensaje original del error |

---

## 1. Catálogo de tipos de paquete

### `GET /packages/get-packages?page=1&limit=20&search=terapia`

Usar para pintar el catálogo de paquetes/planes disponibles antes de asignarlos a un paciente.

Query params:

| Param | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `page` | number | No | Página, por defecto `1`. |
| `limit` | number | No | Registros por página, por defecto `20`. |
| `search` | string | No | Busca por `descripcion` del paquete. |

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Consultada la informacion de los paquetes",
  "response": [
    {
      "id": 2,
      "descripcion": "Paquete fisioterapia 10 sesiones",
      "cantidad_sesiones": 10,
      "valor": 500000
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Respuesta vacía válida:

```json
{
  "status": 200,
  "message": "Consultada la informacion de los paquetes",
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

Error posible:

```json
{
  "status": 500,
  "message": "No hubo respuesta del servidor al obtener paquetes",
  "response": null
}
```

---

## 2. Crear suscripción/paquete asignado al paciente

### `POST /packages/create`

Crea un paquete activo para un paciente. El backend impide crear otro paquete activo del mismo tipo para el mismo paciente.

Body recomendado:

```json
{
  "id_pacientes": 1,
  "id_paquetes_atenciones": 2,
  "id_profesional": 3,
  "id_cie_secundario": 15,
  "id_estado_citas": 1
}
```

Campos:

| Campo | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `id_pacientes` | number | Sí | Paciente dueño del paquete. |
| `id_paquetes_atenciones` | number | Sí | Tipo de paquete del catálogo. |
| `id_profesional` | number | No | Profesional sugerido/asignado. Si existe, se precarga al agendar cita. |
| `id_cie_secundario` | number | No | Motivo/diagnóstico secundario asociado al paquete. |
| `id_estado_citas` | number | No | Si no se envía, backend asigna `1` (activo). |

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Paquete creado",
  "response": {
    "id": 30,
    "id_pacientes": 1,
    "id_paquetes_atenciones": 2,
    "id_profesional": 3,
    "id_cie_secundario": 15,
    "id_estado_citas": 1,
    "patient": {
      "id": 1,
      "nombre": "Ana",
      "apellido": "Pérez",
      "num_doc": "123"
    },
    "attentionPackage": {
      "id": 2,
      "descripcion": "Paquete fisioterapia 10 sesiones",
      "cantidad_sesiones": 10,
      "valor": 500000
    },
    "statusPackage": {
      "id": 1,
      "nombre": "Activo"
    },
    "professional": {
      "id": 3,
      "nombre": "Laura",
      "apellido": "Gómez"
    },
    "secondaryDiagnosis": {
      "id": 15,
      "codigo": "M54",
      "descripcion": "Dorsalgia"
    },
    "Quotes": [],
    "resumen_sesiones": {
      "sesiones_totales": 10,
      "sesiones_usadas": 0,
      "sesiones_disponibles": 10,
      "completo": false
    }
  }
}
```

Errores posibles:

```json
{
  "status": 400,
  "message": "id_pacientes e id_paquetes_atenciones son obligatorios",
  "response": null
}
```

```json
{
  "status": 400,
  "message": "El paciente ya tiene un paquete activo de este tipo.",
  "response": null
}
```

Otros mensajes: `Paciente no encontrado para asignar el paquete`, `Tipo de paquete no encontrado`, `Profesional no encontrado para asignar el paquete`, `CIE10 secundario no encontrado para el motivo de consulta`.

Consideraciones frontend:

1. Después de crear, guardar `response.id` como `id_paquete` para agendar citas.
2. El objeto ya viene hidratado para refrescar una tabla de paquetes asignados sin una consulta adicional.
3. Si el backend responde duplicidad, conviene ofrecer continuar con el paquete activo existente; hoy el endpoint no devuelve el paquete duplicado, así que el front debe consultarlo con `GET /packages/get-assigned?id_paciente=...&id_estado_citas=1` o `GET /packages/get-by-patient/:id`.

---

## 3. Consultar paquetes asignados

### `GET /packages/get-assigned?page=1&limit=20&id_paciente=1&id_profesional=3&id_estado_citas=1&search=ana`

Usar para grillas administrativas con filtros.

Query params:

| Param | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `page`, `limit` | number | No | Paginación. |
| `id_paciente` | number | No | Filtra paquetes del paciente. |
| `id_profesional` | number | No | Filtra por profesional asignado. |
| `id_estado_citas` | number | No | Filtra por estado del paquete. `1` activo, `3` cerrado según constantes del servicio. |
| `search` | string | No | Busca por paciente, documento, paquete o profesional. |

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Listado de paquetes asignados",
  "response": [
    {
      "id": 30,
      "id_pacientes": 1,
      "id_paquetes_atenciones": 2,
      "id_profesional": 3,
      "id_cie_secundario": 15,
      "id_estado_citas": 1,
      "patient": {
        "id": 1,
        "nombre": "Ana",
        "apellido": "Pérez",
        "num_doc": "123"
      },
      "attentionPackage": {
        "id": 2,
        "descripcion": "Paquete fisioterapia 10 sesiones",
        "cantidad_sesiones": 10,
        "valor": 500000
      },
      "statusPackage": {
        "id": 1,
        "nombre": "Activo"
      },
      "professional": {
        "id": 3,
        "nombre": "Laura",
        "apellido": "Gómez"
      },
      "secondaryDiagnosis": {
        "id": 15,
        "codigo": "M54",
        "descripcion": "Dorsalgia"
      },
      "Quotes": [
        {
          "id": 101,
          "fecha_agendamiento": "2026-05-20",
          "horario_inicio": "09:00:00",
          "horario_fin": "09:45:00",
          "numero_sesion": 1,
          "id_estado_citas": 1
        }
      ],
      "resumen_sesiones": {
        "sesiones_totales": 10,
        "sesiones_usadas": 1,
        "sesiones_disponibles": 9,
        "completo": false
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### `GET /packages/get-by-patient/:idPaciente`

Usar para detalle del paciente. Devuelve el mismo modelo de paquete asignado, pero sin `pagination`.

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Paquetes del paciente",
  "response": [
    {
      "id": 30,
      "id_pacientes": 1,
      "id_paquetes_atenciones": 2,
      "id_profesional": 3,
      "id_cie_secundario": 15,
      "id_estado_citas": 1,
      "patient": {
        "id": 1,
        "nombre": "Ana",
        "apellido": "Pérez",
        "num_doc": "123"
      },
      "attentionPackage": {
        "id": 2,
        "descripcion": "Paquete fisioterapia 10 sesiones",
        "cantidad_sesiones": 10,
        "valor": 500000
      },
      "statusPackage": {
        "id": 1,
        "nombre": "Activo"
      },
      "professional": {
        "id": 3,
        "nombre": "Laura",
        "apellido": "Gómez"
      },
      "secondaryDiagnosis": {
        "id": 15,
        "codigo": "M54",
        "descripcion": "Dorsalgia"
      },
      "Quotes": [],
      "resumen_sesiones": {
        "sesiones_totales": 10,
        "sesiones_usadas": 0,
        "sesiones_disponibles": 10,
        "completo": false
      }
    }
  ]
}
```

Respuesta sin paquetes:

```json
{
  "status": 200,
  "message": "Paquetes del paciente",
  "response": []
}
```

---

## 4. Consultar detalle y cerrar paquete

### `GET /packages/get/:idPaquete`

Útil cuando el front ya tiene `id_paquete` y necesita validar el estado/uso actual.

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Detalle del paquete",
  "response": {
    "id": 30,
    "id_pacientes": 1,
    "id_paquetes_atenciones": 2,
    "id_profesional": 3,
    "id_cie_secundario": 15,
    "id_estado_citas": 1,
    "patient": {
      "id": 1,
      "nombre": "Ana",
      "apellido": "Pérez",
      "num_doc": "123"
    },
    "attentionPackage": {
      "id": 2,
      "descripcion": "Paquete fisioterapia 10 sesiones",
      "cantidad_sesiones": 10,
      "valor": 500000
    },
    "statusPackage": {
      "id": 1,
      "nombre": "Activo"
    },
    "professional": {
      "id": 3,
      "nombre": "Laura",
      "apellido": "Gómez"
    },
    "secondaryDiagnosis": {
      "id": 15,
      "codigo": "M54",
      "descripcion": "Dorsalgia"
    },
    "Quotes": [],
    "resumen_sesiones": {
      "sesiones_totales": 10,
      "sesiones_usadas": 0,
      "sesiones_disponibles": 10,
      "completo": false
    }
  }
}
```

> Consideración: si no existe, `response` puede venir `null` con `status: 200`, porque el controlador no convierte ese caso en 404. El frontend debería manejar `!response`.

### `PUT /packages/close/:idPaquete`

Cierra manualmente un paquete, asignando estado `3`.

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Paquete cerrado",
  "response": {
    "id": 30,
    "id_pacientes": 1,
    "id_paquetes_atenciones": 2,
    "id_profesional": 3,
    "id_cie_secundario": 15,
    "id_estado_citas": 3,
    "patient": {
      "id": 1,
      "nombre": "Ana",
      "apellido": "Pérez",
      "num_doc": "123"
    },
    "attentionPackage": {
      "id": 2,
      "descripcion": "Paquete fisioterapia 10 sesiones",
      "cantidad_sesiones": 10,
      "valor": 500000
    },
    "statusPackage": {
      "id": 3,
      "nombre": "Cerrado"
    },
    "professional": {
      "id": 3,
      "nombre": "Laura",
      "apellido": "Gómez"
    },
    "secondaryDiagnosis": {
      "id": 15,
      "codigo": "M54",
      "descripcion": "Dorsalgia"
    },
    "Quotes": [],
    "resumen_sesiones": {
      "sesiones_totales": 10,
      "sesiones_usadas": 0,
      "sesiones_disponibles": 10,
      "completo": false
    }
  }
}
```

Error posible:

```json
{
  "status": 400,
  "message": "Paquete no encontrado",
  "response": null
}
```

---

## 5. Selector de paquetes disponibles para agendar

### Crear cita

`GET /packages/get-available-by-patient/:idPaciente`

### Editar cita

`GET /packages/get-available-by-patient/:idPaciente?quoteId=:idCita`

Devuelve solo paquetes activos (`id_estado_citas = 1`) que tengan sesiones disponibles. En edición, también incluye el paquete de la cita actual aunque al descontar otras citas quede en `0`.

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Paquetes con citas disponibles",
  "response": [
    {
      "id_paquete": 30,
      "sesiones_disponibles": 3,
      "sesiones_totales": 10,
      "sesiones_usadas": 7,
      "tipo_paquete": "Paquete fisioterapia 10 sesiones",
      "id_tipo_paquete": 2,
      "id_profesional": 3,
      "profesional": "Laura Gómez",
      "id_cie_secundario": 15,
      "motivo_secundario": "M54 - Dorsalgia",
      "tiene_cita_actual": false
    }
  ]
}
```

Respuesta sin disponibilidad:

```json
{
  "status": 200,
  "message": "Paquetes con citas disponibles",
  "response": []
}
```

Consideraciones frontend:

- En edición siempre enviar `quoteId` para que no se descuente dos veces la cita actual.
- Si `tiene_cita_actual = true`, mostrarlo aunque `sesiones_disponibles` sea `0`, porque es el paquete ya seleccionado.
- Si viene `id_profesional`, precargar profesional de la cita; si no viene, exigir selección manual antes de crear/actualizar.
- Este endpoint no devuelve datos básicos del paciente; si el selector necesita nombre/documento, usar la data del contexto del paciente o `GET /packages/get-by-patient/:idPaciente`.

---

## 6. Agendar cita

### `POST /quotes/create`

Crea una cita asociada a un paquete. Recalcula los números de sesión del paquete y cierra automáticamente el paquete cuando las citas alcanzan `cantidad_sesiones`.

Body recomendado:

```json
{
  "fecha_agendamiento": "2026-05-20",
  "horario_inicio": "09:00",
  "horario_fin": "09:45",
  "recordatorio": false,
  "id_estado_citas": 1,
  "motivo": "Control de evolución",
  "id_paquetes": 30
}
```

Campos:

| Campo | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `fecha_agendamiento` | string `YYYY-MM-DD` | Sí | Fecha de la cita. |
| `horario_inicio` | string `HH:mm` o `HH:mm:ss` | Sí | Hora inicial. |
| `horario_fin` | string `HH:mm` o `HH:mm:ss` | Recomendado | Necesario para validar colisión real por rango. |
| `recordatorio` | boolean | Sí según modelo | Indica si habrá recordatorio. |
| `id_estado_citas` | number | Sí según modelo | Estado de la cita. |
| `motivo` | string | Sí según modelo | Motivo de consulta/evolución. |
| `id_paquetes` | number | Sí | Paquete que consume sesión. |
| `id_profesional` | number | Condicional | Si el paquete tiene profesional, backend lo autocompleta. Si no, debe enviarse. |

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Cita creada",
  "response": {
    "cita": {
      "id": 101,
      "fecha_agendamiento": "2026-05-20",
      "horario_inicio": "09:00:00",
      "horario_fin": "09:45:00",
      "pagado": false,
      "numero_sesion": 8,
      "recordatorio": false,
      "id_estado_citas": 1,
      "motivo": "Control de evolución",
      "id_profesional": 3,
      "id_paquetes": 30,
      "package": {
        "id": 30,
        "id_pacientes": 1,
        "id_paquetes_atenciones": 2,
        "id_profesional": 3,
        "id_cie_secundario": 15,
        "id_estado_citas": 1,
        "patient": {
          "id": 1,
          "nombre": "Ana",
          "apellido": "Pérez",
          "num_doc": "123"
        },
        "attentionPackage": {
          "id": 2,
          "descripcion": "Paquete fisioterapia 10 sesiones",
          "cantidad_sesiones": 10,
          "valor": 500000
        }
      },
      "professional": {
        "id": 3,
        "nombre": "Laura",
        "apellido": "Gómez"
      },
      "status": {
        "id": 1,
        "nombre": "Agendada"
      },
      "HistoryQuotes": [],
      "agendamiento": {
        "id_cita": 101,
        "id_paquete": 30,
        "id_paciente": 1,
        "id_profesional": 3,
        "fecha": "2026-05-20",
        "hora_inicio": "09:00:00",
        "hora_fin": "09:45:00",
        "numero_sesion": 8,
        "sesiones_totales_paquete": 10,
        "sesiones_usadas_paquete": 8,
        "sesiones_disponibles_paquete": 2,
        "paquete_completo": false,
        "tiene_historia": false,
        "id_historial": null
      }
    },
    "agendamiento": {
      "id_cita": 101,
      "id_paquete": 30,
      "id_paciente": 1,
      "id_profesional": 3,
      "fecha": "2026-05-20",
      "hora_inicio": "09:00:00",
      "hora_fin": "09:45:00",
      "numero_sesion": 8,
      "sesiones_totales_paquete": 10,
      "sesiones_usadas_paquete": 8,
      "sesiones_disponibles_paquete": 2,
      "paquete_completo": false,
      "tiene_historia": false,
      "id_historial": null
    },
    "paquete": {
      "id_paquete": 30,
      "id_estado_citas": 1,
      "sesiones_totales": 10,
      "sesiones_usadas": 8,
      "sesiones_disponibles": 2,
      "completo": false
    }
  }
}
```

Errores posibles:

```json
{
  "status": 400,
  "message": "La fecha de agendamiento es obligatoria",
  "response": null
}
```

```json
{
  "status": 400,
  "message": "La cita colisiona con otra cita del profesional",
  "response": null
}
```

Otros mensajes: `La hora de inicio es obligatoria`, `Debe indicar un profesional o un paquete asociado`, `Profesional no encontrado`, `Paquete no encontrado`, `El paquete no está activo`, `Debe indicar un profesional para agendar la cita`, `Configuración del paquete no encontrada o sin sesiones configuradas`, `No hay sesiones disponibles en el paquete`.

Orden recomendado en frontend:

1. Seleccionar paciente.
2. Consultar paquetes disponibles.
3. Seleccionar paquete.
4. Precargar profesional si el paquete lo tiene; si no, pedir profesional.
5. Consultar disponibilidad del profesional y día.
6. Enviar `POST /quotes/create`.
7. Refrescar agenda con la respuesta inmediata (`response.agendamiento`) o con `GET /quotes/all`.

---

## 7. Listar citas / agenda

### `GET /quotes/all?page=1&limit=20&fecha=2026-05-20&id_profesional=3&id_paciente=1&search=ana`

Usar para agenda, grillas de citas y filtros por paciente/profesional/fecha.

Query params:

| Param | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `page`, `limit` | number | No | Paginación. |
| `fecha` | string `YYYY-MM-DD` | No | Filtra una fecha exacta. |
| `fechaInicio`, `fechaFin` | string `YYYY-MM-DD` | No | Filtra rango, solo aplica si no se envía `fecha`. |
| `id_profesional` | number | No | Filtra citas del profesional. |
| `id_paciente` | number | No | Filtra por paciente dueño del paquete. |
| `search` | string | No | Busca por motivo, profesional, paciente o documento. |

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Citas",
  "response": [
    {
      "id": 101,
      "fecha": "2026-05-20",
      "hora_inicio": "09:00:00",
      "hora_fin": "09:45:00",
      "numero_sesion": 8,
      "pagado": false,
      "motivo": "Control de evolución",
      "id_profesional": 3,
      "id_paquetes": 30,
      "id_estado_citas": 1,
      "paciente": "Ana Pérez",
      "id_paciente": 1,
      "num_doc_paciente": "123",
      "profesional": "Laura",
      "apellido_profesional": "Gómez",
      "estado": "Agendada",
      "tipo_paquete": "Paquete fisioterapia 10 sesiones",
      "sesiones_totales_paquete": 10,
      "tiene_historia": false,
      "id_historial": null
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

## 8. Editar cita

### `PUT /quotes/update/:idCita`

Alias también disponible: `PUT /quotes/:idCita`.

Body recomendado: enviar el mismo modelo de creación con los campos modificados. El backend mezcla la data actual con el body, por lo que permite actualización parcial; aun así, para evitar ambigüedad, el front debería enviar fecha, horas, paquete/profesional, estado y motivo.

```json
{
  "fecha_agendamiento": "2026-05-21",
  "horario_inicio": "10:00",
  "horario_fin": "10:45",
  "recordatorio": true,
  "id_estado_citas": 1,
  "motivo": "Control reagendado",
  "id_profesional": 3,
  "id_paquetes": 30
}
```

Respuesta exitosa: mismo modelo que `POST /quotes/create`, con mensaje `Cita actualizada correctamente`.

```json
{
  "status": 200,
  "message": "Cita actualizada correctamente",
  "response": {
    "cita": {
      "id": 101,
      "fecha_agendamiento": "2026-05-21",
      "horario_inicio": "10:00:00",
      "horario_fin": "10:45:00",
      "numero_sesion": 8,
      "id_profesional": 3,
      "id_paquetes": 30,
      "package": {},
      "professional": {},
      "status": {},
      "HistoryQuotes": [],
      "agendamiento": {
        "id_cita": 101,
        "id_paquete": 30,
        "id_paciente": 1,
        "id_profesional": 3,
        "fecha": "2026-05-21",
        "hora_inicio": "10:00:00",
        "hora_fin": "10:45:00",
        "numero_sesion": 8,
        "sesiones_totales_paquete": 10,
        "sesiones_usadas_paquete": 8,
        "sesiones_disponibles_paquete": 2,
        "paquete_completo": false,
        "tiene_historia": false,
        "id_historial": null
      }
    },
    "agendamiento": {
      "id_cita": 101,
      "id_paquete": 30,
      "id_paciente": 1,
      "id_profesional": 3,
      "fecha": "2026-05-21",
      "hora_inicio": "10:00:00",
      "hora_fin": "10:45:00",
      "numero_sesion": 8,
      "sesiones_totales_paquete": 10,
      "sesiones_usadas_paquete": 8,
      "sesiones_disponibles_paquete": 2,
      "paquete_completo": false,
      "tiene_historia": false,
      "id_historial": null
    },
    "paquete": {
      "id_paquete": 30,
      "id_estado_citas": 1,
      "sesiones_totales": 10,
      "sesiones_usadas": 8,
      "sesiones_disponibles": 2,
      "completo": false
    }
  }
}
```

Errores posibles: los mismos de creación, más `Cita no encontrada`.

Consideraciones:

- Si cambia de paquete, el backend recalcula sesiones en el paquete anterior y el nuevo.
- Para armar el selector de paquetes en edición, llamar antes a `GET /packages/get-available-by-patient/:idPaciente?quoteId=:idCita`.
- Si el paquete anterior queda con cupos, podría reabrirse como activo por el recálculo automático.

---

## 9. Validar disponibilidad del profesional

### `GET /quotes/availability/:idProfesional?date=YYYY-MM-DD`

Devuelve las citas existentes del profesional en la fecha. El front debe usarlo para pintar bloques ocupados antes de crear/editar. La validación final de colisión se hace igualmente en backend al guardar.

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Disponibilidad",
  "response": [
    {
      "id": 101,
      "fecha_agendamiento": "2026-05-20",
      "horario_inicio": "09:00:00",
      "horario_fin": "09:45:00",
      "pagado": false,
      "numero_sesion": 8,
      "recordatorio": false,
      "id_estado_citas": 1,
      "motivo": "Control de evolución",
      "id_profesional": 3,
      "id_paquetes": 30,
      "status": {
        "id": 1,
        "nombre": "Agendada"
      },
      "package": {
        "id": 30,
        "id_pacientes": 1,
        "id_paquetes_atenciones": 2,
        "id_profesional": 3,
        "id_cie_secundario": 15,
        "id_estado_citas": 1,
        "patient": {
          "id": 1,
          "nombre": "Ana",
          "apellido": "Pérez"
        }
      }
    }
  ]
}
```

Respuesta sin citas:

```json
{
  "status": 200,
  "message": "Disponibilidad",
  "response": []
}
```

Error si falta `date`:

```json
{
  "status": 400,
  "message": "Parámetro date es requerido (YYYY-MM-DD)",
  "response": null
}
```

---

## 10. Citas por paquete

### `GET /quotes/get-by-package/:idPaquete`

Útil para ver sesiones consumidas de un paquete y sus historias asociadas.

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Citas del paquete",
  "response": [
    {
      "id": 101,
      "fecha_agendamiento": "2026-05-20",
      "horario_inicio": "09:00:00",
      "horario_fin": "09:45:00",
      "pagado": false,
      "numero_sesion": 1,
      "recordatorio": false,
      "id_estado_citas": 1,
      "motivo": "Control de evolución",
      "id_profesional": 3,
      "id_paquetes": 30,
      "package": {
        "id": 30,
        "patient": {
          "id": 1,
          "nombre": "Ana",
          "apellido": "Pérez",
          "num_doc": "123"
        },
        "attentionPackage": {
          "id": 2,
          "descripcion": "Paquete fisioterapia 10 sesiones",
          "cantidad_sesiones": 10,
          "valor": 500000
        }
      },
      "professional": {
        "id": 3,
        "nombre": "Laura",
        "apellido": "Gómez"
      },
      "status": {
        "id": 1,
        "nombre": "Agendada"
      },
      "HistoryQuotes": [
        {
          "id": 55,
          "fecha_evolucion": "2026-05-20",
          "id_cie": 15,
          "Cie10": {
            "id": 15,
            "codigo": "M54",
            "descripcion": "Dorsalgia"
          }
        }
      ]
    }
  ]
}
```

---

## 11. Eliminar cita

### `DELETE /quotes/:idCita`

Elimina la cita y sus historias asociadas; luego recalcula sesiones y estado del paquete.

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Cita eliminada",
  "response": {
    "id_paquete": 30,
    "id_estado_citas": 1,
    "sesiones_totales": 10,
    "sesiones_usadas": 7,
    "sesiones_disponibles": 3,
    "completo": false
  }
}
```

Error posible:

```json
{
  "status": 500,
  "message": "Cita no encontrada",
  "response": null
}
```

### `DELETE /history/delete-quote/:idCita`

También elimina la cita y sus historias, pero **no recalcula el paquete** en el servicio actual. Para agenda/paquetes es preferible usar `DELETE /quotes/:idCita`.

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Cita eliminada",
  "response": {
    "id_cita": 101,
    "historias_eliminadas": true
  }
}
```

---

## 12. Crear historia/evolución de una cita

### `POST /history/create`

Crea una única evolución por cita. También sincroniza antecedentes del paciente si se envían en el body.

Body recomendado:

```json
{
  "id_cita": 101,
  "id_cie": 15,
  "fecha_evolucion": "2026-05-20",
  "descripcion_estado_paciente": "Paciente estable, dolor leve",
  "subjetivo": "Refiere disminución del dolor.",
  "objetivo": "Mejora rango de movilidad.",
  "intervencion": "Terapia manual y ejercicio terapéutico.",
  "recomendaciones": "Continuar ejercicios en casa.",
  "antecedentes": "Sin antecedentes relevantes",
  "antecedentes_personales": "No refiere",
  "antecedentes_patologicos": "No refiere",
  "antecedentes_quirurgicos": "No refiere",
  "antecedentes_traumaticos": "Esguince previo",
  "antecedentes_farmacologicos": "No refiere",
  "antecedentes_familiares": "No refiere",
  "antecedentes_sociales": "Actividad física recreativa"
}
```

Campos obligatorios por backend/modelo:

| Campo | Obligatorio | Comentario |
| --- | --- | --- |
| `id_cita` | Sí | Debe existir y tener paquete/paciente. |
| `id_cie` | Sí | Debe existir en CIE10. |
| `descripcion_estado_paciente` | Sí | `allowNull: false`. |
| `recomendaciones` | Sí | `allowNull: false`. |
| `fecha_evolucion` | No | Si no se envía, backend usa la fecha actual. |
| `subjetivo`, `objetivo`, `intervencion` | No | Textos clínicos. |
| Antecedentes | No | Si se envían, actualizan el paciente. |

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Historial creado",
  "response": {
    "id": 55,
    "id_cita": 101,
    "fecha_evolucion": "2026-05-20",
    "subjetivo": "Refiere disminución del dolor.",
    "objetivo": "Mejora rango de movilidad.",
    "intervencion": "Terapia manual y ejercicio terapéutico.",
    "descripcion_estado_paciente": "Paciente estable, dolor leve",
    "recomendaciones": "Continuar ejercicios en casa.",
    "id_cie": 15
  }
}
```

Errores posibles:

```json
{
  "status": 500,
  "message": "id_cita e id_cie son obligatorios",
  "response": null
}
```

```json
{
  "status": 500,
  "message": "La cita ya tiene una evolución registrada",
  "response": null
}
```

Otros mensajes: `La cita asociada no existe`, `La cita no tiene paquete/paciente asociado`, `El código CIE10 no existe`.

---

## 13. Consultar historia por cita para formulario clínico

### `GET /history/get-by-quote/:idCita`

Este es el endpoint más útil para abrir la pantalla de atención: trae datos de cita, paquete, paciente, antecedentes, CIE10 del paciente y la historia si ya existe. Si no existe historia, los campos clínicos vienen en `null`.

Respuesta con historia existente:

```json
{
  "status": 200,
  "message": "Historial",
  "response": {
    "id_cita": 101,
    "fecha": "2026-05-20",
    "hora_inicio": "09:00:00",
    "hora_fin": "09:45:00",
    "numero_sesion": 8,
    "motivo": "Control de evolución",
    "id_estado_cita": 1,
    "estado_cita": "Agendada",
    "id_historial": 55,
    "cie10_historia": {
      "id": 15,
      "codigo": "M54",
      "descripcion": "Dorsalgia"
    },
    "descripcion_estado_paciente": "Paciente estable, dolor leve",
    "subjetivo": "Refiere disminución del dolor.",
    "objetivo": "Mejora rango de movilidad.",
    "intervencion": "Terapia manual y ejercicio terapéutico.",
    "recomendaciones": "Continuar ejercicios en casa.",
    "id_paquete": 30,
    "id_tipo_paquete": 2,
    "tipo_paquete": "Paquete fisioterapia 10 sesiones",
    "sesiones_totales_paquete": 10,
    "id_estado_paquete": 1,
    "estado_paquete": "Activo",
    "id_profesional": 3,
    "profesional": "Laura Gómez",
    "tipo_doc": "CC",
    "num_doc": "123",
    "telefono": "3000000000",
    "nombre": "Ana",
    "apellido": "Pérez",
    "telefono_secundario": "3111111111",
    "email": "ana@example.com",
    "eps": "EPS Demo",
    "ocupacion": "Ingeniera",
    "modalidad_deportiva": "Running",
    "antecedentes": "Sin antecedentes relevantes",
    "antecedentes_personales": "No refiere",
    "antecedentes_patologicos": "No refiere",
    "antecedentes_quirurgicos": "No refiere",
    "antecedentes_traumaticos": "Esguince previo",
    "antecedentes_farmacologicos": "No refiere",
    "antecedentes_familiares": "No refiere",
    "antecedentes_sociales": "Actividad física recreativa",
    "cie10_paciente": {
      "id": 10,
      "codigo": "S93",
      "descripcion": "Luxación y esguince"
    }
  }
}
```

Respuesta de cita sin historia:

```json
{
  "status": 200,
  "message": "Historial",
  "response": {
    "id_cita": 101,
    "fecha": "2026-05-20",
    "hora_inicio": "09:00:00",
    "hora_fin": "09:45:00",
    "numero_sesion": 8,
    "motivo": "Control de evolución",
    "id_estado_cita": 1,
    "estado_cita": "Agendada",
    "id_historial": null,
    "cie10_historia": null,
    "descripcion_estado_paciente": null,
    "subjetivo": null,
    "objetivo": null,
    "intervencion": null,
    "recomendaciones": null,
    "id_paquete": 30,
    "id_tipo_paquete": 2,
    "tipo_paquete": "Paquete fisioterapia 10 sesiones",
    "sesiones_totales_paquete": 10,
    "id_estado_paquete": 1,
    "estado_paquete": "Activo",
    "id_profesional": 3,
    "profesional": "Laura Gómez",
    "tipo_doc": "CC",
    "num_doc": "123",
    "telefono": "3000000000",
    "nombre": "Ana",
    "apellido": "Pérez",
    "telefono_secundario": "3111111111",
    "email": "ana@example.com",
    "eps": "EPS Demo",
    "ocupacion": "Ingeniera",
    "modalidad_deportiva": "Running",
    "antecedentes": "Sin antecedentes relevantes",
    "antecedentes_personales": null,
    "antecedentes_patologicos": null,
    "antecedentes_quirurgicos": null,
    "antecedentes_traumaticos": null,
    "antecedentes_farmacologicos": null,
    "antecedentes_familiares": null,
    "antecedentes_sociales": null,
    "cie10_paciente": {
      "id": 10,
      "codigo": "S93",
      "descripcion": "Luxación y esguince"
    }
  }
}
```

Respuesta si no existe la cita:

```json
{
  "status": 404,
  "message": "No existe la cita",
  "response": null
}
```

Consideraciones frontend:

- Para la pantalla de evolución, este endpoint permite decidir si mostrar botón **Crear historia** (`id_historial = null`) o **Editar historia** (`id_historial` con valor).
- El objeto `cie10_historia` puede ser distinto de `cie10_paciente`; usar `cie10_historia` como diagnóstico de la evolución.

---

## 14. Editar historia/evolución

### `PUT /history/update/:idHistorial`

Actualiza una historia existente. Permite cambiar `id_cita` e `id_cie`; si se cambia a otra cita, valida que esa cita no tenga otra evolución.

Body recomendado:

```json
{
  "id_cita": 101,
  "id_cie": 15,
  "fecha_evolucion": "2026-05-20",
  "descripcion_estado_paciente": "Paciente estable sin dolor agudo",
  "subjetivo": "Mejoría sostenida.",
  "objetivo": "Mayor tolerancia al ejercicio.",
  "intervencion": "Progresión de carga.",
  "recomendaciones": "Continuar plan casero.",
  "antecedentes_patologicos": "No refiere"
}
```

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Historial actualizado",
  "response": {
    "id": 55,
    "id_cita": 101,
    "fecha_evolucion": "2026-05-20",
    "subjetivo": "Mejoría sostenida.",
    "objetivo": "Mayor tolerancia al ejercicio.",
    "intervencion": "Progresión de carga.",
    "descripcion_estado_paciente": "Paciente estable sin dolor agudo",
    "recomendaciones": "Continuar plan casero.",
    "id_cie": 15
  }
}
```

Errores posibles: `Historia no encontrada`, `La cita destino ya tiene una evolución registrada`, más los errores de validación de cita/CIE10.

---

## 15. Historias por paciente

### `GET /history/get-by-patient/:idPaciente`

Lista evoluciones registradas para el paciente, ordenadas por `fecha_evolucion` descendente.

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Historiales del paciente",
  "response": [
    {
      "id": 55,
      "id_cita": 101,
      "fecha_evolucion": "2026-05-20",
      "subjetivo": "Refiere disminución del dolor.",
      "objetivo": "Mejora rango de movilidad.",
      "intervencion": "Terapia manual y ejercicio terapéutico.",
      "descripcion_estado_paciente": "Paciente estable, dolor leve",
      "recomendaciones": "Continuar ejercicios en casa.",
      "id_cie": 15,
      "Cie10": {
        "id": 15,
        "codigo": "M54",
        "descripcion": "Dorsalgia"
      },
      "Quotes": {
        "id": 101,
        "fecha_agendamiento": "2026-05-20",
        "horario_inicio": "09:00:00",
        "motivo": "Control de evolución",
        "numero_sesion": 8,
        "id_profesional": 3,
        "id_paquetes": 30,
        "package": {
          "id": 30,
          "id_pacientes": 1,
          "id_paquetes_atenciones": 2,
          "patient": {
            "id": 1,
            "nombre": "Ana",
            "apellido": "Pérez",
            "num_doc": "123"
          },
          "attentionPackage": {
            "id": 2,
            "descripcion": "Paquete fisioterapia 10 sesiones"
          }
        }
      }
    }
  ]
}
```

Respuesta sin historias:

```json
{
  "status": 200,
  "message": "Historiales del paciente",
  "response": []
}
```

---

## 16. Resúmenes de historia/cita

### `GET /history/get-summary-by-history-number/:idHistorial`

Resumen administrativo de una historia.

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Resumen de historia clínica",
  "response": {
    "numero_historia": 55,
    "nombre_paciente": "Ana Pérez",
    "id_profesional": 3,
    "fecha_cita": "2026-05-20",
    "hora_cita": "09:00:00",
    "id_paquete": 30,
    "motivo": "Control de evolución",
    "numero_sesion": 8,
    "estado_pago": "PENDIENTE",
    "metodo_pago": null,
    "fecha_ultimo_pago": null
  }
}
```

Respuesta si no existe:

```json
{
  "status": 404,
  "message": "No existe la historia clínica",
  "response": null
}
```

### `GET /history/get-summary-by-quote-number/:idCita`

Resumen administrativo por número de cita.

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Resumen de historia clínica",
  "response": {
    "numero_cita": 101,
    "id_paciente": 1,
    "nombre_paciente": "Ana Pérez",
    "id_profesional": 3,
    "fecha_cita": "2026-05-20",
    "hora_cita": "09:00:00",
    "id_paquete": 30,
    "motivo": "Control de evolución",
    "numero_sesion": 8,
    "id_tipo_paquete": 2,
    "metodo_pago": null,
    "fecha_ultimo_pago": null
  }
}
```

Respuesta si no existe:

```json
{
  "status": 404,
  "message": "No existe la historia clínica",
  "response": null
}
```

---

## 17. Exportar historia clínica

### `GET /history/export-pdf/:idHistorial`

Aunque la ruta se llama `export-pdf`, actualmente el controlador genera y responde un archivo DOCX.

Headers de respuesta exitosa:

```http
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename=historia.docx
```

Body: binario del documento `.docx`.

Error posible:

```json
{
  "status": 500,
  "message": "Historia no encontrada para exportar",
  "response": null
}
```

Consideración frontend:

- Descargar como blob y nombrar el archivo con extensión `.docx`, no `.pdf`, mientras el backend mantenga el comportamiento actual.

---

## 18. Endpoint adicional disponible: catálogo de paquetes desde citas

### `GET /quotes/all-attention-packages`

Devuelve todos los tipos de paquete sin paginación. Está disponible, pero para catálogo paginado y búsqueda es mejor usar `GET /packages/get-packages`.

Respuesta exitosa:

```json
{
  "status": 200,
  "message": "Paquetes de atenciones ",
  "response": [
    {
      "id": 2,
      "descripcion": "Paquete fisioterapia 10 sesiones",
      "cantidad_sesiones": 10,
      "valor": 500000
    }
  ]
}
```

---

## Flujo recomendado completo en frontend

### A. Venta/asignación de paquete

1. Buscar/seleccionar paciente.
2. Consultar catálogo con `GET /packages/get-packages`.
3. Crear paquete con `POST /packages/create`.
4. Guardar `response.id` como `id_paquete`.
5. Refrescar paquetes del paciente con `GET /packages/get-by-patient/:idPaciente` o actualizar estado local con la respuesta de creación.

### B. Agendamiento de cita

1. Seleccionar paciente.
2. Consultar paquetes disponibles con `GET /packages/get-available-by-patient/:idPaciente`.
3. Seleccionar paquete.
4. Precargar `id_profesional` si viene en el paquete; si no, pedirlo.
5. Consultar bloques ocupados con `GET /quotes/availability/:idProfesional?date=YYYY-MM-DD`.
6. Crear cita con `POST /quotes/create`.
7. Actualizar agenda y resumen del paquete con `response.agendamiento` y `response.paquete`.

### C. Edición/reagendamiento

1. Tener `id_cita`, `id_paciente` e `id_paquete` actuales desde `GET /quotes/all` o contexto de agenda.
2. Consultar paquetes disponibles con `GET /packages/get-available-by-patient/:idPaciente?quoteId=:idCita`.
3. Consultar disponibilidad del profesional/fecha.
4. Actualizar con `PUT /quotes/update/:idCita`.
5. Refrescar agenda y paquetes afectados.

### D. Atención clínica / historia

1. Desde la cita, abrir `GET /history/get-by-quote/:idCita`.
2. Si `id_historial` es `null`, mostrar formulario de creación y guardar con `POST /history/create`.
3. Si `id_historial` existe, mostrar formulario precargado y guardar con `PUT /history/update/:idHistorial`.
4. Para histórico del paciente, usar `GET /history/get-by-patient/:idPaciente`.
5. Para documento clínico, usar `GET /history/export-pdf/:idHistorial` como descarga DOCX.

---

## Tabla resumen de interacciones y consideraciones

| Paso | Endpoint | Método | Entrada clave | Devuelve | Uso front | Consideraciones |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `/packages/get-packages` | GET | `page`, `limit`, `search` | Catálogo paginado de tipos de paquete | Selector/catálogo de venta | Preferible sobre `/quotes/all-attention-packages` porque pagina y busca. |
| 2 | `/packages/create` | POST | `id_pacientes`, `id_paquetes_atenciones` | Paquete hidratado + `resumen_sesiones` | Crear paquete del paciente | Manejar duplicidad de paquete activo; si ocurre, consultar paquetes activos. |
| 3 | `/packages/get-assigned` | GET | filtros administrativos | Paquetes paginados con relaciones | Grilla admin | Incluye `Quotes` y resumen; puede ser pesado si hay muchas citas. |
| 4 | `/packages/get-by-patient/:id` | GET | `idPaciente` | Paquetes del paciente | Detalle paciente | Sin paginación; suficiente para ficha del paciente. |
| 5 | `/packages/get/:id` | GET | `idPaquete` | Detalle de paquete | Validar paquete puntual | Si no existe puede venir `response: null` con status 200. |
| 6 | `/packages/close/:id` | PUT | `idPaquete` | Paquete cerrado | Cierre manual | Las citas también cierran automáticamente al consumir todas las sesiones. |
| 7 | `/packages/get-available-by-patient/:id` | GET | `idPaciente`, opcional `quoteId` | Paquetes activos con cupos | Selector de agendamiento | En edición enviar siempre `quoteId`. |
| 8 | `/quotes/availability/:id` | GET | `date` | Citas ocupadas del profesional | Calendario/slots | Si falta `date`, responde 400. No sustituye validación al guardar. |
| 9 | `/quotes/create` | POST | fecha, horas, paquete/profesional | Cita + agendamiento + resumen paquete | Crear cita | Autocompleta profesional desde paquete si existe. Valida colisiones. |
| 10 | `/quotes/all` | GET | filtros agenda | Citas paginadas normalizadas | Agenda/listado | Ideal para renderizar lista; trae `tiene_historia` e `id_historial`. |
| 11 | `/quotes/update/:id` | PUT | campos de cita | Cita + agendamiento + resumen paquete | Reagendar/editar | Recalcula sesiones si cambia paquete. |
| 12 | `/quotes/get-by-package/:id` | GET | `idPaquete` | Citas completas de un paquete | Ver sesiones | Útil para auditoría del paquete. |
| 13 | `/quotes/:id` | DELETE | `idCita` | Resumen recalculado del paquete | Eliminar cita | Preferible a `/history/delete-quote/:id` porque recalcula paquete. |
| 14 | `/history/get-by-quote/:id` | GET | `idCita` | Cita + paciente + historia opcional | Pantalla clínica | Principal endpoint para decidir crear/editar historia. |
| 15 | `/history/create` | POST | `id_cita`, `id_cie`, textos clínicos | Historia creada | Crear evolución | Solo una historia por cita. Sincroniza antecedentes enviados al paciente. |
| 16 | `/history/update/:id` | PUT | textos clínicos/CIE/cita | Historia actualizada | Editar evolución | Valida que la cita destino no tenga otra historia. |
| 17 | `/history/get-by-patient/:id` | GET | `idPaciente` | Historias del paciente | Timeline clínico | Sin paginación; evaluar paginar si el volumen crece. |
| 18 | `/history/get-summary-by-history-number/:id` | GET | `idHistorial` | Resumen administrativo | Pagos/recibos/resumen | Si no existe, responde envelope 404. |
| 19 | `/history/get-summary-by-quote-number/:id` | GET | `idCita` | Resumen administrativo | Pagos/recibos/resumen | No incluye `estado_pago`; actualmente está comentado en servicio. |
| 20 | `/history/export-pdf/:id` | GET | `idHistorial` | Archivo DOCX | Descargar historia | La ruta dice PDF pero responde DOCX. |

---

## Consideraciones y posibles mejoras de backend

| Hallazgo | Impacto en front | Recomendación |
| --- | --- | --- |
| `GET /history/export-pdf/:id` responde DOCX, no PDF. | El front puede nombrar mal el archivo o usar un viewer PDF incorrecto. | Renombrar ruta a `/history/export-docx/:id` o volver a activar conversión PDF. |
| `DELETE /history/delete-quote/:id` elimina cita sin recalcular paquete. | El paquete puede quedar con estado/sesiones desactualizadas si se usa esa ruta. | Usar `DELETE /quotes/:id` desde front o ajustar el servicio de history para recalcular. |
| Errores de historia devuelven HTTP 400 con envelope `status: 500`. | Manejo inconsistente de errores. | Normalizar status de validación a 400 y no usar 500 para errores de negocio. |
| `GET /packages/get/:id` puede devolver `response: null` con status 200 si no existe. | El front debe validar `response` nulo. | Responder 404 cuando `hydratePackage` retorna null. |
| `GET /packages/get-by-patient/:id` y `/history/get-by-patient/:id` no tienen paginación. | Puede impactar rendimiento con pacientes de mucho historial. | Agregar `page`, `limit`, `fechaInicio`, `fechaFin`. |
| No hay endpoint específico para traer una cita por ID. | Para editar, el front depende de agenda/listados o de `/history/get-by-quote/:id`. | Agregar `GET /quotes/:id` con el modelo completo de cita/agendamiento. |
| `POST /packages/create` no devuelve el paquete activo existente en error de duplicidad. | El front debe hacer una consulta adicional. | En error de duplicidad, considerar devolver `existingPackage` o crear un endpoint de búsqueda activo por paciente/tipo. |
| El estado del paquete se recalcula contando todas las citas, sin filtrar estados cancelados. | Si existen estados de cita cancelada/no asistida, podrían consumir sesión. | Definir qué estados consumen sesión y filtrar el conteo. |
| `GET /quotes/all` devuelve `profesional` y `apellido_profesional` separados, no nombre completo. | El front arma el nombre. | Opcional: agregar `profesional_nombre_completo`. |

## Conclusión sobre viabilidad para frontend

Con los endpoints actuales el flujo **sí puede funcionar bien en el front** para: asignar paquetes, agendar citas consumiendo sesiones, editar/reagendar, validar disponibilidad y crear/editar historia clínica.

Los puntos que el frontend debe cuidar son:

1. Manejar correctamente `quoteId` al editar citas para no ocultar el paquete actual.
2. Usar `DELETE /quotes/:id` en vez de `DELETE /history/delete-quote/:id` para mantener sesiones/estado del paquete consistentes.
3. Descargar `/history/export-pdf/:id` como `.docx`.
4. Validar `response === null` en detalle de paquete.
5. Mostrar errores de negocio desde `message`, incluso cuando el envelope venga con `status: 500`.

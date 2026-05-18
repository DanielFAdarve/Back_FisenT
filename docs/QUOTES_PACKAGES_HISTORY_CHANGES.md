# Cambios aplicados: arquitectura paquetes, citas e historias

## Objetivo

Validar y ajustar el flujo de negocio para que un paquete asignado a un paciente se pueda agendar en citas y luego evolucionar en historia clínica sin inconsistencias al crear, actualizar o eliminar registros.

## Cambios técnicos aplicados

### 1. Servicio de paquetes (`packages.service.js`)

- Se centralizaron constantes de estado de paquete:
  - `ACTIVE = 1`
  - `CLOSED = 3`
- La creación de paquetes ahora valida explícitamente:
  - paciente existente,
  - tipo de paquete existente,
  - profesional existente si se envía,
  - CIE10 secundario existente si se envía,
  - duplicidad de paquete activo por paciente + tipo de paquete.
- `create` retorna el paquete hidratado con paciente, tipo, estado, profesional, CIE10 y resumen de sesiones.
- Se agregó recálculo transaccional de estado del paquete:
  - si sesiones usadas >= sesiones totales, el paquete queda cerrado;
  - si queda cupo nuevamente por actualización/eliminación, el paquete se reactiva.
- Los listados de paquetes asignados agregan `resumen_sesiones` para que el frontend no tenga que calcular cupos.
- El selector `get-available-by-patient` conserva el paquete de la cita actual en modo edición aunque no tenga cupos adicionales, evitando que el formulario pierda su valor actual.

### 2. Servicio de citas (`quotes.service.js`)

- `create`, `update` y `delete` ahora son transaccionales.
- La validación de cita se unificó para creación y actualización:
  - fecha obligatoria,
  - hora de inicio obligatoria,
  - profesional o paquete obligatorio,
  - profesional existente,
  - paquete existente,
  - paquete activo para nuevas asignaciones,
  - se permite editar una cita de un paquete ya cerrado si la cita ya pertenece a ese paquete.
- La disponibilidad se valida por solapamiento real de horas usando minutos del día, evitando errores por parsing de `Date` con zonas horarias.
- Al crear o mover una cita:
  - se valida capacidad excluyendo la cita actual en modo edición,
  - se hereda profesional del paquete si aplica,
  - se recalculan números de sesión por orden cronológico,
  - se recalcula el estado del paquete anterior y del nuevo paquete.
- Las respuestas de creación/actualización retornan un objeto orientado al frontend:
  - `cita` con relaciones,
  - `agendamiento` con resumen listo para UI,
  - `paquete` con cupos y estado resultante.
- Al eliminar una cita se eliminan primero sus historias asociadas y luego se recalcula el paquete para evitar restricciones de integridad.

### 3. Servicio/controlador de historia clínica

- La validación de historia confirma que la cita exista y que tenga paquete/paciente asociado.
- En actualización se impide mover una historia hacia una cita que ya tenga evolución.
- `GET /history/get-by-quote/:id` ahora incluye datos de agenda, paquete, profesional y estado para precargar formularios desde el frontend en una sola llamada.
- La eliminación desde history ahora es transaccional y elimina historia + cita asociada de forma consistente.

## Consideraciones de compatibilidad

- Se mantienen las rutas existentes.
- Las respuestas siguen usando el envelope `{ status, message, response }` y paginación cuando aplica.
- Las respuestas de `POST /quotes/create` y `PUT /quotes/update/:id` ahora contienen más información en `response`, por lo que el frontend puede actualizar estado de agenda y cupos sin llamadas extra.
- `PUT /quotes/:id` se conserva como alias compatible.

## Riesgos mitigados

- Actualizar una cita dentro de un paquete completo ya no falla por capacidad si es la misma cita.
- Mover una cita de paquete recalcula el paquete origen y destino.
- Eliminar citas no deja paquetes cerrados artificialmente con cupos libres.
- El selector de paquetes en edición no pierde el paquete actualmente asignado.

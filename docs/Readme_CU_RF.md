Id Requisito Especifico Prioridad
RF1 Autenticación institucional con gestión de roles (RBAC) Alta
RF2 Sincronización automática de datos institucionales Alta
RF3 Gestión de convocatorias Alta
RF4 Gestión de postulaciones Alta
RF5 Gestión documental Alta
RF6 Evaluación asistida por IA (puntajes + explicabilidad SHAP) Alta
RF7 Evaluación manual del expediente Alta
RF8 Asignación institucional de becas según resultados y cupos Alta
RF9 Registro oficial de beca asignada Alta
RF10 Notificaciones automáticas Media
RF11 Seguimiento académico mensual del becario Alta
RF12 Renovación de beca Media
RF13 Control de incumplimiento y suspensión Alta
RF14 Registro de eventos críticos en blockchain Media
RF15 Reportes y tablero de análisis Baja

Tabla 10. Especificación del requisito funcional Autenticación institucional y gestión de roles
Identificador RF1 Prioridad Alta
Nombre Autenticación institucional y gestión de roles
Descripción Permitir la autenticación mediante Keycloak y asignar permisos específicos según el rol del usuario (estudiante, analista de becas, responsable académico o director).
Usuarios Director Universitario de Bienestar Social, Analista de Becas, responsable de Seguimiento Académico, Estudiante Postulante
Usuario Iniciador Director Universitario de Bienestar Social, Analista de Becas, responsable de Seguimiento Académico, Estudiante Postulante
Precondición Usuario registrado en Keycloak.
Proceso 1. El usuario accede al sistema. 2. Keycloak valida identidad por OIDC. 3. El sistema asigna permisos según rol. 4. El usuario accede a funciones permitidas.
Postcondición Sesión activa y permisos aplicados correctamente.
Excepciones 1. Credenciales incorrectas. 2. Usuario sin rol asignado. 3. Error de comunicación con Keycloak.
Tabla 11. Especificación del requisito funcional Sincronización de datos institucionales del estudiante
Identificador RF2 Prioridad Alta
Nombre Sincronización de datos institucionales del estudiante
Descripción Permitir que el sistema sincronice automáticamente datos académicos del estudiante desde la base institucional (carrera, RU, facultad).
Usuarios Estudiante Postulante
Usuario Iniciador Estudiante Postulante
Precondición El estudiante debe estar autenticado en el sistema.
Proceso 1. El estudiante inicia sesión. 2. El sistema consulta la API institucional. 3. Se obtienen y validan los datos académicos. 4. Se almacenan o actualizan en la base de datos.
Postcondición Datos académicos sincronizados correctamente.
Excepciones 1. Error de conexión con la API. 2. Datos incompletos o inconsistentes. 3. Usuario no encontrado.
Tabla 12. Especificación del requisito funcional Gestión de convocatorias
Identificador RF3 Prioridad Alta
Nombre Gestión de convocatorias
Descripción Permitir crear, configurar, publicar y cerrar convocatorias con cupos, fechas, reglas, criterios y requisitos documentales.
Usuarios Analista de Becas, Director Universitario de Bienestar Social
Usuario Iniciador Analista de Becas
Precondición Usuario con permisos administrativos autenticado.
Proceso 1. El usuario crea una nueva convocatoria. 2. Define fechas, cupos, requisitos y criterios. 3. Guarda la configuración. 4. Publica la convocatoria para los estudiantes.
Postcondición Convocatoria creada, publicada o cerrada según estado.
Excepciones 1. Datos incompletos. 2. Fecha inválida. 3. Error al publicar o cerrar convocatoria.
Tabla 13. Especificación del requisito funcional Gestión completa de postulaciones
Identificador RF4 Prioridad Alta
Nombre Gestión completa de postulaciones
Descripción Permitir que el estudiante registre, edite y envíe una postulación a una convocatoria activa.
Usuarios Estudiante Postulante
Usuario Iniciador Estudiante Postulante
Precondición Debe existir una convocatoria activa con cupos disponibles.
Proceso 1. El estudiante selecciona una convocatoria activa. 2. Completa los formularios requeridos. 3. Revisa y envía la postulación. 4. El sistema registra la postulación en estado “Enviada”.
Postcondición Postulación registrada correctamente.
Excepciones 1. No existen convocatorias activas. 2. Datos incompletos. 3. Error al guardar la postulación.
Tabla 14. Especificación del requisito funcional Gestión documental
Identificador RF5 Prioridad Alta
Nombre Gestión documental: carga, validación automática, hash y versionado
Descripción Permitir que los documentos cargados en una postulación sean validados automáticamente, almacenados en MinIO y registrados con hash y versionado.
Usuarios Estudiante Postulante, Analista de Becas
Usuario Iniciador Estudiante Postulante
Precondición Debe existir una postulación creada.
Proceso 1. El estudiante carga el documento requerido. 2. El sistema valida formato, tamaño y obligatoriedad. 3. Genera hash y registra metadatos. 4. Almacena el documento en MinIO. 5. Si existe uno previo, se genera una nueva versión.
Postcondición Documento almacenado y validado con versión registrada.
Excepciones 1. Formato de archivo inválido. 2. Error al almacenar documento. 3. Documento duplicado en formato incorrecto.
Tabla 15. Especificación del requisito funcional Evaluación asistida por IA
Identificador RF6 Prioridad Alta
Nombre Evaluación asistida por IA
Descripción Permitir que el sistema calcule automáticamente el puntaje académico y socioeconómico de cada postulación utilizando modelos de IA e interpretabilidad SHAP, generando una recomendación preliminar.
Usuarios Analista de Becas
Usuario Iniciador Analista de Becas
Precondición La postulación debe contar con documentos validados y formularios completos.
Proceso 1. El Analista selecciona una postulación. 2. El sistema envía la información al microservicio IA. 3. Se ejecuta el modelo predictivo. 4. Se genera puntaje y recomendación explicable usando SHAP. 5. El sistema almacena resultados en la evaluación preliminar.
Postcondición Recomendación de IA registrada y disponible para revisión.
Excepciones 1. Error en microservicio IA. 2. Datos insuficientes. 3. Modelo no disponible.
Tabla 16. Especificación del requisito funcional Evaluación humana del expediente
Identificador RF7 Prioridad Alta
Nombre Evaluación humana del expediente
Descripción Permitir que el Analista revise documentos, resultados y recomendación IA para emitir correcciones, observaciones o continuar proceso.
Usuarios Analista de Becas
Usuario Iniciador Analista de Becas
Precondición Debe existir una recomendación de IA registrada.
Proceso 1. El Analista revisa expediente completo. 2. Decide si requiere corrección o continua. 3. Si existe observación, se registra y notifica al estudiante. 4. Si está conforme, marca expediente como evaluado.
Postcondición Expediente validado humana y técnicamente.
Excepciones 1. Documento inválido. 2. Estudiante no responde observaciones. 3. Error al registrar evaluación.
Tabla 17. Especificación del requisito funcional Asignación institucional de becas según resultados y cupos
Identificador RF8 Prioridad Alta
Nombre Asignación institucional de becas según resultados y cupos
Descripción Permitir que el Director Universitario de Bienestar Social revise el listado de postulantes evaluados y realice la selección final de beneficiarios en función del dictamen técnico y los cupos disponibles definidos en la convocatoria.
Usuarios Director Universitario de Bienestar Social
Usuario Iniciador Director Universitario de Bienestar Social
Precondición 1. El dictamen técnico del Analista debe estar registrado y aprobado. 2. El sistema debe contar con cupos configurados para la convocatoria.
Proceso 1. El Director accede al listado de postulantes evaluados. 2. Revisa puntajes y dictamen 3. Selecciona postulantes según cupos establecidos. 4. Confirma decisión institucional. 5. El sistema marca cada postulación como Aprobada o Rechazada.
Postcondición Estado actualizado: Aprobado o Rechazado.
Excepciones 1. Cupos insuficientes. 2. Información incompleta. 3. Error al registrar decisión.
Tabla 18. Especificación del requisito funcional Registro oficial de beca asignada
Identificador RF9 Prioridad Media
Nombre Registro oficial de beca asignada
Descripción Registrar formalmente en el sistema las becas aprobadas tras la decisión institucional, generando el acta digital, asignando la beca al estudiante y almacenando el registro en base de datos y blockchain para trazabilidad.
Usuarios Director Universitario de Bienestar Social, Analista de Becas
Usuario Iniciador Director Universitario de Bienestar Social
Precondición 1. La decisión institucional debe estar registrada (RF8). 2. La postulación debe tener estado Aprobado.
Proceso 1. El sistema muestra la lista de solicitudes aprobadas pendientes de registro oficial. 2. El Analista revisa la información y prepara el registro administrativo. 3. El Director confirma el registro. 4. El sistema crea el registro oficial de beca asignada. 5. El sistema almacena hash del evento en blockchain para trazabilidad.
Postcondición La beca queda oficialmente asignada al estudiante y disponible para seguimiento académico, notificaciones y renovación.
Excepciones 1. Falta información o documentación obligatoria. 2. Inconsistencia entre dictamen técnico y decisión final. 3. Error al registrar o sincronizar en blockchain.
Tabla 19. Especificación del requisito funcional Notificaciones automáticas
Identificador RF10 Prioridad Alta
Nombre Notificaciones automáticas
Descripción Permitir que el sistema notifique a los usuarios cuando exista un evento significativo (aprobación, rechazo, correcciones, renovación, recordatorios).
Usuarios Estudiante Postulante, Analista de Becas, Responsable de Seguimiento Académico, Director Universitario
Usuario Iniciador Sistema
Precondición Debe existir un evento registrado que requiera notificación.
Proceso 1. El sistema detecta un evento relevante. 2. Genera mensaje asociado. 3. Envía correo o mensaje WhatsApp. 4. Registra estado de envío.
Postcondición Notificación entregada y registrada.
Excepciones 1. Error con proveedor de notificaciones. 2. Datos de contacto inválidos. 3. Usuario sin canal configurado.
Tabla 20. Especificación del requisito funcional Seguimiento académico mensual
Identificador RF11 Prioridad Media
Nombre Seguimiento académico mensual
Descripción Permitir que el becario envíe su informe académico mensual y que el Responsable de Seguimiento Académico lo revise, valide y registre cumplimiento.
Usuarios Estudiante Postulante, Responsable de Seguimiento Académico
Usuario Iniciador Estudiante Postulante
Precondición Beca activa registrada.
Proceso 1. El estudiante carga su informe mensual. 2. El sistema valida formato y tamaño. 3. El Responsable revisa el informe. 4. Registra cumplimiento o incumplimiento. 5. Se notifica resultado al estudiante.
Postcondición Seguimiento académico registrado en el historial del becario.
Excepciones 1. Informe incompleto o inválido. 2. No se entrega dentro del plazo.
Tabla 21. Especificación del requisito funcional Renovación de beca
Identificador RF12 Prioridad Alta
Nombre Renovación de beca
Descripción Permitir que el becario solicite la renovación de la beca dentro del plazo establecido, y que el Responsable de Seguimiento Académico valide cumplimiento académico y normativo para aprobar o rechazar la renovación.
Usuarios Estudiante Postulante, Responsable de Seguimiento Académico
Usuario Iniciador Estudiante Postulante
Precondición El estudiante debe tener una beca activa y cumplir condiciones de renovación establecidas en la normativa vigente.
Proceso 1. El estudiante accede al módulo de renovación. 2. Adjunta documentos requeridos (si aplica). 3. Envía solicitud de renovación. 4. El Responsable de Seguimiento Académico revisa cumplimiento académico y asistencia. 5. Registra decisión (renovado / no renovado).
Postcondición Estado de renovación actualizado y comunicado al estudiante.
Excepciones 1. Renovación fuera del plazo. 2. Documentos incompletos. 3. Incumplimiento de requisitos académicos.
Tabla 22. Especificación del requisito funcional Control de incumplimiento y suspensión
Identificador RF13 Prioridad Media
Nombre Control de incumplimiento y suspensión
Descripción Permitir al Responsable de Seguimiento Académico registrar alertas, incumplimientos y activar suspensión temporal o definitiva según normativa.
Usuarios Responsable de Seguimiento Académico
Usuario Iniciador Responsable de Seguimiento Académico
Precondición Seguimiento académico con observaciones o alertas previas.
Proceso 1. El responsable detecta incumplimiento. 2. Registra evidencia o documentación. 3. Define acción correctiva (advertencia, suspensión temporal o suspensión definitiva). 4. El sistema registra la decisión y notifica al estudiante.
Postcondición Estado de beca actualizado con histórico de incumplimiento.
Excepciones 1. Evidencia insuficiente. 2. Error al guardar estado.
Tabla 23. Especificación del requisito funcional Registro en Blockchain
Identificador RF14 Prioridad Baja
Nombre Registro en Blockchain
Descripción Registrar de manera inmutable los eventos críticos del proceso (postulación enviada, validación, decisión final, renovaciones, suspensión), generando trazabilidad verificable.
Usuarios Estudiante Postulante, Analista de Becas, Director Universitario, Responsable de Seguimiento Académico
Usuario Iniciador Sistema (según operación ejecutada por usuario autorizado)
Precondición Debe existir un evento válido definido como crítico en la normativa funcional del sistema.
Proceso 1. El sistema genera hash del evento. 2. Envía transacción a Hyperledger Fabric. 3. Recibe tx_id y lo registra en BD interna. 4. Habilita consulta pública de verificación.
Postcondición Evento registrado como inmutable y verificable.
Excepciones 1. Error de comunicación con la red blockchain. 2. Nodo fuera de servicio.
Tabla 24. Especificación del requisito funcional Generación de reportes y dashboards
Identificador RF15 Prioridad Baja
Nombre Generación de reportes y dashboards
Descripción Permitir que el Director consulte indicadores institucionales sobre postulaciones, becas activas, renovaciones y métricas comparativas generales mediante panel visual.
Usuarios Director Universitario de Bienestar Social
Usuario Iniciador Director Universitario de Bienestar Social
Precondición Debe existir información suficiente registrada en el sistema.
Proceso 1. El Director accede al módulo de reportes. 2. Selecciona parámetros o filtros. 3. El sistema genera reportes y gráficos. 4. Permite exportar datos si aplica.
Postcondición Información institucional presentada para análisis y soporte de decisiones.
Excepciones 1. Falta de datos relevantes. 2. Error al renderizar paneles.

CASOS DE USO

Identificador Nombre Prioridad
CU01 Autenticación institucional Alta
CU02 Gestión de roles y permisos Alta
CU03 Sincronizar datos institucionales Alta
CU04 Crear convocatoria Alta
CU05 Configurar cupos por beca y facultad Alta
CU06 Definir criterios, ponderaciones y reglas Alta
CU07 Gestionar requisitos/documentos obligatorios Alta
CU08 Publicar, pausar o cerrar convocatoria Alta
CU09 Consultar convocatorias activas (estudiante) Alta
CU10 Gestionar postulación Alta
CU11 Completar formulario socioeconómico/ académico Alta
CU12 Subir y gestionar documentos Alta
CU13 Evaluación IA automática por registro Alta
CU14 Evaluación IA masiva (batch) Alta
CU15 Validar expediente/documentos (evaluación humana) Alta
CU16 Registrar dictamen técnico final Alta
CU17 Ordenar y seleccionar becarios según ranking/cupos Alta
CU18 Registrar beca asignada Alta
CU19 Notificar decisión al estudiante Media
CU20 Registrar informe académico mensual Alta
CU21 Validar seguimiento académico/alertas Alta
CU22 Solicitar y procesar renovación Alta
CU23 Registrar evento crítico en blockchain Media
CU24 Consultar trazabilidad y verificar integridad Media
CU25 Generar reportes institucionales Baja
CU26 Visualizar dashboards y métricas Baja

5.4.1. CU1 Autenticación institucional del usuario
Figura 9. Diagrama de contexto CU1 Autenticación institucional

Tabla 26. Detallar CU1 Autenticación institucional
Caso de Uso Autenticación institucional
Propósito Permitir que el usuario acceda de forma segura al sistema mediante autenticación institucional con Keycloak usando OpenID Connect.
Descripción El usuario ingresa sus credenciales institucionales. El sistema valida la autenticidad a través del proveedor de identidad (Keycloak). Si las credenciales son válidas, el usuario accede según su rol asignado.
Actores Director Universitario del Bienestar Social y Salud, Analista de Becas, Responsable de Seguimiento Académico, Estudiante
Actor Iniciador Cualquier usuario del sistema
Precondición 1. El usuario debe estar registrado en Keycloak. 2. El servicio de autenticación debe estar disponible.
Proceso 1. El usuario ingresa al sistema y selecciona iniciar sesión. 2. El sistema redirige a Keycloak. 3. El usuario ingresa credenciales institucionales. 4. Keycloak valida credenciales y genera un token JWT. 5. El sistema recibe el token y valida roles asignados.
Postcondición Usuario autenticado con sesión activa y permisos cargados.
Excepciones 1. Credenciales incorrectas. 2. Usuario sin rol asignado. 3. Servicio de autenticación no disponible.

5.4.2. CU2 Gestión de roles y permisos
Figura 10. Diagrama de contexto CU2 Gestión de roles y permisos

Tabla 27. Detallar CU2 Gestión de roles y permisos
Caso de Uso Gestión de roles y permisos
Propósito Permitir la administración de permisos y roles dentro del sistema para garantizar acceso controlado según tipo de usuario.
Descripción El Director puede asignar, modificar o revocar roles institucionales desde el panel administrativo. Los cambios se aplican a la cuenta del usuario mediante Keycloak y el backend.
Actores Director Universitario del Bienestar Social y Salud
Actor Iniciador Director Universitario del Bienestar Social y Salud
Precondición 1. El Director debe estar autenticado. 2. El usuario objetivo debe existir.
Proceso 1. El Director accede al módulo de roles. 2. Selecciona un usuario institucional. 3. Asigna, modifica o revoca roles. 4. El sistema actualiza los permisos en Keycloak y base de datos.
Postcondición Usuario actualizado con nuevos permisos activos.
Excepciones 1. Usuario no encontrado. 2. Error al registrar cambios. 3. Rol duplicado o conflictivo.

5.4.3. CU3 Sincronizar datos institucionales del estudiante
Figura 11. Diagrama de contexto CU3 Sincronizar datos institucionales

Tabla 28. Detallar CU3 Sincronizar datos institucionales
Caso de Uso Sincronizar datos institucionales
Propósito Recuperar información básica oficial del estudiante desde el servicio institucional externo.
Descripción El estudiante solicita la sincronización. El sistema consulta el servicio externo y actualiza nombre, RU, CI, carrera y facultad en el perfil local.
Actores Estudiante
Actor Iniciador Estudiante
Precondición 1. Estudiante autenticado. 2. Servicio institucional disponible.
Proceso 1. El estudiante solicita sincronización. 2. El sistema envía consulta al endpoint institucional. 3. El endpoint retorna datos oficiales (ej.: nombre, CI, carrera, facultad). 4. El sistema valida estructura y formato. 5. Los datos válidos se almacenan y actualizan en el perfil del estudiante.
Postcondición Datos básicos del estudiante actualizados correctamente.
Excepciones 1. Servicio institucional no disponible. 2. Datos corruptos o estructura inválida. 3. Estudiante no encontrado.

5.4.4. CU04 Consultar convocatorias activas
Figura 12. Diagrama de contexto CU4 Consultar convocatorias activas

Tabla 29. Detallar CU4 Consultar convocatorias activas
Caso de Uso Consultar convocatorias activas
Propósito Permitir la creación de una nueva convocatoria institucional para postulaciones de becas.
Descripción El Director crea una nueva convocatoria definiendo título, periodo, fechas clave y estado inicial.
Actores Director Universitario del Bienestar Social y Salud o Analista de Becas
Actor Iniciador Director Universitario del Bienestar Social y Salud o Analista de Becas
Precondición 1. Director autenticado. 2. No existir otra convocatoria activa con el mismo nombre y periodo.
Proceso 1. El Director selecciona “Nueva convocatoria”. 2. Ingresa datos principales (nombre, gestión, fechas). 3. Guarda la convocatoria en estado “Borrador”.
Postcondición Convocatoria creada y registrada como borrador.
Excepciones 1. Datos incompletos. 2. Fechas inválidas. 3. Convocatoria duplicada.

5.4.5. CU05 Configurar cupos por beca y facultad
Figura 13. Diagrama de contexto CU5 Configurar cupos por beca y facultad

Tabla 30. Detallar CU5 Configurar cupos por beca y facultad
Caso de Uso Configurar cupos por beca y facultad
Propósito Permitir definir la cantidad de cupos disponibles por tipo de beca y facultad dentro de una convocatoria.
Descripción El Director ajusta cupos tomando en cuenta disponibilidad institucional, presupuesto o políticas vigentes.
Actores Director Universitario del Bienestar Social y Salud o Analista de Becas
Actor Iniciador Director Universitario del Bienestar Social y Salud o Analista de Becas
Precondición Convocatoria existente en estado “borrador”.
Proceso 1. El Director accede a la convocatoria creada. 2. Selecciona tipo de beca. 3. Asigna cupos por facultad o categoría. 4. Guarda configuración.
Postcondición Cupos registrados correctamente y vinculados a la convocatoria.
Excepciones 1. Cupos exceden límites institucionales. 2. Convocatoria inexistente o cerrada.

5.4.6. CU06 Definir criterios, ponderaciones y reglas
Figura 14. Diagrama de contexto CU6 Definir criterios, ponderaciones y reglas

Tabla 31. Detallar CU6 Definir criterios, ponderaciones y reglas
Caso de Uso Definir criterios, ponderaciones y reglas
Propósito Permitir configurar los criterios de evaluación, ponderaciones y reglas automáticas que aplicarán a la convocatoria.
Descripción El Director define o ajusta criterios de evaluación (académico, socioeconómico u otros), asigna pesos porcentuales y establece reglas automáticas (por ejemplo: exclusiones, prioridades, empates).
Actores Director Universitario del Bienestar Social y Salud o Analista de Becas
Actor Iniciador Director Universitario del Bienestar Social y Salud o Analista de Becas
Precondición 1. Convocatoria existente en estado “borrador”. 2. El Director debe estar autenticado.
Proceso 1. El Director accede a la configuración de la convocatoria. 2. Selecciona “Criterios y ponderaciones”. 3. Define criterios, valores, pesos y reglas automáticas. 4. Guarda configuración. 5. El sistema valida consistencia (por ej., suma total = 100%).
Postcondición Criterios y reglas registrados correctamente en la convocatoria.
Excepciones 1. Valores incompletos o inválidos. 2. Ponderaciones no suman 100%. 3. Regla contradictoria con otra ya definida.

5.4.7. CU07 Gestionar requisitos/documentos obligatorios
Figura 15. Diagrama de contexto CU7 Gestionar requisitos/documentos obligatorios

Tabla 32. Detallar CU7 Gestionar requisitos/documentos obligatorios
Caso de Uso Gestionar requisitos/documentos obligatorios
Propósito Registrar o modificar los documentos requeridos para la postulación en una convocatoria.
Descripción El Director define qué documentos deberán presentar los estudiantes (PDF, imagen u otro formato permitido), indicando si son obligatorios u opcionales, tamaño máximo y formato.
Actores Director Universitario del Bienestar Social y Salud o Analista de Becas
Actor Iniciador Director Universitario del Bienestar Social y Salud o Analista de Becas
Precondición Convocatoria creada y en estado “borrador”.
Proceso 1. El Director accede a la convocatoria. 2. Selecciona “Requisitos documentales”. 3. Añade o edita documentos requeridos. 4. Define obligatoriedad, formato y tamaño máximo. 5. Guarda configuración.
Postcondición Requisitos documentales configurados correctamente para la convocatoria.
Excepciones 1. Formato no permitido. 2. Archivo supera límites definidos. 3. Configuración duplicada o inexistente.

5.4.8. CU08 Publicar, pausar o cerrar convocatoria
Figura 16. Diagrama de contexto CU8 Publicar, pausar o cerrar convocatoria

Tabla 33. Detallar CU8 Publicar, pausar o cerrar convocatoria
Caso de Uso Publicar, pausar o cerrar convocatoria
Propósito Controlar el estado público de una convocatoria para habilitar o deshabilitar postulaciones.
Descripción El Director gestiona el ciclo de vida de la convocatoria: publicación para postulaciones, pausa temporal o cierre definitivo.
Actores Director Universitario del Bienestar Social y Salud o Analista de Becas
Actor Iniciador Director Universitario del Bienestar Social y Salud o Analista de Becas
Precondición 1. Convocatoria configurada correctamente. 2. Cupos, criterios y documentos definidos.
Proceso 1. El Director selecciona una convocatoria. 2. Elige acción: publicar, pausar o cerrar. 3. El sistema valida estado actual. 4. Se actualiza estado visible para usuarios estudiantiles.
Postcondición La convocatoria queda publicada, pausada o cerrada según selección.
Excepciones 1. Intento de publicar sin completar configuración. 2. Intento de cerrar con evaluaciones pendientes. 3. Cambio no permitido por política institucional.

5.4.9. CU09 Consultar convocatorias activas (Estudiante)
Figura 17. Diagrama de contexto CU9 Consultar convocatorias activas (Estudiante)

Tabla 34. Detallar CU9 Consultar convocatorias activas (Estudiante)
Caso de Uso Consultar convocatorias activas (Estudiante)
Propósito Permitir que el estudiante pueda visualizar las convocatorias disponibles con los detalles relevantes.
Descripción El estudiante ingresa al portal y consulta la lista de convocatorias disponibles con información como fechas, cupos, requisitos y estado.
Actores Estudiante
Actor Iniciador Estudiante
Precondición 1. Usuario autenticado. 2. Al menos una convocatoria en estado publicada.
Proceso 1. El estudiante accede al módulo de convocatorias. 2. El sistema lista convocatorias activas. 3. El estudiante puede ver detalles, requisitos y cupos. 4. Opcionalmente, selecciona una para iniciar postulación.
Postcondición El estudiante visualiza la convocatoria seleccionada.
Excepciones 1. No existen convocatorias activas. 2. Error en la visualización.

5.4.10. CU10 Gestionar postulación
Figura 18. Diagrama de contexto CU10 Gestionar postulación

Tabla 35. Detallar CU10 Gestionar postulación
Caso de Uso Gestionar postulación
Propósito Permitir al estudiante crear, continuar, editar o enviar su postulación dentro de los plazos establecidos.
Descripción El estudiante crea una nueva postulación asociada a una convocatoria activa. La puede modificar mientras esté en estado borrador, y enviarla para evaluación cuando esté completa.
Actores Estudiante Postulante
Actor Iniciador Estudiante Postulante
Precondición Revisión humana completada.
Proceso 1. Convocatoria activa. 2. Estudiante autenticado y con datos sincronizados. 3. El estudiante selecciona una convocatoria. 4. El sistema crea la postulación en estado “borrador”. 5. El estudiante completa formulario, agrega documentos y revisa observaciones.
Postcondición 1. Una vez completa, selecciona “Enviar postulación”. 2. El sistema valida que los requisitos estén completos. 3. Cambia el estado a “Recepcionado”. 4. Postulación registrada correctamente para evaluación.
Excepciones 1. Intento de enviar sin completar requisitos. 2. Postulación duplicada. 3. Convocatoria cerrada durante el proceso.

5.4.11. CU11 Completar formulario socioeconómico y académico
Figura 19. Diagrama de contexto CU11 Completar formulario socioeconómico y académico

Tabla 36. Detallar CU11 Completar formulario socioeconómico y académico
Caso de Uso Completar formulario socioeconómico y académico
Propósito Permitir al estudiante completar la información requerida para la postulación, incluyendo datos académicos adicionales y situación socioeconómica.
Descripción El estudiante ingresa al formulario correspondiente, registra la información solicitada y guarda avances hasta completar el proceso.
Actores Estudiante Postulante
Actor Iniciador Estudiante Postulante
Precondición Postulación creada en estado “borrador”.
Usuario autenticado.
Proceso 1. El estudiante abre la sección del formulario. 2. Completa los campos requeridos (académicos y socioeconómicos). 3. El sistema valida formato, rangos y consistencia. 4. El estudiante guarda los cambios. 5. El formulario queda registrado como completado o en progreso.
Postcondición Formulario guardado y asociado a la postulación.
Excepciones 1. Campos incompletos obligatorios. 2. Valores inválidos (rangos, formatos). 3. Error al guardar información.

5.4.12. CU12 Subir y gestionar documentos
Figura 20. Diagrama de contexto CU12 Subir y gestionar documentos

Tabla 37. Detallar CU12 Subir y gestionar documentos
Caso de Uso Subir y gestionar documentos
Propósito Permitir al estudiante cargar, reemplazar y validar documentos requeridos para la postulación.
Descripción El estudiante carga documentos obligatorios según la convocatoria. El sistema valida formato, tamaño y genera hash de integridad.
Actores Estudiante Postulante
Actor Iniciador Estudiante Postulante
Precondición Convocatoria válida y postulación activa.
Requisitos documentales definidos.
Proceso 1. El estudiante accede a la sección de documentos. 2. Selecciona un requisito pendiente. 3. Sube el archivo requerido. 4. El sistema valida formato y tamaño. 5. El sistema genera hash de integridad y almacena metadatos. 6. El estudiante puede reemplazar el documento si recibe observaciones.
Postcondición Documento almacenado correctamente y registrado en la postulación.
Excepciones 1. Archivo supera tamaño permitido. 2. Formato no permitido. 3. Error al subir o almacenar documento. 4. Documento duplicado.

5.4.13. CU13 Evaluación IA automática por registro
Figura 21. Diagrama de contexto CU13 Evaluación IA automática por registro

Tabla 38. Detallar CU13 Evaluación IA automática por registro
Caso de Uso Evaluación IA automática por registro
Propósito Generar evaluación preliminar automática basada en los datos del estudiante usando modelos de IA.
Descripción El sistema envía información relevante al microservicio de IA, recibe puntaje y explicación (SHAP u otra métrica), y actualiza registro evaluado.
Actores Analista de Becas (observador)
Actor Iniciador Estudiante
Precondición 1. Postulación enviada por el estudiante. 2. Modelo de IA activo y accesible.
Proceso 1. El sistema identifica una postulación lista para evaluación automática. 2. Envía datos relevantes al microservicio IA. 3. Recibe puntaje y explicabilidad (SHAP). 4. Registra el resultado en la evaluación preliminar. 5. Notifica al analista que la evaluación está disponible.
Postcondición Evaluación preliminar generada y disponible para el Analista.
Excepciones 1. Microservicio IA no disponible. 2. Datos inconsistentes o insuficientes. 3. Modelo expirado o versión inválida.

5.4.14. CU14 Evaluación IA masiva (Batch)
Figura 22. Diagrama de contexto CU14 Evaluación IA masiva (Batch)

Tabla 39. Detallar CU14 Evaluación IA masiva (Batch)
Caso de Uso Evaluación IA masiva (Batch)
Propósito Permitir ejecutar la evaluación automática para múltiples postulaciones simultáneamente.
Descripción El Analista genera un lote de evaluaciones para procesar todas las postulaciones pendientes, recibiendo puntajes automáticos y resultados interpretables.
Actores Analista de Becas
Actor Iniciador Analista de Becas
Precondición 1. Convocatoria cerrada o etapa de evaluación iniciada. 2. Existencia de postulaciones en estado “Recepcionado”.
Proceso 1. El analista accede al módulo de evaluación masiva. 2. Selecciona convocatoria o lista de postulaciones. 3. Confirma ejecución. 4. El sistema envía datos al microservicio IA en lotes. 5. Recibe resultados y genera ranking preliminar. 6. El sistema registra evaluaciones y notifica finalización.
Postcondición Evaluaciones automáticas generadas para múltiples postulaciones.
Excepciones 1. Fallos parciales en el lote. 2. Servicio IA no disponible. 3. Exceso de carga (timeout).

5.4.15. CU15 Validar expediente/documentos (Evaluación humana)
Figura 23. Diagrama de contexto CU15 Validar expediente/documentos (Evaluación humana)

Tabla 40. Detallar CU15 Validar expediente/documentos (Evaluación humana)
Caso de Uso Validar expediente/documentos (Evaluación humana)
Propósito Permitir al Analista revisar y validar documentos cargados por el estudiante, emitiendo observaciones si corresponde.
Descripción El Analista revisa documentos, confirma su validez o marca observaciones solicitando correcciones al estudiante.
Actores Analista de Becas
Actor Iniciador Analista de Becas
Precondición 1. Postulación en estado válida para revisión. 2. Documentos cargados por el estudiante.
Proceso 1. El analista abre expediente del postulante. 2. Revisa documentos adjuntos. 3. Marca cada documento como válido, observado o rechazado. 4. Si corresponde, registra observaciones para el estudiante. 5. Guarda decisión y actualiza estado del expediente.
Postcondición Estado documental registrado (validado o con observaciones).
Excepciones 1. Documento ilegible o inválido. 2. Faltan archivos requeridos. 3. Error al guardar revisión.

5.4.16. CU16 Registrar dictamen técnico final
Figura 24. Diagrama de contexto CU16 Registrar dictamen técnico final

Tabla 41. Detallar CU16 Registrar dictamen técnico final
Caso de Uso Registrar evento crítico en Blockchain
Propósito Registrar la evaluación técnica del expediente del postulante con base en la revisión documental, resultados IA y criterios institucionales.
Descripción El analista revisa la información completa del expediente, valida documentos y puntajes, y registra el dictamen técnico preliminar que será presentado posteriormente al Comité de Evaluación para su revisión final.
Actores Analista de Becas
Actor Iniciador Analista de Becas
Precondición 1. Evaluación asistida por IA disponible. 2. Documentos validados o corregidos. 3. Postulación en estado “En evaluación técnica”.
Proceso 1. El analista abre el expediente del postulante. 2. Analiza justificativo IA y puntajes. 3. Ajusta puntajes manuales según normativa (si aplica). 4. Registra dictamen preliminar (recomendado/no recomendado). 5. Marca expediente como listo para deliberación del Comité.
Postcondición Dictamen técnico preliminar registrado y postulación lista para evaluación institucional.
Excepciones 1. Falta de criterios o datos. 2. Error al guardar información.

5.4.17. CU17 Ordenar y seleccionar becarios según ranking y cupos
Figura 25. Diagrama de contexto CU17 Ordenar y seleccionar becarios según ranking y cupos

Tabla 42. Detallar CU17 Ordenar y seleccionar becarios según ranking y cupos
Caso de Uso Ordenar y seleccionar becarios según ranking y cupos
Propósito Preparar listado ordenado de postulantes basado en dictámenes técnicos y reglas institucionales como insumo para la sesión del Comité de Evaluación.
Descripción El sistema genera un ranking preliminar basado en criterios, ponderaciones y cupos definidos. El analista revisa el listado y lo prepara para su presentación en comité. Este ranking no constituye decisión final.
Actores Analista de Becas
Actor Iniciador Analista de Becas
Precondición 1. Todos los dictámenes técnicos preliminares registrados. 2. Convocatoria con cupos y criterios definidos.
Proceso 1. El analista accede al módulo de ranking. 2. El sistema ordena postulantes según criterios definidos. 3. Se aplican cupos globales y por facultad (si aplica). 4. El analista revisa, corrige observaciones y genera documento preliminar. 5. El sistema marca el ranking como “Listo para Comité”.
Postcondición Ranking preliminar disponible para proceso deliberativo del Comité de Evaluación.
Excepciones 1. Falta de criterios. 2. Empates sin reglas definidas. 3. Cupos no configurados.

5.4.18. CU18 Registrar beca asignada
Figura 26. Diagrama de contexto CU18 Registrar beca asignada

Tabla 43. Detallar CU18 Registrar beca asignada
Caso de Uso Registrar beca asignada
Propósito Registrar en el sistema la decisión final tomada por el Comité de Evaluación respecto a las postulaciones.
Descripción Luego de la deliberación formal del Comité, el director o el analista autorizado registra los resultados oficiales (estudiantes aprobados, en lista de espera o rechazados), activando el estado “Becado” para quienes corresponda.
Actores Director Universitario de Bienestar Social o Analista de Becas
Actor Iniciador Director Universitario de Bienestar Social o Analista de Becas
Precondición 1. Sesión de comité realizada. 2. Acta de decisión aprobada. 3. Ranking preliminar disponible.
Proceso 1. El responsable abre módulo de asignación final. 2. Carga o confirma las resoluciones del comité. 3. El sistema actualiza estados de postulaciones (Aprobado / Lista de espera / Rechazado). 4. Se genera registro formal de beca asignada para los estudiantes aprobados. 5. El sistema habilita seguimiento académico para los becados.
Postcondición Asignación final registrada oficialmente y estudiantes notificados.
Excepciones 1. Faltan actas o validaciones formales. 2. Intento de asignar más becas que cupos. 3. Error en almacenamiento.

5.4.19. CU19 Notificar decisión al estudiante
Figura 26. Diagrama de contexto CU19 Notificar decisión al estudiante

Tabla 43. Detallar CU19 Notificar decisión al estudiante
Caso de Uso Notificar decisión al estudiante
Propósito Informar al estudiante la resolución final de su postulación mediante notificaciones electrónicas.
Descripción Una vez aprobada o rechazada la solicitud, el sistema envía notificación vía correo institucional y/o WhatsApp con estado final y pasos siguientes.
Actores Director Universitario de Bienestar Social, Estudiante
Actor Iniciador Director Universitario de Bienestar Social
Precondición 1. Decisión final registrada (asignación o rechazo). 2. Canales de notificación configurados.
Proceso 1. El sistema detecta cambio a estado final. 2. Genera mensaje personalizado. 3. Envia notificación vía correo y/o API de mensajería. 4. Registra log de entrega exitosa o fallida.
Postcondición Estudiante informado del resultado de su postulación.
Excepciones 1. Correo o teléfono no válido. 2. Servicio de mensajería no disponible.

5.4.20. CU20 Registrar informe académico mensual
Figura 26. Diagrama de contexto CU20 Registrar informe académico mensual

Tabla 43. Detallar CU20 Registrar informe académico mensual
Caso de Uso Registrar informe académico mensual
Propósito Permitir al estudiante becado cargar periódicamente evidencias de rendimiento académico según reglamento institucional.
Descripción El estudiante ingresa al módulo de seguimiento, adjunta reporte académico mensual y envía para validación por el Responsable de Seguimiento Académico.
Actores Estudiante Becado
Actor Iniciador Estudiante Becado
Precondición 1. Estudiante con beca activa. 2. Convocatoria o cronograma en fase de seguimiento.
Proceso 1. El estudiante accede al módulo de seguimiento. 2. Adjunta documentación requerida (PDF/imagen). 3. El sistema valida formato y registra hash. 4. El estudiante confirma envío. 5. El sistema marca el informe como “pendiente de validación”.
Postcondición Informe registrado y en espera de validación institucional.
Excepciones 1. Archivo con formato incorrecto. 2. Intento de enviar fuera de fecha establecida. 3. Error en almacenamiento o conexión.

5.4.21. CU21 Validar seguimiento académico y alertas
Figura 26. Diagrama de contexto CU21 Validar seguimiento académico y alertas

Tabla 43. Detallar CU21 Validar seguimiento académico y alertas
Caso de Uso Validar seguimiento académico y alertas
Propósito Validar los informes mensuales enviados por el estudiante becado y registrar alertas por incumplimiento académico o documental.
Descripción El Responsable de Seguimiento Académico revisa los informes enviados, verifica cumplimiento de requisitos y registra observaciones, alertas o validación final del seguimiento.
Actores Responsable de Seguimiento Académico
Actor Iniciador Responsable de Seguimiento Académico
Precondición 1. Informe mensual registrado por el estudiante. 2. Estudiante con estado "Beca activa".
Proceso 1. Accede al módulo de seguimiento. 2. Revisa documentos cargados y datos del estudiante. 3. Valida cumplimiento de criterios académicos (asistencia, notas, participación). 4. Marca estado del informe como: Validado / Observado / Incumplido. 5. Si hay incumplimiento, registra observación o alerta institucional.
Postcondición Seguimiento registrado y estado actualizado según cumplimiento.
Excepciones 1. Archivo dañado o ilegible. 2. Falta de datos evaluativos. 3. Intento de validar sin informe cargado.

5.4.22. CU22 Solicitar y procesar renovación
Figura 26. Diagrama de contexto CU22 Solicitar y procesar renovación

Tabla 43. Detallar CU22 Solicitar y procesar renovación
Caso de Uso Solicitar y procesar renovación
Propósito Permitir que el estudiante becado solicite renovación de su beca según criterios institucionales y confirmar dicha solicitud tras evaluación.
Descripción El estudiante solicita renovación adjuntando los requisitos exigidos. Luego el analista y responsable académico evalúan criterios para renovar o finalizar la beca.
Actores Estudiante Becado, Analista de Becas, responsable de Seguimiento Académico
Actor Iniciador Estudiante Becado
Precondición 1. Beca activa con fecha próxima a vencimiento. 2. Seguimiento académico registrado y sin incumplimientos graves.
Proceso 1. El estudiante solicita renovación y sube documentación requerida. 2. El sistema verifica requisitos mínimos automáticos. 3. El Analista revisa y valida expediente. 4. El Responsable de Seguimiento Académico valida desempeño académico final del periodo. 5. El Director confirma renovación o cierre.
Postcondición Renovación registrada y estudiante pasa a nuevo periodo — o la beca finaliza.
Excepciones 1. Solicitud fuera del periodo permitido. 2. Falta de documentos. 3. Incumplimientos académicos que impiden renovación.

5.4.23. CU23 Registrar evento crítico en Blockchain
Figura 26. Diagrama de contexto CU23 Registrar evento crítico en Blockchain

Tabla 43. Detallar CU23 Registrar evento crítico en Blockchain
Caso de Uso Registrar evento crítico en Blockchain
Propósito Registrar de forma inmutable un evento relevante del proceso de becas (evaluación, asignación, renovación, suspensión).
Descripción Cada acción institucional relevante genera un hash y se almacena en Hyperledger Fabric para garantizar trazabilidad.
Actores Director Universitario del Bienestar Social y Salud, Analista de Becas, Responsable de Seguimiento Académico, Estudiante
Actor Iniciador Director Universitario del Bienestar Social y Salud, Analista de Becas, Responsable de Seguimiento Académico, Estudiante
Precondición 1. Acción considerada evento crítico. 2. Servicio de blockchain disponible.
Proceso 1. El sistema detecta un evento crítico (ej.: dictamen final, asignación, renovación). 2. Genera hash del registro correspondiente. 3. Envía transacción al ledger. 4. Almacena tx_id y estado de la transacción.
Postcondición Evento almacenado en blockchain garantizando integridad auditada.
Excepciones 1. Error en conexión con ledger. 2. Tiempo de respuesta excedido. 3. Transacción rechazada por red.

5.4.24. CU24 Consultar trazabilidad y verificar integridad
Figura 26. Diagrama de contexto CU24 Consultar trazabilidad y verificar integridad

Tabla 43. Detallar CU24 Consultar trazabilidad y verificar integridad
Caso de Uso Consultar trazabilidad y verificar integridad
Propósito Permitir verificar que la información registrada en el sistema coincide con los eventos almacenados en blockchain, garantizando confiabilidad del proceso.
Descripción El director o personal autorizado consulta eventos críticos y compara la huella actual con la registrada en el ledger para detectar alteraciones.
Actores Director Universitario de Bienestar Social
Actor Iniciador Director Universitario de Bienestar Social
Precondición 1. Eventos registrados previamente en blockchain. 2. Usuario con permisos administrativos.
Proceso 1. Accede al módulo de trazabilidad. 2. Consulta historial de eventos asociados a un estudiante o convocatoria. 3. El sistema recupera hash local y hash blockchain. 4. Compara resultados y muestra estado: Válido / Manipulado / Inconcluso.
Postcondición Evidencia de integridad consultada exitosamente.
Excepciones 1. Sin permisos suficientes. 2. Hash no localizado en ledger. 3. Inconsistencia de datos.

5.4.25. CU25 Generar reportes institucionales
Figura 26. Diagrama de contexto CU25 Generar reportes institucionales

Tabla 43. Detallar CU25 Generar reportes institucionales
Caso de Uso Generar reportes institucionales
Propósito Generar informes exportables sobre postulaciones, beneficiarios, seguimiento y estadísticas institucionales.
Descripción El director genera reportes en diferentes formatos para evaluaciones internas o auditorías institucionales.
Actores Director Universitario de Bienestar Social
Actor Iniciador Director Universitario de Bienestar Social
Precondición 1. Información histórica registrada en el sistema. 2. Usuario con permisos de reportes.
Proceso 1. El director accede al módulo de reportes. 2. Selecciona criterios (fecha, facultad, tipo de beca, estado). 3. El sistema genera resultados. 4. Permite descargar en PDF o CSV.
Postcondición Reporte generado y disponible para consulta o exportación.
Excepciones 1. Insuficiencia de datos. 2. Error al generar exportación.

5.4.26. CU26 Visualizar dashboards y métricas
Figura 26. Diagrama de contexto CU26 Visualizar dashboards y métricas

Tabla 43. Detallar CU26 Visualizar dashboards y métricas
Caso de Uso Visualizar dashboards y métricas
Propósito Presentar visualmente estadísticas y métricas del sistema mediante paneles gráficos.
Descripción El director visualiza panel con gráficos dinámicos (tendencias, comparaciones, progresiones).
Actores Director Universitario de Bienestar Social
Actor Iniciador Director Universitario de Bienestar Social
Precondición Datos suficientes para generación de métricas.
Proceso 1. El director accede al módulo de estadísticas. 2. El sistema consulta datos acumulados. 3. Renderiza gráficos interactivos. 4. Permite filtrado por periodo, facultad, tipo de beca, estado.
Postcondición Métricas visualizadas correctamente.
Excepciones 1. Falta de datos. 2. Error de procesamiento o visualización gráfica.

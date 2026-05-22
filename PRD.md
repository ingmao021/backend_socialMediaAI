# PRD — Social Media AI (Frontend)

**Versión:** 1.0  
**Fecha:** 2026-05-22  
**Estado:** En desarrollo  
**Autor:** Andres Urbano  

---

## 1. Resumen ejecutivo

Social Media AI es una plataforma SaaS web que permite a los usuarios generar videos cortos mediante prompts de texto usando inteligencia artificial, y publicarlos directamente en YouTube desde la misma interfaz. El producto elimina la barrera técnica de la creación de contenido audiovisual: el usuario describe lo que quiere ver y la plataforma entrega el video listo para compartir.

---

## 2. Problema

Crear contenido de video para redes sociales requiere habilidades de edición, herramientas costosas y tiempo. Los creadores de contenido necesitan una solución que:

- Genere video de calidad a partir de una descripción de texto.
- No requiera instalación de software especializado.
- Permita publicar el resultado en redes sociales sin salir de la plataforma.

---

## 3. Objetivos del producto

| Objetivo | Métrica de éxito |
|----------|------------------|
| Reducir el tiempo de creación de un video a menos de 30 minutos | Tiempo medido desde el envío del prompt hasta el video completado |
| Permitir publicación en YouTube sin fricción | Tasa de videos exportados a YouTube ≥ 30 % de videos completados |
| Retener usuarios mediante una experiencia fluida | Tasa de rebote < 40 % en dashboard |

---

## 4. Usuarios objetivo

**Perfil primario — Creador de contenido independiente**  
- Produce contenido para redes sociales (YouTube Shorts, Reels, TikTok).  
- No tiene formación técnica en producción audiovisual.  
- Busca velocidad y simplicidad sobre control granular.

**Perfil secundario — Equipo de marketing de pequeña empresa**  
- Necesita material visual para campañas sin presupuesto para producción.  
- Valora la integración directa con plataformas de distribución.

---

## 5. Alcance del producto (v1)

### Dentro del alcance

- Autenticación (email/contraseña y Google OAuth).
- Generación de video a partir de prompt de texto (4, 6 u 8 segundos).
- Librería de videos con paginación.
- Gestión de perfil y avatar.
- Exportación de videos a YouTube con título, descripción y privacidad configurable.
- Sistema de cuotas de generación por usuario.

### Fuera del alcance (v1)

- Edición de video post-generación.
- Publicación en plataformas distintas a YouTube (Instagram, TikTok).
- Planes de suscripción y pagos.
- Administración de cuentas de equipo / multi-usuario.
- Análisis de rendimiento del video en redes sociales.

---

## 6. Funcionalidades requeridas

### 6.1 Autenticación

| ID | Funcionalidad | Prioridad |
|----|---------------|-----------|
| AUTH-01 | Registro con nombre, email y contraseña (mín. 8 caracteres) | Alta |
| AUTH-02 | Login con email y contraseña | Alta |
| AUTH-03 | Login / registro con cuenta Google (OAuth 2.0) | Alta |
| AUTH-04 | Persistencia de sesión mediante JWT | Alta |
| AUTH-05 | Cierre de sesión con limpieza de token | Alta |
| AUTH-06 | Redirección automática a `/login` cuando el token expira (401) | Alta |

### 6.2 Generación de video

| ID | Funcionalidad | Prioridad |
|----|---------------|-----------|
| VID-01 | Formulario de generación con campo de prompt (máx. 2 000 caracteres) | Alta |
| VID-02 | Selector de duración: 4, 6 u 8 segundos | Alta |
| VID-03 | Estado de generación en tiempo real mediante polling cada 5 segundos | Alta |
| VID-04 | Timeout de polling a los 25 minutos con mensaje al usuario | Media |
| VID-05 | Bloqueo del formulario cuando se alcanza la cuota de generación | Alta |
| VID-06 | Indicador visual de cuota restante en la cabecera | Media |

### 6.3 Librería de videos

| ID | Funcionalidad | Prioridad |
|----|---------------|-----------|
| LIB-01 | Grid de videos con paginación (10 videos por página) | Alta |
| LIB-02 | Reproducción de video directamente en la tarjeta | Alta |
| LIB-03 | Renovación automática de URL firmada (GCS) antes de que expire | Alta |
| LIB-04 | Estado visual de cada video: PROCESSING / COMPLETED / FAILED | Alta |
| LIB-05 | Eliminación de video con confirmación | Alta |

### 6.4 Perfil de usuario

| ID | Funcionalidad | Prioridad |
|----|---------------|-----------|
| PROF-01 | Visualización de nombre, email y estado de conexión Google | Alta |
| PROF-02 | Edición del nombre de usuario | Media |
| PROF-03 | Subida de avatar (JPG/PNG, máx. 2 MB) | Media |
| PROF-04 | Avatar generado con inicial del nombre como fallback | Baja |

### 6.5 Exportación a YouTube

| ID | Funcionalidad | Prioridad |
|----|---------------|-----------|
| YT-01 | Conexión de cuenta YouTube mediante OAuth 2.0 | Alta |
| YT-02 | Modal de publicación con campos: título, descripción, privacidad | Alta |
| YT-03 | Niveles de privacidad: PRIVATE, UNLISTED, PUBLIC | Alta |
| YT-04 | Tracking de progreso de la subida (barra de porcentaje) | Media |
| YT-05 | Link directo al video publicado en YouTube | Alta |
| YT-06 | Persistencia del estado "publicado" para evitar dobles publicaciones | Media |
| YT-07 | Desconexión de cuenta YouTube | Baja |

---

## 7. Flujos de usuario

### 7.1 Registro e inicio de sesión

```
/register → formulario → POST /api/auth/register → JWT → /dashboard
/login    → formulario → POST /api/auth/login    → JWT → /dashboard
/login    → Google btn → POST /api/auth/google   → JWT → /dashboard
```

### 7.2 Generación de video

```
/dashboard
  → Escribir prompt + seleccionar duración
  → POST /api/videos/generate (202 PROCESSING)
  → VideoCard con spinner aparece en el grid
  → useVideoPolling: GET /api/videos/{id}/status cada 5 s
      PROCESSING → continúa polling
      COMPLETED  → renderiza <VideoPlayer>
      FAILED     → muestra mensaje de error
```

### 7.3 Exportación a YouTube

```
VideoCard → "Compartir en YouTube"
  → GET /api/youtube/connection
      404 → iniciar OAuth → redirect a Google → callback /youtube/connected
      200 → abrir YouTubeShareModal
  → Formulario: título / descripción / privacidad
  → POST /api/videos/{id}/youtube/export
  → Polling GET /api/youtube/exports/{jobId} cada 2 s
      PENDING / PROCESSING → barra de progreso
      COMPLETED → link a YouTube + persistir en localStorage
      FAILED    → mensaje de error + botón reintentar
```

### 7.4 Gestión de perfil

```
Header avatar → dropdown → "Editar perfil" → /profile
  → Editar nombre → PUT /api/users/me
  → Subir avatar  → POST /api/users/me/avatar (multipart)
  → refreshUser() → avatar actualizado en header
```

---

## 8. Arquitectura técnica (frontend)

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Routing | React Router DOM 7 |
| HTTP | Axios con interceptor JWT |
| Auth Google | @react-oauth/google |
| Notificaciones | React Hot Toast |
| Estilos | CSS vanilla (glass-morphism) |
| Despliegue | Vercel |

**Backend:** `https://backend-socialmedia-ixsm.onrender.com` (Spring Boot)  
**Almacenamiento de video:** Google Cloud Storage (URLs firmadas, TTL ~1 h)

---

## 9. Requisitos no funcionales

| Requisito | Descripción |
|-----------|-------------|
| Rendimiento | El dashboard debe cargar en < 2 s en conexión estándar |
| Disponibilidad | Depende del backend en Render (free tier puede tener cold starts) |
| Seguridad | Token JWT en memoria; no persistido en localStorage por defecto |
| Compatibilidad | Chrome, Firefox, Safari, Edge en sus versiones estables actuales |
| Accesibilidad | Contraste mínimo WCAG AA en textos sobre fondos glass |
| Responsive | Usable en pantallas desde 375 px de ancho |

---

## 10. Manejo de errores esperados

| Código / Caso | Comportamiento en UI |
|---------------|---------------------|
| 400 VALIDATION_ERROR | Errores por campo en el formulario correspondiente |
| 401 Unauthorized | Limpiar token + redirigir a `/login` |
| 403 QUOTA_EXCEEDED | Deshabilitar formulario + mostrar mensaje de cuota |
| 409 EMAIL_ALREADY_REGISTERED | Mensaje en formulario de registro |
| Error de red en polling | No detener el polling; reintentar en el siguiente intervalo |
| Timeout de 25 min en generación | Mensaje: "La generación está tardando más de lo esperado" |
| URL firmada expirada | Refrescar automáticamente vía GET /api/videos/{id} |

---

## 11. Métricas de éxito (KPIs)

| KPI | Meta v1 |
|-----|---------|
| Videos generados por usuario activo / semana | ≥ 3 |
| Tasa de exportación a YouTube | ≥ 30 % de videos completados |
| Tasa de error en generación (FAILED) | < 10 % |
| Tiempo promedio de generación | < 5 minutos |
| Tiempo de carga del dashboard | < 2 segundos |

---

## 12. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Cold start del backend (Render free tier) | Alta latencia en primera carga | Mostrar loader + mensaje amigable |
| Expiración de URLs firmadas de GCS | Video no reproducible | Renovación automática con margen de 1 hora |
| Revocación del token de YouTube | Export falla sin aviso | Detectar error 401 en export y reiniciar flujo OAuth |
| Cuota de API de generación agotada | Usuarios bloqueados | Indicador de cuota en cabecera + mensaje claro |

---

## 13. Dependencias externas

| Servicio | Uso | Riesgo |
|----------|-----|--------|
| Google OAuth | Login + YouTube connect | Cambios en política de Google |
| YouTube Data API v3 | Publicación de videos | Cuota diaria de API |
| Google Cloud Storage | Almacenamiento de videos | Coste por almacenamiento y egress |
| Render (backend hosting) | API REST | Disponibilidad del free tier |
| Vercel (frontend hosting) | Servir la SPA | Bajo; tier gratuito estable |

---

## 14. Roadmap tentativo

| Fase | Funcionalidades | Estado |
|------|----------------|--------|
| v1.0 | Auth, generación, librería, perfil, YouTube export | En desarrollo |
| v1.1 | Planes de suscripción y gestión de cuotas por plan | Pendiente |
| v2.0 | Exportación a Instagram Reels y TikTok | Pendiente |
| v2.1 | Editor básico post-generación (recorte, subtítulos) | Pendiente |

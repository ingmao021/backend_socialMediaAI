## Contexto del Proyecto

Eres un experto en React 19 + TypeScript + Vite. Debes construir (o corregir) el frontend de una plataforma de generación de videos con IA. El backend ya está desplegado en Render.

**Stack obligatorio:** React 19, TypeScript, Vite, Vanilla CSS (no Tailwind).

**URLs de producción:**
- Backend: `https://backend-socialmedia-ixsm.onrender.com`
- Frontend (Vercel): `https://backend-social-media-ai.vercel.app`
- Google OAuth Client ID: `473986011010-apbe30gg8sm5drfeh8ap8guiu1ll5h78.apps.googleusercontent.com`

---

## 1. AUTENTICACIÓN

### 1.1 Google OAuth Login
```
POST /api/auth/google
Content-Type: application/json

Request:  { "token": "<google_id_token>" }
Response: { "token": "jwt-string", "user": { ...UserResponse } }
```

### 1.2 Registro Email/Password
```
POST /api/auth/register
Content-Type: application/json

Request:  { "name": "string (2-150)", "email": "valid@email", "password": "string (min 8)" }
Response: { "token": "jwt-string", "user": { ...UserResponse } }
```

### 1.3 Login Email/Password
```
POST /api/auth/login
Content-Type: application/json

Request:  { "email": "string", "password": "string" }
Response: { "token": "jwt-string", "user": { ...UserResponse } }
```

### 1.4 JWT — Reglas
- Guardar el `token` en memoria (context/state). NO en localStorage por seguridad, o si lo guardas en localStorage, acepta el tradeoff.
- **Todas** las peticiones a `/api/*` (excepto `/api/auth/*`) deben llevar: `Authorization: Bearer <token>`
- Si el backend responde 401 → limpiar token y redirigir a login.
- El token expira en 24 horas.

---

## 2. TIPOS TypeScript (deben coincidir exactamente con el backend)

```typescript
// === Auth ===
interface AuthResponse {
  token: string;
  user: UserResponse;
}

interface UserResponse {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  hasPassword: boolean;
  hasGoogle: boolean;
  videosGenerated: number;
  videosLimit: number;
  createdAt: string; // ISO 8601
}

// === Videos ===
type VideoStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface VideoResponse {
  id: string;          // UUID
  prompt: string;
  durationSeconds: number; // 4, 6, u 8
  status: VideoStatus;
  signedUrl: string | null;
  signedUrlExpiresAt: string | null; // ISO 8601
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VideoStatusResponse {
  status: VideoStatus;
  signedUrl: string | null;
}

interface GenerateVideoRequest {
  prompt: string;          // max 2000 chars, obligatorio
  durationSeconds: number; // solo 4, 6 u 8
}

// === Paginación Spring Boot ===
interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;  // página actual (0-indexed)
  size: number;
}

// === Errores ===
interface ApiError {
  code: string;
  message: string;
  fields: Record<string, string> | null;
}
```

---

## 3. ENDPOINTS DE VIDEO

### 3.1 Generar Video
```
POST /api/videos/generate
Authorization: Bearer <JWT>
Content-Type: application/json

Request:  { "prompt": "string", "durationSeconds": 4|6|8 }
Response: 202 Accepted → VideoResponse (status será "PROCESSING", signedUrl será null)
```

### 3.2 Polling de Estado (CRÍTICO)
```
GET /api/videos/{videoId}/status
Authorization: Bearer <JWT>

Response: 200 → VideoStatusResponse
```

**Estados posibles:**
| status | signedUrl | Acción frontend |
|--------|-----------|-----------------|
| `PROCESSING` | `null` | Seguir haciendo polling |
| `COMPLETED` | `"https://storage.googleapis.com/..."` | Detener polling, mostrar `<video>` |
| `FAILED` | `null` | Detener polling, mostrar error |

### 3.3 Listar Videos (Paginado)
```
GET /api/videos?page=0&size=10
Authorization: Bearer <JWT>

Response: 200 → Page<VideoResponse>
```

> ⚠️ **MUY IMPORTANTE:** Los videos están en `response.data.content`, NO en `response.data`.

### 3.4 Obtener Video Individual
```
GET /api/videos/{videoId}
Authorization: Bearer <JWT>

Response: 200 → VideoResponse
```

### 3.5 Eliminar Video
```
DELETE /api/videos/{videoId}
Authorization: Bearer <JWT>

Response: 204 No Content
```

---

## 4. ENDPOINTS DE USUARIO

### 4.1 Obtener Perfil
```
GET /api/users/me
Authorization: Bearer <JWT>

Response: 200 → UserResponse
```

### 4.2 Actualizar Nombre
```
PUT /api/users/me
Authorization: Bearer <JWT>
Content-Type: application/json

Request:  { "name": "string (2-150)" }
Response: 200 → UserResponse
```

### 4.3 Subir Avatar
```
POST /api/users/me/avatar
Authorization: Bearer <JWT>
Content-Type: multipart/form-data

Body: file (max 2MB, imagen)
Response: 200 → UserResponse (avatarUrl actualizado)
```

---

## 5. FLUJO DE GENERACIÓN DE VIDEO (el más importante)

### 5.1 Paso a paso

```
1. Usuario escribe prompt + selecciona duración (4/6/8s)
2. Frontend: POST /api/videos/generate → recibe VideoResponse con status "PROCESSING"
3. Agregar el video a la lista local inmediatamente (optimistic UI con spinner)
4. Iniciar polling: GET /api/videos/{id}/status cada 10 segundos
5. Si status === "COMPLETED" && signedUrl !== null:
   → Detener polling
   → Actualizar el video en la lista local
   → Renderizar <video src={signedUrl}>
6. Si status === "FAILED":
   → Detener polling
   → Mostrar mensaje de error
7. Si pasan 25 minutos sin respuesta:
   → Detener polling
   → Mostrar timeout (el backend tiene timeout de 20 min)
```

### 5.2 Hook de Polling Recomendado

```typescript
const useVideoPolling = (videoId: string | null) => {
  const [status, setStatus] = useState<VideoStatus>('PROCESSING');
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId || status !== 'PROCESSING') return;

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get<VideoStatusResponse>(
          `/api/videos/${videoId}/status`
        );
        setStatus(data.status);
        if (data.status === 'COMPLETED' && data.signedUrl) {
          setSignedUrl(data.signedUrl);
          clearInterval(interval);
        }
        if (data.status === 'FAILED') {
          clearInterval(interval);
        }
      } catch (err) {
        // NO detener polling por errores de red transitorios
        console.error('Polling error:', err);
      }
    }, 10_000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setStatus('FAILED');
    }, 25 * 60 * 1000);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [videoId, status]);

  return { status, signedUrl };
};
```

---

## 6. REPRODUCCIÓN DEL VIDEO

### ✅ CORRECTO
```tsx
{video.status === 'COMPLETED' && video.signedUrl && (
  <video
    key={video.signedUrl}
    src={video.signedUrl}
    controls
    playsInline
    preload="metadata"
  />
)}
```

### ❌ INCORRECTO (NO hacer esto)
```tsx
// NO usar fetch/blob — causa CORS y problemas de memoria
const blob = await fetch(signedUrl).then(r => r.blob());
```

### Reglas de reproducción:
- Usar `src={signedUrl}` directamente — la URL firmada ya da acceso
- Usar `key={signedUrl}` para forzar re-mount cuando la URL cambie
- NO agregar `crossOrigin="anonymous"` — no es necesario y puede causar CORS errors
- Formato: MP4 H.264 720p 16:9
- NO autoplay sin interacción del usuario

---

## 7. MANEJO DE ERRORES

### Códigos HTTP del backend:

| Status | `code` en body | Causa | Acción UI |
|--------|-----------------|-------|-----------|
| 400 | `VALIDATION_ERROR` | Prompt vacío, duración inválida | Mostrar `fields` con errores por campo |
| 400 | `BAD_REQUEST` | Argumento inválido | Mostrar `message` |
| 401 | — | JWT faltante/expirado | Redirigir a login |
| 403 | `QUOTA_EXCEEDED` | Límite de videos alcanzado | Mostrar mensaje de cuota |
| 404 | `NOT_FOUND` | Video/recurso no encontrado | Mostrar "no encontrado" |
| 409 | `EMAIL_ALREADY_REGISTERED` | Email ya existe | Mostrar en formulario |
| 413 | `PAYLOAD_TOO_LARGE` | Archivo > 2MB | Mostrar error de tamaño |
| 500 | `VIDEO_GENERATION_ERROR` | Error generando video | Mostrar error genérico |
| 500 | `INTERNAL_ERROR` | Error interno | Mostrar error genérico |

### Interceptor Axios recomendado:
```typescript
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Limpiar auth y redirigir a login
      authStore.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 8. ESTADOS DE UI POR PANTALLA

### 8.1 Dashboard / Feed de Videos
- **Cargando:** Skeleton/shimmer mientras se carga `GET /api/videos?page=0&size=10`
- **Sin videos:** Empty state con CTA "¡Genera tu primer video con IA!"
- **Con videos:** Grid/lista de VideoCards
- **Error de carga:** Retry button

### 8.2 VideoCard — 3 estados visuales
```
PROCESSING → Skeleton/placeholder con spinner + "Generando video con IA..." + barra de progreso simulada
COMPLETED  → <video> con controles + prompt + fecha + botón eliminar
FAILED     → Icono de error + errorMessage + opción de reintentar
```

### 8.3 Formulario de Generación
- Input de prompt (textarea, max 2000 chars, con contador)
- Selector de duración: 4s / 6s / 8s (botones toggle)
- Botón "Generar Video" (disabled mientras hay uno en PROCESSING)
- Validación client-side antes de enviar
- Loading state en el botón al enviar

### 8.4 Perfil de Usuario
- Mostrar: nombre, email, avatar, `videosGenerated / videosLimit`
- Editar nombre (PUT /api/users/me)
- Subir avatar (POST /api/users/me/avatar, max 2MB)
- Indicar si tiene Google vinculado (`hasGoogle`)

---

## 9. CONFIGURACIÓN DEL PROYECTO

### 9.1 Variables de Entorno (.env)
```
VITE_API_URL=https://backend-socialmedia-ixsm.onrender.com
VITE_GOOGLE_CLIENT_ID=473986011010-apbe30gg8sm5drfeh8ap8guiu1ll5h78.apps.googleusercontent.com
```

### 9.2 Axios Instance
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken(); // desde tu auth context/store
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 10. CHECKLIST FINAL

- [ ] Login con Google funciona y guarda JWT
- [ ] Todas las peticiones autenticadas llevan `Authorization: Bearer`
- [ ] POST /api/videos/generate envía `{ prompt, durationSeconds }` correctamente
- [ ] El polling usa `GET /api/videos/{id}/status` cada 10s
- [ ] El polling se detiene en COMPLETED o FAILED
- [ ] El `<video>` usa `src={signedUrl}` directo (no fetch/blob)
- [ ] El `<video>` tiene `key={signedUrl}`, `controls`, `playsInline`
- [ ] NO tiene `crossOrigin="anonymous"`
- [ ] La lista de videos lee de `response.data.content` (paginación Spring)
- [ ] Errores 401 redirigen a login
- [ ] Errores 403 QUOTA_EXCEEDED muestran mensaje de cuota
- [ ] El timeout del polling es 25 minutos
- [ ] El formulario valida: prompt no vacío, max 2000 chars, duración 4/6/8

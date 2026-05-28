 # Frontend SocialMediaAI

## Descripción general del proyecto

La aplicación es un frontend robusto y escalable para una plataforma de generación y gestión de contenidos multimedia impulsada por Inteligencia Artificial. Facilita a los usuarios la creación, administración y exportación de videos de forma eficiente.

Las funcionalidades principales incluyen:

- **Autenticación completa**: Soporte para registro tradicional (email/contraseña) y autenticación OAuth 2.0 con Google.
- **Generación de videos con IA**: Creación de contenido a través de prompts de texto, con opciones de duración de 4, 6 u 8 segundos.
- **Procesamiento asíncrono**: Polling en tiempo real del estado de generación, manteniendo al usuario informado del progreso (con timeout adaptativo).
- **Gestión integral de contenidos**: Listado paginado de videos, marcación de favoritos, historial de creaciones y eliminación de elementos.
- **Integración con YouTube**: Flujo completo de exportación a un canal de YouTube, personalizando título, descripción, etiquetas y nivel de privacidad (Público, Oculto, Privado).
- **Gestión de perfil**: Modificación de datos personales y actualización de avatar de usuario.
- **Control de cuotas**: Manejo eficiente de los límites de generación definidos por el backend, bloqueando acciones cuando se agota la cuota.

## Stack tecnológico utilizado

El frontend utiliza modernas herramientas del ecosistema React, comunicándose con un backend en **Spring Boot**.

- **Frontend Framework**: React
- **Lenguaje**: TypeScript
- **Enrutamiento**: React Router DOM
- **Cliente HTTP**: Axios
- **Gestión de Estado/Autenticación OAuth**: @react-oauth/google
- **Estilos / Componentes**: CSS puro / react-icons para iconografía
- **Notificaciones**: react-hot-toast
- **Herramienta de Build**: Vite
- **Linter & Formatter**: ESLint + TypeScript ESLint
- **Despliegue**: Vercel

## Versiones exactas

Dependencies clave (extraídas del `package.json`):

| Tecnología / Librería | Versión Exacta (o Mínima Resoluble) |
| --- | --- |
| React / React DOM | `^19.2.5` |
| TypeScript | `~6.0.2` |
| Vite | `^8.0.10` |
| React Router DOM | `^7.14.2` |
| Axios | `^1.15.2` |
| @react-oauth/google | `^0.13.5` |
| react-hot-toast | `^2.6.0` |
| react-icons | `^5.6.0` |
| ESLint | `^10.2.1` |
| TypeScript ESLint | `^8.58.2` |
| Node.js Types | `^24.12.2` |

## Requisitos previos

Para ejecutar este proyecto, necesitas tener instalado:

- **Node.js**: v18.x o superior (se recomienda última versión LTS).
- **npm**: v9.x o superior (suele venir integrado con Node.js).
- **Backend Operativo**: La API en Spring Boot corriendo y accesible localmente (por ejemplo, en el puerto `8080`).
- **Google Cloud Console**: Un proyecto configurado con un *Google OAuth Client ID*. Es fundamental agregar el origen local (ej. `http://localhost:5173`) a la lista de Orígenes de JavaScript autorizados.

## Instalación y configuración

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd frontend_socialMediaAI
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

## Variables de entorno necesarias

Crea un archivo llamado `.env.local` en la raíz del proyecto para tu configuración local:

```env
# URL base del backend de Spring Boot (sin barra final)
VITE_API_URL=http://localhost:8080

# Client ID de Google OAuth 2.0
VITE_GOOGLE_CLIENT_ID=<TU_CLIENT_ID>.apps.googleusercontent.com
```

*Nota: Ambas variables son de carácter obligatorio. Si `VITE_GOOGLE_CLIENT_ID` no se encuentra, la aplicación lanzará una advertencia y no inicializará la capa de OAuth.*

Para despliegues (ej. en Vercel), estas propiedades deben inyectarse en el gestor de variables de entorno de la respectiva plataforma.

## Despliegue y Acceso a la Aplicación

Puedes acceder a la versión ya desplegada de la aplicación en Vercel a través del siguiente enlace:
👉 **[Enlace a la aplicación en Vercel (https://backend-social-media-ai.vercel.app/)](#)**

*(Si necesitas ejecutar el proyecto para desarrollo, asegúrate de tener las dependencias instaladas, configura el `.env.local` y ejecuta `npm run dev` para que la aplicación abra localmente en `http://localhost:5173`)*.

### ¿Qué puedes hacer dentro de la plataforma?

Una vez ingreses a la aplicación web, podrás experimentar el siguiente flujo de usuario:

1. **Autenticación y Acceso**: Regístrate o inicia sesión de manera tradicional (correo/contraseña) o utiliza de forma rápida tu cuenta de Google gracias a OAuth 2.0.
2. **Generación de Videos con IA**: Desde tu Dashboard, interactúa con la Inteligencia Artificial mediante prompts de texto. Configura tu solicitud (por ejemplo, eligiendo si quieres un video de 4, 6 u 8 segundos) y pon en marcha la generación. Puedes usar incluso **entrada de voz** mediante el micrófono si tu navegador lo soporta.
3. **Monitoreo en Tiempo Real**: Visualiza el estado de tu video ("Procesando") mientras el sistema consulta automáticamente en segundo plano. Te notificará tan pronto como tu contenido esté listo.
4. **Gestión Total de Contenidos**:
   - Revisa un listado paginado de todas tus creaciones.
   - Marca tus videos preferidos para gestionarlos desde la vista de **Favoritos**.
   - Accede a tu **Historial** completo.
   - Elimina el contenido que ya no necesites.
5. **Exportación directa a YouTube**: Desde la interfaz de tu video gestionado, conéctalo con tu canal y expórtalo. Puedes añadir tu propio título, descripción, los tags que prefieras y establecer si quieres que se publique en modo *Público, Oculto o Privado*.
   
   > ⚠️ **Nota Importante sobre la Integración con YouTube**
   > 
   > Debido a que este proyecto fue desarrollado con fines académicos, actualmente no se encuentra publicado en Google Cloud por costo al publicar y al obtener un dominio.
   > 
   > Por esta razón, para realizar las pruebas relacionadas con la funcionalidad de publicación y compartición de videos en YouTube, se proporciona una cuenta de prueba.
   > 
   > ### Credenciales de prueba
   > - **Correo:** `Ordonezm021@gmail.com`
   > - **Contraseña:** `contraseña en el archivo enviado al campus`
   > 
   > Estas credenciales deben utilizarse únicamente durante el proceso de pruebas de integración con YouTube al momento de compartir videos desde la aplicación.

6. **Administración de tu Perfil**: Entra a tu perfil personal para enlazar tu canal de YouTube de forma segura, cambiar tu nombre en la plataforma y subir o actualizar tu avatar (soportando JPG o PNG hasta 2MB).
7. **Control de uso**: Podrás ver tu límite máximo de cuota permitida y cuántos videos has generado, todo controlado dinámicamente según la configuración de tu cuenta.



## Estructura básica del proyecto

```text
frontend_socialMediaAI/
├── public/                 # Recursos estáticos servidos crudos
├── src/
│   ├── components/         # Componentes reactivos aislados (UI)
│   ├── contexts/           # React Context (AuthContext)
│   ├── hooks/              # Customhooks (Polling, VoiceInput, Auth)
│   ├── pages/              # Rutas/Vistas a nivel superior
│   ├── routes/             # Configuración de React Router
│   ├── services/           # Peticiones API modularizadas a backend (axios)
│   ├── types/              # Definiciones e Interfaces TypeScript
│   ├── utils/              # Funciones auxiliares (tokenStorage)
│   ├── App.tsx             # Root Component de la aplicación
│   └── main.tsx            # Entry point de React/Vite
├── .env.local              # Fichero (Ignorado) de variables de entorno (Crear manualmente)
├── package.json            # Configuración de proyecto Node/npm
├── tsconfig.*.json         # Configuración del motor TypeScript
└── vite.config.ts          # Configuración del bundler Vite
```

## Consideraciones importantes y buenas prácticas

- **Control de Avatares**: Existen restricciones rigurosas. Solo se permiten imágenes `image/jpeg` o `image/png` con un peso máximo estricto de 2 MB, validado asimétricamente (frontend y backend).
- **Polling de Generación de Video**:
  - Sucede con intervalos de 5 segundos.
  - Implementa un *Timeout de Seguridad* de 25 minutos. Errores `5xx` momentáneos son ignorados, pero un error `404` del backend cancelará de inmediato el polling asumiendo que el recurso ya no existe.
- **Integración con YouTube**: El polling para el estado de carga (exportación) tiene un intervalo de 2 segundos evaluando flujos desde `PENDING` hasta `COMPLETED`.
- **Reglas de SPA en Servidores (Vercel)**: La plataforma de despliegue debe redireccionar a `index.html` si la ruta solicitada no es un archivo estático. Esto está actualmente configurado vía el archivo `vercel.json` interno con una directiva *rewrite catch-all*.

## Posibles errores comunes y cómo solucionarlos

| Error / Síntoma | Posible Causa | Solución Recomendada |
| --- | --- | --- |
| **Página "en blanco" o con error en Vercel** | Rewrite SPA no aplicado. | Validar que el archivo `vercel.json` retiene la regla `"rewrites": [{"source": "/(.*)", "destination": "/"}]`. |
| **Error `Missing VITE_GOOGLE_CLIENT_ID`** | Falta variable de entorno. | Revisar y configurar el archivo `.env.local` en raíz y detener/relanzar `npm run dev`. |
| **Google Login Falla Silenciosamente o 400** | Origen no autorizado en GCP. | Ir a la consola de Google Cloud, acceder a la pantalla del Client ID web y registrar explícitamente `http://localhost:5173`. |
| **Cierre de sesión persistente (401 en todo)** | Token expirado o dañado. | Eliminar el almacenamiento local y reponer credenciales volviendo a loguear. |
| **Video trabado en modo `PROCESSING`** | Crash del Backend o worker IA subyacente. | Esperar o revisar logs en el microservicio; el frontend cortará transcurridos 25 minutos. |
| **Subida de imagen falla (Status 413)** | Payload To Large. | La imagen pesa más de 2MB. Comprimir o reducir resolución. |

## Notas técnicas relevantes para desarrolladores

1. **Persistencia y Seguridad JWT**:
   El Token JWT emitido por la API se persiste en `localStorage` (cubierto tras la abstracción `utils/tokenStorage.ts`). Cualquier fallo sistemático de autenticación en las peticiones Axios intercepadas automáticamente expulsa al usuario al login.

2. **Interceptores Axios**:
   La capa de red (`apiClient.ts`) es madura; interviene el tráfico insertando el header `Authorization: Bearer <token>`. Adicionalmente, atrapa todas las respuestas con código de estado HTTP `401 Unauthorized` de manera general para redirigir forzosamente a la pantalla de Login a reautenticación, evitando estados zombies.
   
3. **Manejo del Callback de OAuth**:
   El retorno de la aprobación en YouTube debe ser interceptado en la ruta pública `/youtube/connected` para que el flujo de redirecciones con Google funcione sin intromisiones de los bloqueos locales de React Router.



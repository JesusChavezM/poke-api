# Poke-Client — Frontend (Quasar + Vue)

## Descripción

Cliente web de la aplicación **Pokédex Explorer**, construido con Vue 3 y Quasar Framework.

La aplicación permite:

- Iniciar sesión con Google (Google Identity Services)
- Consultar el listado completo de Pokémon con scroll infinito
- Ver detalles de cada Pokémon en un dialog (tipos, estadísticas, evoluciones y más)
- Navegar entre Pokémon directamente desde el dialog
- Cerrar sesión desde el header de la aplicación

> El cliente **no** consume directamente la PokeAPI. Toda comunicación ocurre a través del backend (BFF).

```
Browser → Frontend → Backend → PokeAPI
```

---

## Tecnologías

- Vue 3
- Quasar Framework
- Vue Router
- Axios
- Google Identity Services (GSI)
- JWT de sesión (emitido por el backend)

---

## Environment

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
VITE_API_BASE_URL="http://localhost:3000/api"
VITE_GOOGLE_CLIENT_ID="<google-client-id>.apps.googleusercontent.com"
```

> **Notas:**
>
> - `VITE_GOOGLE_CLIENT_ID` debe coincidir exactamente con el `GOOGLE_CLIENT_ID` configurado en el servidor.
> - El origin de la app debe estar registrado en Google Cloud Console.
> - En producción, `VITE_API_BASE_URL` debe apuntar al dominio del servidor desplegado.

---

## Instalación (local)

```bash
git clone <repo>
cd poke-client
yarn install
```

---

## Ejecución en desarrollo

```bash
yarn dev
```

La aplicación estará disponible en `http://localhost:9000`.

---

## Estructura de navegación

| Ruta                 | Acceso    | Descripción                            |
| -------------------- | --------- | -------------------------------------- |
| `/login`             | Público   | Página de inicio de sesión con Google  |
| `/`                  | Protegido | Listado de Pokémon con scroll infinito |
| `/pokemon/:nameOrId` | Protegido | Vista de detalle de un Pokémon         |

---

## Flujo de autenticación

1. El usuario presiona **"Sign in with Google"**.
2. Google retorna un `credential` (`idToken`).
3. El cliente envía el `idToken` al backend: `POST /api/auth/google`.
4. El backend valida el token con Google y devuelve un `sessionToken` (JWT propio).
5. El cliente almacena el token en `localStorage`.
6. El router guard concede acceso a las rutas protegidas.

---

## Protección de rutas

Las rutas protegidas utilizan la meta propiedad `requiresAuth`:

```js
meta: {
  requiresAuth: true;
}
```

El **router guard** evalúa el estado de sesión en cada navegación:

- Si no hay token → redirige a `/login`
- Si hay token → permite el acceso
- Si el backend responde `401` → logout automático y redirección a `/login`

---

## Manejo de sesión

El cliente persiste la sesión en `localStorage` con las claves `token` y `user`.

Axios está configurado con un interceptor global que:

- Adjunta automáticamente el header `Authorization: Bearer <token>` en cada petición.
- Detecta respuestas `401`, limpia el storage y redirige al login.

---

## Funcionalidades principales

### Listado de Pokémon — Scroll infinito

La vista principal (`/`) carga los Pokémon en bloques de **20 en 20** mediante scroll infinito implementado con Quasar, hasta alcanzar el total de **1 350 Pokémon**.

### Dialog de detalle

Al hacer clic en cualquier Pokémon se abre un dialog que muestra:

- Imagen oficial
- Tipos
- Estadísticas base
- Habilidades
- Cadena de evoluciones

El dialog incluye **botones de navegación** para desplazarse al Pokémon anterior o siguiente sin cerrar la vista.

### Header y cierre de sesión

El layout principal incluye un **header persistente** con el botón de **cerrar sesión**, que limpia la sesión y redirige al login.

### Diseño responsivo

La interfaz está construida con los componentes y el sistema de grid de Quasar, adaptándose correctamente a dispositivos móviles y escritorio.

---

## Comunicación con el backend

Todos los requests HTTP pasan por una instancia centralizada de Axios (`apiClient`) que gestiona:

- Timeout controlado
- Normalización de respuestas
- Manejo uniforme de errores
- Interceptor `401` global

---

## Google Sign-In y COOP

Para que el popup de Google funcione correctamente, el servidor debe responder con el siguiente header:

```
Cross-Origin-Opener-Policy: same-origin-allow-popups
```

Sin este header, el popup no puede comunicarse con la ventana principal y quedará en blanco.

---

## Troubleshooting

| Síntoma                   | Causa probable                                                        |
| ------------------------- | --------------------------------------------------------------------- |
| `401 Unauthorized`        | Token expirado o ausente                                              |
| `502 Network Error`       | Backend no disponible                                                 |
| Popup de Google en blanco | Falta el header COOP o el origin no está autorizado en Google Console |
| No redirige al login      | Revisar la configuración del router guard                             |

---

## Concepto importante

El frontend **nunca**:

- Valida tokens de forma independiente
- Consume la PokeAPI directamente
- Opera con los tokens de Google más allá del flujo de autenticación inicial

El backend es la **única fuente de autorización** de la aplicación.

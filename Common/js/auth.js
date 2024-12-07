// Common/js/auth.js

const TOKEN_KEY = 'authToken';

/**
 * Guarda el token de autenticación en el localStorage.
 * @param {string} token - Token de autenticación.
 */
function saveToken(token) {
    if (!token) {
        console.error("El token proporcionado es inválido.");
        return;
    }
    try {
        localStorage.setItem(TOKEN_KEY, token);
        console.log("Token guardado exitosamente:", token);
    } catch (error) {
        console.error("Error al guardar el token:", error);
    }
}

/**
 * Obtiene el token de autenticación almacenado en el localStorage.
 * @returns {string|null} El token o null si no existe.
 */
function getToken() {
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            console.warn("No se encontró ningún token almacenado.");
            return null;
        }
        console.log("Token recuperado:", token);
        return token;
    } catch (error) {
        console.error("Error al recuperar el token:", error);
        return null;
    }
}

/**
 * Elimina el token del almacenamiento local.
 */
function removeToken() {
    try {
        localStorage.removeItem(TOKEN_KEY);
        console.log("Token eliminado exitosamente.");
    } catch (error) {
        console.error("Error al eliminar el token:", error);
    }
}

/**
 * Verifica si hay un token almacenado.
 * @returns {boolean} True si el token existe, false en caso contrario.
 */
function isAuthenticated() {
    const token = getToken();
    return token !== null;
}

/**
 * Redirige al usuario al login si no está autenticado.
 */
function ensureAuthenticated() {
    if (!isAuthenticated()) {
        alert('No se ha iniciado sesión. Redirigiendo al login.');
        // Abrir el modal de iniciar sesión
        const loginModal = new bootstrap.Modal(document.getElementById('modalIniciarSesion'));
        loginModal.show();
    }
}

/**
 * Realiza el inicio de sesión del usuario.
 * @param {string} username - Nombre de usuario.
 * @param {string} password - Contraseña.
 * @returns {Promise<object>} Los datos del usuario.
 * @throws Error si la autenticación falla.
 */
async function login(username, password) {
    try {
        const response = await apiRequest('/auth/login/', 'POST', { username, password }, false);
        
        console.log("Respuesta del login:", response);
        
        if (response.tokens?.access) {
            saveToken(response.tokens.access);
            console.log("Inicio de sesión exitoso.");
            return response;
        } else {
            console.error("Respuesta inválida: no se encontró un token de acceso.");
            throw new Error("No se pudo iniciar sesión.");
        }
    } catch (error) {
        console.error("Error en el inicio de sesión:", error);
        Swal.fire('Error', error.message || 'No se pudo iniciar sesión.', 'error');
        throw error;
    }
}

/**
 * Realiza el cierre de sesión del usuario.
 */
function logout() {
    try {
        removeToken();
        console.log("Sesión cerrada exitosamente.");
    } catch (error) {
        console.error("Error al cerrar la sesión:", error);
    }
}

// Asignar las funciones al objeto window para hacerlas globales
window.saveToken = saveToken;
window.getToken = getToken;
window.removeToken = removeToken;
window.isAuthenticated = isAuthenticated;
window.ensureAuthenticated = ensureAuthenticated;
window.login = login;
window.logout = logout;

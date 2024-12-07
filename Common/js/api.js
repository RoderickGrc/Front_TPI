// Common/js/api.js

const BASE_URL = 'https://web-production-3c69.up.railway.app';

/**
 * Realiza una solicitud a la API.
 * @param {string} endpoint - Endpoint de la API.
 * @param {string} method - Método HTTP (GET, POST, etc.).
 * @param {object|null} body - Cuerpo de la solicitud.
 * @param {boolean} requiresAuth - Indica si la solicitud requiere autenticación.
 * @returns {Promise<object>} La respuesta de la API.
 * @throws Error si la solicitud falla.
 */
async function apiRequest(endpoint, method = 'GET', body = null, requiresAuth = false) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (requiresAuth) {
        const token = getToken();
        if (!token) {
            // No hay token, abrir el modal de iniciar sesión
            alert('No se ha iniciado sesión. Redirigiendo al login.');
            const loginModal = new bootstrap.Modal(document.getElementById('modalIniciarSesion'));
            loginModal.show();
            throw new Error('No autenticado');
        }
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`Enviando token en encabezados: Bearer ${token}`);
    }

    console.log(`Realizando solicitud: ${method} ${BASE_URL}${endpoint}`);
    if (body) {
        console.log('Cuerpo de la solicitud:', body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
        });

        // Manejar errores específicos
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.detail || 'Error desconocido';
            console.error(`Error en la solicitud: ${response.status} - ${errorMessage}`);
            throw new Error(errorMessage);
        }

        // Si la respuesta no tiene contenido (204 No Content), retornar null
        if (response.status === 204) {
            return null;
        }

        const data = await response.json();
        console.log('Respuesta de la API:', data);
        return data;
    } catch (error) {
        console.error('Error en apiRequest:', error);
        throw error;
    }
}

// Asignar apiRequest al objeto window para hacerlo global
window.apiRequest = apiRequest;

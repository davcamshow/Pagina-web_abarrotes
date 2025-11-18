// static/js/admin-users.js
class AdminUsersManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('Administrador de usuarios inicializado');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Buscar usuarios al escribir
        document.getElementById('searchUsers').addEventListener('input', (e) => {
            this.buscarUsuarios(e.target.value);
        });

        // Enter en búsqueda
        document.getElementById('searchUsers').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.buscarUsuarios(e.target.value);
            }
        });
    }

    buscarUsuarios(termino = null) {
        if (!termino) {
            termino = document.getElementById('searchUsers').value;
        }
        
        const filas = document.querySelectorAll('.table-row');
        const terminoLower = termino.toLowerCase();

        filas.forEach(fila => {
            if (fila.classList.contains('table-header')) return;
            
            const textoFila = fila.textContent.toLowerCase();
            if (textoFila.includes(terminoLower)) {
                fila.style.display = '';
            } else {
                fila.style.display = 'none';
            }
        });
    }

    filtrarUsuarios() {
        const estado = document.getElementById('filterStatus').value;
        const rol = document.getElementById('filterRole').value;
        const filas = document.querySelectorAll('.table-row');

        filas.forEach(fila => {
            if (fila.classList.contains('table-header')) return;
            
            const esActivo = fila.querySelector('.status-badge').textContent.includes('Activo');
            const esAdmin = fila.querySelectorAll('.status-badge')[1].textContent.includes('Administrador');
            
            let mostrar = true;

            // Filtrar por estado
            if (estado === 'active' && !esActivo) mostrar = false;
            if (estado === 'inactive' && esActivo) mostrar = false;

            // Filtrar por rol
            if (rol === 'admin' && !esAdmin) mostrar = false;
            if (rol === 'user' && esAdmin) mostrar = false;

            fila.style.display = mostrar ? '' : 'none';
        });
    }

    mostrarModalCrear() {
        document.getElementById('modalTitle').textContent = 'Agregar Usuario';
        document.getElementById('userForm').reset();
        document.getElementById('usuarioId').value = '';
        document.getElementById('password').required = true;
        document.getElementById('passwordHelp').style.display = 'none';
        document.getElementById('userModal').style.display = 'block';
    }

    editarUsuario(usuarioId) {
        const fila = document.querySelector(`[data-user-id="${usuarioId}"]`);
        const celdas = fila.querySelectorAll('div');
        
        document.getElementById('modalTitle').textContent = 'Editar Usuario';
        document.getElementById('usuarioId').value = usuarioId;
        document.getElementById('nombre').value = celdas[1].textContent.trim();
        document.getElementById('email').value = celdas[2].textContent.trim();
        document.getElementById('es_admin').checked = celdas[4].textContent.includes('Administrador');
        document.getElementById('password').required = false;
        document.getElementById('passwordHelp').style.display = 'block';
        
        document.getElementById('userModal').style.display = 'block';
    }

    cerrarModal() {
        document.getElementById('userModal').style.display = 'none';
    }

    async guardarUsuario() {
        const formData = new FormData();
        const usuarioId = document.getElementById('usuarioId').value;
        
        formData.append('nombre', document.getElementById('nombre').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('es_admin', document.getElementById('es_admin').checked);
        
        if (usuarioId) {
            formData.append('usuario_id', usuarioId);
            if (document.getElementById('password').value) {
                formData.append('password', document.getElementById('password').value);
            }
        } else {
            formData.append('password', document.getElementById('password').value);
        }

        try {
            const url = usuarioId ? '/api/editar-usuario/' : '/api/crear-usuario/';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                this.cerrarModal();
                location.reload(); // Recargar para ver los cambios
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('Error al guardar usuario: ' + error.message);
        }
    }

    async cambiarEstado(usuarioId, accion) {
        if (!confirm(`¿Estás seguro de que quieres ${accion} este usuario?`)) {
            return;
        }

        try {
            const formData = new FormData();
            formData.append('usuario_id', usuarioId);
            formData.append('accion', accion);

            const response = await fetch('/api/cambiar-estado-usuario/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                location.reload();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('Error al cambiar estado: ' + error.message);
        }
    }

    async eliminarUsuario(usuarioId) {
        if (!confirm('¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE este usuario? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const formData = new FormData();
            formData.append('usuario_id', usuarioId);

            const response = await fetch('/api/eliminar-usuario/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                location.reload();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            alert('Error al eliminar usuario: ' + error.message);
        }
    }

    getCSRFToken() {
        const name = 'csrftoken';
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.adminUsersManager = new AdminUsersManager();
});

// Funciones globales para los onclick
function mostrarModalCrear() {
    window.adminUsersManager.mostrarModalCrear();
}

function editarUsuario(usuarioId) {
    window.adminUsersManager.editarUsuario(usuarioId);
}

function cerrarModal() {
    window.adminUsersManager.cerrarModal();
}

function guardarUsuario() {
    window.adminUsersManager.guardarUsuario();
}

function cambiarEstado(usuarioId, accion) {
    window.adminUsersManager.cambiarEstado(usuarioId, accion);
}

function eliminarUsuario(usuarioId) {
    window.adminUsersManager.eliminarUsuario(usuarioId);
}

function buscarUsuarios() {
    window.adminUsersManager.buscarUsuarios();
}

function filtrarUsuarios() {
    window.adminUsersManager.filtrarUsuarios();
}
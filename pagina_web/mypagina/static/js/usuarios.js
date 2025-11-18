// Funcionalidades para la gestión de usuarios
document.addEventListener('DOMContentLoaded', function() {
    console.log('Módulo de usuarios cargado');
    
    inicializarGestionUsuarios();
});

function inicializarGestionUsuarios() {
    // Botón de búsqueda
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.getElementById('search-users');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', buscarUsuarios);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarUsuarios();
            }
        });
    }
    
    // Botón agregar usuario
    const btnAgregar = document.getElementById('btn-agregar-usuario');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', agregarUsuario);
    }
    
    // Filtros
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', aplicarFiltrosUsuarios);
    }
    
    // Delegación de eventos para los botones de acción
    const table = document.querySelector('.users-table');
    if (table) {
        table.addEventListener('click', manejarAccionesUsuario);
    }
}

function buscarUsuarios() {
    const searchTerm = document.getElementById('search-users').value.trim();
    if (searchTerm) {
        console.log('Buscando usuarios:', searchTerm);
        // Aquí implementarías la búsqueda real
        mostrarNotificacion(`Buscando usuarios: "${searchTerm}"`, 'info');
    } else {
        mostrarNotificacion('Por favor, ingresa un término de búsqueda', 'warning');
    }
}

function agregarUsuario() {
    mostrarNotificacion('Funcionalidad para agregar usuario', 'info');
    // Aquí iría el modal/formulario para agregar usuario
}

function aplicarFiltrosUsuarios() {
    const estado = document.getElementById('status-filter').value;
    
    console.log('Aplicando filtros de usuarios:', { estado });
    
    // Aquí implementarías el filtrado real de la tabla
    const filas = document.querySelectorAll('.users-table .table-row[data-user-id]');
    
    filas.forEach(fila => {
        let mostrar = true;
        
        if (estado === 'active' && fila.classList.contains('user-inactive')) {
            mostrar = false;
        } else if (estado === 'inactive' && !fila.classList.contains('user-inactive')) {
            mostrar = false;
        }
        
        fila.style.display = mostrar ? '' : 'none';
    });
    
    mostrarNotificacion('Filtros de usuarios aplicados correctamente', 'success');
}

function manejarAccionesUsuario(event) {
    const boton = event.target;
    if (!boton.classList.contains('btn-small')) return;
    
    const accion = boton.getAttribute('data-action');
    const fila = boton.closest('.table-row');
    const userId = fila.getAttribute('data-user-id');
    const nombreUsuario = fila.querySelector('strong').textContent;
    
    switch (accion) {
        case 'edit':
            editarUsuario(userId, nombreUsuario);
            break;
        case 'deactivate':
            desactivarUsuario(userId, nombreUsuario);
            break;
        case 'activate':
            activarUsuario(userId, nombreUsuario);
            break;
        case 'delete':
            eliminarUsuario(userId, nombreUsuario);
            break;
    }
}

function editarUsuario(userId, nombreUsuario) {
    if (confirmarAccion(`¿Estás seguro de que quieres editar el usuario "${nombreUsuario}"?`)) {
        mostrarNotificacion(`Editando usuario: ${nombreUsuario} (ID: ${userId})`, 'info');
        // Aquí iría el modal/formulario para editar usuario
    }
}

function desactivarUsuario(userId, nombreUsuario) {
    if (confirmarAccion(`¿Estás seguro de que quieres desactivar el usuario "${nombreUsuario}"?`)) {
        mostrarNotificacion(`Desactivando usuario: ${nombreUsuario} (ID: ${userId})`, 'warning');
        // Aquí iría la llamada AJAX para desactivar
    }
}

function activarUsuario(userId, nombreUsuario) {
    mostrarNotificacion(`Activando usuario: ${nombreUsuario} (ID: ${userId})`, 'info');
    // Aquí iría la llamada AJAX para activar
}

function eliminarUsuario(userId, nombreUsuario) {
    if (confirmarAccion(`¿Estás seguro de que quieres eliminar el usuario "${nombreUsuario}"? Esta acción no se puede deshacer.`)) {
        mostrarNotificacion(`Eliminando usuario: ${nombreUsuario} (ID: ${userId})`, 'error');
        // Aquí iría la llamada AJAX para eliminar
    }
}

// Funciones de utilidad (compartidas)
function mostrarNotificacion(mensaje, tipo = 'info') {
    const tipos = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    
    const icono = tipos[tipo] || tipos['info'];
    alert(`${icono} ${mensaje}`);
}

function confirmarAccion(mensaje) {
    return confirm(mensaje);
}
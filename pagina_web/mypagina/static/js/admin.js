// Funcionalidades básicas del panel de administración
document.addEventListener('DOMContentLoaded', function() {
    console.log('Panel de administración cargado');
    
    // Inicializar funcionalidades comunes
    inicializarBusqueda();
    inicializarAccionesRapidas();
});

function inicializarBusqueda() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', function() {
            buscarEnSistema();
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarEnSistema();
            }
        });
    }
}

function buscarEnSistema() {
    const searchTerm = document.querySelector('.search-input').value.trim();
    if (searchTerm) {
        // Aquí implementarías la búsqueda en todo el sistema
        console.log('Buscando en sistema:', searchTerm);
        alert(`Buscando: "${searchTerm}" en todo el sistema`);
    }
}

function inicializarAccionesRapidas() {
    // Las tarjetas de acción ya tienen onclick en el HTML
    console.log('Acciones rápidas inicializadas');
}

// Funciones de utilidad para el admin
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
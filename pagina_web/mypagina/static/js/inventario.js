// Funcionalidades para la gestión de inventario
document.addEventListener('DOMContentLoaded', function() {
    console.log('Módulo de inventario cargado');
    
    inicializarInventario();
});

function inicializarInventario() {
    // Botón de búsqueda
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.getElementById('search-inventory');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', buscarProductos);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarProductos();
            }
        });
    }
    
    // Botón agregar producto
    const btnAgregar = document.getElementById('btn-agregar-producto');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', agregarProducto);
    }
    
    // Filtros
    const categoryFilter = document.getElementById('category-filter');
    const stockFilter = document.getElementById('stock-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', aplicarFiltros);
    }
    
    if (stockFilter) {
        stockFilter.addEventListener('change', aplicarFiltros);
    }
    
    // Delegación de eventos para los botones de acción
    const table = document.querySelector('.inventory-table');
    if (table) {
        table.addEventListener('click', manejarAccionesProducto);
    }
}

function buscarProductos() {
    const searchTerm = document.getElementById('search-inventory').value.trim();
    if (searchTerm) {
        console.log('Buscando productos:', searchTerm);
        // Aquí implementarías la búsqueda real
        mostrarNotificacion(`Buscando productos: "${searchTerm}"`, 'info');
    } else {
        mostrarNotificacion('Por favor, ingresa un término de búsqueda', 'warning');
    }
}

function agregarProducto() {
    mostrarNotificacion('Funcionalidad para agregar producto', 'info');
    // Aquí iría el modal/formulario para agregar producto
}

function aplicarFiltros() {
    const categoria = document.getElementById('category-filter').value;
    const stock = document.getElementById('stock-filter').value;
    
    console.log('Aplicando filtros:', { categoria, stock });
    
    // Aquí implementarías el filtrado real de la tabla
    const filas = document.querySelectorAll('.inventory-table .table-row[data-product-id]');
    
    filas.forEach(fila => {
        let mostrar = true;
        
        // Filtrar por categoría (simulado)
        if (categoria && fila.querySelector('span:nth-child(2)').textContent !== categoria) {
            mostrar = false;
        }
        
        // Filtrar por stock (simulado)
        if (stock === 'low' && !fila.classList.contains('stock-low')) {
            mostrar = false;
        } else if (stock === 'out' && !fila.classList.contains('stock-out')) {
            mostrar = false;
        } else if (stock === 'good' && (fila.classList.contains('stock-low') || fila.classList.contains('stock-out'))) {
            mostrar = false;
        }
        
        fila.style.display = mostrar ? '' : 'none';
    });
    
    mostrarNotificacion('Filtros aplicados correctamente', 'success');
}

function manejarAccionesProducto(event) {
    const boton = event.target;
    if (!boton.classList.contains('btn-small')) return;
    
    const accion = boton.getAttribute('data-action');
    const fila = boton.closest('.table-row');
    const productId = fila.getAttribute('data-product-id');
    const nombreProducto = fila.querySelector('strong').textContent;
    
    switch (accion) {
        case 'edit':
            editarProducto(productId, nombreProducto);
            break;
        case 'delete':
            eliminarProducto(productId, nombreProducto);
            break;
    }
}

function editarProducto(productId, nombreProducto) {
    if (confirmarAccion(`¿Estás seguro de que quieres editar el producto "${nombreProducto}"?`)) {
        mostrarNotificacion(`Editando producto: ${nombreProducto} (ID: ${productId})`, 'info');
        // Aquí iría el modal/formulario para editar producto
    }
}

function eliminarProducto(productId, nombreProducto) {
    if (confirmarAccion(`¿Estás seguro de que quieres eliminar el producto "${nombreProducto}"? Esta acción no se puede deshacer.`)) {
        mostrarNotificacion(`Eliminando producto: ${nombreProducto} (ID: ${productId})`, 'success');
        // Aquí iría la llamada AJAX para eliminar
    }
}

// Funciones de utilidad (compartidas con admin.js)
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
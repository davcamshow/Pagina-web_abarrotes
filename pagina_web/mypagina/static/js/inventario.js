// Funcionalidades completas para la gestión de inventario - VERSIÓN CORREGIDA
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Módulo de inventario cargado');
    
    inicializarInventario();
});

function inicializarInventario() {
    console.log('🔧 Inicializando inventario...');
    
    // Botón agregar producto
    const btnAgregar = document.getElementById('btn-agregar-producto');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', mostrarModalAgregarProducto);
        console.log('✅ Botón agregar producto configurado');
    } else {
        console.error('❌ No se encontró el botón agregar producto');
    }
    
    // Filtro de categoría
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const categoriaId = this.value;
            console.log('🔄 Categoría seleccionada:', categoriaId);
            aplicarFiltros();
        });
        console.log('✅ Filtro de categoría configurado');
    }
    
    // Filtro de stock
    const stockFilter = document.getElementById('stock-filter');
    if (stockFilter) {
        stockFilter.addEventListener('change', aplicarFiltros);
        console.log('✅ Filtro de stock configurado');
    }
    
    // Búsqueda
    const searchInput = document.getElementById('search-inventory');
    if (searchInput) {
        searchInput.addEventListener('input', buscarProductos);
        console.log('✅ Búsqueda configurada');
    }
    
    // Delegación de eventos para acciones
    const table = document.querySelector('.inventory-table');
    if (table) {
        table.addEventListener('click', manejarAccionesProducto);
        console.log('✅ Delegación de eventos configurada');
    }
    
    // Cargar todos los productos al inicio
    cargarTodosLosProductos();
}

function aplicarFiltros() {
    const categoriaId = document.getElementById('category-filter').value;
    const stockFiltro = document.getElementById('stock-filter').value;
    
    console.log('🔄 Aplicando filtros - Categoría:', categoriaId, 'Stock:', stockFiltro);
    
    // Si hay categoría seleccionada, cargar productos de esa categoría
    if (categoriaId) {
        console.log('📦 Cargando productos de categoría:', categoriaId);
        cargarProductosPorCategoria(categoriaId, stockFiltro);
    } else {
        // Si no hay categoría seleccionada, cargar todos los productos
        console.log('📦 Cargando todos los productos');
        cargarTodosLosProductos(stockFiltro);
    }
}

function cargarTodosLosProductos(stockFiltro = '') {
    console.log('📦 Cargando todos los productos...');
    fetch('/api/productos-por-categoria/')
        .then(response => {
            console.log('📡 Respuesta del servidor:', response.status);
            if (!response.ok) throw new Error('Error del servidor: ' + response.status);
            return response.json();
        })
        .then(data => {
            console.log('📊 Todos los productos recibidos:', data);
            if (data.success) {
                mostrarProductosEnTabla(data.productos, stockFiltro);
                mostrarNotificacion(`✅ Cargados ${data.productos.length} productos`, 'success');
            } else {
                mostrarNotificacion('❌ Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error al cargar productos:', error);
            mostrarNotificacion('❌ Error al cargar productos: ' + error.message, 'error');
        });
}

function cargarProductosPorCategoria(categoriaId, stockFiltro = '') {
    console.log(`📦 Cargando productos de categoría: ${categoriaId}`);
    fetch(`/api/productos-por-categoria/?categoria_id=${categoriaId}`)
        .then(response => {
            console.log('📡 Respuesta del servidor:', response.status);
            if (!response.ok) throw new Error('Error del servidor: ' + response.status);
            return response.json();
        })
        .then(data => {
            console.log(`📊 Productos de categoría ${categoriaId}:`, data);
            if (data.success) {
                mostrarProductosEnTabla(data.productos, stockFiltro);
                mostrarNotificacion(`✅ Cargados ${data.productos.length} productos de esta categoría`, 'success');
            } else {
                mostrarNotificacion('❌ Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            mostrarNotificacion('❌ Error al cargar productos: ' + error.message, 'error');
        });
}

function mostrarProductosEnTabla(productos, stockFiltro = '') {
    console.log('🔄 Actualizando tabla con', productos.length, 'productos. Filtro stock:', stockFiltro);
    
    const tbody = document.querySelector('.inventory-table');
    if (!tbody) {
        console.error('❌ No se encontró la tabla de inventario');
        return;
    }
    
    // Limpiar tabla (mantener header)
    const rows = tbody.querySelectorAll('.table-row[data-product-id], .no-products-message');
    rows.forEach(row => row.remove());
    
    // Aplicar filtro de stock si existe
    let productosFiltrados = productos;
    if (stockFiltro) {
        productosFiltrados = productos.filter(producto => {
            if (stockFiltro === 'low') return producto.stock < 10 && producto.stock > 0;
            if (stockFiltro === 'out') return producto.stock === 0;
            if (stockFiltro === 'good') return producto.stock >= 10;
            return true;
        });
        console.log(`🔍 Después de filtrar stock (${stockFiltro}):`, productosFiltrados.length, 'productos');
    }
    
    if (productosFiltrados.length === 0) {
        const emptyRow = document.createElement('div');
        emptyRow.className = 'table-row no-products-message';
        emptyRow.style.textAlign = 'center';
        emptyRow.style.padding = '2rem';
        emptyRow.style.gridColumn = '1 / -1';
        emptyRow.innerHTML = '<span style="color: var(--text-dark);">No hay productos disponibles</span>';
        tbody.appendChild(emptyRow);
        console.log('📭 Tabla vacía - no hay productos que coincidan con los filtros');
        return;
    }
    
    productosFiltrados.forEach(producto => {
        const fila = document.createElement('div');
        fila.className = `table-row ${producto.stock === 0 ? 'stock-out' : producto.stock < 10 ? 'stock-low' : ''}`;
        fila.setAttribute('data-product-id', producto.id_producto);
        
        const estadoBadge = producto.stock === 0 ? 
            '<span class="stock-badge stock-danger">Agotado</span>' : 
            producto.stock < 10 ? 
            '<span class="stock-badge stock-warning">Bajo</span>' : 
            '<span class="stock-badge stock-good">Disponible</span>';
        
        const destacadoIcon = producto.destacado ? '<span style="color: gold; margin-left: 0.5rem;">★</span>' : '';
        
        fila.innerHTML = `
            <span>
                <strong>${producto.nombre}</strong>
                ${destacadoIcon}
            </span>
            <span>${producto.categoria}</span>
            <span>$${producto.precio.toFixed(2)}</span>
            <span>${producto.stock}</span>
            <span>${estadoBadge}</span>
            <span class="action-buttons">
                <button class="btn-small btn-edit" data-action="edit">
                    Editar
                </button>
                <button class="btn-small btn-delete" data-action="delete">
                    Eliminar
                </button>
            </span>
        `;
        
        tbody.appendChild(fila);
    });
    
    console.log('✅ Tabla actualizada con', productosFiltrados.length, 'productos');
}

function buscarProductos() {
    const searchTerm = document.getElementById('search-inventory').value.trim().toLowerCase();
    console.log('🔍 Buscando:', searchTerm);
    
    if (searchTerm) {
        const filas = document.querySelectorAll('.inventory-table .table-row[data-product-id]');
        let encontrados = 0;
        
        filas.forEach(fila => {
            const nombreProducto = fila.querySelector('strong').textContent.toLowerCase();
            if (nombreProducto.includes(searchTerm)) {
                fila.style.display = '';
                encontrados++;
            } else {
                fila.style.display = 'none';
            }
        });
        
        console.log(`🔍 Encontrados ${encontrados} productos`);
        mostrarNotificacion(`🔍 Encontrados ${encontrados} productos para "${searchTerm}"`, 'info');
    } else {
        // Mostrar todos si no hay término de búsqueda
        const filas = document.querySelectorAll('.inventory-table .table-row[data-product-id]');
        filas.forEach(fila => fila.style.display = '');
    }
}

function mostrarModalAgregarProducto() {
    console.log('➕ Mostrando modal para agregar producto');
    
    const modalHTML = `
        <div class="modal-overlay" id="modal-producto">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>➕ Agregar Nuevo Producto</h3>
                    <button class="modal-close" onclick="cerrarModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-producto">
                        <div class="form-group">
                            <label for="nombre">Nombre del Producto *</label>
                            <input type="text" id="nombre" name="nombre" required>
                        </div>
                        <div class="form-group">
                            <label for="descripcion">Descripción</label>
                            <textarea id="descripcion" name="descripcion" rows="3"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="precio">Precio *</label>
                                <input type="number" id="precio" name="precio" step="0.01" min="0" required>
                            </div>
                            <div class="form-group">
                                <label for="stock">Stock *</label>
                                <input type="number" id="stock" name="stock" min="0" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="categoria_id">Categoría *</label>
                                <select id="categoria_id" name="categoria_id" required>
                                    <option value="">Seleccionar categoría</option>
                                    ${obtenerOpcionesCategorias()}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="descuento">Descuento (%)</label>
                                <input type="number" id="descuento" name="descuento" min="0" max="100" value="0">
                            </div>
                        </div>
                        <div class="form-group checkbox-group">
                            <input type="checkbox" id="destacado" name="destacado">
                            <label for="destacado">Producto Destacado</label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
                    <button type="button" class="btn-primary" onclick="guardarProducto()">Guardar Producto</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('✅ Modal mostrado');
}

function obtenerOpcionesCategorias() {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        let options = '';
        categoryFilter.querySelectorAll('option').forEach(option => {
            if (option.value) {
                options += `<option value="${option.value}">${option.textContent}</option>`;
            }
        });
        return options;
    }
    return '<option value="">No hay categorías disponibles</option>';
}

function cerrarModal() {
    const modal = document.getElementById('modal-producto');
    if (modal) {
        modal.remove();
        console.log('✅ Modal cerrado');
    }
}

function guardarProducto() {
    console.log('💾 Guardando producto...');
    
    const form = document.getElementById('form-producto');
    const formData = new FormData(form);
    
    // Validar
    if (!formData.get('nombre') || !formData.get('precio') || !formData.get('stock') || !formData.get('categoria_id')) {
        mostrarNotificacion('❌ Completa todos los campos obligatorios', 'warning');
        return;
    }
    
    fetch('/api/crear-producto/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('📨 Respuesta del servidor:', data);
        if (data.success) {
            mostrarNotificacion('✅ ' + data.message, 'success');
            cerrarModal();
            aplicarFiltros(); // Recargar con los filtros actuales
        } else {
            mostrarNotificacion('❌ ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('❌ Error:', error);
        mostrarNotificacion('❌ Error al guardar producto', 'error');
    });
}

function manejarAccionesProducto(event) {
    const boton = event.target;
    if (!boton.classList.contains('btn-small')) return;
    
    const accion = boton.getAttribute('data-action');
    const fila = boton.closest('.table-row');
    const productId = fila.getAttribute('data-product-id');
    const nombreProducto = fila.querySelector('strong').textContent;
    
    console.log(`🔧 Acción: ${accion} en producto ${productId} - ${nombreProducto}`);
    
    if (accion === 'delete') {
        eliminarProducto(productId, nombreProducto);
    } else if (accion === 'edit') {
        editarProducto(productId, nombreProducto);
    }
}

function editarProducto(productId, nombreProducto) {
    console.log(`✏️ Editando producto: ${nombreProducto} (ID: ${productId})`);
    
    // Primero obtener los datos actuales del producto
    fetch('/api/productos-por-categoria/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const producto = data.productos.find(p => p.id_producto == productId);
                if (producto) {
                    mostrarModalEditarProducto(productId, producto);
                } else {
                    mostrarNotificacion('❌ No se encontraron los datos del producto', 'error');
                }
            } else {
                mostrarNotificacion('❌ Error al cargar datos del producto', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            mostrarNotificacion('❌ Error al cargar datos del producto', 'error');
        });
}

function mostrarModalEditarProducto(productId, productoData) {
    console.log('✏️ Mostrando modal para editar producto:', productoData);
    
    const modalHTML = `
        <div class="modal-overlay" id="modal-producto">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>✏️ Editar Producto</h3>
                    <button class="modal-close" onclick="cerrarModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-producto">
                        <input type="hidden" id="producto_id" name="producto_id" value="${productId}">
                        <div class="form-group">
                            <label for="nombre">Nombre del Producto *</label>
                            <input type="text" id="nombre" name="nombre" value="${productoData.nombre}" required>
                        </div>
                        <div class="form-group">
                            <label for="descripcion">Descripción</label>
                            <textarea id="descripcion" name="descripcion" rows="3">${productoData.descripcion || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="precio">Precio *</label>
                                <input type="number" id="precio" name="precio" step="0.01" min="0" value="${productoData.precio}" required>
                            </div>
                            <div class="form-group">
                                <label for="stock">Stock *</label>
                                <input type="number" id="stock" name="stock" min="0" value="${productoData.stock}" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="categoria_id">Categoría *</label>
                                <select id="categoria_id" name="categoria_id" required>
                                    <option value="">Seleccionar categoría</option>
                                    ${obtenerOpcionesCategoriasConSeleccion(productoData.categoria_id)}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="descuento">Descuento (%)</label>
                                <input type="number" id="descuento" name="descuento" min="0" max="100" value="${productoData.descuento || 0}">
                            </div>
                        </div>
                        <div class="form-group checkbox-group">
                            <input type="checkbox" id="destacado" name="destacado" ${productoData.destacado ? 'checked' : ''}>
                            <label for="destacado">Producto Destacado</label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
                    <button type="button" class="btn-primary" onclick="actualizarProducto()">Actualizar Producto</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function obtenerOpcionesCategoriasConSeleccion(categoriaSeleccionada) {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        let options = '';
        categoryFilter.querySelectorAll('option').forEach(option => {
            if (option.value) {
                const selected = option.value == categoriaSeleccionada ? 'selected' : '';
                options += `<option value="${option.value}" ${selected}>${option.textContent}</option>`;
            }
        });
        return options;
    }
    return '';
}

function actualizarProducto() {
    console.log('💾 Actualizando producto...');
    
    const form = document.getElementById('form-producto');
    const formData = new FormData(form);
    
    // Validar
    if (!formData.get('nombre') || !formData.get('precio') || !formData.get('stock') || !formData.get('categoria_id')) {
        mostrarNotificacion('❌ Completa todos los campos obligatorios', 'warning');
        return;
    }
    
    fetch('/api/editar-producto/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('📨 Respuesta del servidor:', data);
        if (data.success) {
            mostrarNotificacion('✅ ' + data.message, 'success');
            cerrarModal();
            aplicarFiltros(); // Recargar con los filtros actuales
        } else {
            mostrarNotificacion('❌ ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('❌ Error:', error);
        mostrarNotificacion('❌ Error al actualizar producto', 'error');
    });
}

function eliminarProducto(productId, nombreProducto) {
    if (confirm(`¿Estás seguro de eliminar "${nombreProducto}"? Esta acción no se puede deshacer.`)) {
        console.log(`🗑️ Eliminando producto ${productId}`);
        
        const formData = new FormData();
        formData.append('producto_id', productId);
        
        fetch('/api/eliminar-producto/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('📨 Respuesta eliminación:', data);
            if (data.success) {
                mostrarNotificacion('✅ ' + data.message, 'success');
                aplicarFiltros(); // Recargar con los filtros actuales
            } else {
                mostrarNotificacion('❌ ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            mostrarNotificacion('❌ Error al eliminar producto', 'error');
        });
    }
}

// Funciones de utilidad
function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || 'no-csrf-token';
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    // Sistema de notificaciones mejorado
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    if (tipo === 'success') {
        notification.style.background = '#28a745';
    } else if (tipo === 'error') {
        notification.style.background = '#dc3545';
    } else if (tipo === 'warning') {
        notification.style.background = '#ffc107';
        notification.style.color = '#000';
    } else {
        notification.style.background = '#17a2b8';
    }
    
    notification.textContent = mensaje;
    document.body.appendChild(notification);
    
    // Auto-eliminar después de 4 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 4000);
}

// Hacer funciones globales para el modal
window.cerrarModal = cerrarModal;
window.guardarProducto = guardarProducto;
window.actualizarProducto = actualizarProducto;
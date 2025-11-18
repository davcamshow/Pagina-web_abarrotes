// Función para agregar producto al carrito
function agregarAlCarrito(productoId) {
    const cantidad = 1;
    
    fetch(`/agregar-carrito/${productoId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: `cantidad=${cantidad}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarNotificacion('Producto agregado al carrito', 'success');
            actualizarContadorCarrito(data.carrito_count);
        } else {
            mostrarNotificacion(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al agregar al carrito', 'error');
    });
}

// Función para actualizar cantidad en el carrito
function actualizarCantidad(itemId, accion) {
    fetch(`/actualizar-carrito/${itemId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: `accion=${accion}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Actualizar la interfaz
            const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
            if (itemElement) {
                if (accion === 'eliminar') {
                    itemElement.remove();
                } else {
                    const cantidadElement = itemElement.querySelector('.cantidad');
                    const subtotalElement = itemElement.querySelector('.item-subtotal');
                    
                    if (cantidadElement && subtotalElement) {
                        const nuevaCantidad = parseInt(cantidadElement.textContent) + (accion === 'incrementar' ? 1 : -1);
                        cantidadElement.textContent = nuevaCantidad;
                        subtotalElement.textContent = `$${data.item_subtotal}`;
                    }
                }
            }
            
            // Actualizar totales
            document.getElementById('subtotal').textContent = `$${data.subtotal}`;
            document.getElementById('envio').textContent = `$${data.envio}`;
            document.getElementById('total').textContent = `$${data.total}`;
            
            actualizarContadorCarrito(data.carrito_count);
            
        } else {
            mostrarNotificacion(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al actualizar carrito', 'error');
    });
}

// Función para realizar compra
function realizarCompra() {
    if (!confirm('¿Estás seguro de que deseas realizar la compra?')) {
        return;
    }
    
    fetch('/realizar-compra/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarNotificacion(`¡Compra realizada exitosamente! Orden: ${data.orden_numero}`, 'success');
            setTimeout(() => {
                window.location.href = '/inicioUsuario/';
            }, 2000);
        } else {
            mostrarNotificacion(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al realizar la compra', 'error');
    });
}

// Función para obtener contador del carrito
function actualizarContadorCarrito(count) {
    const contador = document.getElementById('carrito-count');
    if (contador) {
        contador.textContent = count;
        contador.style.display = count > 0 ? 'inline' : 'none';
    }
}

// Función auxiliar para obtener cookie
function getCookie(name) {
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

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo) {
    // Implementar lógica de notificaciones según tu diseño
    alert(mensaje); // Puedes reemplazar con un sistema de notificaciones más elegante
}

// Cargar contador del carrito al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    fetch('/obtener-contador-carrito/')
        .then(response => response.json())
        .then(data => {
            actualizarContadorCarrito(data.carrito_count);
        });
});
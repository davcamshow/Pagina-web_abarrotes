from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import login as auth_login
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json
from .forms import RegistroForm, LoginForm
from .models import Usuario, Categoria, Producto
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import user_passes_test

def home(request):
    return render(request, 'inicio.html')

def sobre_nosotros(request):
    return render(request, 'SobreNosotros.html')

def registro(request):
    if request.method == 'POST':
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            email = request.POST.get('email')
            if Usuario.objects.filter(email=email).exists():
                return JsonResponse({
                    'exists': True,
                    'message': 'Este correo ya está registrado. ¿Quieres iniciar sesión?'
                })
            else:
                return JsonResponse({'exists': False})
        
        form = RegistroForm(request.POST)
        if form.is_valid():
            usuario = form.save()
            messages.success(request, '¡Registro exitoso! Ahora puedes iniciar sesión.')
            return redirect('login')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    if ';' not in error:
                        messages.error(request, f'{error}')
    else:
        form = RegistroForm()
    
    return render(request, 'Registro.html', {'form': form})

# views.py - Modificar la función login
def login(request):
    if request.method == 'POST':
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            email = request.POST.get('email')
            if not Usuario.objects.filter(email=email).exists():
                return JsonResponse({
                    'exists': False,
                    'message': 'Este correo no está registrado. ¿Quieres crear una cuenta?'
                })
            else:
                return JsonResponse({'exists': True})
        
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            
            try:
                usuario = Usuario.objects.get(email=email)
                if usuario.check_password(password):
                    auth_login(request, usuario)
                    messages.success(request, f'¡Bienvenido {usuario.nombre}!')
                    
                    # CORREGIDO: Usar is_staff en lugar de is_admin
                    if usuario.is_staff:
                        return redirect('inicio_admin')
                    else:
                        return redirect('inicio_usuario')
                        
                else:
                    messages.error(request, 'Contraseña incorrecta')
            except Usuario.DoesNotExist:
                messages.error(request, 'Este correo no está registrado')
        else:
            messages.error(request, 'Por favor corrige los errores del formulario')
    else:
        form = LoginForm()
    
    return render(request, 'login.html', {'form': form})

@login_required
def inicio_usuario(request):
    categorias = Categoria.objects.all()
    
    categoria_id = request.GET.get('categoria_id')
    productos = None
    categoria_seleccionada = None
    
    if categoria_id:
        try:
            categoria_seleccionada = Categoria.objects.get(id=categoria_id)
            productos = Producto.objects.filter(categoria=categoria_seleccionada, activo=True)
        except Categoria.DoesNotExist:
            messages.error(request, 'Categoría no encontrada')
    
    # Obtener el carrito del usuario
    carrito = request.user.obtener_carrito()
    total_carrito = sum(item['cantidad'] for item in carrito)
    
    context = {
        'usuario': request.user,
        'categorias': categorias,
        'productos': productos,
        'categoria_seleccionada': categoria_seleccionada,
        'total_carrito': total_carrito
    }
    
    return render(request, 'inicioUsuario.html', context)

@login_required
def carrito(request):
    # Obtener el carrito del usuario
    carrito_items = request.user.obtener_carrito()
    
    # Calcular totales y subtotales por item
    for item in carrito_items:
        item['subtotal'] = float(item['precio']) * item['cantidad']
    
    subtotal = sum(item['subtotal'] for item in carrito_items)
    envio = 0 if subtotal >= 500 else 50
    descuento = subtotal * 0.1 if subtotal > 300 else 0
    total = subtotal + envio - descuento
    
    context = {
        'usuario': request.user,
        'carrito_items': carrito_items,
        'subtotal': subtotal,
        'envio': envio,
        'descuento': descuento,
        'total': total,
        'total_items': sum(item['cantidad'] for item in carrito_items),
        'faltante_envio_gratis': max(0, 500 - subtotal)  # Para el mensaje de envío gratis
    }
    
    return render(request, 'carrito.html', context)

@login_required
@require_POST
def agregar_al_carrito(request):
    try:
        producto_id = int(request.POST.get('producto_id'))
        cantidad = int(request.POST.get('cantidad', 1))
        
        producto = get_object_or_404(Producto, id_producto=producto_id)
        
        # Verificar stock
        if producto.stock < cantidad:
            return JsonResponse({
                'success': False,
                'message': f'No hay suficiente stock. Stock disponible: {producto.stock}'
            })
        
        producto_data = {
            'nombre': producto.nombre,
            'precio': float(producto.precio),
            'imagen': producto.obtener_imagen_emoji(),
            'categoria': producto.categoria.nombre
        }
        
        carrito = request.user.agregar_al_carrito(producto_id, cantidad, producto_data)
        total_items = sum(item['cantidad'] for item in carrito)
        
        return JsonResponse({
            'success': True,
            'message': f'¡{producto.nombre} agregado al carrito!',
            'total_items': total_items,
            'carrito': carrito
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al agregar al carrito: {str(e)}'
        })

@login_required
@require_POST
def actualizar_carrito(request):
    try:
        producto_id = int(request.POST.get('producto_id'))
        cantidad = int(request.POST.get('cantidad', 1))
        
        carrito = request.user.actualizar_cantidad(producto_id, cantidad)
        total_items = sum(item['cantidad'] for item in carrito)
        
        # Recalcular totales
        subtotal = sum(item['precio'] * item['cantidad'] for item in carrito)
        envio = 0 if subtotal >= 500 else 50
        descuento = subtotal * 0.1 if subtotal > 300 else 0
        total = subtotal + envio - descuento
        
        return JsonResponse({
            'success': True,
            'total_items': total_items,
            'subtotal': subtotal,
            'envio': envio,
            'descuento': descuento,
            'total': total
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al actualizar carrito: {str(e)}'
        })

@login_required
@require_POST
def eliminar_del_carrito(request):
    try:
        producto_id = int(request.POST.get('producto_id'))
        
        carrito = request.user.eliminar_del_carrito(producto_id)
        total_items = sum(item['cantidad'] for item in carrito)
        
        # Recalcular totales
        subtotal = sum(item['precio'] * item['cantidad'] for item in carrito)
        envio = 0 if subtotal >= 500 else 50
        descuento = subtotal * 0.1 if subtotal > 300 else 0
        total = subtotal + envio - descuento
        
        return JsonResponse({
            'success': True,
            'message': 'Producto eliminado del carrito',
            'total_items': total_items,
            'subtotal': subtotal,
            'envio': envio,
            'descuento': descuento,
            'total': total
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al eliminar del carrito: {str(e)}'
        })

@login_required
@require_POST
def vaciar_carrito(request):
    try:
        carrito = request.user.vaciar_carrito()
        
        return JsonResponse({
            'success': True,
            'message': 'Carrito vaciado correctamente',
            'total_items': 0,
            'subtotal': 0,
            'envio': 0,
            'descuento': 0,
            'total': 0
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al vaciar carrito: {str(e)}'
        })

@login_required
def obtener_carrito(request):
    """Endpoint para obtener el carrito actual"""
    try:
        carrito = request.user.obtener_carrito()
        total_items = sum(item['cantidad'] for item in carrito)
        
        return JsonResponse({
            'success': True,
            'carrito': carrito,
            'total_items': total_items
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener carrito: {str(e)}'
        })
    
# CORREGIDO: Decorador admin_required usando is_staff
def admin_required(function=None):
    """
    Decorador que verifica si el usuario es administrador
    """
    actual_decorator = user_passes_test(
        lambda u: u.is_authenticated and u.is_staff,  # CORREGIDO: usar is_staff
        login_url='/login/',
        redirect_field_name=None
    )
    if function:
        return actual_decorator(function)
    return actual_decorator

# Modificar las vistas administrativas
@admin_required
def inicio_admin(request):
    """Vista para el panel de administración"""
    # Obtener estadísticas
    total_usuarios = Usuario.objects.count()
    total_productos = Producto.objects.count()
    productos_bajo_stock = Producto.objects.filter(stock__lt=10).count()
    productos_agotados = Producto.objects.filter(stock=0).count()
    
    context = {
        'usuario': request.user,
        'total_usuarios': total_usuarios,
        'total_productos': total_productos,
        'productos_bajo_stock': productos_bajo_stock,
        'productos_agotados': productos_agotados
    }
    
    return render(request, 'inicioAdmin.html', context)

@admin_required
def inventario(request):
    """Vista para gestionar el inventario"""
    productos = Producto.objects.all().select_related('categoria')
    categorias = Categoria.objects.all()
    
    # Estadísticas
    total_productos = productos.count()
    productos_bajo_stock = productos.filter(stock__lt=10).count()
    productos_agotados = productos.filter(stock=0).count()
    
    context = {
        'usuario': request.user,
        'productos': productos,
        'categorias': categorias,
        'total_productos': total_productos,
        'productos_bajo_stock': productos_bajo_stock,
        'productos_agotados': productos_agotados
    }
    
    return render(request, 'inventario.html', context)

# CORREGIDO: Vista administrar_usuarios usando is_staff
@staff_member_required
def administrar_usuarios(request):
    """Vista para administrar usuarios"""
    usuarios = Usuario.objects.all()
    
    # Estadísticas - CORREGIDO: usar is_staff en lugar de is_admin
    total_usuarios = usuarios.count()
    usuarios_activos = usuarios.filter(is_active=True).count()
    administradores = usuarios.filter(is_staff=True).count()  # CORREGIDO
    
    context = {
        'usuario': request.user,
        'usuarios': usuarios,
        'total_usuarios': total_usuarios,
        'usuarios_activos': usuarios_activos,
        'administradores': administradores
    }
    
    return render(request, 'administrar_usuarios.html', context)

# CORREGIDO: Funciones para usuarios usando is_staff
@staff_member_required
@require_POST
def crear_usuario(request):
    """Crear nuevo usuario desde el panel admin"""
    try:
        nombre = request.POST.get('nombre')
        email = request.POST.get('email')
        password = request.POST.get('password')
        es_admin = request.POST.get('es_admin') == 'true'
        
        if not nombre or not email or not password:
            return JsonResponse({
                'success': False,
                'message': 'Todos los campos son obligatorios'
            })
        
        if Usuario.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': 'Este email ya está registrado'
            })
        
        # CORREGIDO: Usar solo is_staff
        usuario = Usuario(
            nombre=nombre,
            email=email,
            is_staff=es_admin  # CORREGIDO
        )
        usuario.set_password(password)
        usuario.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Usuario {nombre} creado exitosamente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al crear usuario: {str(e)}'
        })

@staff_member_required
@require_POST
def editar_usuario(request):
    """Editar usuario existente"""
    try:
        usuario_id = request.POST.get('usuario_id')
        nombre = request.POST.get('nombre')
        email = request.POST.get('email')
        es_admin = request.POST.get('es_admin') == 'true'
        
        usuario = get_object_or_404(Usuario, id=usuario_id)
        
        # Verificar si el email ya existe en otro usuario
        if Usuario.objects.filter(email=email).exclude(id=usuario_id).exists():
            return JsonResponse({
                'success': False,
                'message': 'Este email ya está en uso por otro usuario'
            })
        
        usuario.nombre = nombre
        usuario.email = email
        usuario.is_staff = es_admin  # CORREGIDO
        usuario.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Usuario {nombre} actualizado exitosamente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al editar usuario: {str(e)}'
        })

@staff_member_required
@require_POST
def cambiar_estado_usuario(request):
    """Activar/desactivar usuario"""
    try:
        usuario_id = request.POST.get('usuario_id')
        accion = request.POST.get('accion')  # 'activar' o 'desactivar'
        
        usuario = get_object_or_404(Usuario, id=usuario_id)
        
        if accion == 'activar':
            usuario.activar()
            mensaje = f'Usuario {usuario.nombre} activado'
        else:
            usuario.desactivar()
            mensaje = f'Usuario {usuario.nombre} desactivado'
        
        return JsonResponse({
            'success': True,
            'message': mensaje
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al cambiar estado: {str(e)}'
        })

@staff_member_required
@require_POST
def eliminar_usuario(request):
    """Eliminar usuario permanentemente"""
    try:
        usuario_id = request.POST.get('usuario_id')
        usuario = get_object_or_404(Usuario, id=usuario_id)
        
        # No permitir eliminar al propio usuario
        if usuario.id == request.user.id:
            return JsonResponse({
                'success': False,
                'message': 'No puedes eliminar tu propio usuario'
            })
        
        nombre_usuario = usuario.nombre
        usuario.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Usuario {nombre_usuario} eliminado permanentemente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al eliminar usuario: {str(e)}'
        })

# Funciones para productos
@staff_member_required
@require_POST
def crear_producto(request):
    """Crear nuevo producto desde el panel admin"""
    try:
        nombre = request.POST.get('nombre')
        descripcion = request.POST.get('descripcion')
        precio = request.POST.get('precio')
        stock = request.POST.get('stock')
        categoria_id = request.POST.get('categoria_id')
        destacado = request.POST.get('destacado') == 'true'
        descuento = request.POST.get('descuento', 0)
        
        print(f"Datos recibidos: {nombre}, {precio}, {stock}, {categoria_id}")
        
        if not all([nombre, precio, stock, categoria_id]):
            return JsonResponse({
                'success': False,
                'message': 'Todos los campos obligatorios deben ser llenados'
            })
        
        categoria = get_object_or_404(Categoria, id=categoria_id)
        
        producto = Producto(
            nombre=nombre,
            description=descripcion,
            precio=float(precio),
            stock=int(stock),
            categoria=categoria,
            destacado=destacado,
            descuento=int(descuento)
        )
        producto.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Producto "{nombre}" creado exitosamente',
            'producto_id': producto.id_producto
        })
        
    except Exception as e:
        print(f"Error en crear_producto: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error al crear producto: {str(e)}'
        })

@staff_member_required
@require_POST
def editar_producto(request):
    """Editar producto existente"""
    try:
        producto_id = request.POST.get('producto_id')
        nombre = request.POST.get('nombre')
        descripcion = request.POST.get('descripcion')
        precio = request.POST.get('precio')
        stock = request.POST.get('stock')
        categoria_id = request.POST.get('categoria_id')
        destacado = request.POST.get('destacado') == 'true'
        descuento = request.POST.get('descuento', 0)
        
        producto = get_object_or_404(Producto, id_producto=producto_id)
        categoria = get_object_or_404(Categoria, id=categoria_id)
        
        producto.nombre = nombre
        producto.description = descripcion
        producto.precio = float(precio)
        producto.stock = int(stock)
        producto.categoria = categoria
        producto.destacado = destacado
        producto.descuento = int(descuento)
        producto.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Producto "{nombre}" actualizado exitosamente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al editar producto: {str(e)}'
        })

@staff_member_required
@require_POST
def eliminar_producto(request):
    """Eliminar producto permanentemente"""
    try:
        producto_id = request.POST.get('producto_id')
        producto = get_object_or_404(Producto, id_producto=producto_id)
        
        nombre_producto = producto.nombre
        producto.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'Producto "{nombre_producto}" eliminado permanentemente'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error al eliminar producto: {str(e)}'
        })

@staff_member_required
def obtener_productos_por_categoria(request):
    """Obtener productos filtrados por categoría"""
    try:
        categoria_id = request.GET.get('categoria_id')
        
        if categoria_id and categoria_id != '':
            productos = Producto.objects.filter(
                categoria_id=categoria_id, 
                activo=True
            ).select_related('categoria')
        else:
            productos = Producto.objects.filter(activo=True).select_related('categoria')
        
        productos_data = []
        for producto in productos:
            productos_data.append({
                'id_producto': producto.id_producto,
                'nombre': producto.nombre,
                'precio': float(producto.precio),
                'stock': producto.stock,
                'categoria': producto.categoria.nombre,
                'categoria_id': producto.categoria.id,
                'destacado': producto.destacado,
                'descuento': producto.descuento,
                'descripcion': producto.description or ''
            })
        
        return JsonResponse({
            'success': True,
            'productos': productos_data
        })
        
    except Exception as e:
        print(f"Error en obtener_productos_por_categoria: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error al obtener productos: {str(e)}'
        })
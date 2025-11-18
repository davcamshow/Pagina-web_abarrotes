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
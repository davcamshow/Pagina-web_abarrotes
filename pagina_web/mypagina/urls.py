from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name="home"),
    path('SobreNosotros/', views.sobre_nosotros, name="sobre_nosotros"),
    path('Registro/', views.registro, name="registro"),
    path('login/', views.login, name="login"),
    path('inicioUsuario/', views.inicio_usuario, name="inicio_usuario"),
    path('carrito/', views.carrito, name="carrito"),
    
    # API endpoints para el carrito
    path('api/agregar-carrito/', views.agregar_al_carrito, name='agregar_carrito'),
    path('api/actualizar-carrito/', views.actualizar_carrito, name='actualizar_carrito'),
    path('api/eliminar-carrito/', views.eliminar_del_carrito, name='eliminar_carrito'),
    path('api/vaciar-carrito/', views.vaciar_carrito, name='vaciar_carrito'),
    path('api/obtener-carrito/', views.obtener_carrito, name='obtener_carrito'),

    # Panel de administración
    path('inicioAdmin/', views.inicio_admin, name="inicio_admin"),
    path('inventario/', views.inventario, name="inventario"),
    path('administrar-usuarios/', views.administrar_usuarios, name="administrar_usuarios"),

    path('api/crear-usuario/', views.crear_usuario, name='crear_usuario'),
    path('api/editar-usuario/', views.editar_usuario, name='editar_usuario'),
    path('api/cambiar-estado-usuario/', views.cambiar_estado_usuario, name='cambiar_estado_usuario'),
    path('api/eliminar-usuario/', views.eliminar_usuario, name='eliminar_usuario'),
    
    # NUEVAS RUTAS PARA PRODUCTOS - AGREGA ESTAS
    path('api/crear-producto/', views.crear_producto, name='crear_producto'),
    path('api/editar-producto/', views.editar_producto, name='editar_producto'),
    path('api/eliminar-producto/', views.eliminar_producto, name='eliminar_producto'),
    path('api/productos-por-categoria/', views.obtener_productos_por_categoria, name='productos_por_categoria'),
]
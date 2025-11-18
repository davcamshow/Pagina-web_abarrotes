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
]
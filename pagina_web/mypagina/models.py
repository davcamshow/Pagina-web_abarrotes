from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.auth.hashers import make_password, check_password
import json

class UsuarioManager(BaseUserManager):
    def create_user(self, email, nombre, password=None):
        if not email:
            raise ValueError('El usuario debe tener un email')
        
        usuario = self.model(
            email=self.normalize_email(email),
            nombre=nombre,
        )
        
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, email, nombre, password=None):
        """Crear superusuario (admin)"""
        usuario = self.create_user(
            email=email,
            nombre=nombre,
            password=password,
        )
        usuario.is_staff = True
        usuario.save(using=self._db)
        return usuario

class Usuario(AbstractBaseUser):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    email = models.EmailField(unique=True, max_length=254)
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    carrito = models.TextField(default='[]')
    
    # Campos para mapear a la base de datos
    is_admin_field = models.IntegerField(default=0, db_column='is_admin')
    is_staff_field = models.IntegerField(default=0, db_column='is_staff')
    
    objects = UsuarioManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre']
    
    class Meta:
        db_table = 'usuarios'
        managed = False
    
    def __str__(self):
        return self.email

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def has_perm(self, perm, obj=None):
        # Los staff tienen todos los permisos
        return self.is_staff

    def has_module_perms(self, app_label):
        # Los staff tienen acceso a todos los módulos
        return self.is_staff

    # Propiedades para compatibilidad
    @property
    def is_staff(self):
        return bool(self.is_staff_field)
    
    @is_staff.setter
    def is_staff(self, value):
        self.is_staff_field = 1 if value else 0
    
    @property
    def is_admin(self):
        return bool(self.is_admin_field)
    
    @is_admin.setter
    def is_admin(self, value):
        self.is_admin_field = 1 if value else 0
    
    def activar(self):
        """Activar usuario"""
        self.is_active = True
        self.save()
    
    def desactivar(self):
        """Desactivar usuario"""
        self.is_active = False
        self.save()
    
    def convertir_en_admin(self):
        """Convertir usuario en administrador"""
        self.is_staff = True
        self.is_admin = True
        self.save()
    
    def remover_admin(self):
        """Remover permisos de administrador"""
        self.is_staff = False
        self.is_admin = False
        self.save()
    
    def obtener_carrito(self):
        """Obtiene el carrito del usuario como lista"""
        try:
            return json.loads(self.carrito)
        except:
            return []

    def guardar_carrito(self, carrito):
        """Guarda el carrito del usuario"""
        self.carrito = json.dumps(carrito)
        self.save()

    def agregar_al_carrito(self, producto_id, cantidad=1, producto_data=None):
        """Agrega un producto al carrito"""
        carrito = self.obtener_carrito()
        
        # Buscar si el producto ya está en el carrito
        for item in carrito:
            if item['id'] == producto_id:
                item['cantidad'] += cantidad
                break
        else:
            # Si no existe, agregarlo
            if producto_data:
                carrito.append({
                    'id': producto_id,
                    'nombre': producto_data.get('nombre', 'Producto'),
                    'precio': float(producto_data.get('precio', 0)),
                    'cantidad': cantidad,
                    'imagen': producto_data.get('imagen', '📦'),
                    'categoria': producto_data.get('categoria', 'General')
                })
        
        self.guardar_carrito(carrito)
        return carrito

    def eliminar_del_carrito(self, producto_id):
        """Elimina un producto del carrito"""
        carrito = self.obtener_carrito()
        carrito = [item for item in carrito if item['id'] != producto_id]
        self.guardar_carrito(carrito)
        return carrito

    def actualizar_cantidad(self, producto_id, cantidad):
        """Actualiza la cantidad de un producto en el carrito"""
        carrito = self.obtener_carrito()
        
        for item in carrito:
            if item['id'] == producto_id:
                if cantidad <= 0:
                    carrito = [i for i in carrito if i['id'] != producto_id]
                else:
                    item['cantidad'] = cantidad
                break
        
        self.guardar_carrito(carrito)
        return carrito

    def vaciar_carrito(self):
        """Vacía todo el carrito"""
        self.guardar_carrito([])
        return []

class Categoria(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'categorias'
        managed = False
    
    def __str__(self):
        return self.nombre

class Producto(models.Model):
    # Cambiado de id_producto a id para coincidir con la base de datos
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    # IMPORTANTE: En la base de datos la columna se llama "description" (con "r" extra)
    # Pero según tu base de datos SQL dice "descripcion" (sin "r")
    # Vamos a usar db_column para especificar el nombre correcto
    descripcion = models.TextField(blank=True, null=True, db_column='description')
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    precio_original = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    imagen = models.CharField(max_length=255, blank=True, null=True)
    destacado = models.BooleanField(default=False)
    descuento = models.IntegerField(default=0)
    stock = models.IntegerField(default=0)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, db_column='categoria_id')
    
    class Meta:
        db_table = 'productos'
        managed = False
    
    def __str__(self):
        return self.nombre
    
    @property
    def tiene_descuento(self):
        return self.descuento > 0
    
    @property
    def precio_con_descuento(self):
        if self.tiene_descuento:
            return float(self.precio) * (1 - self.descuento / 100)
        return float(self.precio)

    def obtener_imagen_emoji(self):
        """Obtiene un emoji representativo para el producto"""
        if not self.categoria:
            return "📦"
            
        nombre_categoria = self.categoria.nombre.lower()
        if "fruta" in nombre_categoria:
            return "🍎"
        elif "verdura" in nombre_categoria:
            return "🥦"
        elif "carne" in nombre_categoria:
            return "🥩"
        elif "lácteo" in nombre_categoria or "leche" in nombre_categoria:
            return "🥛"
        elif "grano" in nombre_categoria or "arroz" in nombre_categoria or "frijol" in nombre_categoria:
            return "🍚"
        elif "limpieza" in nombre_categoria:
            return "🧴"
        elif "bebida" in nombre_categoria:
            return "🧃"
        elif "pan" in nombre_categoria:
            return "🍞"
        elif "conserva" in nombre_categoria or "enlatado" in nombre_categoria:
            return "🥫"
        else:
            return "📦"
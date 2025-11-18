# mypagina/management/commands/crear_admin.py
from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone
import hashlib

class Command(BaseCommand):
    help = 'Crear usuario administrador por defecto'

    def handle(self, *args, **options):
        try:
            with connection.cursor() as cursor:
                # 1. Verificar estructura de la tabla
                cursor.execute("DESCRIBE usuarios")
                columns = [row[0] for row in cursor.fetchall()]
                self.stdout.write(f"Columnas en tabla usuarios: {columns}")
                
                # 2. Agregar columnas is_staff e is_admin si no existen
                if 'is_staff' not in columns:
                    self.stdout.write('Agregando columna is_staff...')
                    cursor.execute("ALTER TABLE usuarios ADD COLUMN is_staff BOOLEAN DEFAULT FALSE")
                
                if 'is_admin' not in columns:
                    self.stdout.write('Agregando columna is_admin...')
                    cursor.execute("ALTER TABLE usuarios ADD COLUMN is_admin BOOLEAN DEFAULT FALSE")
                
                # 3. Verificar si el administrador ya existe
                cursor.execute("SELECT COUNT(*) FROM usuarios WHERE email = 'admin@tienda.com'")
                admin_exists = cursor.fetchone()[0]
                
                if not admin_exists:
                    # 4. Preparar los datos para insertar
                    # Generar hash de contraseña para 'admin123'
                    from django.contrib.auth.hashers import make_password
                    hashed_password = make_password('admin123')
                    
                    # Valores por defecto para campos comunes
                    current_time = timezone.now().strftime('%Y-%m-%d %H:%M:%S')
                    
                    # Construir la consulta dinámicamente basada en las columnas existentes
                    column_names = []
                    placeholders = []
                    values = []
                    
                    # Campos básicos
                    column_names.extend(['nombre', 'email', 'password', 'is_staff', 'is_admin', 'is_active', 'carrito'])
                    placeholders.extend(['%s'] * 7)
                    values.extend([
                        'Administrador',
                        'admin@tienda.com', 
                        hashed_password,
                        True, 
                        True, 
                        True, 
                        '[]'
                    ])
                    
                    # Campos adicionales basados en lo que existe
                    if 'fecha_registro' in columns:
                        column_names.append('fecha_registro')
                        placeholders.append('%s')
                        values.append(current_time)
                    
                    if 'last_login' in columns:
                        column_names.append('last_login')
                        placeholders.append('%s')
                        values.append(current_time)
                    
                    if 'fecha_creacion' in columns:
                        column_names.append('fecha_creacion')
                        placeholders.append('%s')
                        values.append(current_time)
                    
                    # Construir y ejecutar la consulta
                    columns_str = ', '.join(column_names)
                    placeholders_str = ', '.join(placeholders)
                    
                    query = f"""
                        INSERT INTO usuarios ({columns_str}) 
                        VALUES ({placeholders_str})
                    """
                    
                    cursor.execute(query, values)
                    self.stdout.write(
                        self.style.SUCCESS('✅ Usuario administrador creado: admin@tienda.com / admin123')
                    )
                    
                else:
                    # 5. Actualizar usuario existente como admin
                    cursor.execute("""
                        UPDATE usuarios 
                        SET is_staff = TRUE, is_admin = TRUE 
                        WHERE email = 'admin@tienda.com'
                    """)
                    self.stdout.write(
                        self.style.SUCCESS('✅ Usuario existente actualizado como administrador')
                    )
                
                # 6. Mostrar información del administrador
                cursor.execute("""
                    SELECT nombre, email, is_staff, is_admin 
                    FROM usuarios 
                    WHERE email = 'admin@tienda.com'
                """)
                admin_info = cursor.fetchone()
                self.stdout.write(
                    self.style.SUCCESS(f'📋 Información del administrador: {admin_info}')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error: {str(e)}')
            )
            self.stdout.write(
                self.style.WARNING('💡 Ejecuta este comando SQL manualmente en phpMyAdmin:')
            )
            self.stdout.write("""
-- Agregar columnas si no existen
ALTER TABLE usuarios 
ADD COLUMN is_staff BOOLEAN DEFAULT FALSE,
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Insertar administrador (ajusta los campos según tu tabla)
INSERT INTO usuarios (nombre, email, password, is_staff, is_admin, is_active, carrito, fecha_registro) 
VALUES (
    'Administrador', 
    'admin@tienda.com', 
    'pbkdf2_sha256$600000$WesXCPehmUcXr0J9B9nB0C$6gR9kC3cJ8bZ7Q8Y7wT7vL8mK9nT8cJ8bZ7Q8Y7wT7vL8=', 
    TRUE, 
    TRUE, 
    TRUE, 
    '[]',
    NOW()
);

-- O actualizar usuario existente
UPDATE usuarios SET is_staff = TRUE, is_admin = TRUE WHERE email = 'admin@tienda.com';
            """)
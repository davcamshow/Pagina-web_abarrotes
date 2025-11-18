from django import forms
from .models import Usuario
import re

class RegistroForm(forms.ModelForm):
    confirmar_password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': '••••••••'}),
        label='Confirmar contraseña'
    )
    
    class Meta:
        model = Usuario
        fields = ['nombre', 'email', 'password']
        widgets = {
            'password': forms.PasswordInput(attrs={'placeholder': '••••••••'}),
            'nombre': forms.TextInput(attrs={'placeholder': 'Tu nombre completo'}),
            'email': forms.EmailInput(attrs={'placeholder': 'tu@email.com'}),
        }
        labels = {
            'nombre': 'Nombre completo',
            'email': 'Correo electrónico',
            'password': 'Contraseña',
        }
    
    def clean_nombre(self):
        nombre = self.cleaned_data.get('nombre')
        if not nombre:
            raise forms.ValidationError('El nombre es obligatorio')
        
        # Validar que no contenga números
        if any(char.isdigit() for char in nombre):
            raise forms.ValidationError('El nombre no puede contener números')
        
        # Validar longitud mínima
        if len(nombre.strip()) < 2:
            raise forms.ValidationError('El nombre debe tener al menos 2 caracteres')
            
        return nombre.strip()
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if not email:
            raise forms.ValidationError('El email es obligatorio')
        
        # Validar formato de email
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            raise forms.ValidationError('Por favor ingresa un email válido')
        
        # Validar si el email ya existe
        if Usuario.objects.filter(email=email).exists():
            raise forms.ValidationError('Este email ya está registrado')
            
        return email
    
    def clean_password(self):
        password = self.cleaned_data.get('password')
        if not password:
            raise forms.ValidationError('La contraseña es obligatoria')
        
        # Validaciones de contraseña
        errors = []
        
        if len(password) < 8:
            errors.append('Al menos 8 caracteres')
        
        if not any(c.isupper() for c in password):
            errors.append('Al menos una mayúscula')
        
        if not any(c.isdigit() for c in password):
            errors.append('Al menos un número')
        
        # Caracteres especiales
        special_chars = r'[!@#$%^&*(),.?":{}|<>]'
        if not re.search(special_chars, password):
            errors.append('Al menos un carácter especial (!@#$%^&*)')
        
        if errors:
            raise forms.ValidationError(';'.join(errors))  # Separamos con ; para procesar después
            
        return password
    
    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        confirmar_password = cleaned_data.get('confirmar_password')
        
        if password and confirmar_password and password != confirmar_password:
            raise forms.ValidationError('Las contraseñas no coinciden')
        
        return cleaned_data
    
    def save(self, commit=True):
        usuario = super().save(commit=False)
        usuario.set_password(self.cleaned_data['password'])
        if commit:
            usuario.save()
        return usuario

class LoginForm(forms.Form):
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'placeholder': 'tu@email.com'}),
        label='Correo electrónico'
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': '••••••••'}),
        label='Contraseña'
    )
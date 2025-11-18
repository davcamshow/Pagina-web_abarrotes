// Sistema de validaciones en tiempo real
class ValidacionesAvanzadas {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupRegistroValidations();
            this.setupLoginValidations();
            // Solo configurar fortaleza de password en registro
            if (document.querySelector('#nombre')) {
                this.setupPasswordStrength();
            }
        });
    }

    setupRegistroValidations() {
        const registroForm = document.querySelector('.auth-form');
        if (!registroForm || !registroForm.querySelector('#nombre')) return;

        const emailInput = document.getElementById('email');
        const nombreInput = document.getElementById('nombre');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmar_password');

        // Validación de email en tiempo real
        if (emailInput) {
            emailInput.addEventListener('blur', this.verificarEmailRegistro.bind(this));
        }

        // Validación de nombre en tiempo real
        if (nombreInput) {
            nombreInput.addEventListener('input', this.validarNombre.bind(this));
        }

        // Validación de contraseña en tiempo real
        if (passwordInput) {
            passwordInput.addEventListener('input', this.validarFortalezaPassword.bind(this));
        }

        // Validación de confirmación de contraseña
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', this.validarConfirmacionPassword.bind(this));
        }

        // Interceptar envío del formulario
        registroForm.addEventListener('submit', this.validarFormularioRegistro.bind(this));
    }

    setupLoginValidations() {
        const loginForm = document.querySelector('.auth-form');
        // Solo aplicar si es el formulario de login (no tiene campo nombre)
        if (!loginForm || loginForm.querySelector('#nombre')) return;

        const emailInput = document.getElementById('email');
        
        if (emailInput) {
            emailInput.addEventListener('blur', this.verificarEmailLogin.bind(this));
        }

        // Validación básica del formulario de login
        loginForm.addEventListener('submit', this.validarFormularioLogin.bind(this));
    }

    setupPasswordStrength() {
        const passwordInput = document.getElementById('password');
        if (!passwordInput) return;

        // Crear contenedor para indicadores de fortaleza (SOLO en registro)
        const passwordContainer = passwordInput.parentNode;
        const strengthMeter = this.crearIndicadorFortaleza();
        passwordContainer.appendChild(strengthMeter);
    }

    crearIndicadorFortaleza() {
        const container = document.createElement('div');
        container.className = 'password-strength';
        container.innerHTML = `
            <div class="strength-title">La contraseña debe contener:</div>
            <div class="strength-checks">
                <div class="strength-check" data-check="length">
                    <span class="check-icon">○</span>
                    <span class="check-text">Al menos 8 caracteres</span>
                </div>
                <div class="strength-check" data-check="uppercase">
                    <span class="check-icon">○</span>
                    <span class="check-text">Al menos una mayúscula</span>
                </div>
                <div class="strength-check" data-check="number">
                    <span class="check-icon">○</span>
                    <span class="check-text">Al menos un número</span>
                </div>
                <div class="strength-check" data-check="special">
                    <span class="check-icon">○</span>
                    <span class="check-text">Al menos un carácter especial</span>
                </div>
            </div>
        `;
        
        return container;
    }

    validarFortalezaPassword(event) {
        const password = event.target.value;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        // Actualizar indicadores visuales
        Object.keys(checks).forEach(check => {
            const checkElement = document.querySelector(`[data-check="${check}"]`);
            if (checkElement) {
                const icon = checkElement.querySelector('.check-icon');
                if (checks[check]) {
                    icon.textContent = '✓';
                    icon.style.color = 'var(--success)';
                    checkElement.style.color = 'var(--success)';
                } else {
                    icon.textContent = '○';
                    icon.style.color = 'var(--error)';
                    checkElement.style.color = 'var(--text-dark)';
                }
            }
        });
    }

    validarNombre(event) {
        const nombre = event.target.value;
        const errorDiv = event.target.parentNode.querySelector('.nombre-error');
        
        // Remover números
        const nombreLimpio = nombre.replace(/[0-9]/g, '');
        if (nombre !== nombreLimpio) {
            event.target.value = nombreLimpio;
            this.mostrarError(event.target, 'El nombre no puede contener números');
        } else {
            this.limpiarError(event.target);
        }
    }

    async verificarEmailRegistro(event) {
        const email = event.target.value;
        if (!this.validarEmail(email)) {
            this.mostrarError(event.target, 'Por favor ingresa un email válido');
            return;
        }

        try {
            const response = await fetch('', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: `email=${encodeURIComponent(email)}`
            });

            const data = await response.json();
            
            if (data.exists) {
                this.mostrarModalRegistro(data.message);
                this.mostrarError(event.target, 'Este correo ya está registrado');
            } else {
                this.limpiarError(event.target);
            }
        } catch (error) {
            console.error('Error al verificar email:', error);
        }
    }

    async verificarEmailLogin(event) {
        const email = event.target.value;
        if (!this.validarEmail(email)) {
            this.mostrarError(event.target, 'Por favor ingresa un email válido');
            return;
        }

        try {
            const response = await fetch('', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: `email=${encodeURIComponent(email)}`
            });

            const data = await response.json();
            
            if (!data.exists) {
                this.mostrarModalLogin(data.message);
                this.mostrarError(event.target, 'Este correo no está registrado');
            } else {
                this.limpiarError(event.target);
            }
        } catch (error) {
            console.error('Error al verificar email:', error);
        }
    }

    validarConfirmacionPassword(event) {
        const confirmPassword = event.target.value;
        const password = document.getElementById('password').value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.mostrarError(event.target, 'Las contraseñas no coinciden');
        } else {
            this.limpiarError(event.target);
        }
    }

    validarFormularioRegistro(event) {
        const form = event.target;
        let isValid = true;

        // Validar nombre
        const nombre = document.getElementById('nombre').value;
        if (nombre.match(/[0-9]/)) {
            this.mostrarError(document.getElementById('nombre'), 'El nombre no puede contener números');
            isValid = false;
        }

        // Validar contraseña
        const password = document.getElementById('password').value;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        if (!Object.values(checks).every(check => check)) {
            this.mostrarError(document.getElementById('password'), 'La contraseña no cumple con todos los requisitos');
            isValid = false;
        }

        // Validar confirmación
        const confirmPassword = document.getElementById('confirmar_password').value;
        if (password !== confirmPassword) {
            this.mostrarError(document.getElementById('confirmar_password'), 'Las contraseñas no coinciden');
            isValid = false;
        }

        if (!isValid) {
            event.preventDefault();
            this.mostrarErrorGeneral('Por favor corrige los errores en el formulario');
        }
    }

    validarFormularioLogin(event) {
        const form = event.target;
        let isValid = true;

        // Validación básica para login - solo email válido
        const email = document.getElementById('email').value;
        if (!this.validarEmail(email)) {
            this.mostrarError(document.getElementById('email'), 'Por favor ingresa un email válido');
            isValid = false;
        }

        // Validar que la contraseña no esté vacía
        const password = document.getElementById('password').value;
        if (!password) {
            this.mostrarError(document.getElementById('password'), 'La contraseña es obligatoria');
            isValid = false;
        }

        if (!isValid) {
            event.preventDefault();
        }
    }

    mostrarModalRegistro(mensaje) {
        const modal = this.crearModal(
            'Usuario Existente',
            mensaje,
            'Iniciar Sesión',
            'Cerrar',
            () => { window.location.href = '/login/'; }
        );
        document.body.appendChild(modal);
    }

    mostrarModalLogin(mensaje) {
        const modal = this.crearModal(
            'Usuario No Encontrado',
            mensaje,
            'Registrarse',
            'Cerrar',
            () => { window.location.href = '/Registro/'; }
        );
        document.body.appendChild(modal);
    }

    crearModal(titulo, mensaje, textoBotonPrincipal, textoBotonSecundario, accionPrincipal) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 2rem;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                max-width: 400px;
                width: 90%;
                text-align: center;
            ">
                <h3 style="color: var(--primary); margin-bottom: 1rem;">${titulo}</h3>
                <p style="margin-bottom: 2rem; color: var(--text-dark);">${mensaje}</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="modal-btn-primary" style="
                        background: var(--primary);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">${textoBotonPrincipal}</button>
                    <button class="modal-btn-secondary" style="
                        background: var(--light);
                        color: var(--text-dark);
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                    ">${textoBotonSecundario}</button>
                </div>
            </div>
        `;

        // Event listeners para los botones
        modal.querySelector('.modal-btn-primary').addEventListener('click', accionPrincipal);
        modal.querySelector('.modal-btn-secondary').addEventListener('click', () => {
            modal.remove();
        });

        // Cerrar modal al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }

    validarEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    mostrarError(input, mensaje) {
        this.limpiarError(input);
        
        input.style.borderColor = 'var(--error)';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            color: var(--error);
            font-size: 0.8rem;
            margin-top: 5px;
        `;
        errorDiv.textContent = mensaje;
        
        input.parentNode.appendChild(errorDiv);
    }

    limpiarError(input) {
        input.style.borderColor = '';
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    mostrarErrorGeneral(mensaje) {
        // Puedes implementar un toast o alerta general aquí
        alert(mensaje);
    }
}

// Inicializar validaciones
new ValidacionesAvanzadas();
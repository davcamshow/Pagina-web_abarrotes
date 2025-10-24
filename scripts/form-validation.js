// Validación de formularios usando Validator.js (librería ligera)
class FormValidator {
    constructor() {
        this.patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
            phone: /^[\+]?[0-9]{10,13}$/,
            name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/
        };
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupLoginForm();
            this.setupRegisterForm();
        });
    }

    setupLoginForm() {
        const loginForm = document.querySelector('.auth-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.validateLoginForm()) {
                    this.submitForm(loginForm);
                }
            });
        }
    }

    setupRegisterForm() {
        const registerForm = document.querySelector('.auth-form');
        if (registerForm && registerForm.querySelector('#name')) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.validateRegisterForm()) {
                    this.submitForm(registerForm);
                }
            });
        }
    }

    validateLoginForm() {
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        let isValid = true;

        // Validar email
        if (!this.validateEmail(email.value)) {
            this.showError(email, 'Por favor ingresa un email válido');
            isValid = false;
        } else {
            this.clearError(email);
        }

        // Validar contraseña
        if (!this.validatePassword(password.value)) {
            this.showError(password, 'La contraseña debe tener al menos 8 caracteres, una letra y un número');
            isValid = false;
        } else {
            this.clearError(password);
        }

        return isValid;
    }

    validateRegisterForm() {
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirm-password');
        let isValid = true;

        // Validar nombre
        if (!this.validateName(name.value)) {
            this.showError(name, 'El nombre debe tener entre 2 y 50 caracteres');
            isValid = false;
        } else {
            this.clearError(name);
        }

        // Validar email
        if (!this.validateEmail(email.value)) {
            this.showError(email, 'Por favor ingresa un email válido');
            isValid = false;
        } else {
            this.clearError(email);
        }

        // Validar contraseña
        if (!this.validatePassword(password.value)) {
            this.showError(password, 'La contraseña debe tener al menos 8 caracteres, una letra y un número');
            isValid = false;
        } else {
            this.clearError(password);
        }

        // Validar confirmación de contraseña
        if (password.value !== confirmPassword.value) {
            this.showError(confirmPassword, 'Las contraseñas no coinciden');
            isValid = false;
        } else {
            this.clearError(confirmPassword);
        }

        return isValid;
    }

    validateEmail(email) {
        return this.patterns.email.test(email);
    }

    validatePassword(password) {
        return this.patterns.password.test(password);
    }

    validateName(name) {
        return this.patterns.name.test(name);
    }

    showError(input, message) {
        this.clearError(input);
        
        input.style.borderColor = 'var(--error)';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            color: var(--error);
            font-size: 0.8rem;
            margin-top: 5px;
        `;
        errorDiv.textContent = message;
        
        input.parentNode.appendChild(errorDiv);
    }

    clearError(input) {
        input.style.borderColor = '';
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    submitForm(form) {
        // Simular envío de formulario
        const submitBtn = form.querySelector('.auth-btn');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Procesando...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            alert('Formulario enviado correctamente');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            form.reset();
        }, 1500);
    }
}

// Inicializar validador de formularios
new FormValidator();
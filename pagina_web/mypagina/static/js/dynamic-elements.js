// Librería para elementos dinámicos - usando jQuery para simplificar
class DynamicElements {
    constructor() {
        this.init();
    }

    init() {
        // Efectos hover mejorados para productos
        this.addProductHoverEffects();
        
        // Animaciones de carga para contenido
        this.addLoadingAnimations();
        
        // Contador de productos en carrito
        this.addCartCounter();
        
        // Efectos de scroll suave
        this.addSmoothScroll();
    }

    addProductHoverEffects() {
        document.addEventListener('DOMContentLoaded', () => {
            const products = document.querySelectorAll('.product-card, section');
            
            products.forEach(product => {
                product.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-8px) scale(1.02)';
                    this.style.transition = 'all 0.3s ease';
                });
                
                product.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                });
            });
        });
    }

    addLoadingAnimations() {
        // Simular carga de contenido dinámico
        document.addEventListener('DOMContentLoaded', () => {
            const sections = document.querySelectorAll('section');
            
            sections.forEach((section, index) => {
                section.style.opacity = '0';
                section.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    section.style.transition = 'all 0.5s ease';
                    section.style.opacity = '1';
                    section.style.transform = 'translateY(0)';
                }, index * 200);
            });
        });
    }

    addCartCounter() {
        // Contador dinámico para el carrito
        const cartCount = localStorage.getItem('cartCount') || 0;
        this.updateCartDisplay(cartCount);
    }

    updateCartDisplay(count) {
        let cartBadge = document.querySelector('.cart-badge');
        if (!cartBadge) {
            const menuItems = document.querySelectorAll('.menu-link');
            menuItems.forEach(item => {
                if (item.textContent.includes('🛒')) {
                    cartBadge = document.createElement('span');
                    cartBadge.className = 'cart-badge';
                    cartBadge.style.cssText = `
                        background: var(--accent);
                        color: white;
                        border-radius: 50%;
                        padding: 2px 6px;
                        font-size: 0.7rem;
                        margin-left: 5px;
                    `;
                    item.appendChild(cartBadge);
                }
            });
        }
        if (cartBadge) {
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    addSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// Inicializar elementos dinámicos
new DynamicElements();
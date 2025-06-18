/**
 * ChefMate Main JavaScript Entry Point
 * Coordinates all application modules and provides global functionality
 */

class ChefMateMain {
    constructor() {
        this.currentPage = this.detectCurrentPage();
        this.userPreferences = this.loadUserPreferences();
        this.init();
    }

    init() {
        this.setupGlobalEventListeners();
        this.initializeNavigation();
        this.loadUserSession();
        this.setupServiceWorker();
    }

    // ===== PAGE DETECTION =====
    detectCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        if (filename.includes('index') || filename === '') return 'home';
        if (filename.includes('search')) return 'search';
        if (filename.includes('recipe')) return 'recipe';
        if (filename.includes('favorites')) return 'favorites';
        if (filename.includes('profile')) return 'profile';
        return 'unknown';
    }

    // ===== USER PREFERENCES =====
    loadUserPreferences() {
        const defaultPreferences = {
            theme: 'light',
            dietaryRestrictions: [],
            cuisinePreferences: [],
            skillLevel: 'beginner',
            servingSize: 4,
            cookingTime: 60,
            notifications: true,
            units: 'metric'
        };

        const saved = localStorage.getItem('chefmate_user_preferences');
        return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
    }

    saveUserPreferences(preferences) {
        this.userPreferences = { ...this.userPreferences, ...preferences };
        localStorage.setItem('chefmate_user_preferences', JSON.stringify(this.userPreferences));
        this.applyPreferences();
    }

    applyPreferences() {
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.userPreferences.theme);
        
        // Apply units preference
        document.documentElement.setAttribute('data-units', this.userPreferences.units);
        
        // Dispatch preference change event
        window.dispatchEvent(new CustomEvent('preferencesChanged', {
            detail: this.userPreferences
        }));
    }

    // ===== NAVIGATION =====
    initializeNavigation() {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav') && navMenu?.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle?.classList.remove('active');
            }
        });

        // Update active nav link
        this.updateActiveNavLink();
    }

    updateActiveNavLink() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && window.location.pathname.includes(href.replace('.html', ''))) {
                link.classList.add('active');
            }
        });
    }

    // ===== USER SESSION =====
    loadUserSession() {
        const session = localStorage.getItem('chefmate_user_session');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                this.userSession = sessionData;
                this.updateUserInterface();
            } catch (error) {
                console.error('Error loading user session:', error);
                this.createGuestSession();
            }
        } else {
            this.createGuestSession();
        }
    }

    createGuestSession() {
        this.userSession = {
            id: 'guest_' + Date.now(),
            type: 'guest',
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };
        this.saveUserSession();
    }

    saveUserSession() {
        this.userSession.lastActive = new Date().toISOString();
        localStorage.setItem('chefmate_user_session', JSON.stringify(this.userSession));
    }

    updateUserInterface() {
        // Update any user-specific UI elements
        const userElements = document.querySelectorAll('[data-user-content]');
        userElements.forEach(element => {
            const contentType = element.getAttribute('data-user-content');
            switch (contentType) {
                case 'greeting':
                    element.textContent = this.userSession.type === 'guest' ? 'Welcome!' : `Welcome back!`;
                    break;
            }
        });
    }

    // ===== GLOBAL EVENT LISTENERS =====
    setupGlobalEventListeners() {
        // Handle errors globally
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showNotification('An error occurred. Please try again.', 'error');
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.showNotification('Something went wrong. Please refresh the page.', 'error');
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showNotification('Connection restored!', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('You are offline. Some features may not work.', 'warning');
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.saveUserSession();
            }
        });
    }

    // ===== NOTIFICATIONS =====
    showNotification(message, type = 'info', duration = 5000) {
        if (!this.userPreferences.notifications) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add to page
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        container.appendChild(notification);

        // Handle close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        // Auto remove after duration
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
    }

    removeNotification(notification) {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // ===== SERVICE WORKER =====
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    // ===== UTILITY METHODS =====
    getCurrentPage() {
        return this.currentPage;
    }

    getUserPreferences() {
        return this.userPreferences;
    }

    getUserSession() {
        return this.userSession;
    }
}

// Initialize ChefMate Main
window.chefMateMain = new ChefMateMain();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChefMateMain;
}

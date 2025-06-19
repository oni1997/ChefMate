/**
 * ChefMate Configuration Manager
 * Handles API key setup, validation, and environment detection
 */

class ChefMateConfig {
    constructor() {
        this.isProduction = this.detectEnvironment();
        this.setupRequired = !this.isProduction;
    }

    /**
     * Detect if we're running in production (Vercel) or local development
     * @returns {boolean} True if production environment
     */
    detectEnvironment() {
        // Check for Vercel deployment
        if (window.location.hostname.includes('vercel.app')) {
            return true;
        }
        
        // Check for other production indicators
        if (window.location.protocol === 'https:' && 
            !window.location.hostname.includes('localhost') &&
            !window.location.hostname.includes('127.0.0.1')) {
            return true;
        }
        
        return false;
    }

    /**
     * Check if API keys are properly configured for local development
     * @returns {Object} Configuration status
     */
    checkConfiguration() {
        if (this.isProduction) {
            return {
                ready: true,
                environment: 'production',
                message: 'Running in production mode with serverless functions'
            };
        }

        const hasSpoonacular = this.hasApiKey('spoonacular');
        const hasGemini = this.hasApiKey('gemini');

        if (!hasSpoonacular) {
            return {
                ready: false,
                environment: 'development',
                message: 'API keys required for local development',
                missingKeys: ['spoonacular'],
                setupUrl: 'setup.html'
            };
        }

        return {
            ready: true,
            environment: 'development',
            message: 'Local development configured',
            hasGemini: hasGemini
        };
    }

    /**
     * Check if an API key exists in localStorage
     * @param {string} service - Service name (spoonacular, gemini)
     * @returns {boolean} True if key exists
     */
    hasApiKey(service) {
        const key = localStorage.getItem(`chefmate_${service}_key`);
        return key && key.trim() !== '';
    }

    /**
     * Get API key from localStorage
     * @param {string} service - Service name
     * @returns {string|null} API key or null if not found
     */
    getApiKey(service) {
        return localStorage.getItem(`chefmate_${service}_key`);
    }

    /**
     * Validate API key format
     * @param {string} service - Service name
     * @param {string} key - API key to validate
     * @returns {Object} Validation result
     */
    validateApiKey(service, key) {
        if (!key || key.trim() === '') {
            return { valid: false, error: 'API key cannot be empty' };
        }

        switch (service) {
            case 'spoonacular':
                // Spoonacular keys are typically 32 character hex strings
                if (!/^[a-f0-9]{32}$/i.test(key)) {
                    return { 
                        valid: false, 
                        error: 'Invalid Spoonacular API key format. Should be 32 character hex string.' 
                    };
                }
                break;
                
            case 'gemini':
                // Gemini keys start with AIzaSy and are about 39 characters
                if (!/^AIzaSy[A-Za-z0-9_-]{33}$/.test(key)) {
                    return { 
                        valid: false, 
                        error: 'Invalid Gemini API key format. Should start with "AIzaSy" and be 39 characters long.' 
                    };
                }
                break;
                
            default:
                return { valid: false, error: 'Unknown service' };
        }

        return { valid: true };
    }

    /**
     * Show setup notification if configuration is required
     */
    showSetupNotification() {
        const config = this.checkConfiguration();
        
        if (!config.ready && config.setupUrl) {
            this.createSetupBanner(config);
        }
    }

    /**
     * Create a setup banner for unconfigured local development
     * @param {Object} config - Configuration status
     */
    createSetupBanner(config) {
        // Don't show banner if already on setup page
        if (window.location.pathname.includes('setup.html')) {
            return;
        }

        // Check if banner already exists
        if (document.getElementById('chefmate-setup-banner')) {
            return;
        }

        const banner = document.createElement('div');
        banner.id = 'chefmate-setup-banner';
        banner.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                color: white;
                padding: 1rem;
                text-align: center;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 10000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="max-width: 800px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                    <div style="flex: 1; min-width: 200px;">
                        <strong>⚙️ Setup Required</strong>
                        <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 0.25rem;">
                            ${config.message} - Configure your API keys to use ChefMate locally
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button onclick="window.location.href='${config.setupUrl}'" style="
                            background: rgba(255,255,255,0.2);
                            border: 1px solid rgba(255,255,255,0.3);
                            color: white;
                            padding: 0.5rem 1rem;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            Setup Now
                        </button>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                            background: transparent;
                            border: none;
                            color: white;
                            padding: 0.5rem;
                            cursor: pointer;
                            font-size: 1.2rem;
                            opacity: 0.7;
                        " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                            ×
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add banner to page
        document.body.insertBefore(banner, document.body.firstChild);

        // Adjust body padding to account for banner
        document.body.style.paddingTop = '80px';

        // Remove banner when it's closed
        banner.querySelector('button[onclick*="remove"]').addEventListener('click', () => {
            document.body.style.paddingTop = '';
        });
    }

    /**
     * Initialize configuration check on page load
     */
    init() {
        // Show setup notification if needed
        this.showSetupNotification();

        // Add setup link to navigation if in development mode
        if (!this.isProduction) {
            this.addSetupNavigation();
        }
    }

    /**
     * Add setup link to navigation menu
     */
    addSetupNavigation() {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && !document.querySelector('.nav-link[href="setup.html"]')) {
            const setupItem = document.createElement('li');
            setupItem.className = 'nav-item';
            setupItem.innerHTML = '<a href="setup.html" class="nav-link">Setup</a>';
            
            // Insert before the last item (usually Profile)
            const lastItem = navMenu.lastElementChild;
            if (lastItem) {
                navMenu.insertBefore(setupItem, lastItem);
            } else {
                navMenu.appendChild(setupItem);
            }
        }
    }

    /**
     * Get environment information for debugging
     * @returns {Object} Environment details
     */
    getEnvironmentInfo() {
        return {
            isProduction: this.isProduction,
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            userAgent: navigator.userAgent,
            hasSpoonacularKey: this.hasApiKey('spoonacular'),
            hasGeminiKey: this.hasApiKey('gemini')
        };
    }
}

// Initialize configuration manager
window.ChefMateConfig = new ChefMateConfig();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ChefMateConfig.init();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChefMateConfig;
}

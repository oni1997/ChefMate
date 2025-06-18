/**
 * ChefMate Main Application JavaScript
 * Handles the home page functionality and ingredient input
 */

class ChefMateApp {
    constructor() {
        this.api = window.ChefMateAPI;
        this.utils = window.ChefMateUtils;
        this.currentIngredients = [];
        this.currentPreferences = {};
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadIngredientHistory();
        this.setupSuggestionCards();
    }

    // ===== EVENT BINDING =====
    bindEvents() {
        // Main ingredient form submission
        const ingredientForm = document.getElementById('ingredientForm');
        if (ingredientForm) {
            ingredientForm.addEventListener('submit', (e) => this.handleIngredientSubmit(e));
        }

        // Suggestion cards
        const suggestionCards = document.querySelectorAll('.suggestion-card');
        suggestionCards.forEach(card => {
            card.addEventListener('click', (e) => this.handleSuggestionClick(e));
        });

        // Real-time ingredient validation
        const ingredientsTextarea = document.getElementById('ingredients');
        if (ingredientsTextarea) {
            ingredientsTextarea.addEventListener('input', 
                this.utils.Utils.debounce((e) => this.validateIngredients(e), 300)
            );
        }

        // Dietary preference changes
        const dietCheckboxes = document.querySelectorAll('input[name="diet"]');
        dietCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.updateDietaryPreferences(e));
        });

        // Cooking time selection
        const maxTimeSelect = document.getElementById('maxTime');
        if (maxTimeSelect) {
            maxTimeSelect.addEventListener('change', (e) => this.updateCookingTime(e));
        }
    }

    // ===== INGREDIENT HANDLING =====
    handleIngredientSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const ingredientsText = formData.get('ingredients');
        const maxTime = formData.get('maxTime');
        const dietPreferences = formData.getAll('diet');

        // Validate ingredients
        if (!ingredientsText || ingredientsText.trim().length === 0) {
            this.showError('Please enter at least one ingredient.');
            return;
        }

        // Parse ingredients
        this.currentIngredients = this.utils.Utils.parseIngredients(ingredientsText);
        
        if (this.currentIngredients.length === 0) {
            this.showError('Please enter valid ingredients separated by commas.');
            return;
        }

        // Store preferences
        this.currentPreferences = {
            diet: dietPreferences,
            maxTime: maxTime
        };

        // Save to history
        this.utils.IngredientHistory.addToHistory(this.currentIngredients);

        // Show loading state
        this.showLoadingState();

        // Search for recipes
        this.searchRecipes();
    }

    async searchRecipes() {
        try {
            // Build search options
            const searchOptions = {
                number: 12,
                ranking: 1,
                ignorePantry: true
            };

            // Add dietary preferences
            if (this.currentPreferences.diet && this.currentPreferences.diet.length > 0) {
                searchOptions.diet = this.currentPreferences.diet.join(',');
            }

            // Add time constraint
            if (this.currentPreferences.maxTime) {
                searchOptions.maxReadyTime = parseInt(this.currentPreferences.maxTime);
            }

            // Call API
            const recipes = await this.api.searchRecipesByIngredients(
                this.currentIngredients, 
                searchOptions
            );

            // Store results and redirect
            this.storeSearchResults(recipes);
            this.redirectToResults();

        } catch (error) {
            console.error('Recipe search failed:', error);
            this.showError(error.message || 'Failed to search recipes. Please try again.');
            this.hideLoadingState();
        }
    }

    // ===== SUGGESTION HANDLING =====
    handleSuggestionClick(event) {
        const card = event.currentTarget;
        const ingredients = card.dataset.ingredients;
        
        if (ingredients) {
            const ingredientsTextarea = document.getElementById('ingredients');
            if (ingredientsTextarea) {
                ingredientsTextarea.value = ingredients;
                this.validateIngredients({ target: ingredientsTextarea });
                
                // Scroll to form
                const form = document.getElementById('ingredientForm');
                if (form) {
                    this.utils.Utils.scrollToElement(form, 100);
                }
            }
        }
    }

    setupSuggestionCards() {
        // Add hover effects and animations
        const suggestionCards = document.querySelectorAll('.suggestion-card');
        suggestionCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }

    // ===== VALIDATION =====
    validateIngredients(event) {
        const textarea = event.target;
        const value = textarea.value.trim();
        
        // Remove any existing validation messages
        this.clearValidationMessages();
        
        if (value.length === 0) {
            return;
        }

        const ingredients = this.utils.Utils.parseIngredients(value);
        
        if (ingredients.length === 0) {
            this.showValidationMessage('Please enter ingredients separated by commas.', 'warning');
            return;
        }

        if (ingredients.length > 10) {
            this.showValidationMessage('Too many ingredients. Please limit to 10 or fewer.', 'warning');
            return;
        }

        // Show success message
        this.showValidationMessage(`Found ${ingredients.length} ingredient${ingredients.length > 1 ? 's' : ''}`, 'success');
    }

    showValidationMessage(message, type = 'info') {
        this.clearValidationMessages();
        
        const textarea = document.getElementById('ingredients');
        if (!textarea) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `validation-message validation-${type}`;
        messageDiv.textContent = message;
        
        textarea.parentNode.appendChild(messageDiv);
    }

    clearValidationMessages() {
        const existingMessages = document.querySelectorAll('.validation-message');
        existingMessages.forEach(msg => msg.remove());
    }

    // ===== PREFERENCES =====
    updateDietaryPreferences(event) {
        const checkbox = event.target;
        const value = checkbox.value;
        
        if (!this.currentPreferences.diet) {
            this.currentPreferences.diet = [];
        }

        if (checkbox.checked) {
            if (!this.currentPreferences.diet.includes(value)) {
                this.currentPreferences.diet.push(value);
            }
        } else {
            this.currentPreferences.diet = this.currentPreferences.diet.filter(diet => diet !== value);
        }
    }

    updateCookingTime(event) {
        this.currentPreferences.maxTime = event.target.value;
    }

    // ===== INGREDIENT HISTORY =====
    loadIngredientHistory() {
        const history = this.utils.IngredientHistory.getHistory();
        
        if (history.length > 0) {
            this.displayIngredientHistory(history);
        }
    }

    displayIngredientHistory(history) {
        // Create history section if it doesn't exist
        let historySection = document.getElementById('ingredientHistory');
        
        if (!historySection) {
            historySection = this.createHistorySection();
        }

        const historyList = historySection.querySelector('.history-list');
        historyList.innerHTML = '';

        history.slice(0, 5).forEach(item => {
            const historyItem = this.createHistoryItem(item);
            historyList.appendChild(historyItem);
        });

        historySection.style.display = 'block';
    }

    createHistorySection() {
        const inputCard = document.querySelector('.input-card');
        if (!inputCard) return null;

        const historySection = document.createElement('div');
        historySection.id = 'ingredientHistory';
        historySection.className = 'ingredient-history';
        historySection.innerHTML = `
            <h3>Recent Searches</h3>
            <div class="history-list"></div>
        `;

        inputCard.appendChild(historySection);
        return historySection;
    }

    createHistoryItem(item) {
        const historyItem = document.createElement('button');
        historyItem.className = 'history-item';
        historyItem.textContent = item.ingredients;
        
        historyItem.addEventListener('click', () => {
            const textarea = document.getElementById('ingredients');
            if (textarea) {
                textarea.value = item.ingredients;
                this.validateIngredients({ target: textarea });
            }
        });

        return historyItem;
    }

    // ===== UI STATE MANAGEMENT =====
    showLoadingState() {
        const submitBtn = document.querySelector('#ingredientForm button[type="submit"]');
        if (submitBtn) {
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            
            if (btnText && btnLoader) {
                btnText.style.display = 'none';
                btnLoader.style.display = 'flex';
            }
            
            submitBtn.disabled = true;
        }
    }

    hideLoadingState() {
        const submitBtn = document.querySelector('#ingredientForm button[type="submit"]');
        if (submitBtn) {
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            
            if (btnText && btnLoader) {
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
            }
            
            submitBtn.disabled = false;
        }
    }

    showError(message) {
        // Create or update error message
        let errorDiv = document.getElementById('searchError');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'searchError';
            errorDiv.className = 'error-message';
            
            const form = document.getElementById('ingredientForm');
            if (form) {
                form.appendChild(errorDiv);
            }
        }

        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        errorDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv && errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // ===== NAVIGATION =====
    storeSearchResults(recipes) {
        // Store search results and parameters in sessionStorage
        const searchData = {
            ingredients: this.currentIngredients,
            preferences: this.currentPreferences,
            results: recipes,
            timestamp: new Date().toISOString()
        };

        sessionStorage.setItem('chefmate_search_results', JSON.stringify(searchData));
    }

    redirectToResults() {
        // Redirect to search results page
        window.location.href = 'search.html';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on the home page
    if (document.getElementById('ingredientForm')) {
        window.chefMateApp = new ChefMateApp();
    }
});

// Export for main.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChefMateApp;
}

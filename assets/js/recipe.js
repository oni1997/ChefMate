/**
 * ChefMate Recipe Page JavaScript
 * Handles recipe display, cooking mode, timers, and advanced features
 */

class ChefMateRecipe {
    constructor() {
        this.utils = window.ChefMateUtils;
        this.api = window.ChefMateAPI;
        this.recipe = null;
        this.currentServings = 4;
        this.originalServings = 4;
        this.cookingMode = false;
        this.timers = [];
        this.currentStep = 0;

        // Check if dependencies are loaded
        if (!this.utils) {
            console.error('ChefMateUtils not loaded');
            return;
        }
        if (!this.api) {
            console.error('ChefMateAPI not loaded');
            return;
        }

        this.init();
    }

    init() {
        this.loadRecipe();
        this.bindEvents();
    }

    // ===== RECIPE LOADING =====
    async loadRecipe() {
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('id');

        if (!recipeId) {
            console.error('No recipe ID provided in URL');
            this.showError();
            return;
        }

        if (!this.api) {
            console.error('ChefMateAPI not available');
            this.showError();
            return;
        }

        if (typeof this.api.getRecipeDetails !== 'function') {
            console.error('getRecipeDetails method not available on API object');
            console.log('Available API methods:', Object.getOwnPropertyNames(this.api));
            this.showError();
            return;
        }

        try {
            this.showLoading();
            console.log('Loading recipe with ID:', recipeId);
            this.recipe = await this.api.getRecipeDetails(recipeId);
            console.log('Recipe loaded:', this.recipe);
            this.originalServings = this.recipe.servings || 4;
            this.currentServings = this.originalServings;
            this.displayRecipe();
        } catch (error) {
            console.error('Failed to load recipe:', error);
            this.showError();
        }
    }

    // ===== EVENT BINDING =====
    bindEvents() {
        // Serving size controls
        document.getElementById('decreaseServing')?.addEventListener('click', () => {
            this.adjustServings(-1);
        });
        
        document.getElementById('increaseServing')?.addEventListener('click', () => {
            this.adjustServings(1);
        });

        // Favorite toggle
        document.getElementById('favoriteBtn')?.addEventListener('click', () => {
            this.toggleFavorite();
        });

        // Shopping list
        document.getElementById('addToShoppingList')?.addEventListener('click', () => {
            this.addToShoppingList();
        });

        document.getElementById('generateShoppingList')?.addEventListener('click', () => {
            this.generateShoppingList();
        });

        // Cooking mode
        document.getElementById('startCookingBtn')?.addEventListener('click', () => {
            this.startCookingMode();
        });

        // AI tips
        document.getElementById('getAiTips')?.addEventListener('click', () => {
            this.getAITips();
        });

        // Timer modal
        this.bindTimerEvents();
    }

    bindTimerEvents() {
        const timerModal = document.getElementById('timerModal');
        const closeTimer = document.getElementById('closeTimer');
        const startTimer = document.getElementById('startTimer');
        const pauseTimer = document.getElementById('pauseTimer');
        const resetTimer = document.getElementById('resetTimer');

        closeTimer?.addEventListener('click', () => this.hideTimerModal());
        startTimer?.addEventListener('click', () => this.startTimer());
        pauseTimer?.addEventListener('click', () => this.pauseTimer());
        resetTimer?.addEventListener('click', () => this.resetTimer());

        // Timer presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes);
                this.setTimerPreset(minutes);
            });
        });

        // Close modal when clicking outside
        timerModal?.addEventListener('click', (e) => {
            if (e.target === timerModal) this.hideTimerModal();
        });
    }

    // ===== RECIPE DISPLAY =====
    displayRecipe() {
        if (!this.recipe) return;

        // Basic info with null checks
        const recipeTitle = document.getElementById('recipeTitle');
        const recipeImage = document.getElementById('recipeImage');
        const cookTime = document.getElementById('cookTime');
        const servings = document.getElementById('servings');
        const difficulty = document.getElementById('difficulty');

        if (recipeTitle) recipeTitle.textContent = this.recipe.title;
        if (recipeImage) {
            recipeImage.src = this.recipe.image;
            recipeImage.alt = this.recipe.title;
        }
        if (cookTime) cookTime.textContent = this.utils.Utils.formatCookTime(this.recipe.readyInMinutes);
        if (servings) servings.textContent = this.currentServings;
        if (difficulty) difficulty.textContent = this.calculateDifficulty();

        // Update favorite button
        this.updateFavoriteButton();

        // Display ingredients
        this.displayIngredients();

        // Display instructions
        this.displayInstructions();

        // Display nutrition info
        this.displayNutritionInfo();

        // Show recipe content
        this.showRecipe();
    }

    displayIngredients() {
        const container = document.getElementById('ingredientsList');
        if (!container || !this.recipe.extendedIngredients) return;

        container.innerHTML = this.recipe.extendedIngredients.map(ingredient => {
            const adjustedAmount = this.adjustIngredientAmount(ingredient.amount);
            return `
                <div class="ingredient-item">
                    <div class="ingredient-amount">${adjustedAmount} ${ingredient.unit}</div>
                    <div class="ingredient-name">${ingredient.name}</div>
                </div>
            `;
        }).join('');
    }

    displayInstructions() {
        const container = document.getElementById('instructionsList');
        if (!container || !this.recipe.analyzedInstructions?.[0]?.steps) return;

        const steps = this.recipe.analyzedInstructions[0].steps;
        container.innerHTML = steps.map((step, index) => `
            <div class="instruction-step" data-step="${index}">
                <div class="step-number">${step.number}</div>
                <div class="step-content">
                    <p>${step.step}</p>
                    ${step.length ? `<div class="step-timer">
                        <button class="btn btn-small btn-secondary" onclick="window.chefMateRecipe.showTimerModal(${step.length.number})">
                            Timer: ${step.length.number} ${step.length.unit}
                        </button>
                    </div>` : ''}
                </div>
            </div>
        `).join('');
    }

    displayNutritionInfo() {
        const container = document.getElementById('nutritionInfo');
        if (!container || !this.recipe.nutrition) return;

        const nutrition = this.recipe.nutrition.nutrients || [];
        const importantNutrients = ['Calories', 'Protein', 'Carbohydrates', 'Fat', 'Fiber', 'Sugar'];
        
        container.innerHTML = importantNutrients.map(nutrientName => {
            const nutrient = nutrition.find(n => n.name === nutrientName);
            if (!nutrient) return '';
            
            const adjustedAmount = this.adjustNutrientAmount(nutrient.amount);
            return `
                <div class="nutrition-item">
                    <span class="nutrition-label">${nutrient.name}</span>
                    <span class="nutrition-value">${adjustedAmount.toFixed(1)}${nutrient.unit}</span>
                </div>
            `;
        }).filter(item => item).join('');
    }

    // ===== SERVING SIZE ADJUSTMENT =====
    adjustServings(change) {
        const newServings = Math.max(1, Math.min(12, this.currentServings + change));
        if (newServings !== this.currentServings) {
            this.currentServings = newServings;
            const servingsElement = document.getElementById('servings');
            if (servingsElement) {
                servingsElement.textContent = this.currentServings;
            }
            this.displayIngredients();
            this.displayNutritionInfo();
        }
    }

    adjustIngredientAmount(originalAmount) {
        if (!originalAmount) return '';
        const ratio = this.currentServings / this.originalServings;
        const adjusted = originalAmount * ratio;
        
        // Round to reasonable precision
        if (adjusted < 1) {
            return adjusted.toFixed(2);
        } else if (adjusted < 10) {
            return adjusted.toFixed(1);
        } else {
            return Math.round(adjusted);
        }
    }

    adjustNutrientAmount(originalAmount) {
        const ratio = this.currentServings / this.originalServings;
        return originalAmount * ratio;
    }

    // ===== FAVORITES =====
    toggleFavorite() {
        if (!this.recipe) return;

        const isFavorite = this.utils.Favorites.isFavorite(this.recipe.id);
        
        if (isFavorite) {
            this.utils.Favorites.remove(this.recipe.id);
            window.chefMateMain?.showNotification('Removed from favorites', 'info');
        } else {
            this.utils.Favorites.add(this.recipe);
            window.chefMateMain?.showNotification('Added to favorites!', 'success');
        }
        
        this.updateFavoriteButton();
    }

    updateFavoriteButton() {
        const btn = document.getElementById('favoriteBtn');
        if (!btn || !this.recipe) return;

        const isFavorite = this.utils.Favorites.isFavorite(this.recipe.id);
        btn.innerHTML = isFavorite 
            ? '<span class="heart-icon">❤️</span> Favorited'
            : '<span class="heart-icon">🤍</span> Add to Favorites';
        btn.classList.toggle('favorited', isFavorite);
    }

    // ===== SHOPPING LIST =====
    addToShoppingList() {
        if (!this.recipe?.extendedIngredients) return;

        const shoppingList = {
            id: this.utils.Utils.generateId(),
            name: `${this.recipe.title} - Shopping List`,
            items: this.recipe.extendedIngredients.map(ingredient => ({
                id: this.utils.Utils.generateId(),
                name: ingredient.name,
                amount: this.adjustIngredientAmount(ingredient.amount),
                unit: ingredient.unit,
                checked: false
            })),
            createdAt: new Date().toISOString()
        };

        const existingLists = this.utils.Storage.get('chefmate_shopping_lists', []);
        existingLists.push(shoppingList);
        this.utils.Storage.set('chefmate_shopping_lists', existingLists);

        window.chefMateMain?.showNotification('Added to shopping lists!', 'success');
    }

    generateShoppingList() {
        // Placeholder for missing ingredients shopping list
        window.chefMateMain?.showNotification('Shopping list generation coming soon!', 'info');
    }

    // ===== COOKING MODE =====
    startCookingMode() {
        this.cookingMode = true;
        this.currentStep = 0;
        
        // Add cooking mode UI
        this.showCookingModeUI();
        
        // Track activity
        window.chefMateProfile?.addActivity('recipe', `Started cooking: ${this.recipe.title}`);
    }

    showCookingModeUI() {
        const instructionsCard = document.querySelector('.instructions-card');
        if (!instructionsCard) return;

        // Add cooking mode header
        const cookingHeader = document.createElement('div');
        cookingHeader.className = 'cooking-mode-header';
        cookingHeader.innerHTML = `
            <div class="cooking-progress">
                <span>Step ${this.currentStep + 1} of ${this.recipe.analyzedInstructions?.[0]?.steps?.length || 0}</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${((this.currentStep + 1) / (this.recipe.analyzedInstructions?.[0]?.steps?.length || 1)) * 100}%"></div>
                </div>
            </div>
            <div class="cooking-controls">
                <button class="btn btn-secondary btn-small" id="prevStepBtn">Previous</button>
                <button class="btn btn-primary btn-small" id="nextStepBtn">Next Step</button>
                <button class="btn btn-secondary btn-small" id="exitCookingBtn">Exit Cooking Mode</button>
            </div>
        `;

        instructionsCard.insertBefore(cookingHeader, instructionsCard.firstChild);

        // Bind cooking mode events
        document.getElementById('prevStepBtn')?.addEventListener('click', () => this.previousStep());
        document.getElementById('nextStepBtn')?.addEventListener('click', () => this.nextStep());
        document.getElementById('exitCookingBtn')?.addEventListener('click', () => this.exitCookingMode());

        // Highlight current step
        this.highlightCurrentStep();
    }

    nextStep() {
        const maxSteps = this.recipe.analyzedInstructions?.[0]?.steps?.length || 0;
        if (this.currentStep < maxSteps - 1) {
            this.currentStep++;
            this.updateCookingProgress();
            this.highlightCurrentStep();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateCookingProgress();
            this.highlightCurrentStep();
        }
    }

    updateCookingProgress() {
        const maxSteps = this.recipe.analyzedInstructions?.[0]?.steps?.length || 0;
        const progressText = document.querySelector('.cooking-progress span');
        const progressFill = document.querySelector('.progress-fill');
        
        if (progressText) {
            progressText.textContent = `Step ${this.currentStep + 1} of ${maxSteps}`;
        }
        
        if (progressFill) {
            progressFill.style.width = `${((this.currentStep + 1) / maxSteps) * 100}%`;
        }
    }

    highlightCurrentStep() {
        // Remove previous highlights
        document.querySelectorAll('.instruction-step').forEach(step => {
            step.classList.remove('current-step');
        });

        // Highlight current step
        const currentStepElement = document.querySelector(`[data-step="${this.currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.classList.add('current-step');
            currentStepElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    exitCookingMode() {
        this.cookingMode = false;
        
        // Remove cooking mode UI
        const cookingHeader = document.querySelector('.cooking-mode-header');
        if (cookingHeader) {
            cookingHeader.remove();
        }

        // Remove step highlights
        document.querySelectorAll('.instruction-step').forEach(step => {
            step.classList.remove('current-step');
        });
    }

    // ===== TIMERS =====
    showTimerModal(presetMinutes = null) {
        if (presetMinutes) {
            this.setTimerPreset(presetMinutes);
        }
        document.getElementById('timerModal').style.display = 'flex';
    }

    hideTimerModal() {
        document.getElementById('timerModal').style.display = 'none';
    }

    setTimerPreset(minutes) {
        this.currentTimer = {
            duration: minutes * 60,
            remaining: minutes * 60,
            running: false,
            startTime: null
        };
        this.updateTimerDisplay();
    }

    startTimer() {
        if (!this.currentTimer) {
            this.setTimerPreset(5); // Default 5 minutes
        }
        
        this.currentTimer.running = true;
        this.currentTimer.startTime = Date.now();
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    pauseTimer() {
        if (this.currentTimer?.running) {
            this.currentTimer.running = false;
            clearInterval(this.timerInterval);
        }
    }

    resetTimer() {
        if (this.currentTimer) {
            this.currentTimer.remaining = this.currentTimer.duration;
            this.currentTimer.running = false;
            clearInterval(this.timerInterval);
            this.updateTimerDisplay();
        }
    }

    updateTimer() {
        if (!this.currentTimer?.running) return;

        const elapsed = Math.floor((Date.now() - this.currentTimer.startTime) / 1000);
        this.currentTimer.remaining = Math.max(0, this.currentTimer.duration - elapsed);
        
        this.updateTimerDisplay();
        
        if (this.currentTimer.remaining === 0) {
            this.timerComplete();
        }
    }

    updateTimerDisplay() {
        const display = document.getElementById('timerDisplay');
        if (!display || !this.currentTimer) return;

        const minutes = Math.floor(this.currentTimer.remaining / 60);
        const seconds = this.currentTimer.remaining % 60;
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    timerComplete() {
        this.currentTimer.running = false;
        clearInterval(this.timerInterval);
        
        window.chefMateMain?.showNotification('Timer completed!', 'success');
        
        // Play notification sound or show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('ChefMate Timer', {
                body: 'Your cooking timer is done!',
                icon: '/favicon.svg'
            });
        }
    }

    // ===== AI TIPS =====
    async getAITips() {
        if (!this.recipe) return;

        const btn = document.getElementById('getAiTips');
        const content = document.getElementById('aiTipsContent');
        
        if (!btn || !content) return;

        try {
            btn.disabled = true;
            btn.textContent = 'Getting Tips...';
            content.innerHTML = '<div class="loading">🤖 Generating personalized tips...</div>';

            const tips = await this.api.getAICookingTips(this.recipe);
            
            if (tips && tips.tips) {
                content.innerHTML = `
                    <div class="ai-tips-list">
                        ${tips.tips.map(tip => `<div class="ai-tip">💡 ${tip}</div>`).join('')}
                    </div>
                `;
            } else {
                content.innerHTML = '<div class="ai-error">Unable to generate tips right now. Try again later!</div>';
            }
        } catch (error) {
            console.error('Failed to get AI tips:', error);
            content.innerHTML = '<div class="ai-error">Unable to generate tips right now. Try again later!</div>';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Get More Tips';
        }
    }

    // ===== UTILITIES =====
    calculateDifficulty() {
        if (!this.recipe) return 'Medium';
        
        const time = this.recipe.readyInMinutes || 30;
        const ingredientCount = this.recipe.extendedIngredients?.length || 5;
        
        if (time <= 20 && ingredientCount <= 5) return 'Easy';
        if (time <= 45 && ingredientCount <= 10) return 'Medium';
        return 'Hard';
    }

    showLoading() {
        const loadingState = document.getElementById('loadingState');
        const recipeContent = document.getElementById('recipeContent');
        const errorState = document.getElementById('errorState');

        if (loadingState) loadingState.style.display = 'block';
        if (recipeContent) recipeContent.style.display = 'none';
        if (errorState) errorState.style.display = 'none';
    }

    showError() {
        const loadingState = document.getElementById('loadingState');
        const recipeContent = document.getElementById('recipeContent');
        const errorState = document.getElementById('errorState');

        if (loadingState) loadingState.style.display = 'none';
        if (recipeContent) recipeContent.style.display = 'none';
        if (errorState) errorState.style.display = 'block';
    }

    showRecipe() {
        const loadingState = document.getElementById('loadingState');
        const recipeContent = document.getElementById('recipeContent');
        const errorState = document.getElementById('errorState');

        if (loadingState) loadingState.style.display = 'none';
        if (recipeContent) recipeContent.style.display = 'block';
        if (errorState) errorState.style.display = 'none';
    }
}

// Initialize when DOM is loaded and dependencies are available
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('recipeTitle')) {
        // Wait for dependencies to be loaded
        const initializeRecipe = () => {
            if (window.ChefMateAPI && window.ChefMateUtils) {
                console.log('Initializing ChefMateRecipe...');
                window.chefMateRecipe = new ChefMateRecipe();
            } else {
                console.log('Waiting for dependencies to load...');
                setTimeout(initializeRecipe, 100);
            }
        };

        initializeRecipe();
    }
});

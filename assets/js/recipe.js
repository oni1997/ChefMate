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
            this.showError();
            return;
        }

        try {
            this.showLoading();
            this.recipe = await this.api.getRecipeDetails(recipeId);
            this.originalServings = this.recipe.servings || 4;
            this.currentServings = this.originalServings;
            this.displayRecipe();
        } catch (error) {
            this.handleRecipeNotFound(recipeId, error);
        }
    }

    // ===== RECIPE NOT FOUND HANDLING =====
    handleRecipeNotFound(recipeId, error) {
        this.currentRecipeId = recipeId;
        this.showError();
    }

    async searchWithAI() {
        try {
            this.showAISearchLoading();
            const aiRecipe = await this.api.searchRecipeWithAI(this.currentRecipeId);
            this.recipe = aiRecipe;
            this.originalServings = this.recipe.servings || 4;
            this.currentServings = this.originalServings;

            this.showAISearchResults();
            this.displayAIRecipe();
        } catch (error) {
            this.showAISearchError();
        }
    }

    displayAIRecipe() {

        // Display basic recipe info
        const aiRecipeTitle = document.getElementById('aiRecipeTitle');
        const aiRecipeSource = document.getElementById('aiRecipeSource');

        if (aiRecipeTitle) aiRecipeTitle.textContent = this.recipe.title;
        if (aiRecipeSource) aiRecipeSource.textContent = this.recipe.source || 'AI Generated';

        // Display ingredients
        this.displayAIIngredients();

        // Display instructions
        this.displayAIInstructions();

        // Display tips
        this.displayAITips();
    }

    displayAIIngredients() {
        const ingredientsList = document.getElementById('aiIngredientsList');
        if (!ingredientsList || !this.recipe.extendedIngredients) return;

        ingredientsList.innerHTML = '';

        this.recipe.extendedIngredients.forEach(ingredient => {
            const ingredientDiv = document.createElement('div');
            ingredientDiv.className = 'ai-ingredient-item';
            ingredientDiv.textContent = ingredient.original || ingredient.originalString;
            ingredientsList.appendChild(ingredientDiv);
        });
    }

    displayAIInstructions() {
        const instructionsList = document.getElementById('aiInstructionsList');
        if (!instructionsList || !this.recipe.analyzedInstructions) return;

        instructionsList.innerHTML = '';

        const instructions = this.recipe.analyzedInstructions[0]?.steps || [];
        instructions.forEach(instruction => {
            const instructionDiv = document.createElement('div');
            instructionDiv.className = 'ai-instruction-item';

            const numberDiv = document.createElement('div');
            numberDiv.className = 'ai-instruction-number';
            numberDiv.textContent = instruction.number;

            const textDiv = document.createElement('div');
            textDiv.className = 'ai-instruction-text';
            textDiv.textContent = instruction.step;

            instructionDiv.appendChild(numberDiv);
            instructionDiv.appendChild(textDiv);
            instructionsList.appendChild(instructionDiv);
        });
    }

    displayAITips() {
        const tipsList = document.getElementById('aiTipsList');
        if (!tipsList || !this.recipe.tips) return;

        tipsList.innerHTML = '';

        this.recipe.tips.forEach(tip => {
            const tipDiv = document.createElement('div');
            tipDiv.className = 'ai-tip-item';
            tipDiv.textContent = tip;
            tipsList.appendChild(tipDiv);
        });
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

        // Removed duplicate event listeners

        document.getElementById('getAiTipsBtn')?.addEventListener('click', () => {
            this.showAITipsSection();
        });

        document.getElementById('askAiBtn')?.addEventListener('click', () => {
            this.getAITips();
        });

        // Removed share and print functionality

        // Enhanced shopping list functionality
        document.getElementById('addToShoppingListBtn')?.addEventListener('click', () => {
            this.addToShoppingList();
        });

        document.getElementById('addToShoppingList')?.addEventListener('click', () => {
            this.addToShoppingList();
        });

        // Enhanced cooking mode functionality
        document.getElementById('startCookingBtn')?.addEventListener('click', () => {
            this.startCookingMode();
        });

        document.getElementById('cookingModeBtn')?.addEventListener('click', () => {
            this.startCookingMode();
        });

        // Timer buttons
        document.getElementById('timerBtn')?.addEventListener('click', () => {
            this.showTimerModal();
        });

        document.getElementById('timerToolBtn')?.addEventListener('click', () => {
            this.showTimerModal();
        });

        // Notes functionality
        document.getElementById('saveNotesBtn')?.addEventListener('click', () => {
            this.saveNotes();
        });

        document.getElementById('saveNotesActionBtn')?.addEventListener('click', () => {
            this.saveNotes();
        });

        document.getElementById('clearNotesBtn')?.addEventListener('click', () => {
            this.clearNotes();
        });

        // Tool buttons
        document.getElementById('nutritionToolBtn')?.addEventListener('click', () => {
            this.showDetailedNutrition();
        });

        document.getElementById('nutritionDetailsBtn')?.addEventListener('click', () => {
            this.showDetailedNutrition();
        });

        // AI search functionality
        document.getElementById('searchWithAI')?.addEventListener('click', () => {
            this.searchWithAI();
        });

        document.getElementById('tryAnotherRecipe')?.addEventListener('click', () => {
            this.searchWithAI();
        });

        document.getElementById('retryAISearch')?.addEventListener('click', () => {
            this.searchWithAI();
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
        if (!this.recipe) {
            return;
        }

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

        // Display recipe summary if available
        this.displaySummary();

        // Load saved notes
        this.loadNotes();

        // Show recipe content
        this.showRecipe();
    }

    displayIngredients() {
        const container = document.getElementById('ingredientsList');

        if (!container) {
            return;
        }

        if (!this.recipe.extendedIngredients) {
            console.error('No extendedIngredients in recipe!');
            return;
        }

        container.innerHTML = this.recipe.extendedIngredients.map(ingredient => {
            // Use the original text if available, otherwise construct from parts
            let displayText = ingredient.original;

            if (!displayText) {
                const adjustedAmount = this.adjustIngredientAmount(ingredient.amount);
                const unit = ingredient.unit || '';
                const name = ingredient.name || ingredient.nameClean || '';
                displayText = `${adjustedAmount} ${unit} ${name}`.trim();
            }

            return `
                <div class="ingredient-item">
                    <div class="ingredient-content">
                        <span class="ingredient-text">${displayText}</span>
                    </div>
                    <button class="ingredient-check-btn" onclick="window.chefMateRecipe.toggleIngredient('${ingredient.id}')">
                        <span class="checkmark">✓</span>
                    </button>
                </div>
            `;
        }).join('');
    }

    displayInstructions() {
        const container = document.getElementById('instructionsList');

        if (!container) {
            return;
        }

        let instructionsHTML = '';

        // Check for structured instructions first
        if (this.recipe.analyzedInstructions?.[0]?.steps?.length > 0) {
            const steps = this.recipe.analyzedInstructions[0].steps;
            instructionsHTML = steps.map((step, index) => `
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
        // Fall back to plain text instructions
        else if (this.recipe.instructions) {
            // Split by periods or line breaks to create steps
            const textSteps = this.recipe.instructions
                .split(/\.\s+|\n/)
                .filter(step => step.trim().length > 10)
                .map(step => step.trim());

            instructionsHTML = textSteps.map((step, index) => `
                <div class="instruction-step" data-step="${index}">
                    <div class="step-number">${index + 1}</div>
                    <div class="step-content">
                        <p>${step}${step.endsWith('.') ? '' : '.'}</p>
                    </div>
                </div>
            `).join('');
        }
        // No instructions available
        else {
            instructionsHTML = '<div class="empty-state">No instructions available for this recipe.</div>';
        }

        container.innerHTML = instructionsHTML;
    }

    async displayNutritionInfo() {
        const nutritionContainer = document.getElementById('nutritionInfo');
        if (!nutritionContainer) return;

        try {
            // Try to get detailed nutrition widget data first
            const nutritionWidget = await this.api.getRecipeNutritionWidget(this.recipe.id);

            if (nutritionWidget) {
                this.displayNutritionWidget(nutritionWidget, nutritionContainer);
                return;
            }
        } catch (error) {
            // Failed to load nutrition widget, falling back to basic nutrition
        }

        // Fallback to basic nutrition from recipe data
        this.displayBasicNutrition(nutritionContainer);
    }

    displayNutritionWidget(nutritionData, container) {

        // Main nutrition overview
        let nutritionHTML = '<div class="nutrition-overview">';

        // Caloric breakdown
        if (nutritionData.caloricBreakdown) {
            nutritionHTML += `
                <div class="caloric-breakdown">
                    <h4>Caloric Breakdown</h4>
                    <div class="breakdown-chart">
                        <div class="breakdown-item">
                            <span class="breakdown-label">Carbs</span>
                            <span class="breakdown-value">${Math.round(nutritionData.caloricBreakdown.percentCarbs)}%</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="breakdown-label">Fat</span>
                            <span class="breakdown-value">${Math.round(nutritionData.caloricBreakdown.percentFat)}%</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="breakdown-label">Protein</span>
                            <span class="breakdown-value">${Math.round(nutritionData.caloricBreakdown.percentProtein)}%</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Main nutrients
        nutritionHTML += '<div class="main-nutrients">';
        if (nutritionData.calories) {
            nutritionHTML += `
                <div class="nutrient-item primary">
                    <span class="nutrient-name">Calories</span>
                    <span class="nutrient-value">${nutritionData.calories}</span>
                </div>
            `;
        }

        if (nutritionData.carbs) {
            nutritionHTML += `
                <div class="nutrient-item">
                    <span class="nutrient-name">Carbohydrates</span>
                    <span class="nutrient-value">${nutritionData.carbs}</span>
                </div>
            `;
        }

        if (nutritionData.fat) {
            nutritionHTML += `
                <div class="nutrient-item">
                    <span class="nutrient-name">Fat</span>
                    <span class="nutrient-value">${nutritionData.fat}</span>
                </div>
            `;
        }

        if (nutritionData.protein) {
            nutritionHTML += `
                <div class="nutrient-item">
                    <span class="nutrient-name">Protein</span>
                    <span class="nutrient-value">${nutritionData.protein}</span>
                </div>
            `;
        }
        nutritionHTML += '</div>';

        // Good and bad nutrients
        if (nutritionData.good && nutritionData.good.length > 0) {
            nutritionHTML += '<div class="good-nutrients"><h5>✅ Good Nutrients</h5>';
            nutritionData.good.forEach(nutrient => {
                nutritionHTML += `
                    <div class="nutrient-detail good">
                        <span class="nutrient-name">${nutrient.title}</span>
                        <span class="nutrient-amount">${nutrient.amount}</span>
                        <span class="nutrient-percent">${nutrient.percentOfDailyNeeds}% DV</span>
                    </div>
                `;
            });
            nutritionHTML += '</div>';
        }

        if (nutritionData.bad && nutritionData.bad.length > 0) {
            nutritionHTML += '<div class="bad-nutrients"><h5>⚠️ Watch Out For</h5>';
            nutritionData.bad.forEach(nutrient => {
                nutritionHTML += `
                    <div class="nutrient-detail bad">
                        <span class="nutrient-name">${nutrient.title}</span>
                        <span class="nutrient-amount">${nutrient.amount}</span>
                        <span class="nutrient-percent">${nutrient.percentOfDailyNeeds}% DV</span>
                    </div>
                `;
            });
            nutritionHTML += '</div>';
        }

        nutritionHTML += '</div>';

        // Add button to show detailed nutrition
        nutritionHTML += '<button id="showDetailedNutritionBtn" class="btn btn-secondary btn-small">View Detailed Nutrition</button>';

        container.innerHTML = nutritionHTML;

        // Bind detailed nutrition button
        document.getElementById('showDetailedNutritionBtn')?.addEventListener('click', () => {
            this.showDetailedNutrition(nutritionData);
        });
    }

    displayBasicNutrition(container) {
        if (!this.recipe?.nutrition) {
            container.innerHTML = '<p class="no-nutrition">Nutrition information not available</p>';
            return;
        }

        const nutrients = this.recipe.nutrition.nutrients || [];
        const mainNutrients = ['Calories', 'Fat', 'Carbohydrates', 'Protein', 'Sodium', 'Sugar'];

        let nutritionHTML = '<div class="basic-nutrition"><h4>Nutrition Facts</h4><div class="nutrition-grid">';

        mainNutrients.forEach(nutrientName => {
            const nutrient = nutrients.find(n => n.name === nutrientName);
            if (nutrient) {
                nutritionHTML += `
                    <div class="nutrient-item">
                        <span class="nutrient-name">${nutrient.name}</span>
                        <span class="nutrient-value">${nutrient.amount} ${nutrient.unit}</span>
                    </div>
                `;
            }
        });

        nutritionHTML += '</div>';
        nutritionHTML += '<button id="showAllNutrientsBtn" class="btn btn-secondary btn-small">Show All Nutrients</button>';
        nutritionHTML += '</div>';

        container.innerHTML = nutritionHTML;

        document.getElementById('showAllNutrientsBtn')?.addEventListener('click', () => {
            this.showAllNutrients(nutrients);
        });
    }

    showDetailedNutrition(nutritionData) {
        const modal = document.createElement('div');
        modal.className = 'modal nutrition-modal';

        let modalContent = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detailed Nutrition Information</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
        `;

        // All nutrients
        if (nutritionData.nutrients && nutritionData.nutrients.length > 0) {
            modalContent += '<div class="nutrients-section"><h4>All Nutrients</h4>';
            nutritionData.nutrients.forEach(nutrient => {
                modalContent += `
                    <div class="nutrient-row">
                        <span class="nutrient-name">${nutrient.name}</span>
                        <span class="nutrient-value">${nutrient.amount} ${nutrient.unit}</span>
                        <span class="nutrient-percent">${nutrient.percentOfDailyNeeds}% DV</span>
                    </div>
                `;
            });
            modalContent += '</div>';
        }

        // Properties
        if (nutritionData.properties && nutritionData.properties.length > 0) {
            modalContent += '<div class="properties-section"><h4>Properties</h4>';
            nutritionData.properties.forEach(property => {
                modalContent += `
                    <div class="property-row">
                        <span class="property-name">${property.name}</span>
                        <span class="property-value">${property.amount} ${property.unit}</span>
                    </div>
                `;
            });
            modalContent += '</div>';
        }

        // Flavonoids
        if (nutritionData.flavonoids && nutritionData.flavonoids.length > 0) {
            modalContent += '<div class="flavonoids-section"><h4>Flavonoids</h4>';
            nutritionData.flavonoids.forEach(flavonoid => {
                modalContent += `
                    <div class="flavonoid-row">
                        <span class="flavonoid-name">${flavonoid.name}</span>
                        <span class="flavonoid-value">${flavonoid.amount} ${flavonoid.unit}</span>
                    </div>
                `;
            });
            modalContent += '</div>';
        }

        // Weight per serving
        if (nutritionData.weightPerServing) {
            modalContent += `
                <div class="weight-section">
                    <h4>Serving Information</h4>
                    <p><strong>Weight per serving:</strong> ${nutritionData.weightPerServing.amount} ${nutritionData.weightPerServing.unit}</p>
                </div>
            `;
        }

        modalContent += '</div></div>';
        modal.innerHTML = modalContent;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        });
    }

    showAllNutrients(nutrients) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Complete Nutritional Information</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="full-nutrition-list">
                        ${nutrients.map(n => `
                            <div class="nutrient-row">
                                <span class="nutrient-name">${n.name}</span>
                                <span class="nutrient-value">${n.amount} ${n.unit}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        });
    }

    displaySummary() {
        const container = document.getElementById('recipeSummary');
        if (!container) return;

        if (this.recipe.summary) {
            // Remove HTML tags from summary
            const cleanSummary = this.recipe.summary.replace(/<[^>]*>/g, '');
            container.innerHTML = `<p class="recipe-summary-text">${cleanSummary}</p>`;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    toggleIngredient(ingredientId) {
        const ingredientElement = document.querySelector(`[onclick*="${ingredientId}"]`);
        if (ingredientElement) {
            const item = ingredientElement.closest('.ingredient-item');
            item.classList.toggle('checked');

            // Store checked state
            const checkedIngredients = JSON.parse(localStorage.getItem('chefmate_checked_ingredients') || '{}');
            const recipeKey = `recipe_${this.recipe.id}`;

            if (!checkedIngredients[recipeKey]) {
                checkedIngredients[recipeKey] = [];
            }

            if (item.classList.contains('checked')) {
                if (!checkedIngredients[recipeKey].includes(ingredientId)) {
                    checkedIngredients[recipeKey].push(ingredientId);
                }
            } else {
                checkedIngredients[recipeKey] = checkedIngredients[recipeKey].filter(id => id !== ingredientId);
            }

            localStorage.setItem('chefmate_checked_ingredients', JSON.stringify(checkedIngredients));
        }
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

        btn.innerHTML = `
            <div class="favorite-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </div>
            <span class="favorite-text">${isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
        `;

        btn.classList.toggle('favorited', isFavorite);

        // Add animation when favorited
        if (isFavorite) {
            btn.querySelector('.favorite-icon').style.animation = 'heartBeat 0.6s ease-in-out';
            setTimeout(() => {
                const icon = btn.querySelector('.favorite-icon');
                if (icon) icon.style.animation = '';
            }, 600);
        }
    }

    // ===== SHOPPING LIST =====
    addToShoppingList() {
        if (!this.recipe?.extendedIngredients) {
            window.chefMateMain?.showNotification('No ingredients found to add to shopping list', 'error');
            return;
        }

        const shoppingList = {
            id: this.utils.Utils.generateId(),
            name: `${this.recipe.title} - Shopping List`,
            items: this.recipe.extendedIngredients.map(ingredient => ({
                id: this.utils.Utils.generateId(),
                name: ingredient.name,
                amount: this.adjustIngredientAmount(ingredient.amount),
                unit: ingredient.unit || '',
                checked: false
            })),
            createdAt: new Date().toISOString()
        };

        // Show preview modal before saving
        this.showShoppingListPreview(shoppingList);
    }

    showShoppingListPreview(shoppingList) {
        const modal = document.createElement('div');
        modal.className = 'modal shopping-list-preview-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🛒 Shopping List Preview</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="shopping-preview-info">
                        <h4>${shoppingList.name}</h4>
                        <p class="list-summary">${shoppingList.items.length} ingredients • Created ${new Date().toLocaleDateString()}</p>
                    </div>

                    <div class="shopping-preview-items">
                        <h5>Ingredients to add:</h5>
                        <div class="preview-items-grid">
                            ${shoppingList.items.map(item => `
                                <div class="preview-item">
                                    <span class="item-name">${item.name}</span>
                                    <span class="item-amount">${item.amount} ${item.unit}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="shopping-preview-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Cancel
                        </button>
                        <button class="btn btn-primary" onclick="window.chefMateRecipe.confirmAddToShoppingList('${shoppingList.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 11H5a2 2 0 0 0-2 2v3c0 5 2 7 9 7s9-2 9-7v-3a2 2 0 0 0-2-2h-4"/>
                                <polyline points="9,11 12,14 22,4"/>
                            </svg>
                            Add to Shopping Lists
                        </button>
                        <button class="btn btn-secondary" onclick="window.chefMateRecipe.viewAllShoppingLists()">
                            View All Lists
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Store the shopping list temporarily
        this.tempShoppingList = shoppingList;

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    confirmAddToShoppingList(listId) {
        if (!this.tempShoppingList) return;

        const existingLists = this.utils.Storage.get('chefmate_shopping_lists', []);
        existingLists.push(this.tempShoppingList);
        this.utils.Storage.set('chefmate_shopping_lists', existingLists);

        // Close modal
        document.querySelector('.shopping-list-preview-modal')?.remove();

        // Show success notification
        window.chefMateMain?.showNotification(
            `✅ Added ${this.tempShoppingList.items.length} ingredients to shopping list!`,
            'success'
        );

        // Clear temp data
        this.tempShoppingList = null;
    }

    viewAllShoppingLists() {
        // Close current modal
        document.querySelector('.shopping-list-preview-modal')?.remove();

        // Navigate to profile page
        window.location.href = 'profile.html#shopping-lists';
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

        // Check if cooking mode header already exists
        const existingHeader = document.querySelector('.cooking-mode-header');
        if (existingHeader) {
            // Update existing header instead of creating new one
            this.updateCookingProgress();
            this.highlightCurrentStep();
            return;
        }

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
        
        // Factors that affect difficulty
        const factors = {
            prepTime: this.recipe.preparationMinutes || 0,
            cookTime: this.recipe.cookingMinutes || 0,
            totalTime: this.recipe.readyInMinutes || 0,
            ingredientCount: this.recipe.extendedIngredients?.length || 0,
            stepCount: this.recipe.analyzedInstructions?.[0]?.steps?.length || 0,
            specialEquipment: this.recipe.equipment?.length || 0
        };
        
        // Calculate difficulty score (0-100)
        let score = 0;
        
        // Time factors (longer = harder)
        score += Math.min(factors.totalTime / 120 * 30, 30); // Max 30 points for time
        
        // Ingredient complexity
        score += Math.min(factors.ingredientCount / 15 * 25, 25); // Max 25 points for ingredients
        
        // Step complexity
        score += Math.min(factors.stepCount / 10 * 25, 25); // Max 25 points for steps
        
        // Special equipment
        score += Math.min(factors.specialEquipment * 5, 20); // Max 20 points for equipment
        
        // Determine difficulty level
        if (score < 30) return 'Easy';
        if (score < 60) return 'Medium';
        return 'Hard';
    }

    displayDifficultyRating() {
        const difficulty = this.calculateDifficulty();
        const difficultyEl = document.querySelector('.recipe-difficulty');
        
        if (difficultyEl) {
            difficultyEl.textContent = difficulty;
            difficultyEl.className = `recipe-difficulty difficulty-${difficulty.toLowerCase()}`;
        }
    }

    showLoading() {
        const loadingState = document.getElementById('loadingState');
        const recipeContainer = document.getElementById('recipeContainer');
        const errorState = document.getElementById('errorState');

        if (loadingState) loadingState.style.display = 'block';
        if (recipeContainer) recipeContainer.style.display = 'none';
        if (errorState) errorState.style.display = 'none';
    }

    showError() {
        const loadingState = document.getElementById('loadingState');
        const recipeContainer = document.getElementById('recipeContainer');
        const errorState = document.getElementById('errorState');

        if (loadingState) loadingState.style.display = 'none';
        if (recipeContainer) recipeContainer.style.display = 'none';
        if (errorState) errorState.style.display = 'block';
    }

    showRecipe() {
        const loadingState = document.getElementById('loadingState');
        const recipeContainer = document.getElementById('recipeContainer');
        const recipeContent = document.getElementById('recipeContent');
        const errorState = document.getElementById('errorState');

        if (loadingState) {
            loadingState.style.display = 'none';
        }
        if (recipeContainer) {
            recipeContainer.style.display = 'block';
        }
        if (recipeContent) {
            recipeContent.style.display = 'block';
        }
        if (errorState) {
            errorState.style.display = 'none';
        }
    }

    // ===== AI SEARCH UI STATES =====
    showAISearchLoading() {
        const loadingState = document.getElementById('loadingState');
        const recipeContainer = document.getElementById('recipeContainer');
        const errorState = document.getElementById('errorState');
        const aiSearchState = document.getElementById('aiSearchState');
        const aiSearchLoading = document.getElementById('aiSearchLoading');
        const aiSearchResults = document.getElementById('aiSearchResults');
        const aiSearchError = document.getElementById('aiSearchError');

        if (loadingState) loadingState.style.display = 'none';
        if (recipeContainer) recipeContainer.style.display = 'none';
        if (errorState) errorState.style.display = 'none';
        if (aiSearchState) aiSearchState.style.display = 'block';
        if (aiSearchLoading) aiSearchLoading.style.display = 'block';
        if (aiSearchResults) aiSearchResults.style.display = 'none';
        if (aiSearchError) aiSearchError.style.display = 'none';
    }

    showAISearchResults() {
        const aiSearchLoading = document.getElementById('aiSearchLoading');
        const aiSearchResults = document.getElementById('aiSearchResults');
        const aiSearchError = document.getElementById('aiSearchError');

        if (aiSearchLoading) aiSearchLoading.style.display = 'none';
        if (aiSearchResults) aiSearchResults.style.display = 'block';
        if (aiSearchError) aiSearchError.style.display = 'none';
    }

    showAISearchError() {
        const aiSearchLoading = document.getElementById('aiSearchLoading');
        const aiSearchResults = document.getElementById('aiSearchResults');
        const aiSearchError = document.getElementById('aiSearchError');

        if (aiSearchLoading) aiSearchLoading.style.display = 'none';
        if (aiSearchResults) aiSearchResults.style.display = 'none';
        if (aiSearchError) aiSearchError.style.display = 'block';
    }

    // ===== ENHANCED AI FUNCTIONALITY =====
    showAITipsSection() {
        const aiSection = document.getElementById('aiTipsSection');
        if (aiSection) {
            aiSection.style.display = 'block';
            // Scroll to the AI section
            aiSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Auto-load AI tips
            this.getAITips();
        }
    }

    async getAITips() {
        if (!this.recipe) {
            window.chefMateMain?.showNotification('No recipe loaded for AI tips', 'error');
            return;
        }

        // Show loading state
        const aiContent = document.getElementById('aiTipsContent');
        if (aiContent) {
            aiContent.innerHTML = `
                <div class="ai-loading">
                    <div class="loading-spinner"></div>
                    <p>🤖 AI Chef is analyzing this recipe...</p>
                </div>
            `;
        }

        try {
            // Create context-aware prompt for the recipe
            const recipeContext = {
                title: this.recipe.title,
                ingredients: this.recipe.extendedIngredients?.map(ing => ing.name).join(', ') || '',
                cookTime: this.recipe.readyInMinutes || 'unknown',
                servings: this.recipe.servings || 'unknown',
                difficulty: this.recipe.spoonacularScore > 80 ? 'Advanced' :
                           this.recipe.spoonacularScore > 50 ? 'Intermediate' : 'Beginner'
            };

            const prompt = `As an expert chef, provide 3-4 personalized cooking tips for "${recipeContext.title}".
            This recipe serves ${recipeContext.servings} and takes ${recipeContext.cookTime} minutes.
            Key ingredients: ${recipeContext.ingredients}

            Focus on:
            1. Technique improvements
            2. Ingredient substitutions or enhancements
            3. Common mistakes to avoid
            4. Presentation or serving suggestions

            Keep tips practical and specific to this recipe. Format as a friendly, encouraging response.`;

            const response = await this.api.getAICookingTips(this.recipe);

            if (response && response.tips && aiContent) {
                aiContent.innerHTML = `
                    <div class="ai-tips-response">
                        <div class="ai-header-small">
                            <div class="ai-avatar-small">🤖</div>
                            <h4>Chef AI's Tips for ${this.recipe.title}</h4>
                        </div>
                        <div class="ai-tips-content">
                            ${this.formatAITipsResponse(response.tips)}
                        </div>
                        <div class="ai-actions">
                            <button class="btn btn-secondary btn-small" onclick="window.chefMateRecipe.askSpecificQuestion()">
                                Ask Specific Question
                            </button>
                            <button class="btn btn-secondary btn-small" onclick="window.chefMateRecipe.getMoreTips()">
                                Get More Tips
                            </button>
                        </div>
                    </div>
                `;
            }

        } catch (error) {
            console.error('AI tips error:', error);
            if (aiContent) {
                aiContent.innerHTML = `
                    <div class="ai-error">
                        <p>🤖 Sorry, I'm having trouble connecting right now. Here are some general tips for cooking:</p>
                        <ul>
                            <li><strong>Prep first:</strong> Have all ingredients measured and ready before you start cooking</li>
                            <li><strong>Taste as you go:</strong> Adjust seasoning throughout the cooking process</li>
                            <li><strong>Temperature matters:</strong> Use a thermometer for meat and baking for best results</li>
                            <li><strong>Don't overcrowd:</strong> Give ingredients space in the pan for proper browning</li>
                        </ul>
                        <button class="btn btn-primary btn-small" onclick="window.chefMateRecipe.getAITips()">
                            Try Again
                        </button>
                    </div>
                `;
            }
        }
    }

    formatAITipsResponse(tips) {
        if (!tips || !Array.isArray(tips)) {
            return '<p>No tips available at this time.</p>';
        }

        return tips.map((tip, index) => {
            // Add emphasis to key cooking terms
            let formattedTip = tip;
            const cookingTerms = ['sauté', 'simmer', 'boil', 'bake', 'roast', 'grill', 'season', 'marinate', 'rest', 'preheat', 'dice', 'chop', 'mince', 'whisk', 'fold', 'brown', 'caramelize'];
            cookingTerms.forEach(term => {
                const regex = new RegExp(`\\b${term}\\b`, 'gi');
                formattedTip = formattedTip.replace(regex, `<em>${term}</em>`);
            });

            return `
                <div class="ai-tip-item">
                    <div class="tip-number">${index + 1}</div>
                    <div class="tip-content">
                        <p>${formattedTip}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    formatAIResponse(response) {
        // Legacy function for backward compatibility
        if (typeof response === 'string') {
            let formatted = response;

            // Convert numbered lists to HTML
            formatted = formatted.replace(/(\d+\.\s)/g, '<br><strong>$1</strong>');

            // Convert bullet points to HTML
            formatted = formatted.replace(/•\s/g, '<br>• ');

            // Add emphasis to key cooking terms
            const cookingTerms = ['sauté', 'simmer', 'boil', 'bake', 'roast', 'grill', 'season', 'marinate', 'rest', 'preheat'];
            cookingTerms.forEach(term => {
                const regex = new RegExp(`\\b${term}\\b`, 'gi');
                formatted = formatted.replace(regex, `<em>${term}</em>`);
            });

            return `<p>${formatted}</p>`;
        }

        return '<p>Unable to format response.</p>';
    }

    async askSpecificQuestion() {
        const question = prompt('What specific cooking question do you have about this recipe?');
        if (!question) return;

        const aiContent = document.getElementById('aiTipsContent');
        if (aiContent) {
            aiContent.innerHTML = `
                <div class="ai-tips-response">
                    <div class="ai-header-small">
                        <div class="ai-avatar-small">🤖</div>
                        <h4>Your Question: "${question}"</h4>
                    </div>
                    <div class="ai-tips-content">
                        <div class="ai-tip-item">
                            <div class="tip-number">💡</div>
                            <div class="tip-content">
                                <p>Great question! Here are some general guidelines that might help:</p>
                                <ul>
                                    <li>Check the recipe instructions for specific guidance on this step</li>
                                    <li>Look for visual cues mentioned in the recipe (golden brown, bubbling, etc.)</li>
                                    <li>Use a food thermometer for meat dishes to ensure proper doneness</li>
                                    <li>Taste and adjust seasonings as you cook</li>
                                    <li>Don't be afraid to trust your cooking instincts!</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="ai-actions">
                        <button class="btn btn-secondary btn-small" onclick="window.chefMateRecipe.askSpecificQuestion()">
                            Ask Another Question
                        </button>
                        <button class="btn btn-primary btn-small" onclick="window.chefMateRecipe.getAITips()">
                            Back to General Tips
                        </button>
                    </div>
                </div>
            `;
        }
    }

    async getMoreTips() {
        const aiContent = document.getElementById('aiTipsContent');
        if (aiContent) {
            // Show professional chef tips
            const professionalTips = [
                "Season in layers - add salt and spices at different stages of cooking for deeper flavor",
                "Let meat rest after cooking to allow juices to redistribute for better texture",
                "Use the right pan size - overcrowding leads to steaming instead of browning",
                "Taste and adjust seasoning throughout the cooking process, not just at the end",
                "Prep all ingredients before you start cooking (mise en place) for smoother execution",
                "Control your heat - most home cooks use too high heat too often",
                "Don't move food around too much in the pan - let it develop proper color first"
            ];

            aiContent.innerHTML = `
                <div class="ai-tips-response">
                    <div class="ai-header-small">
                        <div class="ai-avatar-small">👨‍🍳</div>
                        <h4>Professional Chef Secrets</h4>
                    </div>
                    <div class="ai-tips-content">
                        ${this.formatAITipsResponse(professionalTips)}
                    </div>
                    <div class="ai-actions">
                        <button class="btn btn-secondary btn-small" onclick="window.chefMateRecipe.askSpecificQuestion()">
                            Ask Specific Question
                        </button>
                        <button class="btn btn-primary btn-small" onclick="window.chefMateRecipe.getAITips()">
                            Back to Basic Tips
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // ===== NOTES FUNCTIONALITY =====
    saveNotes() {
        const notesTextarea = document.getElementById('recipeNotes');
        if (!notesTextarea || !this.recipe) return;

        const notes = notesTextarea.value.trim();
        const recipeNotes = JSON.parse(localStorage.getItem('chefmate_recipe_notes') || '{}');

        if (notes) {
            recipeNotes[this.recipe.id] = {
                notes: notes,
                savedAt: new Date().toISOString()
            };
        } else {
            delete recipeNotes[this.recipe.id];
        }

        localStorage.setItem('chefmate_recipe_notes', JSON.stringify(recipeNotes));
        window.chefMateMain?.showNotification('Notes saved!', 'success');
    }

    clearNotes() {
        const notesTextarea = document.getElementById('recipeNotes');
        if (!notesTextarea) return;

        if (confirm('Clear all notes for this recipe?')) {
            notesTextarea.value = '';
            if (this.recipe) {
                const recipeNotes = JSON.parse(localStorage.getItem('chefmate_recipe_notes') || '{}');
                delete recipeNotes[this.recipe.id];
                localStorage.setItem('chefmate_recipe_notes', JSON.stringify(recipeNotes));
            }
            window.chefMateMain?.showNotification('Notes cleared!', 'info');
        }
    }

    loadNotes() {
        if (!this.recipe) return;

        const recipeNotes = JSON.parse(localStorage.getItem('chefmate_recipe_notes') || '{}');
        const notes = recipeNotes[this.recipe.id];

        if (notes) {
            const notesTextarea = document.getElementById('recipeNotes');
            if (notesTextarea) {
                notesTextarea.value = notes.notes;
            }
        }
    }

    // ===== REMOVED COMING SOON PLACEHOLDERS =====

    // ===== TIMER MODAL =====
    showTimerModal() {
        const modal = document.getElementById('timerModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideTimerModal() {
        const modal = document.getElementById('timerModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Initialize when DOM is loaded and dependencies are available
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('recipeTitle')) {
        // Wait for dependencies to be loaded
        const initializeRecipe = () => {
            if (window.ChefMateAPI && window.ChefMateUtils) {
                window.chefMateRecipe = new ChefMateRecipe();
            } else {
                setTimeout(initializeRecipe, 100);
            }
        };

        initializeRecipe();
    }
});

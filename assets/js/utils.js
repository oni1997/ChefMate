/**
 * ChefMate Utility Functions
 * Common helper functions used across the application
 */

// ===== LOCAL STORAGE UTILITIES =====
const Storage = {
    // Get item from localStorage with JSON parsing
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },

    // Set item in localStorage with JSON stringification
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    },

    // Remove item from localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },

    // Clear all localStorage
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// ===== FAVORITES MANAGEMENT =====
const Favorites = {
    // Get all favorite recipes
    getAll() {
        return Storage.get('chefmate_favorites', []);
    },

    // Add recipe to favorites
    add(recipe) {
        const favorites = this.getAll();
        const existingIndex = favorites.findIndex(fav => fav.id === recipe.id);
        
        if (existingIndex === -1) {
            const favoriteRecipe = {
                ...recipe,
                dateAdded: new Date().toISOString(),
                notes: ''
            };
            favorites.push(favoriteRecipe);
            Storage.set('chefmate_favorites', favorites);
            return true;
        }
        return false;
    },

    // Remove recipe from favorites
    remove(recipeId) {
        const favorites = this.getAll();
        const filteredFavorites = favorites.filter(fav => fav.id !== recipeId);
        Storage.set('chefmate_favorites', filteredFavorites);
        return filteredFavorites.length < favorites.length;
    },

    // Check if recipe is in favorites
    isFavorite(recipeId) {
        const favorites = this.getAll();
        return favorites.some(fav => fav.id === recipeId);
    },

    // Update notes for a favorite recipe
    updateNotes(recipeId, notes) {
        const favorites = this.getAll();
        const favoriteIndex = favorites.findIndex(fav => fav.id === recipeId);
        
        if (favoriteIndex !== -1) {
            favorites[favoriteIndex].notes = notes;
            favorites[favoriteIndex].lastModified = new Date().toISOString();
            Storage.set('chefmate_favorites', favorites);
            return true;
        }
        return false;
    }
};

// ===== INGREDIENT HISTORY =====
const IngredientHistory = {
    // Get ingredient search history
    getHistory() {
        return Storage.get('chefmate_ingredient_history', []);
    },

    // Add ingredients to history
    addToHistory(ingredients) {
        const history = this.getHistory();
        const ingredientString = ingredients.join(', ');
        
        // Remove if already exists
        const filteredHistory = history.filter(item => item.ingredients !== ingredientString);
        
        // Add to beginning
        filteredHistory.unshift({
            ingredients: ingredientString,
            timestamp: new Date().toISOString()
        });

        // Keep only last 10 searches
        const limitedHistory = filteredHistory.slice(0, 10);
        Storage.set('chefmate_ingredient_history', limitedHistory);
    },

    // Clear history
    clearHistory() {
        Storage.remove('chefmate_ingredient_history');
    }
};

// ===== UTILITY FUNCTIONS =====
const Utils = {
    // Debounce function for search inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Format cooking time
    formatCookTime(minutes) {
        if (!minutes) return 'N/A';
        
        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            if (remainingMinutes === 0) {
                return `${hours}h`;
            } else {
                return `${hours}h ${remainingMinutes}m`;
            }
        }
    },

    // Format difficulty level
    formatDifficulty(level) {
        const difficulties = {
            'very easy': 1,
            'easy': 1,
            'medium': 2,
            'hard': 3,
            'very hard': 3
        };
        
        return difficulties[level?.toLowerCase()] || 2;
    },

    // Generate difficulty dots HTML
    generateDifficultyDots(level) {
        const numDots = this.formatDifficulty(level);
        let dotsHTML = '';
        
        for (let i = 1; i <= 3; i++) {
            const activeClass = i <= numDots ? 'active' : '';
            dotsHTML += `<span class="difficulty-dot ${activeClass}"></span>`;
        }
        
        return dotsHTML;
    },

    // Generate star rating HTML
    generateStarRating(rating, maxRating = 5) {
        if (!rating) return '<span class="no-rating">No rating</span>';
        
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let starsHTML = '';
        
        for (let i = 1; i <= maxRating; i++) {
            if (i <= fullStars) {
                starsHTML += '★';
            } else if (i === fullStars + 1 && hasHalfStar) {
                starsHTML += '☆';
            } else {
                starsHTML += '☆';
            }
        }
        
        return starsHTML;
    },

    // Clean and parse ingredients string
    parseIngredients(ingredientsString) {
        if (!ingredientsString) return [];
        
        return ingredientsString
            .split(',')
            .map(ingredient => ingredient.trim())
            .filter(ingredient => ingredient.length > 0);
    },

    // Format ingredients list for display
    formatIngredientsList(ingredients, maxDisplay = 3) {
        if (!ingredients || ingredients.length === 0) return 'No ingredients';
        
        if (ingredients.length <= maxDisplay) {
            return ingredients.join(', ');
        } else {
            const displayed = ingredients.slice(0, maxDisplay);
            const remaining = ingredients.length - maxDisplay;
            return `${displayed.join(', ')} +${remaining} more`;
        }
    },

    // Show loading state
    showLoading(element, message = 'Loading...') {
        if (element) {
            element.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                    <p>${message}</p>
                </div>
            `;
        }
    },

    // Show error state
    showError(element, message = 'Something went wrong', retryCallback = null) {
        if (element) {
            const retryButton = retryCallback ? 
                `<button class="btn btn-primary" onclick="${retryCallback}">Try Again</button>` : '';
            
            element.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Oops! Something went wrong</h3>
                    <p>${message}</p>
                    ${retryButton}
                </div>
            `;
        }
    },

    // Show empty state
    showEmpty(element, title = 'No results found', message = '', actionButton = '') {
        if (element) {
            element.innerHTML = `
                <div class="no-results-state">
                    <div class="no-results-icon">🔍</div>
                    <h3>${title}</h3>
                    <p>${message}</p>
                    ${actionButton}
                </div>
            `;
        }
    },

    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        if (element) {
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    },

    // Copy text to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    },

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    },

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },

    // Calculate recipe difficulty rating
    calculateDifficultyRating(recipe) {
        const time = recipe.readyInMinutes || 30;
        const ingredientCount = recipe.extendedIngredients?.length || 5;
        const instructionCount = recipe.analyzedInstructions?.[0]?.steps?.length || 5;

        let score = 0;

        // Time factor (0-3 points)
        if (time <= 15) score += 0;
        else if (time <= 30) score += 1;
        else if (time <= 60) score += 2;
        else score += 3;

        // Ingredient factor (0-3 points)
        if (ingredientCount <= 5) score += 0;
        else if (ingredientCount <= 10) score += 1;
        else if (ingredientCount <= 15) score += 2;
        else score += 3;

        // Instruction complexity (0-2 points)
        if (instructionCount <= 5) score += 0;
        else if (instructionCount <= 10) score += 1;
        else score += 2;

        // Convert to difficulty level
        if (score <= 2) return { level: 'Easy', rating: 1 };
        if (score <= 5) return { level: 'Medium', rating: 2 };
        return { level: 'Hard', rating: 3 };
    },

    // Format serving size for display
    formatServingSize(servings) {
        if (!servings) return '4 servings';
        if (servings === 1) return '1 serving';
        return `${servings} servings`;
    },

    // Calculate nutritional values per serving
    calculateNutritionPerServing(nutrition, originalServings, currentServings) {
        if (!nutrition || !originalServings || !currentServings) return nutrition;

        const ratio = currentServings / originalServings;
        return nutrition.map(nutrient => ({
            ...nutrient,
            amount: nutrient.amount * ratio
        }));
    },

    // Format time for display
    formatTime(seconds) {
        if (!seconds) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // Time ago helper
    timeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    },

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
};

// ===== SHOPPING LIST MANAGEMENT =====
const ShoppingList = {
    // Get all shopping lists
    getAllLists() {
        return Storage.get('chefmate_shopping_lists', []);
    },
    
    // Create a new shopping list
    createList(name, items = []) {
        const lists = this.getAllLists();
        const newList = {
            id: Utils.generateId(),
            name,
            items,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        lists.push(newList);
        Storage.set('chefmate_shopping_lists', lists);
        return newList;
    },
    
    // Get a specific list by ID
    getList(listId) {
        const lists = this.getAllLists();
        return lists.find(list => list.id === listId);
    },
    
    // Add items to a shopping list
    addItems(listId, newItems) {
        const lists = this.getAllLists();
        const listIndex = lists.findIndex(list => list.id === listId);
        
        if (listIndex === -1) return false;
        
        // Add new items, avoiding duplicates
        newItems.forEach(newItem => {
            const existingItem = lists[listIndex].items.find(item => 
                item.name.toLowerCase() === newItem.name.toLowerCase());
                
            if (existingItem) {
                // Update existing item
                existingItem.amount = (parseFloat(existingItem.amount) + parseFloat(newItem.amount)).toString();
            } else {
                // Add new item
                lists[listIndex].items.push({
                    id: Utils.generateId(),
                    ...newItem,
                    checked: false
                });
            }
        });
        
        lists[listIndex].updatedAt = new Date().toISOString();
        Storage.set('chefmate_shopping_lists', lists);
        return true;
    },
    
    // Update item status (checked/unchecked)
    updateItemStatus(listId, itemId, checked) {
        const lists = this.getAllLists();
        const listIndex = lists.findIndex(list => list.id === listId);
        
        if (listIndex === -1) return false;
        
        const itemIndex = lists[listIndex].items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return false;
        
        lists[listIndex].items[itemIndex].checked = checked;
        lists[listIndex].updatedAt = new Date().toISOString();
        
        Storage.set('chefmate_shopping_lists', lists);
        return true;
    },
    
    // Remove an item from a list
    removeItem(listId, itemId) {
        const lists = this.getAllLists();
        const listIndex = lists.findIndex(list => list.id === listId);
        
        if (listIndex === -1) return false;
        
        lists[listIndex].items = lists[listIndex].items.filter(item => item.id !== itemId);
        lists[listIndex].updatedAt = new Date().toISOString();
        
        Storage.set('chefmate_shopping_lists', lists);
        return true;
    },
    
    // Delete a shopping list
    deleteList(listId) {
        const lists = this.getAllLists();
        const updatedLists = lists.filter(list => list.id !== listId);
        
        if (updatedLists.length === lists.length) return false;
        
        Storage.set('chefmate_shopping_lists', updatedLists);
        return true;
    },
    
    // Generate a shopping list from recipe ingredients
    generateFromRecipe(recipe, servings = null) {
        if (!recipe || !recipe.extendedIngredients) return null;
        
        const recipeServings = recipe.servings || 4;
        const targetServings = servings || recipeServings;
        const ratio = targetServings / recipeServings;
        
        const items = recipe.extendedIngredients.map(ingredient => {
            const adjustedAmount = (parseFloat(ingredient.amount) * ratio).toFixed(2).replace(/\.00$/, '');
            
            return {
                id: Utils.generateId(),
                name: ingredient.name,
                amount: adjustedAmount,
                unit: ingredient.unit || '',
                aisle: ingredient.aisle || 'Other',
                checked: false
            };
        });
        
        return this.createList(`${recipe.title} - Shopping List`, items);
    }
};

// ===== TIMER MANAGEMENT =====
const Timer = {
    // Get all timers
    getAll() {
        return Storage.get('chefmate_timers', []);
    },

    // Create new timer
    create(name, durationMinutes) {
        const timers = this.getAll();
        const newTimer = {
            id: Utils.generateId(),
            name: name.trim(),
            duration: durationMinutes * 60, // Convert to seconds
            remaining: durationMinutes * 60,
            status: 'ready', // ready, running, paused, completed
            createdAt: new Date().toISOString(),
            startedAt: null,
            pausedAt: null
        };

        timers.push(newTimer);
        Storage.set('chefmate_timers', timers);
        return newTimer;
    },

    // Start timer
    start(timerId) {
        const timers = this.getAll();
        const timerIndex = timers.findIndex(timer => timer.id === timerId);

        if (timerIndex !== -1) {
            timers[timerIndex].status = 'running';
            timers[timerIndex].startedAt = new Date().toISOString();
            Storage.set('chefmate_timers', timers);
            return true;
        }
        return false;
    },

    // Pause timer
    pause(timerId) {
        const timers = this.getAll();
        const timerIndex = timers.findIndex(timer => timer.id === timerId);

        if (timerIndex !== -1 && timers[timerIndex].status === 'running') {
            timers[timerIndex].status = 'paused';
            timers[timerIndex].pausedAt = new Date().toISOString();
            Storage.set('chefmate_timers', timers);
            return true;
        }
        return false;
    },

    // Resume timer
    resume(timerId) {
        const timers = this.getAll();
        const timerIndex = timers.findIndex(timer => timer.id === timerId);

        if (timerIndex !== -1 && timers[timerIndex].status === 'paused') {
            timers[timerIndex].status = 'running';
            timers[timerIndex].pausedAt = null;
            Storage.set('chefmate_timers', timers);
            return true;
        }
        return false;
    },

    // Complete timer
    complete(timerId) {
        const timers = this.getAll();
        const timerIndex = timers.findIndex(timer => timer.id === timerId);

        if (timerIndex !== -1) {
            timers[timerIndex].status = 'completed';
            timers[timerIndex].completedAt = new Date().toISOString();
            Storage.set('chefmate_timers', timers);
            return true;
        }
        return false;
    },

    // Delete timer
    delete(timerId) {
        const timers = this.getAll();
        const filteredTimers = timers.filter(timer => timer.id !== timerId);
        Storage.set('chefmate_timers', filteredTimers);
        return filteredTimers.length < timers.length;
    },

    // Get active timers
    getActive() {
        return this.getAll().filter(timer =>
            timer.status === 'running' || timer.status === 'paused'
        );
    }
};

// ===== MOBILE NAVIGATION =====
const MobileNav = {
    init() {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });

            // Close menu when clicking on a link
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                });
            });
        }
    }
};

// Initialize mobile navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    MobileNav.init();
});

// Export utilities for use in other modules
window.ChefMateUtils = {
    Storage,
    Favorites,
    IngredientHistory,
    Utils,
    ShoppingList,
    Timer,
    MobileNav
};

/**
 * ChefMate Search Results JavaScript
 * Handles the search results page functionality
 */

class ChefMateSearch {
    constructor() {
        this.api = window.ChefMateAPI;
        this.utils = window.ChefMateUtils;
        this.searchData = null;
        this.currentResults = [];
        this.filteredResults = [];
        this.currentPage = 1;
        this.resultsPerPage = 12;
        
        this.init();
    }

    init() {
        this.loadSearchData();
        this.bindEvents();
        this.displayResults();
    }

    // ===== DATA LOADING =====
    loadSearchData() {
        const storedData = sessionStorage.getItem('chefmate_search_results');
        
        if (storedData) {
            try {
                this.searchData = JSON.parse(storedData);
                this.currentResults = this.searchData.results || [];
                this.filteredResults = [...this.currentResults];
                this.updateSearchInfo();
            } catch (error) {
                console.error('Failed to load search data:', error);
                this.showNoResults();
            }
        } else {
            // No search data found, redirect to home
            this.redirectToHome();
        }
    }

    updateSearchInfo() {
        const subtitle = document.getElementById('searchSubtitle');
        if (subtitle && this.searchData) {
            const ingredientCount = this.searchData.ingredients.length;
            const resultCount = this.currentResults.length;
            
            subtitle.textContent = `Found ${resultCount} recipes using ${ingredientCount} ingredient${ingredientCount > 1 ? 's' : ''}: ${this.searchData.ingredients.join(', ')}`;
        }
    }

    // ===== EVENT BINDING =====
    bindEvents() {
        // Quick search form
        const quickSearchForm = document.getElementById('quickSearchForm');
        if (quickSearchForm) {
            quickSearchForm.addEventListener('submit', (e) => this.handleQuickSearch(e));
        }

        // Filter controls
        this.bindFilterEvents();

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreResults());
        }
    }

    bindFilterEvents() {
        const filters = ['timeFilter', 'difficultyFilter', 'dietFilter', 'sortFilter'];
        
        filters.forEach(filterId => {
            const filterElement = document.getElementById(filterId);
            if (filterElement) {
                filterElement.addEventListener('change', () => this.applyFilters());
            }
        });
    }

    // ===== SEARCH HANDLING =====
    async handleQuickSearch(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const additionalIngredients = formData.get('quickIngredients');
        
        if (!additionalIngredients || additionalIngredients.trim().length === 0) {
            return;
        }

        const newIngredients = this.utils.Utils.parseIngredients(additionalIngredients);
        const allIngredients = [...this.searchData.ingredients, ...newIngredients];

        // Show loading state
        this.showLoadingState();

        try {
            const searchOptions = {
                ...this.searchData.preferences,
                number: 12
            };

            const newResults = await this.api.searchRecipesByIngredients(allIngredients, searchOptions);
            
            // Update search data
            this.searchData.ingredients = allIngredients;
            this.searchData.results = newResults;
            this.currentResults = newResults;
            this.filteredResults = [...newResults];
            
            // Update UI
            this.updateSearchInfo();
            this.displayResults();
            
            // Clear quick search input
            document.getElementById('quickIngredients').value = '';

        } catch (error) {
            console.error('Quick search failed:', error);
            this.showError(error.message);
        }
    }

    // ===== FILTERING =====
    applyFilters() {
        let filtered = [...this.currentResults];

        // Time filter
        const timeFilter = document.getElementById('timeFilter')?.value;
        if (timeFilter) {
            const maxTime = parseInt(timeFilter);
            filtered = filtered.filter(recipe => 
                recipe.readyInMinutes && recipe.readyInMinutes <= maxTime
            );
        }

        // Difficulty filter
        const difficultyFilter = document.getElementById('difficultyFilter')?.value;
        if (difficultyFilter) {
            filtered = filtered.filter(recipe => {
                const recipeDifficulty = this.getRecipeDifficulty(recipe);
                return recipeDifficulty === difficultyFilter;
            });
        }

        // Diet filter
        const dietFilter = document.getElementById('dietFilter')?.value;
        if (dietFilter) {
            filtered = filtered.filter(recipe => {
                switch (dietFilter) {
                    case 'vegetarian':
                        return recipe.vegetarian;
                    case 'vegan':
                        return recipe.vegan;
                    case 'gluten-free':
                        return recipe.glutenFree;
                    case 'dairy-free':
                        return recipe.dairyFree;
                    default:
                        return true;
                }
            });
        }

        // Sort filter
        const sortFilter = document.getElementById('sortFilter')?.value;
        if (sortFilter) {
            filtered = this.sortResults(filtered, sortFilter);
        }

        this.filteredResults = filtered;
        this.currentPage = 1;
        this.displayResults();
    }

    sortResults(results, sortBy) {
        const sorted = [...results];
        
        switch (sortBy) {
            case 'time':
                return sorted.sort((a, b) => (a.readyInMinutes || 999) - (b.readyInMinutes || 999));
            case 'popularity':
                return sorted.sort((a, b) => (b.aggregateLikes || 0) - (a.aggregateLikes || 0));
            case 'rating':
                return sorted.sort((a, b) => (b.spoonacularScore || 0) - (a.spoonacularScore || 0));
            case 'relevance':
            default:
                return sorted.sort((a, b) => (a.missedIngredientCount || 0) - (b.missedIngredientCount || 0));
        }
    }

    getRecipeDifficulty(recipe) {
        const readyTime = recipe.readyInMinutes || 30;
        const ingredientCount = recipe.extendedIngredients?.length || 5;
        
        if (readyTime <= 20 && ingredientCount <= 5) return 'easy';
        if (readyTime <= 45 && ingredientCount <= 10) return 'medium';
        return 'hard';
    }

    // ===== DISPLAY RESULTS =====
    displayResults() {
        const resultsGrid = document.getElementById('resultsGrid');
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const noResultsState = document.getElementById('noResultsState');

        // Hide all states first
        [loadingState, errorState, noResultsState].forEach(element => {
            if (element) element.style.display = 'none';
        });

        if (!this.filteredResults || this.filteredResults.length === 0) {
            this.showNoResults();
            return;
        }

        // Show results grid
        if (resultsGrid) {
            resultsGrid.style.display = 'grid';
            resultsGrid.innerHTML = '';

            // Calculate pagination
            const startIndex = 0;
            const endIndex = this.currentPage * this.resultsPerPage;
            const recipesToShow = this.filteredResults.slice(startIndex, endIndex);

            // Create recipe cards
            recipesToShow.forEach(recipe => {
                const recipeCard = this.createRecipeCard(recipe);
                resultsGrid.appendChild(recipeCard);
            });

            // Update load more button
            this.updateLoadMoreButton();
        }
    }

    createRecipeCard(recipe) {
        const template = document.getElementById('recipeCardTemplate');
        if (!template) {
            console.error('Recipe card template not found');
            return document.createElement('div');
        }

        const cardElement = template.content.cloneNode(true);
        const card = cardElement.querySelector('.recipe-card');

        // Set recipe data
        card.dataset.recipeId = recipe.id;

        // Image
        const image = card.querySelector('.recipe-image');
        if (image) {
            image.src = recipe.image || 'assets/images/recipe-placeholder.jpg';
            image.alt = recipe.title;
        }

        // Title
        const title = card.querySelector('.recipe-title');
        if (title) {
            title.textContent = recipe.title;
        }

        // Time
        const timeText = card.querySelector('.time-text');
        if (timeText) {
            timeText.textContent = this.utils.Utils.formatCookTime(recipe.readyInMinutes);
        }

        // Difficulty
        const difficultyDots = card.querySelector('.difficulty-dots');
        if (difficultyDots) {
            const difficulty = this.getRecipeDifficulty(recipe);
            difficultyDots.innerHTML = this.utils.Utils.generateDifficultyDots(difficulty);
        }

        // Rating
        const stars = card.querySelector('.stars');
        const ratingText = card.querySelector('.rating-text');
        if (stars && ratingText) {
            const rating = recipe.spoonacularScore ? recipe.spoonacularScore / 20 : null;
            stars.innerHTML = this.utils.Utils.generateStarRating(rating);
            ratingText.textContent = rating ? `(${rating.toFixed(1)})` : '';
        }

        // Description
        const description = card.querySelector('.recipe-description');
        if (description && recipe.summary) {
            // Strip HTML tags and limit length
            const plainText = recipe.summary.replace(/<[^>]*>/g, '');
            description.textContent = plainText.length > 120 ? 
                plainText.substring(0, 120) + '...' : plainText;
        }

        // Ingredients
        const ingredientsList = card.querySelector('.ingredients-list');
        if (ingredientsList && recipe.extendedIngredients) {
            const ingredients = recipe.extendedIngredients.map(ing => ing.name);
            ingredientsList.textContent = this.utils.Utils.formatIngredientsList(ingredients);
        }

        // Badges
        this.addRecipeBadges(card, recipe);

        // Favorite button
        const favoriteBtn = card.querySelector('.favorite-btn');
        if (favoriteBtn) {
            this.updateFavoriteButton(favoriteBtn, recipe.id);
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(recipe);
            });
        }

        // Action buttons
        const viewRecipeBtn = card.querySelector('.view-recipe-btn');
        if (viewRecipeBtn) {
            viewRecipeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.viewRecipe(recipe.id);
            });
        }

        const aiTipsBtn = card.querySelector('.ai-tips-btn');
        if (aiTipsBtn) {
            aiTipsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showAITips(recipe);
            });
        }

        // Card click handler
        card.addEventListener('click', () => this.viewRecipe(recipe.id));

        return cardElement;
    }

    addRecipeBadges(card, recipe) {
        const badgesContainer = card.querySelector('.recipe-badges');
        if (!badgesContainer) return;

        const badges = [];

        if (recipe.vegetarian) badges.push('Vegetarian');
        if (recipe.vegan) badges.push('Vegan');
        if (recipe.glutenFree) badges.push('Gluten-Free');
        if (recipe.dairyFree) badges.push('Dairy-Free');
        if (recipe.readyInMinutes && recipe.readyInMinutes <= 30) badges.push('Quick');

        badges.forEach(badgeText => {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = badgeText;
            badgesContainer.appendChild(badge);
        });
    }

    updateFavoriteButton(button, recipeId) {
        const isFavorite = this.utils.Favorites.isFavorite(recipeId);
        const heartIcon = button.querySelector('.heart-icon');
        
        if (heartIcon) {
            heartIcon.textContent = isFavorite ? '♥' : '♡';
            button.classList.toggle('favorited', isFavorite);
        }
    }

    // ===== ACTIONS =====
    toggleFavorite(recipe) {
        const isFavorite = this.utils.Favorites.isFavorite(recipe.id);
        
        if (isFavorite) {
            this.utils.Favorites.remove(recipe.id);
        } else {
            this.utils.Favorites.add(recipe);
        }

        // Update all favorite buttons for this recipe
        const favoriteButtons = document.querySelectorAll(`[data-recipe-id="${recipe.id}"] .favorite-btn`);
        favoriteButtons.forEach(button => {
            this.updateFavoriteButton(button, recipe.id);
        });
    }

    viewRecipe(recipeId) {
        // Store recipe ID and redirect
        sessionStorage.setItem('chefmate_current_recipe_id', recipeId);
        window.location.href = `recipe.html?id=${recipeId}`;
    }

    async showAITips(recipe) {
        const aiSuggestions = document.getElementById('aiSuggestions');
        const aiContent = document.getElementById('aiContent');
        
        if (!aiSuggestions || !aiContent) return;

        // Show AI section
        aiSuggestions.style.display = 'block';
        aiContent.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div><p>Getting AI cooking tips...</p>';

        try {
            const tips = await this.api.getAICookingTips(recipe, this.searchData.ingredients);
            this.displayAITips(tips);
        } catch (error) {
            console.error('Failed to get AI tips:', error);
            aiContent.innerHTML = '<p>Unable to get cooking tips at this time. Please try again later.</p>';
        }
    }

    displayAITips(tips) {
        const aiContent = document.getElementById('aiContent');
        if (!aiContent || !tips.tips) return;

        const tipsHTML = tips.tips.map(tip => `<li>${tip}</li>`).join('');
        aiContent.innerHTML = `
            <h4>Cooking Tips for Better Results:</h4>
            <ul class="ai-tips-list">${tipsHTML}</ul>
        `;
    }

    // ===== PAGINATION =====
    updateLoadMoreButton() {
        const loadMoreSection = document.getElementById('loadMoreSection');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (!loadMoreSection || !loadMoreBtn) return;

        const totalResults = this.filteredResults.length;
        const shownResults = this.currentPage * this.resultsPerPage;

        if (shownResults >= totalResults) {
            loadMoreSection.style.display = 'none';
        } else {
            loadMoreSection.style.display = 'block';
            const remainingResults = totalResults - shownResults;
            loadMoreBtn.textContent = `Load ${Math.min(remainingResults, this.resultsPerPage)} More Recipes`;
        }
    }

    loadMoreResults() {
        this.currentPage++;
        this.displayResults();
    }

    // ===== UI STATES =====
    showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const resultsGrid = document.getElementById('resultsGrid');
        
        if (loadingState) loadingState.style.display = 'block';
        if (resultsGrid) resultsGrid.style.display = 'none';
    }

    showNoResults() {
        const noResultsState = document.getElementById('noResultsState');
        const resultsGrid = document.getElementById('resultsGrid');
        
        if (noResultsState) noResultsState.style.display = 'block';
        if (resultsGrid) resultsGrid.style.display = 'none';
    }

    showError(message) {
        const errorState = document.getElementById('errorState');
        const errorMessage = document.getElementById('errorMessage');
        const resultsGrid = document.getElementById('resultsGrid');
        
        if (errorState) errorState.style.display = 'block';
        if (errorMessage) errorMessage.textContent = message;
        if (resultsGrid) resultsGrid.style.display = 'none';
    }

    redirectToHome() {
        window.location.href = 'index.html';
    }
}

// Retry search function (called from error state button)
function retrySearch() {
    if (window.chefMateSearch) {
        window.chefMateSearch.displayResults();
    }
}

// Initialize the search page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on the search page
    if (document.getElementById('resultsGrid')) {
        window.chefMateSearch = new ChefMateSearch();
    }
});

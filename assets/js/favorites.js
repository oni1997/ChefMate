/**
 * ChefMate Favorites Page JavaScript
 * Handles favorites page functionality and recipe management
 */

class ChefMateFavorites {
    constructor() {
        this.utils = window.ChefMateUtils;
        this.api = window.ChefMateAPI;
        this.favorites = [];
        this.filteredFavorites = [];
        this.currentView = 'grid';
        this.collections = [];
        
        this.init();
    }

    init() {
        this.loadFavorites();
        this.loadCollections();
        this.bindEvents();
        this.updateStats();
        this.displayFavorites();
    }

    // ===== DATA LOADING =====
    loadFavorites() {
        this.favorites = this.utils.Favorites.getAll();
        this.filteredFavorites = [...this.favorites];
    }

    loadCollections() {
        this.collections = this.utils.Storage.get('chefmate_collections', []);
    }

    // ===== EVENT BINDING =====
    bindEvents() {
        // Search favorites
        const searchInput = document.getElementById('searchFavorites');
        if (searchInput) {
            searchInput.addEventListener('input', this.utils.Utils.debounce((e) => {
                this.searchFavorites(e.target.value);
            }, 300));
        }

        // Filter by category
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterByCategory(e.target.value);
            });
        }

        // Sort favorites
        const sortSelect = document.getElementById('sortFavorites');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortFavorites(e.target.value);
            });
        }

        // View toggle
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toggleView(e.target.closest('.view-btn').dataset.view);
            });
        });

        // Create collection
        const createCollectionBtn = document.getElementById('createCollectionBtn');
        if (createCollectionBtn) {
            createCollectionBtn.addEventListener('click', () => {
                this.showCreateCollectionModal();
            });
        }

        // Modal events
        this.bindModalEvents();
    }

    bindModalEvents() {
        const modal = document.getElementById('createCollectionModal');
        const closeBtn = document.getElementById('closeCreateCollection');
        const cancelBtn = document.getElementById('cancelCreateCollection');
        const form = document.getElementById('createCollectionForm');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideCreateCollectionModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideCreateCollectionModal());
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createCollection();
            });
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideCreateCollectionModal();
                }
            });
        }
    }

    // ===== SEARCH AND FILTER =====
    searchFavorites(query) {
        if (!query.trim()) {
            this.filteredFavorites = [...this.favorites];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredFavorites = this.favorites.filter(recipe => 
                recipe.title.toLowerCase().includes(searchTerm) ||
                recipe.notes.toLowerCase().includes(searchTerm)
            );
        }
        this.displayFavorites();
    }

    filterByCategory(category) {
        if (!category) {
            this.filteredFavorites = [...this.favorites];
        } else {
            this.filteredFavorites = this.favorites.filter(recipe => 
                recipe.dishTypes && recipe.dishTypes.includes(category)
            );
        }
        this.displayFavorites();
    }

    sortFavorites(sortBy) {
        switch (sortBy) {
            case 'recent':
                this.filteredFavorites.sort((a, b) => 
                    new Date(b.dateAdded) - new Date(a.dateAdded)
                );
                break;
            case 'alphabetical':
                this.filteredFavorites.sort((a, b) => 
                    a.title.localeCompare(b.title)
                );
                break;
            case 'rating':
                this.filteredFavorites.sort((a, b) => 
                    (b.spoonacularScore || 0) - (a.spoonacularScore || 0)
                );
                break;
            case 'cookTime':
                this.filteredFavorites.sort((a, b) => 
                    (a.readyInMinutes || 999) - (b.readyInMinutes || 999)
                );
                break;
        }
        this.displayFavorites();
    }

    // ===== VIEW MANAGEMENT =====
    toggleView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        this.displayFavorites();
    }

    // ===== DISPLAY =====
    displayFavorites() {
        const emptyState = document.getElementById('emptyState');
        const gridContainer = document.getElementById('favoritesGrid');
        const listContainer = document.getElementById('favoritesList');

        if (this.filteredFavorites.length === 0) {
            emptyState.style.display = 'block';
            gridContainer.style.display = 'none';
            listContainer.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';

        if (this.currentView === 'grid') {
            gridContainer.style.display = 'grid';
            listContainer.style.display = 'none';
            this.renderGridView();
        } else {
            gridContainer.style.display = 'none';
            listContainer.style.display = 'block';
            this.renderListView();
        }
    }

    renderGridView() {
        const container = document.getElementById('favoritesGrid');
        const template = document.getElementById('favoriteCardTemplate');
        
        container.innerHTML = '';
        
        this.filteredFavorites.forEach(recipe => {
            const card = template.content.cloneNode(true);
            
            // Set recipe data
            card.querySelector('.favorite-card').dataset.recipeId = recipe.id;
            card.querySelector('.favorite-image').src = recipe.image || 'assets/images/recipe-placeholder.jpg';
            card.querySelector('.favorite-image').alt = recipe.title;
            card.querySelector('.favorite-title').textContent = recipe.title;
            card.querySelector('.time-text').textContent = this.utils.Utils.formatCookTime(recipe.readyInMinutes);
            card.querySelector('.stars').innerHTML = this.generateStars(recipe.spoonacularScore);
            card.querySelector('.notes-input').value = recipe.notes || '';
            card.querySelector('.date-value').textContent = this.formatDate(recipe.dateAdded);
            
            // Bind events
            this.bindCardEvents(card, recipe);
            
            container.appendChild(card);
        });
    }

    renderListView() {
        const container = document.getElementById('favoritesList');
        const template = document.getElementById('favoriteListTemplate');
        
        container.innerHTML = '';
        
        this.filteredFavorites.forEach(recipe => {
            const item = template.content.cloneNode(true);
            
            // Set recipe data
            item.querySelector('.favorite-list-item').dataset.recipeId = recipe.id;
            item.querySelector('.list-image').src = recipe.image || 'assets/images/recipe-placeholder.jpg';
            item.querySelector('.list-image').alt = recipe.title;
            item.querySelector('.list-item-title').textContent = recipe.title;
            item.querySelector('.list-time').textContent = this.utils.Utils.formatCookTime(recipe.readyInMinutes);
            item.querySelector('.list-rating').innerHTML = this.generateStars(recipe.spoonacularScore);
            item.querySelector('.list-difficulty').textContent = this.getDifficulty(recipe);
            item.querySelector('.notes-preview').textContent = recipe.notes || 'No notes added';
            
            // Bind events
            this.bindListItemEvents(item, recipe);
            
            container.appendChild(item);
        });
    }

    bindCardEvents(card, recipe) {
        // Remove favorite
        const removeBtn = card.querySelector('.remove-favorite-btn');
        removeBtn.addEventListener('click', () => this.removeFavorite(recipe.id));
        
        // View recipe
        const viewBtn = card.querySelector('.view-recipe-btn');
        viewBtn.addEventListener('click', () => this.viewRecipe(recipe.id));
        
        // Save notes
        const saveNotesBtn = card.querySelector('.save-notes-btn');
        const notesInput = card.querySelector('.notes-input');
        saveNotesBtn.addEventListener('click', () => this.saveNotes(recipe.id, notesInput.value));
    }

    bindListItemEvents(item, recipe) {
        // Remove favorite
        const removeBtn = item.querySelector('.remove-favorite-btn');
        removeBtn.addEventListener('click', () => this.removeFavorite(recipe.id));
        
        // View recipe
        const viewBtn = item.querySelector('.view-recipe-btn');
        viewBtn.addEventListener('click', () => this.viewRecipe(recipe.id));
        
        // Edit notes (placeholder for modal)
        const editNotesBtn = item.querySelector('.edit-notes-btn');
        editNotesBtn.addEventListener('click', () => this.editNotes(recipe.id));
    }

    // ===== ACTIONS =====
    removeFavorite(recipeId) {
        if (confirm('Remove this recipe from favorites?')) {
            this.utils.Favorites.remove(recipeId);
            this.loadFavorites();
            this.updateStats();
            this.displayFavorites();
        }
    }

    viewRecipe(recipeId) {
        window.location.href = `recipe.html?id=${recipeId}`;
    }

    saveNotes(recipeId, notes) {
        this.utils.Favorites.updateNotes(recipeId, notes);
        this.loadFavorites();
        window.chefMateMain?.showNotification('Notes saved!', 'success');
    }

    editNotes(recipeId) {
        // Placeholder for notes editing modal
        const recipe = this.favorites.find(r => r.id === recipeId);
        const newNotes = prompt('Edit notes:', recipe.notes || '');
        if (newNotes !== null) {
            this.saveNotes(recipeId, newNotes);
        }
    }

    // ===== COLLECTIONS =====
    showCreateCollectionModal() {
        document.getElementById('createCollectionModal').style.display = 'flex';
    }

    hideCreateCollectionModal() {
        document.getElementById('createCollectionModal').style.display = 'none';
        document.getElementById('createCollectionForm').reset();
    }

    createCollection() {
        const name = document.getElementById('collectionName').value.trim();
        const description = document.getElementById('collectionDescription').value.trim();
        
        if (!name) return;
        
        const collection = {
            id: Date.now().toString(),
            name,
            description,
            recipes: [],
            createdAt: new Date().toISOString()
        };
        
        this.collections.push(collection);
        this.utils.Storage.set('chefmate_collections', this.collections);
        this.hideCreateCollectionModal();
        this.updateStats();
        
        window.chefMateMain?.showNotification('Collection created!', 'success');
    }

    // ===== UTILITIES =====
    updateStats() {
        document.getElementById('totalFavorites').textContent = this.favorites.length;
        document.getElementById('totalNotes').textContent = 
            this.favorites.filter(r => r.notes && r.notes.trim()).length;
        document.getElementById('totalCollections').textContent = this.collections.length;
    }

    generateStars(score) {
        const rating = Math.round((score || 50) / 20);
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    }

    getDifficulty(recipe) {
        const time = recipe.readyInMinutes || 30;
        if (time <= 20) return 'Easy';
        if (time <= 45) return 'Medium';
        return 'Hard';
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('favoritesGrid')) {
        window.chefMateFavorites = new ChefMateFavorites();
    }
});

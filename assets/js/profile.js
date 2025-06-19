/**
 * ChefMate Profile Page JavaScript
 * Handles user preferences, activity tracking, and profile management
 */

class ChefMateProfile {
    constructor() {
        this.utils = window.ChefMateUtils;
        this.main = window.chefMateMain;
        this.preferences = this.main?.getUserPreferences() || {};
        this.activity = [];
        this.shoppingLists = [];
        this.timers = [];
        this.userAccount = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.updateDisplay();
        this.startTimerUpdates();
        this.loadUserAccount();
    }

    // ===== DATA LOADING =====
    loadData() {
        this.activity = this.utils.Storage.get('chefmate_activity', []);
        this.shoppingLists = this.utils.Storage.get('chefmate_shopping_lists', []);
        this.timers = this.utils.Storage.get('chefmate_timers', []);
        
        // Clean up expired timers
        this.cleanupTimers();
    }

    // ===== EVENT BINDING =====
    bindEvents() {
        // Edit preferences
        document.getElementById('editPreferencesBtn')?.addEventListener('click', () => {
            this.showPreferencesModal();
        });

        // Clear activity
        document.getElementById('clearActivityBtn')?.addEventListener('click', () => {
            this.clearActivity();
        });

        // Create shopping list
        document.getElementById('createListBtn')?.addEventListener('click', () => {
            this.createShoppingList();
        });

        // Add timer
        document.getElementById('addTimerBtn')?.addEventListener('click', () => {
            this.showTimerModal();
        });

        // Modal events
        this.bindModalEvents();
    }

    bindModalEvents() {
        // Preferences modal
        const preferencesModal = document.getElementById('editPreferencesModal');
        const closePreferencesBtn = document.getElementById('closePreferencesModal');
        const cancelPreferencesBtn = document.getElementById('cancelPreferences');
        const preferencesForm = document.getElementById('preferencesForm');

        closePreferencesBtn?.addEventListener('click', () => this.hidePreferencesModal());
        cancelPreferencesBtn?.addEventListener('click', () => this.hidePreferencesModal());
        preferencesForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePreferences();
        });

        // Timer modal
        const timerModal = document.getElementById('addTimerModal');
        const closeTimerBtn = document.getElementById('closeTimerModal');
        const cancelTimerBtn = document.getElementById('cancelTimer');
        const timerForm = document.getElementById('timerForm');

        closeTimerBtn?.addEventListener('click', () => this.hideTimerModal());
        cancelTimerBtn?.addEventListener('click', () => this.hideTimerModal());
        timerForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTimer();
        });

        // Close modals when clicking outside
        preferencesModal?.addEventListener('click', (e) => {
            if (e.target === preferencesModal) this.hidePreferencesModal();
        });
        timerModal?.addEventListener('click', (e) => {
            if (e.target === timerModal) this.hideTimerModal();
        });
    }

    // ===== DISPLAY UPDATES =====
    updateDisplay() {
        this.updateProfileInfo();
        this.updatePreferencesDisplay();
        this.updateActivityDisplay();
        this.updateShoppingListsDisplay();
        this.updateTimersDisplay();
    }

    updateProfileInfo() {
        const favorites = this.utils.Favorites.getAll();
        const recipesTried = this.utils.Storage.get('chefmate_recipes_tried', []);
        
        document.getElementById('totalFavorites').textContent = favorites.length;
        document.getElementById('totalRecipesTried').textContent = recipesTried.length;
        document.getElementById('cookingStreak').textContent = this.calculateCookingStreak();
    }

    updatePreferencesDisplay() {
        // Dietary restrictions
        const dietaryContainer = document.getElementById('dietaryRestrictions');
        if (dietaryContainer) {
            dietaryContainer.innerHTML = this.preferences.dietaryRestrictions?.length > 0 
                ? this.preferences.dietaryRestrictions.map(diet => 
                    `<span class="preference-tag">${diet}</span>`
                  ).join('')
                : '<span class="no-preferences">None selected</span>';
        }

        // Cuisine preferences
        const cuisineContainer = document.getElementById('cuisinePreferences');
        if (cuisineContainer) {
            cuisineContainer.innerHTML = this.preferences.cuisinePreferences?.length > 0
                ? this.preferences.cuisinePreferences.map(cuisine => 
                    `<span class="preference-tag">${cuisine}</span>`
                  ).join('')
                : '<span class="no-preferences">None selected</span>';
        }

        // Skill level
        const skillLevel = document.getElementById('skillLevel');
        if (skillLevel) {
            skillLevel.innerHTML = `<span class="skill-badge skill-${this.preferences.skillLevel}">${this.preferences.skillLevel || 'Beginner'}</span>`;
        }

        // Default settings
        document.getElementById('defaultServings').textContent = `${this.preferences.servingSize || 4} people`;
        document.getElementById('maxCookTime').textContent = `${this.preferences.cookingTime || 60} minutes`;
        document.getElementById('unitPreference').textContent = this.preferences.units || 'Metric';
    }

    updateActivityDisplay() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        if (this.activity.length === 0) {
            container.innerHTML = '<div class="no-activity">No recent activity</div>';
            return;
        }

        container.innerHTML = this.activity.slice(0, 10).map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${this.getActivityIcon(activity.type)}</div>
                <div class="activity-content">
                    <div class="activity-text">${activity.description}</div>
                    <div class="activity-time">${this.utils.Utils.formatDate(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    updateShoppingListsDisplay() {
        const container = document.getElementById('shoppingLists');
        if (!container) return;

        if (this.shoppingLists.length === 0) {
            container.innerHTML = '<div class="no-lists">No shopping lists created</div>';
            return;
        }

        container.innerHTML = this.shoppingLists.map(list => `
            <div class="shopping-list-item">
                <div class="list-header">
                    <h4>${list.name}</h4>
                    <span class="list-count">${list.items.length} items</span>
                </div>
                <div class="list-actions">
                    <button class="btn btn-small btn-secondary" onclick="window.chefMateProfile.viewShoppingList('${list.id}')">View</button>
                    <button class="btn btn-small btn-danger" onclick="window.chefMateProfile.deleteShoppingList('${list.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    updateTimersDisplay() {
        const container = document.getElementById('activeTimers');
        if (!container) return;

        const activeTimers = this.timers.filter(timer => timer.status === 'active');

        if (activeTimers.length === 0) {
            container.innerHTML = '<div class="no-timers">No active timers</div>';
            return;
        }

        container.innerHTML = activeTimers.map(timer => `
            <div class="timer-item" data-timer-id="${timer.id}">
                <div class="timer-info">
                    <h4>${timer.name}</h4>
                    <div class="timer-display" id="timer-${timer.id}">
                        ${this.formatTimeRemaining(timer)}
                    </div>
                </div>
                <div class="timer-actions">
                    <button class="btn btn-small btn-secondary" onclick="window.chefMateProfile.pauseTimer('${timer.id}')">
                        ${timer.paused ? 'Resume' : 'Pause'}
                    </button>
                    <button class="btn btn-small btn-danger" onclick="window.chefMateProfile.stopTimer('${timer.id}')">Stop</button>
                </div>
            </div>
        `).join('');
    }

    // ===== PREFERENCES MANAGEMENT =====
    showPreferencesModal() {
        // Populate form with current preferences
        this.populatePreferencesForm();
        document.getElementById('editPreferencesModal').style.display = 'flex';
    }

    hidePreferencesModal() {
        document.getElementById('editPreferencesModal').style.display = 'none';
    }

    populatePreferencesForm() {
        // Dietary restrictions
        const dietaryCheckboxes = document.querySelectorAll('#dietaryCheckboxes input[type="checkbox"]');
        dietaryCheckboxes.forEach(checkbox => {
            checkbox.checked = this.preferences.dietaryRestrictions?.includes(checkbox.value) || false;
        });

        // Cuisine preferences
        const cuisineCheckboxes = document.querySelectorAll('#cuisineCheckboxes input[type="checkbox"]');
        cuisineCheckboxes.forEach(checkbox => {
            checkbox.checked = this.preferences.cuisinePreferences?.includes(checkbox.value) || false;
        });

        // Other preferences
        document.getElementById('skillLevelSelect').value = this.preferences.skillLevel || 'beginner';
        document.getElementById('defaultServingsInput').value = this.preferences.servingSize || 4;
        document.getElementById('maxCookTimeInput').value = this.preferences.cookingTime || 60;
        document.getElementById('unitsSelect').value = this.preferences.units || 'metric';
    }

    savePreferences() {
        // Collect dietary restrictions
        const dietaryRestrictions = Array.from(
            document.querySelectorAll('#dietaryCheckboxes input[type="checkbox"]:checked')
        ).map(cb => cb.value);

        // Collect cuisine preferences
        const cuisinePreferences = Array.from(
            document.querySelectorAll('#cuisineCheckboxes input[type="checkbox"]:checked')
        ).map(cb => cb.value);

        // Collect other preferences
        const newPreferences = {
            dietaryRestrictions,
            cuisinePreferences,
            skillLevel: document.getElementById('skillLevelSelect').value,
            servingSize: parseInt(document.getElementById('defaultServingsInput').value),
            cookingTime: parseInt(document.getElementById('maxCookTimeInput').value),
            units: document.getElementById('unitsSelect').value
        };

        // Save preferences
        this.main?.saveUserPreferences(newPreferences);
        this.preferences = { ...this.preferences, ...newPreferences };
        
        // Update display
        this.updatePreferencesDisplay();
        this.hidePreferencesModal();
        
        // Add activity
        this.addActivity('preferences', 'Updated cooking preferences');
        
        window.chefMateMain?.showNotification('Preferences saved!', 'success');
    }

    // ===== ACTIVITY TRACKING =====
    addActivity(type, description) {
        const activity = {
            id: this.utils.Utils.generateId(),
            type,
            description,
            timestamp: new Date().toISOString()
        };

        this.activity.unshift(activity);
        
        // Keep only last 50 activities
        this.activity = this.activity.slice(0, 50);
        
        this.utils.Storage.set('chefmate_activity', this.activity);
        this.updateActivityDisplay();
    }

    clearActivity() {
        if (confirm('Clear all activity history?')) {
            this.activity = [];
            this.utils.Storage.remove('chefmate_activity');
            this.updateActivityDisplay();
            window.chefMateMain?.showNotification('Activity cleared!', 'success');
        }
    }

    getActivityIcon(type) {
        const icons = {
            recipe: '🍳',
            favorite: '❤️',
            search: '🔍',
            preferences: '⚙️',
            timer: '⏰',
            shopping: '🛒'
        };
        return icons[type] || '📝';
    }

    calculateCookingStreak() {
        // Simple streak calculation based on activity
        const recentDays = 7;
        const now = new Date();
        let streak = 0;
        
        for (let i = 0; i < recentDays; i++) {
            const checkDate = new Date(now);
            checkDate.setDate(checkDate.getDate() - i);
            
            const hasActivity = this.activity.some(activity => {
                const activityDate = new Date(activity.timestamp);
                return activityDate.toDateString() === checkDate.toDateString() &&
                       ['recipe', 'favorite', 'timer'].includes(activity.type);
            });
            
            if (hasActivity) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        
        return streak;
    }

    // ===== SHOPPING LISTS =====
    createShoppingList() {
        const name = prompt('Enter shopping list name:');
        if (!name) return;

        const list = {
            id: this.utils.Utils.generateId(),
            name: name.trim(),
            items: [],
            createdAt: new Date().toISOString()
        };

        this.shoppingLists.push(list);
        this.utils.Storage.set('chefmate_shopping_lists', this.shoppingLists);
        this.updateShoppingListsDisplay();
        this.addActivity('shopping', `Created shopping list: ${name}`);
        
        window.chefMateMain?.showNotification('Shopping list created!', 'success');
    }

    viewShoppingList(listId) {
        const list = this.shoppingLists.find(l => l.id === listId);
        if (!list) {
            window.chefMateMain?.showNotification('Shopping list not found!', 'error');
            return;
        }

        this.showShoppingListModal(list);
    }

    showShoppingListModal(list) {
        // Create modal HTML
        const modal = document.createElement('div');
        modal.className = 'modal shopping-list-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${list.name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="shopping-list-info">
                        <div class="list-stats">
                            <span class="stat-item">
                                <strong>${list.items.length}</strong> total items
                            </span>
                            <span class="stat-item">
                                <strong>${list.items.filter(item => item.checked).length}</strong> completed
                            </span>
                            <span class="stat-item">
                                Created: <strong>${new Date(list.createdAt).toLocaleDateString()}</strong>
                            </span>
                        </div>
                    </div>

                    <div class="shopping-list-items" id="shoppingListItems-${list.id}">
                        ${this.renderShoppingListItems(list)}
                    </div>

                    <div class="shopping-list-actions">
                        <button class="btn btn-primary" onclick="window.chefMateProfile.printShoppingList('${list.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6,9 6,2 18,2 18,9"/>
                                <path d="M6,18H4a2,2,0,0,1-2-2V11a2,2,0,0,1,2-2H20a2,2,0,0,1,2,2v5a2,2,0,0,1-2,2H18"/>
                                <polyline points="6,14 18,14 18,22 6,22 6,14"/>
                            </svg>
                            Print List
                        </button>
                        <button class="btn btn-secondary" onclick="window.chefMateProfile.shareShoppingList('${list.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            Share
                        </button>
                        <button class="btn btn-secondary" onclick="window.chefMateProfile.addItemToList('${list.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add Item
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    renderShoppingListItems(list) {
        if (list.items.length === 0) {
            return '<div class="no-items">No items in this shopping list</div>';
        }

        return list.items.map(item => `
            <div class="shopping-item ${item.checked ? 'checked' : ''}" data-item-id="${item.id}">
                <div class="item-checkbox">
                    <input type="checkbox"
                           id="item-${item.id}"
                           ${item.checked ? 'checked' : ''}
                           onchange="window.chefMateProfile.toggleShoppingItem('${list.id}', '${item.id}')">
                    <label for="item-${item.id}"></label>
                </div>
                <div class="item-content">
                    <span class="item-name">${item.name}</span>
                    <span class="item-amount">${item.amount} ${item.unit || ''}</span>
                </div>
                <button class="item-remove" onclick="window.chefMateProfile.removeShoppingItem('${list.id}', '${item.id}')" title="Remove item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    deleteShoppingList(listId) {
        if (confirm('Delete this shopping list?')) {
            this.shoppingLists = this.shoppingLists.filter(list => list.id !== listId);
            this.utils.Storage.set('chefmate_shopping_lists', this.shoppingLists);
            this.updateShoppingListsDisplay();
            window.chefMateMain?.showNotification('Shopping list deleted!', 'success');
        }
    }

    toggleShoppingItem(listId, itemId) {
        const list = this.shoppingLists.find(l => l.id === listId);
        if (!list) return;

        const item = list.items.find(i => i.id === itemId);
        if (!item) return;

        item.checked = !item.checked;

        // Update storage
        this.utils.Storage.set('chefmate_shopping_lists', this.shoppingLists);

        // Update visual state
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemElement) {
            itemElement.classList.toggle('checked', item.checked);
        }

        // Update stats
        this.updateShoppingListStats(listId);
    }

    removeShoppingItem(listId, itemId) {
        const list = this.shoppingLists.find(l => l.id === listId);
        if (!list) return;

        list.items = list.items.filter(item => item.id !== itemId);

        // Update storage
        this.utils.Storage.set('chefmate_shopping_lists', this.shoppingLists);

        // Remove from DOM
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemElement) {
            itemElement.remove();
        }

        // Update stats and main display
        this.updateShoppingListStats(listId);
        this.updateShoppingListsDisplay();

        window.chefMateMain?.showNotification('Item removed!', 'success');
    }

    addItemToList(listId) {
        const itemName = prompt('Enter item name:');
        if (!itemName) return;

        const itemAmount = prompt('Enter amount (optional):') || '';

        const list = this.shoppingLists.find(l => l.id === listId);
        if (!list) return;

        const newItem = {
            id: this.utils.Utils.generateId(),
            name: itemName.trim(),
            amount: itemAmount.trim(),
            unit: '',
            checked: false
        };

        list.items.push(newItem);

        // Update storage
        this.utils.Storage.set('chefmate_shopping_lists', this.shoppingLists);

        // Update modal display
        const itemsContainer = document.getElementById(`shoppingListItems-${listId}`);
        if (itemsContainer) {
            itemsContainer.innerHTML = this.renderShoppingListItems(list);
        }

        // Update stats and main display
        this.updateShoppingListStats(listId);
        this.updateShoppingListsDisplay();

        window.chefMateMain?.showNotification('Item added!', 'success');
    }

    updateShoppingListStats(listId) {
        const list = this.shoppingLists.find(l => l.id === listId);
        if (!list) return;

        const modal = document.querySelector('.shopping-list-modal');
        if (!modal) return;

        const statsContainer = modal.querySelector('.list-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <span class="stat-item">
                    <strong>${list.items.length}</strong> total items
                </span>
                <span class="stat-item">
                    <strong>${list.items.filter(item => item.checked).length}</strong> completed
                </span>
                <span class="stat-item">
                    Created: <strong>${new Date(list.createdAt).toLocaleDateString()}</strong>
                </span>
            `;
        }
    }

    printShoppingList(listId) {
        const list = this.shoppingLists.find(l => l.id === listId);
        if (!list) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${list.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #4caf50; border-bottom: 2px solid #4caf50; padding-bottom: 10px; }
                    .item { padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
                    .item:last-child { border-bottom: none; }
                    .checked { text-decoration: line-through; opacity: 0.6; }
                    .amount { color: #666; font-size: 0.9em; }
                    .stats { margin-bottom: 20px; color: #666; }
                </style>
            </head>
            <body>
                <h1>${list.name}</h1>
                <div class="stats">
                    Created: ${new Date(list.createdAt).toLocaleDateString()} |
                    ${list.items.length} items |
                    ${list.items.filter(item => item.checked).length} completed
                </div>
                ${list.items.map(item => `
                    <div class="item ${item.checked ? 'checked' : ''}">
                        <span>${item.name}</span>
                        <span class="amount">${item.amount} ${item.unit || ''}</span>
                    </div>
                `).join('')}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    shareShoppingList(listId) {
        const list = this.shoppingLists.find(l => l.id === listId);
        if (!list) return;

        const shareText = `${list.name}\n\n${list.items.map(item =>
            `${item.checked ? '✓' : '○'} ${item.name} ${item.amount} ${item.unit || ''}`
        ).join('\n')}`;

        if (navigator.share) {
            navigator.share({
                title: list.name,
                text: shareText
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                window.chefMateMain?.showNotification('Shopping list copied to clipboard!', 'success');
            }).catch(() => {
                // Fallback: show in alert
                alert(shareText);
            });
        }
    }

    // ===== TIMERS =====
    showTimerModal() {
        document.getElementById('addTimerModal').style.display = 'flex';
    }

    hideTimerModal() {
        document.getElementById('addTimerModal').style.display = 'none';
        document.getElementById('timerForm').reset();
    }

    addTimer() {
        const name = document.getElementById('timerName').value.trim();
        const minutes = parseInt(document.getElementById('timerMinutes').value);

        if (!name || !minutes) return;

        const timer = {
            id: this.utils.Utils.generateId(),
            name,
            duration: minutes * 60, // Convert to seconds
            remaining: minutes * 60,
            startTime: Date.now(),
            status: 'active',
            paused: false
        };

        this.timers.push(timer);
        this.utils.Storage.set('chefmate_timers', this.timers);
        this.updateTimersDisplay();
        this.hideTimerModal();
        this.addActivity('timer', `Started timer: ${name} (${minutes}m)`);
        
        window.chefMateMain?.showNotification(`Timer started: ${name}`, 'success');
    }

    pauseTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;

        timer.paused = !timer.paused;
        if (timer.paused) {
            timer.pausedAt = Date.now();
        } else {
            timer.startTime += Date.now() - timer.pausedAt;
            delete timer.pausedAt;
        }

        this.utils.Storage.set('chefmate_timers', this.timers);
        this.updateTimersDisplay();
    }

    stopTimer(timerId) {
        this.timers = this.timers.filter(t => t.id !== timerId);
        this.utils.Storage.set('chefmate_timers', this.timers);
        this.updateTimersDisplay();
        window.chefMateMain?.showNotification('Timer stopped', 'info');
    }

    cleanupTimers() {
        const now = Date.now();
        this.timers = this.timers.filter(timer => {
            if (timer.status !== 'active') return false;
            
            const elapsed = timer.paused 
                ? timer.pausedAt - timer.startTime 
                : now - timer.startTime;
            
            return elapsed < timer.duration * 1000;
        });
        this.utils.Storage.set('chefmate_timers', this.timers);
    }

    formatTimeRemaining(timer) {
        const now = Date.now();
        const elapsed = timer.paused 
            ? timer.pausedAt - timer.startTime 
            : now - timer.startTime;
        
        const remaining = Math.max(0, timer.duration * 1000 - elapsed);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    startTimerUpdates() {
        setInterval(() => {
            this.updateTimersDisplay();
            
            // Check for completed timers
            this.timers.forEach(timer => {
                if (timer.status === 'active' && !timer.paused) {
                    const elapsed = Date.now() - timer.startTime;
                    if (elapsed >= timer.duration * 1000) {
                        timer.status = 'completed';
                        window.chefMateMain?.showNotification(`Timer completed: ${timer.name}`, 'success');
                        
                        // Play notification sound if available
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('ChefMate Timer', {
                                body: `${timer.name} is done!`,
                                icon: '/favicon.svg'
                            });
                        }
                    }
                }
            });
            
            this.cleanupTimers();
        }, 1000);
    }

    // ===== USER ACCOUNT SYSTEM =====
    loadUserAccount() {
        this.userAccount = this.utils.Storage.get('chefmate_user_account', null);
        this.updateAccountDisplay();
    }

    createUserAccount() {
        const username = document.getElementById('usernameInput')?.value || prompt('Enter a username:');
        if (!username) return;
        
        this.userAccount = {
            username,
            created: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        this.utils.Storage.set('chefmate_user_account', this.userAccount);
        this.updateAccountDisplay();
        this.addActivity('account', 'Created user account');
        window.chefMateMain?.showNotification('Account created!', 'success');
    }

    updateAccountDisplay() {
        const accountSection = document.getElementById('accountSection');
        if (!accountSection) return;
        
        if (this.userAccount) {
            accountSection.innerHTML = `
                <div class="account-info">
                    <h3>Welcome, ${this.userAccount.username}!</h3>
                    <p>Account created: ${this.formatDate(this.userAccount.created)}</p>
                    <button id="logoutBtn" class="btn btn-outline">Logout</button>
                </div>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        } else {
            accountSection.innerHTML = `
                <div class="account-create">
                    <h3>Create Account</h3>
                    <div class="form-group">
                        <input type="text" id="usernameInput" placeholder="Username">
                        <button id="createAccountBtn" class="btn btn-primary">Create Account</button>
                    </div>
                </div>
            `;
            document.getElementById('createAccountBtn').addEventListener('click', () => this.createUserAccount());
        }
    }

    logout() {
        if (confirm('Are you sure you want to logout? Your data will still be saved.')) {
            this.userAccount = null;
            this.utils.Storage.set('chefmate_user_account', null);
            this.updateAccountDisplay();
            window.chefMateMain?.showNotification('Logged out successfully', 'info');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('profileName')) {
        window.chefMateProfile = new ChefMateProfile();
    }
});

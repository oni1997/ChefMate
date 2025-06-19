/**
 * ChefMate API Integration Module
 * Handles all API calls to Spoonacular and Gemini APIs
 */

class ChefMateAPI {
    constructor() {
        // Always try serverless functions first (works with .env files locally and in production)
        this.spoonacularBaseURL = '/api/spoonacular';
        this.geminiBaseURL = '/api/gemini';
        this.useServerlessAPI = true;
        this.serverlessFunctionsAvailable = null; // Will be determined on first API call

        // Fallback configuration for direct API calls
        this.directSpoonacularBaseURL = 'https://api.spoonacular.com';
        this.directGeminiBaseURL = 'https://generativelanguage.googleapis.com/v1beta';

        // Initialize API keys (will be loaded when needed for direct calls)
        this.spoonacularApiKey = null;
        this.spoonacularApiKeys = []; // Array to hold multiple API keys
        this.currentSpoonacularKeyIndex = 0;
        this.geminiApiKey = null;

        // Initialize API keys from localStorage
        this.initializeApiKeys();

        // Request configuration
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };

        // Rate limiting (only for direct API calls)
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.maxRequestsPerMinute = 150;
        this.requestTimestamps = [];
    }

    // ===== API KEY INITIALIZATION =====
    initializeApiKeys() {
        // Load primary Spoonacular API key
        const primaryKey = localStorage.getItem('chefmate_spoonacular_key');
        if (primaryKey) {
            this.spoonacularApiKeys.push(primaryKey);
        }

        // Load backup Spoonacular API key
        const backupKey = localStorage.getItem('chefmate_spoonacular_key_2');
        if (backupKey) {
            this.spoonacularApiKeys.push(backupKey);
        }

        // Set current key to the first available
        if (this.spoonacularApiKeys.length > 0) {
            this.spoonacularApiKey = this.spoonacularApiKeys[0];
            this.currentSpoonacularKeyIndex = 0;
        }

        // Load Gemini API key
        this.geminiApiKey = localStorage.getItem('chefmate_gemini_key');
    }

    // ===== API KEY MANAGEMENT =====
    getApiKey(service) {
        const key = localStorage.getItem(`chefmate_${service}_key`);
        if (!key) {
            throw new Error(`${service} API key not configured. Please set up your API keys first.`);
        }
        return key;
    }

    hasApiKey(service) {
        const key = localStorage.getItem(`chefmate_${service}_key`);
        return key && key.trim() !== '';
    }

    validateApiKey(service, key) {
        if (!key || key.trim() === '') {
            return { valid: false, error: 'API key cannot be empty' };
        }

        // Basic format validation
        if (service === 'spoonacular') {
            // Spoonacular keys are typically 32 character hex strings
            if (!/^[a-f0-9]{32}$/i.test(key)) {
                return { valid: false, error: 'Invalid Spoonacular API key format. Should be 32 character hex string.' };
            }
        } else if (service === 'gemini') {
            // Gemini keys start with AIzaSy and are about 39 characters
            if (!/^AIzaSy[A-Za-z0-9_-]{33}$/.test(key)) {
                return { valid: false, error: 'Invalid Gemini API key format. Should start with "AIzaSy" and be 39 characters long.' };
            }
        }

        return { valid: true };
    }

    setApiKey(service, key) {
        const validation = this.validateApiKey(service, key);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        localStorage.setItem(`chefmate_${service}_key`, key);
        if (service === 'spoonacular') {
            this.spoonacularApiKey = key;
        } else if (service === 'gemini') {
            this.geminiApiKey = key;
        }
    }

    removeApiKey(service) {
        localStorage.removeItem(`chefmate_${service}_key`);
        if (service === 'spoonacular') {
            this.spoonacularApiKey = null;
            this.spoonacularApiKeys = [];
            this.currentSpoonacularKeyIndex = 0;
        } else if (service === 'gemini') {
            this.geminiApiKey = null;
        }
    }

    /**
     * Switch to the next available Spoonacular API key when quota is reached
     * @returns {boolean} True if switched to a new key, false if no more keys available
     */
    switchToNextSpoonacularKey() {
        if (this.currentSpoonacularKeyIndex < this.spoonacularApiKeys.length - 1) {
            this.currentSpoonacularKeyIndex++;
            this.spoonacularApiKey = this.spoonacularApiKeys[this.currentSpoonacularKeyIndex];
            // Switched to backup Spoonacular API key
            return true;
        }

        console.warn('⚠️ All Spoonacular API keys have reached their quota');
        return false;
    }

    /**
     * Check if an error indicates quota exceeded
     * @param {Error} error - The error to check
     * @returns {boolean} True if error indicates quota exceeded
     */
    isQuotaExceededError(error) {
        const errorMessage = error.message.toLowerCase();
        return errorMessage.includes('daily points limit') ||
               errorMessage.includes('quota') ||
               errorMessage.includes('402') ||
               error.status === 402;
    }

    /**
     * Test if serverless functions are available
     * @returns {Promise<boolean>} True if serverless functions work
     */
    async testServerlessFunctions() {
        if (this.serverlessFunctionsAvailable !== null) {
            return this.serverlessFunctionsAvailable;
        }

        try {
            // Test with a simple request to the spoonacular endpoint
            const response = await fetch('/api/spoonacular?endpoint=/recipes/random&number=1', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            this.serverlessFunctionsAvailable = response.ok || response.status !== 404;
            return this.serverlessFunctionsAvailable;
        } catch (error) {
            this.serverlessFunctionsAvailable = false;
            return false;
        }
    }

    /**
     * Switch to direct API calls if serverless functions aren't available
     */
    switchToDirectAPICalls() {
        this.useServerlessAPI = false;
        this.spoonacularBaseURL = this.directSpoonacularBaseURL;
        this.geminiBaseURL = this.directGeminiBaseURL;
    }

    checkApiKeysSetup() {
        if (this.useServerlessAPI && this.serverlessFunctionsAvailable !== false) {
            return { ready: true, message: 'Using serverless API - no keys needed' };
        }

        const hasSpoonacular = this.hasApiKey('spoonacular');
        const hasGemini = this.hasApiKey('gemini');

        if (!hasSpoonacular) {
            return {
                ready: false,
                message: 'Spoonacular API key is required for local development',
                missingKeys: ['spoonacular']
            };
        }

        return {
            ready: true,
            message: 'API keys configured',
            hasGemini: hasGemini
        };
    }

    // ===== RATE LIMITING =====
    canMakeRequest() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Remove timestamps older than 1 minute
        this.requestTimestamps = this.requestTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
        
        return this.requestTimestamps.length < this.maxRequestsPerMinute;
    }

    addRequestTimestamp() {
        this.requestTimestamps.push(Date.now());
    }

    // ===== HTTP REQUEST HELPER =====
    async makeRequest(url, options = {}) {
        try {
            // Check rate limiting only for direct API calls
            if (!this.useServerlessAPI && !this.canMakeRequest()) {
                throw new Error('Rate limit exceeded. Please wait a moment before making another request.');
            }

            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.defaultHeaders,
                    ...options.headers
                }
            });

            // Add timestamp only for direct API calls
            if (!this.useServerlessAPI) {
                this.addRequestTimestamp();
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
                error.status = response.status;
                throw error;
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);

            // Check if this is a quota exceeded error for Spoonacular API
            if (this.isQuotaExceededError(error) && url.includes('spoonacular.com') && !this.useServerlessAPI) {
                if (this.switchToNextSpoonacularKey()) {
                    // Retry the request with the new API key
                    const newUrl = url.replace(/apiKey=[^&]+/, `apiKey=${this.spoonacularApiKey}`);
                    return this.makeRequest(newUrl, options);
                }
            }

            throw error;
        }
    }

    // ===== SPOONACULAR API METHODS =====

    /**
     * Search recipes by ingredients
     * @param {Array} ingredients - Array of ingredient names
     * @param {Object} options - Search options (diet, maxTime, etc.)
     * @returns {Promise} Recipe search results
     */
    async searchRecipesByIngredients(ingredients, options = {}) {
        if (!ingredients || ingredients.length === 0) {
            throw new Error('At least one ingredient is required');
        }

        // Test serverless functions on first API call
        if (this.useServerlessAPI && this.serverlessFunctionsAvailable === null) {
            const serverlessAvailable = await this.testServerlessFunctions();
            if (!serverlessAvailable) {
                this.switchToDirectAPICalls();
            }
        }

        let url, params;

        if (this.useServerlessAPI && this.serverlessFunctionsAvailable !== false) {
            // Use serverless function
            params = new URLSearchParams({
                endpoint: '/recipes/findByIngredients',
                ingredients: ingredients.join(','),
                number: options.number || 12,
                ranking: options.ranking || 1,
                ignorePantry: options.ignorePantry || true
            });

            // Add optional parameters
            if (options.diet) params.append('diet', options.diet);
            if (options.intolerances) params.append('intolerances', options.intolerances);

            url = `${this.spoonacularBaseURL}?${params}`;
        } else {
            // Use direct API call - ensure we have API key
            if (!this.spoonacularApiKey) {
                this.spoonacularApiKey = this.getApiKey('spoonacular');
            }

            params = new URLSearchParams({
                apiKey: this.spoonacularApiKey,
                ingredients: ingredients.join(','),
                number: options.number || 12,
                ranking: options.ranking || 1,
                ignorePantry: options.ignorePantry || true
            });

            if (options.diet) params.append('diet', options.diet);
            if (options.intolerances) params.append('intolerances', options.intolerances);

            url = `${this.spoonacularBaseURL}/recipes/findByIngredients?${params}`;
        }

        let results;
        try {
            results = await this.makeRequest(url);
        } catch (error) {
            // If serverless function fails, try direct API call as fallback
            if (this.useServerlessAPI && this.serverlessFunctionsAvailable !== false) {
                this.switchToDirectAPICalls();
                return this.searchRecipesByIngredients(ingredients, options);
            }
            throw error;
        }

        // Get additional recipe information for each result
        const enrichedResults = await Promise.all(
            results.map(async (recipe) => {
                try {
                    const detailedInfo = await this.getRecipeInformation(recipe.id);
                    return {
                        ...recipe,
                        ...detailedInfo,
                        missingIngredientCount: recipe.missedIngredientCount || 0,
                        usedIngredientCount: recipe.usedIngredientCount || 0
                    };
                } catch (error) {
                    console.warn(`Failed to get details for recipe ${recipe.id}:`, error);
                    return recipe;
                }
            })
        );

        return enrichedResults;
    }

    /**
     * Get detailed recipe information
     * @param {number} recipeId - Recipe ID
     * @returns {Promise} Detailed recipe information
     */
    async getRecipeInformation(recipeId) {
        let url;

        if (this.useServerlessAPI) {
            // Use Vercel serverless function
            const params = new URLSearchParams({
                endpoint: `/recipes/${recipeId}/information`,
                includeNutrition: true
            });
            url = `${this.spoonacularBaseURL}?${params}`;
        } else {
            // Use direct API call - ensure we have API key
            if (!this.spoonacularApiKey) {
                this.spoonacularApiKey = this.getApiKey('spoonacular');
            }

            const params = new URLSearchParams({
                apiKey: this.spoonacularApiKey,
                includeNutrition: true,
                addRecipeInformation: true,
                fillIngredients: true
            });
            url = `${this.spoonacularBaseURL}/recipes/${recipeId}/information?${params}`;
        }

        const recipe = await this.makeRequest(url);

        // If instructions are missing, try to get them separately
        if (!recipe.analyzedInstructions || recipe.analyzedInstructions.length === 0) {
            try {
                const instructions = await this.getRecipeInstructions(recipeId);
                if (instructions && instructions.length > 0) {
                    recipe.analyzedInstructions = instructions;
                }
            } catch (error) {
                console.warn('Failed to get separate instructions:', error);
            }
        }

        return recipe;
    }

    /**
     * Get detailed recipe information (alias for getRecipeInformation)
     * @param {number} recipeId - Recipe ID
     * @returns {Promise} Detailed recipe information
     */
    async getRecipeDetails(recipeId) {
        return this.getRecipeInformation(recipeId);
    }

    /**
     * Get recipe instructions
     * @param {number} recipeId - Recipe ID
     * @returns {Promise} Recipe instructions
     */
    async getRecipeInstructions(recipeId) {
        if (this.useServerlessAPI) {
            // Use Vercel serverless function
            const params = new URLSearchParams({
                endpoint: `/recipes/${recipeId}/analyzedInstructions`
            });
            const url = `${this.spoonacularBaseURL}?${params}`;
            return await this.makeRequest(url);
        } else {
            // Use direct API call - ensure we have API key
            if (!this.spoonacularApiKey) {
                this.spoonacularApiKey = this.getApiKey('spoonacular');
            }

            const params = new URLSearchParams({
                apiKey: this.spoonacularApiKey
            });
            const url = `${this.spoonacularBaseURL}/recipes/${recipeId}/analyzedInstructions?${params}`;
            return await this.makeRequest(url);
        }
    }

    /**
     * Get detailed nutrition information for a recipe
     * @param {number} recipeId - Recipe ID
     * @returns {Promise} Detailed nutrition widget data
     */
    async getRecipeNutritionWidget(recipeId) {
        if (this.useServerlessAPI) {
            // Use Vercel serverless function
            const params = new URLSearchParams({
                endpoint: `/recipes/${recipeId}/nutritionWidget.json`
            });
            const url = `${this.spoonacularBaseURL}?${params}`;
            return await this.makeRequest(url);
        } else {
            // Use direct API call - ensure we have API key
            if (!this.spoonacularApiKey) {
                this.spoonacularApiKey = this.getApiKey('spoonacular');
            }

            const params = new URLSearchParams({
                apiKey: this.spoonacularApiKey
            });
            const url = `${this.spoonacularBaseURL}/recipes/${recipeId}/nutritionWidget.json?${params}`;
            return await this.makeRequest(url);
        }
    }

    /**
     * Search recipes with complex query
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise} Recipe search results
     */
    async searchRecipes(query, options = {}) {
        // Ensure we have API key for direct calls
        if (!this.useServerlessAPI && !this.spoonacularApiKey) {
            this.spoonacularApiKey = this.getApiKey('spoonacular');
        }

        const params = new URLSearchParams({
            apiKey: this.spoonacularApiKey,
            query: query,
            number: options.number || 12,
            offset: options.offset || 0,
            addRecipeInformation: true,
            fillIngredients: true
        });

        // Add optional filters
        if (options.diet) params.append('diet', options.diet);
        if (options.intolerances) params.append('intolerances', options.intolerances);
        if (options.maxReadyTime) params.append('maxReadyTime', options.maxReadyTime);
        if (options.minCalories) params.append('minCalories', options.minCalories);
        if (options.maxCalories) params.append('maxCalories', options.maxCalories);
        if (options.sort) params.append('sort', options.sort);

        const url = `${this.spoonacularBaseURL}/recipes/complexSearch?${params}`;
        const response = await this.makeRequest(url);
        
        return response.results || [];
    }

    /**
     * Get random recipes
     * @param {Object} options - Options for random recipes
     * @returns {Promise} Random recipes
     */
    async getRandomRecipes(options = {}) {
        // Ensure we have API key for direct calls
        if (!this.useServerlessAPI && !this.spoonacularApiKey) {
            this.spoonacularApiKey = this.getApiKey('spoonacular');
        }

        const params = new URLSearchParams({
            apiKey: this.spoonacularApiKey,
            number: options.number || 6
        });

        if (options.tags) params.append('tags', options.tags);

        const url = `${this.spoonacularBaseURL}/recipes/random?${params}`;
        const response = await this.makeRequest(url);
        
        return response.recipes || [];
    }

    // ===== GEMINI AI METHODS =====

    /**
     * Get AI cooking tips for a recipe
     * @param {Object} recipe - Recipe object
     * @param {Array} userIngredients - User's available ingredients
     * @returns {Promise} AI cooking tips
     */
    async getAICookingTips(recipe, userIngredients = []) {
        const prompt = this.buildCookingTipsPrompt(recipe, userIngredients);

        try {
            if (this.useServerlessAPI) {
                // Use Vercel serverless function
                const response = await this.makeRequest(this.geminiBaseURL, {
                    method: 'POST',
                    body: JSON.stringify({ prompt })
                });
                return response;
            } else {
                // Use direct API call
                const response = await this.callGeminiAPI(prompt);
                return this.parseAIResponse(response);
            }
        } catch (error) {
            console.warn('AI API failed, using mock data:', error);
            return this.getMockAITips(recipe);
        }
    }

    /**
     * Search for a recipe using AI when the original recipe is not found
     * @param {string} recipeId - Original recipe ID that wasn't found
     * @param {string} recipeName - Optional recipe name hint
     * @returns {Promise} AI-generated recipe
     */
    async searchRecipeWithAI(recipeId, recipeName = null) {
        const prompt = this.buildRecipeSearchPrompt(recipeId, recipeName);

        try {
            if (this.useServerlessAPI) {
                // Use Vercel serverless function for AI recipe search
                const response = await this.makeRequest('/api/gemini-search', {
                    method: 'POST',
                    body: JSON.stringify({
                        prompt,
                        recipeId,
                        recipeName
                    })
                });
                return response;
            } else {
                // Use direct API call
                const response = await this.callGeminiAPI(prompt);
                return this.parseAIRecipeResponse(response);
            }
        } catch (error) {
            console.warn('AI recipe search failed:', error);
            throw new Error('Unable to generate recipe with AI. Please try searching manually.');
        }
    }

    /**
     * Build prompt for cooking tips
     * @param {Object} recipe - Recipe object
     * @param {Array} userIngredients - User's available ingredients
     * @returns {string} Formatted prompt
     */
    buildCookingTipsPrompt(recipe, userIngredients) {
        return `As an expert chef, provide 3-5 practical cooking tips for this recipe:

Recipe: ${recipe.title}
Cooking Time: ${recipe.readyInMinutes} minutes
Difficulty: ${recipe.difficulty || 'Medium'}

Ingredients needed: ${recipe.extendedIngredients?.map(ing => ing.name).join(', ') || 'Various ingredients'}
User has: ${userIngredients.join(', ') || 'Not specified'}

Please provide:
1. Key cooking techniques for best results
2. Common mistakes to avoid
3. Ingredient substitution suggestions if applicable
4. Timing and preparation tips
5. Presentation or serving suggestions

Keep tips practical, concise, and beginner-friendly. Format as a JSON object with a 'tips' array.`;
    }

    /**
     * Build prompt for AI recipe search
     * @param {string} recipeId - Original recipe ID
     * @param {string} recipeName - Optional recipe name hint
     * @returns {string} Formatted prompt
     */
    buildRecipeSearchPrompt(recipeId, recipeName) {
        const searchHint = recipeName ? `The recipe might be called "${recipeName}" or something similar.` : '';

        return `I'm looking for a recipe with ID ${recipeId} that wasn't found in the database. ${searchHint}

Please help me by:
1. Suggesting what this recipe might be based on the ID or name
2. Providing a complete recipe with ingredients and step-by-step instructions
3. Including cooking tips and estimated cooking time

Please format your response as a JSON object with this structure:
{
    "title": "Recipe Name",
    "description": "Brief description of the dish",
    "cookTime": "30 minutes",
    "servings": 4,
    "difficulty": "Easy/Medium/Hard",
    "ingredients": [
        "1 cup flour",
        "2 eggs",
        "etc..."
    ],
    "instructions": [
        "Step 1: Do this...",
        "Step 2: Do that...",
        "etc..."
    ],
    "tips": [
        "Helpful cooking tip 1",
        "Helpful cooking tip 2",
        "etc..."
    ],
    "source": "AI Generated Recipe"
}

Make the recipe practical, delicious, and easy to follow. Include specific measurements and clear instructions.`;
    }

    /**
     * Call Gemini API
     * @param {string} prompt - The prompt to send
     * @returns {Promise} API response
     */
    async callGeminiAPI(prompt) {
        // Ensure we have API key for direct calls
        if (!this.geminiApiKey) {
            this.geminiApiKey = this.getApiKey('gemini');
        }

        const url = `${this.geminiBaseURL}/models/gemini-pro:generateContent?key=${this.geminiApiKey}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024
            }
        };

        return await this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });
    }

    /**
     * Parse AI response
     * @param {Object} response - Raw API response
     * @returns {Object} Parsed tips
     */
    parseAIResponse(response) {
        try {
            const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!content) throw new Error('No content in response');

            // Try to parse as JSON first
            try {
                return JSON.parse(content);
            } catch {
                // If not JSON, parse as plain text
                const tips = content.split('\n')
                    .filter(line => line.trim())
                    .map(line => line.replace(/^\d+\.\s*/, '').trim())
                    .filter(tip => tip.length > 10);

                return { tips };
            }
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return { tips: ['Unable to generate cooking tips at this time.'] };
        }
    }

    /**
     * Get mock AI tips (fallback when API is unavailable)
     * @param {Object} recipe - Recipe object
     * @returns {Object} Mock tips
     */
    getMockAITips(recipe) {
        const mockTips = [
            "Read through the entire recipe before starting to ensure you have all ingredients and understand the steps.",
            "Prep all your ingredients (mise en place) before you start cooking to make the process smoother.",
            "Taste as you go and adjust seasonings according to your preference.",
            "Don't overcrowd the pan when cooking - this can lead to steaming instead of proper browning.",
            "Let meat rest for a few minutes after cooking to allow juices to redistribute for better flavor."
        ];

        // Add recipe-specific tips based on cooking time
        if (recipe.readyInMinutes && recipe.readyInMinutes > 60) {
            mockTips.push("This is a longer recipe - consider preparing some components ahead of time.");
        }

        if (recipe.vegetarian) {
            mockTips.push("For extra flavor in vegetarian dishes, don't forget to season vegetables well and consider adding umami-rich ingredients.");
        }

        return { tips: mockTips.slice(0, 4) };
    }



    // ===== ERROR HANDLING =====
    handleAPIError(error, context = '') {
        console.error(`API Error ${context}:`, error);
        
        if (error.message.includes('Rate limit')) {
            return {
                error: true,
                message: 'Too many requests. Please wait a moment and try again.',
                type: 'rate_limit'
            };
        } else if (error.message.includes('API key')) {
            return {
                error: true,
                message: 'API configuration error. Please check your settings.',
                type: 'auth_error'
            };
        } else if (error.message.includes('Network')) {
            return {
                error: true,
                message: 'Network error. Please check your connection and try again.',
                type: 'network_error'
            };
        } else {
            return {
                error: true,
                message: 'Something went wrong. Please try again.',
                type: 'unknown_error'
            };
        }
    }

    /**
     * Parse AI recipe response
     * @param {Object} response - Raw AI response
     * @returns {Object} Parsed recipe
     */
    parseAIRecipeResponse(response) {
        try {
            const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!content) {
                throw new Error('No content in AI response');
            }

            // Try to parse as JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const recipe = JSON.parse(jsonMatch[0]);

                // Ensure required fields exist and format for compatibility
                return {
                    id: 'ai-generated',
                    title: recipe.title || 'AI Generated Recipe',
                    summary: recipe.description || 'A delicious recipe generated by AI',
                    readyInMinutes: this.parseTimeToMinutes(recipe.cookTime) || 30,
                    servings: recipe.servings || 4,
                    difficulty: recipe.difficulty || 'Medium',
                    extendedIngredients: this.formatAIIngredients(recipe.ingredients || []),
                    analyzedInstructions: this.formatAIInstructions(recipe.instructions || []),
                    tips: recipe.tips || [],
                    source: recipe.source || 'AI Generated',
                    image: 'assets/images/ai-recipe-placeholder.jpg',
                    vegetarian: false,
                    vegan: false,
                    glutenFree: false,
                    dairyFree: false,
                    veryHealthy: false,
                    cheap: false,
                    veryPopular: false,
                    sustainable: false,
                    weightWatcherSmartPoints: 0,
                    gaps: 'no',
                    lowFodmap: false,
                    aggregateLikes: 0,
                    spoonacularScore: 0,
                    healthScore: 0,
                    creditsText: 'AI Generated Recipe',
                    license: 'AI Generated',
                    sourceName: 'ChefMate AI',
                    pricePerServing: 0,
                    nutrition: {
                        nutrients: []
                    }
                };
            }

            throw new Error('Could not parse AI recipe response');
        } catch (error) {
            console.warn('Failed to parse AI recipe response:', error);
            throw new Error('Unable to parse AI-generated recipe');
        }
    }

    /**
     * Parse time string to minutes
     * @param {string} timeStr - Time string like "30 minutes" or "1 hour"
     * @returns {number} Minutes
     */
    parseTimeToMinutes(timeStr) {
        if (!timeStr) return 30;

        const str = timeStr.toLowerCase();
        let minutes = 0;

        // Extract hours
        const hourMatch = str.match(/(\d+)\s*h/);
        if (hourMatch) {
            minutes += parseInt(hourMatch[1]) * 60;
        }

        // Extract minutes
        const minMatch = str.match(/(\d+)\s*m/);
        if (minMatch) {
            minutes += parseInt(minMatch[1]);
        }

        // If no specific format found, try to extract any number
        if (minutes === 0) {
            const numMatch = str.match(/(\d+)/);
            if (numMatch) {
                minutes = parseInt(numMatch[1]);
            }
        }

        return minutes || 30;
    }

    /**
     * Format AI ingredients for compatibility
     * @param {Array} ingredients - Array of ingredient strings
     * @returns {Array} Formatted ingredients
     */
    formatAIIngredients(ingredients) {
        return ingredients.map((ingredient, index) => ({
            id: index + 1,
            original: ingredient,
            originalString: ingredient,
            originalName: ingredient.replace(/^\d+\s*\w*\s*/, ''),
            name: ingredient.replace(/^\d+\s*\w*\s*/, ''),
            amount: 1,
            unit: '',
            measures: {
                us: { amount: 1, unitShort: '', unitLong: '' },
                metric: { amount: 1, unitShort: '', unitLong: '' }
            }
        }));
    }

    /**
     * Format AI instructions for compatibility
     * @param {Array} instructions - Array of instruction strings
     * @returns {Array} Formatted instructions
     */
    formatAIInstructions(instructions) {
        return [{
            name: '',
            steps: instructions.map((instruction, index) => ({
                number: index + 1,
                step: instruction,
                ingredients: [],
                equipment: []
            }))
        }];
    }
}

window.ChefMateAPI = new ChefMateAPI();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChefMateAPI;
}

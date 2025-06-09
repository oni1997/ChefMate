/**
 * ChefMate API Integration Module
 * Handles all API calls to Spoonacular and Gemini APIs
 */

class ChefMateAPI {
    constructor() {
        // Check if we're running on Vercel (has serverless functions)
        this.isVercelDeployment = window.location.hostname.includes('vercel.app') ||
                                  window.location.hostname.includes('localhost') && window.location.port === '';

        if (this.isVercelDeployment) {
            // Use Vercel serverless functions (no API keys needed on client)
            this.spoonacularBaseURL = '/api/spoonacular';
            this.geminiBaseURL = '/api/gemini';
            this.useServerlessAPI = true;
        } else {
            // Use direct API calls (for local development)
            this.spoonacularBaseURL = 'https://api.spoonacular.com';
            this.geminiBaseURL = 'https://generativelanguage.googleapis.com/v1beta';
            this.spoonacularApiKey = this.getApiKey('spoonacular');
            this.geminiApiKey = this.getApiKey('gemini');
            this.useServerlessAPI = false;
        }

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

    // ===== API KEY MANAGEMENT =====
    getApiKey(service) {
        // For development, you can set these in localStorage
        // In production, use environment variables or secure key management
        const keys = {
            spoonacular: localStorage.getItem('chefmate_spoonacular_key') || 'YOUR_SPOONACULAR_API_KEY',
            gemini: localStorage.getItem('chefmate_gemini_key') || 'YOUR_GEMINI_API_KEY'
        };
        return keys[service];
    }

    setApiKey(service, key) {
        localStorage.setItem(`chefmate_${service}_key`, key);
        if (service === 'spoonacular') {
            this.spoonacularApiKey = key;
        } else if (service === 'gemini') {
            this.geminiApiKey = key;
        }
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
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
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

        let url, params;

        if (this.useServerlessAPI) {
            // Use Vercel serverless function
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
            // Use direct API call
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

        const results = await this.makeRequest(url);

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
            // Use direct API call
            const params = new URLSearchParams({
                apiKey: this.spoonacularApiKey,
                includeNutrition: true
            });
            url = `${this.spoonacularBaseURL}/recipes/${recipeId}/information?${params}`;
        }

        return await this.makeRequest(url);
    }

    /**
     * Get recipe instructions
     * @param {number} recipeId - Recipe ID
     * @returns {Promise} Recipe instructions
     */
    async getRecipeInstructions(recipeId) {
        const params = new URLSearchParams({
            apiKey: this.spoonacularApiKey
        });

        const url = `${this.spoonacularBaseURL}/recipes/${recipeId}/analyzedInstructions?${params}`;
        return await this.makeRequest(url);
    }

    /**
     * Search recipes with complex query
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise} Recipe search results
     */
    async searchRecipes(query, options = {}) {
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
                if (!this.geminiApiKey || this.geminiApiKey === 'YOUR_GEMINI_API_KEY') {
                    return this.getMockAITips(recipe);
                }

                const response = await this.callGeminiAPI(prompt);
                return this.parseAIResponse(response);
            }
        } catch (error) {
            console.warn('AI API failed, using mock data:', error);
            return this.getMockAITips(recipe);
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
     * Call Gemini API
     * @param {string} prompt - The prompt to send
     * @returns {Promise} API response
     */
    async callGeminiAPI(prompt) {
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
}

window.ChefMateAPI = new ChefMateAPI();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChefMateAPI;
}

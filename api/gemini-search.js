/**
 * Vercel Serverless Function for AI Recipe Search
 * Handles AI-powered recipe generation when original recipes are not found
 */

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { prompt, recipeId, recipeName } = req.body;

        if (!prompt) {
            res.status(400).json({ error: 'Prompt is required' });
            return;
        }

        // Get API key from environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY not found in environment variables');
            
            // Return mock recipe data when API key is missing
            const mockRecipe = generateMockRecipe(recipeId, recipeName);
            res.status(200).json(mockRecipe);
            return;
        }

        // Build the enhanced prompt for recipe search
        const enhancedPrompt = buildRecipeSearchPrompt(recipeId, recipeName);

        // Call Gemini API
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: enhancedPrompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048
            }
        };

        console.log('Calling Gemini API for recipe search...');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', response.status, errorText);
            
            // Return mock recipe data on API error
            const mockRecipe = generateMockRecipe(recipeId, recipeName);
            res.status(200).json(mockRecipe);
            return;
        }

        const data = await response.json();
        console.log('Gemini API response received');

        // Parse the AI response
        try {
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!content) {
                throw new Error('No content in AI response');
            }

            // Try to parse as JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const recipe = JSON.parse(jsonMatch[0]);
                
                // Format the recipe for compatibility with the frontend
                const formattedRecipe = formatAIRecipe(recipe, recipeId);
                res.status(200).json(formattedRecipe);
                return;
            }

            throw new Error('Could not parse AI recipe response');
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            
            // Return mock recipe data on parse error
            const mockRecipe = generateMockRecipe(recipeId, recipeName);
            res.status(200).json(mockRecipe);
        }

    } catch (error) {
        console.error('Server error:', error);
        
        // Return mock recipe data on server error
        const mockRecipe = generateMockRecipe(req.body?.recipeId, req.body?.recipeName);
        res.status(200).json(mockRecipe);
    }
}

/**
 * Build enhanced prompt for recipe search
 */
function buildRecipeSearchPrompt(recipeId, recipeName) {
    const searchHint = recipeName ? `The recipe might be called "${recipeName}" or something similar.` : '';
    
    return `I'm looking for a recipe with ID ${recipeId} that wasn't found in the database. ${searchHint}

Please help me by creating a complete, delicious recipe. Based on the ID or name, suggest what this recipe might be and provide:

1. A creative and appetizing recipe name
2. A brief description of the dish
3. Complete ingredient list with measurements
4. Step-by-step cooking instructions
5. Helpful cooking tips
6. Estimated cooking time and servings

Please format your response as a JSON object with this exact structure:
{
    "title": "Recipe Name",
    "description": "Brief description of the dish",
    "cookTime": "30 minutes",
    "servings": 4,
    "difficulty": "Easy",
    "ingredients": [
        "1 cup flour",
        "2 large eggs",
        "1/2 cup milk",
        "2 tbsp butter"
    ],
    "instructions": [
        "Preheat oven to 350°F (175°C).",
        "In a large bowl, whisk together flour and eggs.",
        "Gradually add milk while stirring to avoid lumps.",
        "Heat butter in a pan over medium heat.",
        "Cook until golden brown, about 3-4 minutes per side."
    ],
    "tips": [
        "Make sure all ingredients are at room temperature for best results.",
        "Don't overmix the batter to keep it light and fluffy.",
        "Taste and adjust seasoning as needed."
    ],
    "source": "AI Generated Recipe"
}

Make the recipe practical, delicious, and easy to follow. Include specific measurements and clear, detailed instructions.`;
}

/**
 * Format AI recipe for frontend compatibility
 */
function formatAIRecipe(recipe, recipeId) {
    return {
        id: 'ai-generated',
        title: recipe.title || 'AI Generated Recipe',
        summary: recipe.description || 'A delicious recipe generated by AI',
        readyInMinutes: parseTimeToMinutes(recipe.cookTime) || 30,
        servings: recipe.servings || 4,
        difficulty: recipe.difficulty || 'Medium',
        extendedIngredients: formatAIIngredients(recipe.ingredients || []),
        analyzedInstructions: formatAIInstructions(recipe.instructions || []),
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

/**
 * Generate mock recipe when AI is unavailable
 */
function generateMockRecipe(recipeId, recipeName) {
    const recipeName_safe = recipeName || 'Mystery Recipe';
    
    return {
        id: 'ai-generated',
        title: `${recipeName_safe} (AI Generated)`,
        summary: `A delicious ${recipeName_safe.toLowerCase()} recipe created by our AI chef when the original wasn't available.`,
        readyInMinutes: 30,
        servings: 4,
        difficulty: 'Medium',
        extendedIngredients: [
            {
                id: 1,
                original: '2 cups all-purpose flour',
                originalString: '2 cups all-purpose flour',
                originalName: 'all-purpose flour',
                name: 'all-purpose flour',
                amount: 2,
                unit: 'cups'
            },
            {
                id: 2,
                original: '1 tsp salt',
                originalString: '1 tsp salt',
                originalName: 'salt',
                name: 'salt',
                amount: 1,
                unit: 'tsp'
            },
            {
                id: 3,
                original: '2 tbsp olive oil',
                originalString: '2 tbsp olive oil',
                originalName: 'olive oil',
                name: 'olive oil',
                amount: 2,
                unit: 'tbsp'
            }
        ],
        analyzedInstructions: [{
            name: '',
            steps: [
                {
                    number: 1,
                    step: 'Gather all ingredients and prepare your workspace.',
                    ingredients: [],
                    equipment: []
                },
                {
                    number: 2,
                    step: 'Follow the basic preparation steps for this type of dish.',
                    ingredients: [],
                    equipment: []
                },
                {
                    number: 3,
                    step: 'Cook according to standard methods and taste for seasoning.',
                    ingredients: [],
                    equipment: []
                },
                {
                    number: 4,
                    step: 'Serve hot and enjoy your meal!',
                    ingredients: [],
                    equipment: []
                }
            ]
        }],
        tips: [
            'This is a basic recipe template generated when the AI service is unavailable.',
            'For best results, search for a similar recipe online or try our recipe search feature.',
            'Feel free to customize ingredients and cooking methods to your taste.'
        ],
        source: 'AI Generated (Fallback)',
        image: 'assets/images/ai-recipe-placeholder.jpg'
    };
}

/**
 * Helper functions
 */
function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 30;
    
    const str = timeStr.toLowerCase();
    let minutes = 0;
    
    const hourMatch = str.match(/(\d+)\s*h/);
    if (hourMatch) {
        minutes += parseInt(hourMatch[1]) * 60;
    }
    
    const minMatch = str.match(/(\d+)\s*m/);
    if (minMatch) {
        minutes += parseInt(minMatch[1]);
    }
    
    if (minutes === 0) {
        const numMatch = str.match(/(\d+)/);
        if (numMatch) {
            minutes = parseInt(numMatch[1]);
        }
    }
    
    return minutes || 30;
}

function formatAIIngredients(ingredients) {
    return ingredients.map((ingredient, index) => ({
        id: index + 1,
        original: ingredient,
        originalString: ingredient,
        originalName: ingredient.replace(/^\d+\s*\w*\s*/, ''),
        name: ingredient.replace(/^\d+\s*\w*\s*/, ''),
        amount: 1,
        unit: ''
    }));
}

function formatAIInstructions(instructions) {
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

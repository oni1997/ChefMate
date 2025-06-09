/**
 * Vercel Serverless Function for Gemini AI API
 * This proxies requests to Gemini AI using server-side API keys
 */

export default async function handler(req, res) {
    // Enable CORS for frontend requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests for Gemini
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Get API key from environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            // Return mock data if no API key is configured
            const mockTips = {
                tips: [
                    "Read through the entire recipe before starting to ensure you have all ingredients and understand the steps.",
                    "Prep all your ingredients (mise en place) before you start cooking to make the process smoother.",
                    "Taste as you go and adjust seasonings according to your preference.",
                    "Don't overcrowd the pan when cooking - this can lead to steaming instead of proper browning."
                ]
            };
            res.status(200).json(mockTips);
            return;
        }

        const { prompt } = req.body;
        
        if (!prompt) {
            res.status(400).json({ error: 'Prompt is required' });
            return;
        }

        // Build Gemini API URL
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
        
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

        console.log('Calling Gemini AI for cooking tips');

        // Make request to Gemini API
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
            
            // Return mock data on API error
            const mockTips = {
                tips: [
                    "Read through the entire recipe before starting to ensure you have all ingredients and understand the steps.",
                    "Prep all your ingredients (mise en place) before you start cooking to make the process smoother.",
                    "Taste as you go and adjust seasonings according to your preference.",
                    "For best results, let meat rest for a few minutes after cooking to allow juices to redistribute."
                ]
            };
            res.status(200).json(mockTips);
            return;
        }

        const data = await response.json();
        
        // Parse the response
        try {
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!content) {
                throw new Error('No content in response');
            }

            // Try to parse as JSON first
            let parsedTips;
            try {
                parsedTips = JSON.parse(content);
            } catch {
                // If not JSON, parse as plain text
                const tips = content.split('\n')
                    .filter(line => line.trim())
                    .map(line => line.replace(/^\d+\.\s*/, '').trim())
                    .filter(tip => tip.length > 10);

                parsedTips = { tips };
            }

            res.status(200).json(parsedTips);

        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            
            // Return mock data on parse error
            const mockTips = {
                tips: [
                    "Read through the entire recipe before starting to ensure you have all ingredients and understand the steps.",
                    "Prep all your ingredients (mise en place) before you start cooking to make the process smoother.",
                    "Taste as you go and adjust seasonings according to your preference."
                ]
            };
            res.status(200).json(mockTips);
        }

    } catch (error) {
        console.error('Server error:', error);
        
        // Return mock data on server error
        const mockTips = {
            tips: [
                "Read through the entire recipe before starting to ensure you have all ingredients and understand the steps.",
                "Prep all your ingredients (mise en place) before you start cooking to make the process smoother.",
                "Taste as you go and adjust seasonings according to your preference."
            ]
        };
        res.status(200).json(mockTips);
    }
}

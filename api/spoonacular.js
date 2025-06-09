/**
 * Vercel Serverless Function for Spoonacular API
 * This proxies requests to Spoonacular API using server-side API keys
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

    // Only allow GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { endpoint, ...queryParams } = req.query;
        
        if (!endpoint) {
            res.status(400).json({ error: 'Endpoint parameter is required' });
            return;
        }

        // Get API key from environment variables
        const apiKey = process.env.SPOONACULAR_API_KEY;
        
        if (!apiKey) {
            res.status(500).json({ error: 'API key not configured' });
            return;
        }

        // Build Spoonacular API URL
        const baseURL = 'https://api.spoonacular.com';
        const url = new URL(`${baseURL}${endpoint}`);
        
        // Add API key and other parameters
        url.searchParams.append('apiKey', apiKey);
        
        // Add all query parameters from the request
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value) {
                url.searchParams.append(key, value);
            }
        });

        console.log('Fetching from Spoonacular:', url.pathname + url.search);

        // Make request to Spoonacular API
        const response = await fetch(url.toString());
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Spoonacular API error:', response.status, errorText);
            
            res.status(response.status).json({ 
                error: `Spoonacular API error: ${response.status}`,
                details: errorText
            });
            return;
        }

        const data = await response.json();
        
        // Return the data
        res.status(200).json(data);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}

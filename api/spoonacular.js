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

        // Get API keys from environment variables (primary and backup)
        const apiKey = process.env.SPOONACULAR_API_KEY;
        const apiKey2 = process.env.SPOONACULAR_API_KEY_2;

        if (!apiKey) {
            res.status(500).json({ error: 'Primary API key not configured' });
            return;
        }

        // Function to make API request with a specific key
        const makeSpoonacularRequest = async (key, keyName = 'primary') => {
            const baseURL = 'https://api.spoonacular.com';
            const url = new URL(`${baseURL}${endpoint}`);

            // Add API key and other parameters
            url.searchParams.append('apiKey', key);

            // Add all query parameters from the request
            Object.entries(queryParams).forEach(([paramKey, value]) => {
                if (value) {
                    url.searchParams.append(paramKey, value);
                }
            });

            console.log(`Fetching from Spoonacular with ${keyName} key:`, url.pathname + url.search);

            const response = await fetch(url.toString());

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Spoonacular API error with ${keyName} key:`, response.status, errorText);

                // Check if this is a quota exceeded error (402)
                if (response.status === 402 && keyName === 'primary' && apiKey2) {
                    console.log('🔄 Primary key quota exceeded, trying backup key...');
                    return null; // Signal to try backup key
                }

                throw new Error(`Spoonacular API error: ${response.status} - ${errorText}`);
            }

            return response;
        };

        // Try primary key first
        let response = await makeSpoonacularRequest(apiKey, 'primary');

        // If primary key failed with quota error and we have a backup key, try backup
        if (response === null && apiKey2) {
            console.log('🔄 Switching to backup API key...');
            response = await makeSpoonacularRequest(apiKey2, 'backup');
        }

        if (!response) {
            res.status(402).json({
                error: 'All API keys have reached their quota limit',
                details: 'Both primary and backup API keys have exceeded their daily limits'
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

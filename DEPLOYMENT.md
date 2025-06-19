# ChefMate Deployment Guide

## Vercel Deployment (Recommended)

### Prerequisites
1. GitHub account
2. Vercel account (free)
3. API keys:
   - **Spoonacular API Key** (Required): Get from [https://spoonacular.com/food-api](https://spoonacular.com/food-api)
   - **Gemini AI API Key** (Optional): Get from [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

### Step-by-Step Deployment

#### 1. Fork the Repository
- Fork this repository to your GitHub account
- Clone your fork locally (optional, for development)

#### 2. Get Your API Keys

**Spoonacular API (Required)**
1. Visit [https://spoonacular.com/food-api](https://spoonacular.com/food-api)
2. Sign up for a free account
3. Navigate to your dashboard to get your API key
4. Free tier includes 150 requests per day

**Gemini AI API (Optional)**
1. Visit [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. If not provided, the app will use mock AI responses

#### 3. Deploy to Vercel

**Option A: Deploy via Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your forked GitHub repository
4. Vercel will auto-detect the configuration
5. Before deploying, add environment variables (see step 4)

**Option B: Deploy via Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel --prod
```

#### 4. Configure Environment Variables

In your Vercel project dashboard:
1. Go to Settings → Environment Variables
2. Add the following variables:

| Variable Name | Value | Required |
|---------------|-------|----------|
| `SPOONACULAR_API_KEY` | Your Spoonacular API key | Yes |
| `GEMINI_API_KEY` | Your Gemini AI API key | No |

**Important**: Make sure the variable names match exactly:
- `SPOONACULAR_API_KEY` (not `SPOONACULAR_API_KEY_HERE`)
- `GEMINI_API_KEY` (not `GEMINI_API_KEY_HERE`)

#### 5. Redeploy
After adding environment variables, trigger a new deployment:
- Go to Deployments tab
- Click "Redeploy" on the latest deployment
- Or push a new commit to trigger automatic deployment

### Verification

1. Visit your deployed URL
2. Try searching for recipes with ingredients like "chicken, rice"
3. Check that recipes load properly
4. Test AI cooking tips (if Gemini API is configured)

### Troubleshooting

**Recipes not loading:**
- Check that `SPOONACULAR_API_KEY` is set correctly
- Verify your API key is valid at [Spoonacular dashboard](https://spoonacular.com/food-api/console)
- Check Vercel function logs for errors

**AI tips not working:**
- Check that `GEMINI_API_KEY` is set correctly (optional)
- If not set, the app should show mock tips instead

**Environment variables not working:**
- Ensure variable names match exactly
- Redeploy after adding variables
- Check Vercel project settings

## Local Development

For local development, you'll need to set up API keys manually:

1. Serve the project locally:
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```

2. Visit `http://localhost:8000/setup.html`
3. Enter your API keys
4. Navigate to the main app

**Note**: Local development stores API keys in browser localStorage. This is only for development - production uses secure serverless functions.

## Architecture

### Production (Vercel)
- Static files served by Vercel CDN
- API calls routed through serverless functions (`/api/spoonacular.js`, `/api/gemini.js`)
- Environment variables securely stored on Vercel
- No API keys exposed to client

### Local Development
- Static files served by local server
- Direct API calls to external services
- API keys stored in browser localStorage
- Setup page for key management

## Security

✅ **Production**: API keys are secure server-side environment variables
✅ **HTTPS**: All production traffic encrypted
✅ **No hardcoded secrets**: All sensitive data in environment variables
✅ **CORS**: Proper cross-origin request handling

## Performance

- Static site with CDN delivery
- Serverless functions for API calls
- Service worker for offline functionality
- Optimized images and assets

## Monitoring

Monitor your API usage:
- **Spoonacular**: Check usage in your dashboard
- **Gemini**: Monitor usage in Google Cloud Console
- **Vercel**: Check function execution logs

## Cost

- **Vercel**: Free tier includes generous limits
- **Spoonacular**: Free tier (150 requests/day), paid plans available
- **Gemini**: Generous free tier, pay-per-use beyond limits

## Support

For deployment issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test API keys independently
4. Check browser console for errors

---

**Ready to deploy?** Follow the steps above and you'll have ChefMate running in production within minutes! 🚀

# ChefMate - Smart Recipe Generator

ChefMate is a smart recipe generator that helps users discover recipes using ingredients they own, with AI guidance for better cooking results.

## Week 5 Deliverables ✅

This implementation includes all the required Week 5 features:

### HTML Structure & Layout ✅
- ✅ Main HTML pages (index.html, search.html, recipe.html, favorites.html)
- ✅ Semantic HTML structure for each page
- ✅ Form elements for ingredient input
- ✅ Recipe card templates

### Basic CSS Styling ✅
- ✅ Color scheme implementation (#fafafa background, #4caf50 buttons, #ff7043 favorites, #ffeb3b AI suggestions)
- ✅ Typography setup (Poppins for headers, Open Sans for body, Roboto Mono for notes)
- ✅ Responsive grid layout
- ✅ Navigation and basic components styling
- ✅ Mobile-first responsive design

### Spoonacular API Integration ✅
- ✅ API integration module with authentication
- ✅ Recipe search by ingredients endpoint
- ✅ Error handling and rate limiting
- ✅ Recipe card display with basic results

## Project Structure

```
ChefMate/
├── index.html              # Home page with ingredient input
├── search.html             # Recipe search results page
├── recipe.html             # Individual recipe details page
├── favorites.html          # User's favorite recipes dashboard
├── assets/
│   ├── css/
│   │   └── styles.css      # Main stylesheet with color scheme & responsive design
│   ├── js/
│   │   ├── utils.js        # Utility functions and local storage management
│   │   ├── api.js          # Spoonacular & Gemini API integration
│   │   ├── app.js          # Home page functionality
│   │   └── search.js       # Search results page functionality
│   └── images/             # Images and icons (to be added)
└── README.md               # This file
```

## Features Implemented

### 🏠 Home Page (index.html)
- Ingredient input interface with textarea
- Dietary preferences selection (vegetarian, vegan, gluten-free, dairy-free)
- Cooking time constraints
- Quick suggestion cards for popular ingredient combinations
- Features preview section
- Ingredient history (stored locally)
- Form validation with real-time feedback

### 🔍 Search Results (search.html)
- Recipe cards with images, ratings, cooking time, difficulty
- Filtering by time, difficulty, diet, and sorting options
- Quick search to add more ingredients
- AI cooking tips integration
- Pagination with "Load More" functionality
- Favorite/unfavorite recipes
- Responsive grid layout

### 📖 Recipe Details (recipe.html)
- Detailed recipe information with hero image
- Adjustable serving sizes
- Ingredients list with shopping list generation
- Step-by-step instructions
- Nutrition information display
- AI cooking coach integration
- Built-in cooking timers
- Favorite management

### ❤️ Favorites (favorites.html)
- Saved recipes dashboard
- Personal notes for each recipe
- Search and filter favorites
- Grid/list view toggle
- Recipe collections (planned)
- Statistics display

## API Integration

### Spoonacular API
- Recipe search by ingredients
- Detailed recipe information
- Nutrition data
- Recipe instructions
- Rate limiting and error handling

### Gemini AI (Optional)
- Personalized cooking tips
- Recipe guidance
- Fallback to mock data when API unavailable

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/chefmate)

ChefMate is ready for Vercel deployment! See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Quick Vercel Deployment:
1. Push your code to GitHub
2. Connect GitHub to Vercel
3. Deploy with one click
4. Set API keys in browser localStorage

## Setup Instructions

### 1. API Keys Setup

**For Vercel Deployment (Recommended):**
- API keys are configured server-side using environment variables
- No user setup required - just use the app!
- Set `SPOONACULAR_API_KEY` and `GEMINI_API_KEY` in Vercel dashboard

**For Local Development:**
1. Get API keys:
   - [Spoonacular API](https://spoonacular.com/food-api) (free tier: 150 requests/day)
   - [Gemini AI](https://makersuite.google.com/app/apikey) (optional)

2. Set API keys in browser console:
   ```javascript
   localStorage.setItem('chefmate_spoonacular_key', 'YOUR_SPOONACULAR_KEY');
   localStorage.setItem('chefmate_gemini_key', 'YOUR_GEMINI_KEY');
   ```

### 2. Local Development
1. Clone or download the project
2. Open `index.html` in a modern web browser
3. For best results, serve from a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

### 3. Testing the Application
1. Open the application in your browser
2. Enter ingredients like "chicken, rice, vegetables"
3. Select dietary preferences if needed
4. Click "Find Recipes" to search
5. Browse results, view recipe details, and add favorites

## Color Scheme

- **Background**: #fafafa (light gray)
- **Primary Actions**: #4caf50 (natural green)
- **Favorites**: #ff7043 (warm red)
- **AI Suggestions**: #ffeb3b (yellow)
- **Text**: #424242 (dark gray)
- **White**: #ffffff (cards and navigation)

## Typography

- **Headers**: Poppins (Google Fonts)
- **Body Text**: Open Sans (Google Fonts)
- **Notes/Code**: Roboto Mono (Google Fonts)

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Known Limitations (Week 5)

- Recipe images may not load without proper API setup
- AI features require Gemini API key
- No user authentication (planned for later weeks)
- Limited offline functionality
- No image upload for ingredients (planned for future)

## Next Steps (Week 6 & 7)

- Enhanced ingredient input system
- Voice input integration
- User preferences and profiles
- Advanced local storage management
- Recipe rating and review system
- Shopping list functionality
- Cooking mode with timers
- Final styling and deployment

## Contributing

This is a student project for learning web development. Feel free to explore the code and suggest improvements!

## License

This project is for educational purposes. API usage subject to respective service terms.

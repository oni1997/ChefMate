# ChefMate - Smart Recipe Generator 🍳

ChefMate is a comprehensive smart recipe generator that helps users discover recipes using ingredients they own, with AI guidance for better cooking results. Built with modern web technologies and a clean, fresh design.

## ✨ Features

### 🏠 **Smart Recipe Discovery**
- **Ingredient-Based Search**: Find recipes using ingredients you already have
- **AI-Powered Suggestions**: Get personalized cooking tips and guidance
- **Dietary Preferences**: Filter by vegetarian, vegan, gluten-free, and more
- **Smart Recommendations**: Discover new recipes based on your preferences

### 👨‍🍳 **Enhanced Cooking Experience**
- **Step-by-Step Cooking Mode**: Immersive cooking interface with progress tracking
- **Interactive Shopping Lists**: Organized ingredient lists with preview and management
- **Kitchen Timers**: Built-in timers for perfect cooking results
- **Personal Notes**: Save your cooking modifications and tips

### 🤖 **AI Cooking Coach**
- **Context-Aware Tips**: Recipe-specific cooking advice
- **Interactive Q&A**: Ask specific cooking questions
- **Professional Secrets**: Advanced techniques from expert chefs
- **Smart Formatting**: Highlighted cooking terms and structured guidance

### ❤️ **Personal Recipe Management**
- **Favorites System**: Save and organize your favorite recipes
- **Recipe Collections**: Manage your personal recipe library
- **Nutrition Information**: Detailed nutritional breakdowns
- **Serving Adjustments**: Scale recipes for different serving sizes

## 🏗️ Project Structure

```
ChefMate/
├── api/                    # Serverless API functions
│   ├── gemini.js          # AI functionality
│   ├── gemini-search.js   # AI recipe search
│   └── spoonacular.js     # Recipe API integration
├── assets/
│   ├── css/
│   │   └── styles.css     # Main stylesheet with fresh design system
│   ├── js/
│   │   ├── api.js         # API integration & management
│   │   ├── app.js         # Home page functionality
│   │   ├── config.js      # Configuration management
│   │   ├── favorites.js   # Favorites management
│   │   ├── main.js        # Core application logic
│   │   ├── profile.js     # Profile & shopping lists
│   │   ├── recipe.js      # Recipe display & cooking mode
│   │   ├── search.js      # Search functionality
│   │   └── utils.js       # Utility functions
│   └── images/            # Application images & icons
├── index.html             # Home page with ingredient input
├── search.html            # Recipe search results
├── recipe.html            # Recipe details & cooking mode
├── favorites.html         # Favorites management
├── profile.html           # User profile & shopping lists
├── setup-api-keys.html    # API key configuration
├── setup.html             # Initial application setup
├── sw.js                  # Service worker for offline support
├── package.json           # Dependencies & scripts
├── vercel.json            # Deployment configuration
└── README.md              # Documentation
```

## 📱 Pages & Functionality

### 🏠 **Home Page** (`index.html`)
- **Smart Ingredient Input**: Intuitive interface with autocomplete and suggestions
- **Dietary Preferences**: Comprehensive filtering (vegetarian, vegan, gluten-free, dairy-free)
- **Cooking Constraints**: Time-based recipe filtering
- **Quick Suggestions**: Popular ingredient combinations for inspiration
- **Ingredient History**: Locally stored ingredient preferences
- **Real-time Validation**: Form validation with helpful feedback

### 🔍 **Search Results** (`search.html`)
- **Rich Recipe Cards**: Images, ratings, cooking time, and difficulty indicators
- **Advanced Filtering**: Multi-criteria filtering and sorting options
- **Dynamic Search**: Add more ingredients without losing results
- **AI Integration**: Context-aware cooking tips for search results
- **Infinite Scroll**: Smooth pagination with "Load More" functionality
- **Instant Favorites**: One-click favorite management
- **Responsive Grid**: Optimized layout for all screen sizes

### 📖 **Recipe Details** (`recipe.html`)
- **Immersive Hero Section**: Full-width recipe images with floating action buttons
- **Enhanced Favorite Button**: Animated heart with warm red color scheme
- **Start Cooking Mode**: Step-by-step cooking interface with progress tracking
- **Smart Shopping Lists**: Preview modal with organized ingredient display
- **AI Cooking Coach**: Context-aware tips, Q&A, and professional secrets
- **Kitchen Tools**: Integrated timers and nutrition information
- **Personal Notes**: Save cooking modifications and tips
- **Serving Adjustments**: Dynamic ingredient scaling

### ❤️ **Favorites** (`favorites.html`)
- **Recipe Library**: Organized collection of saved recipes
- **Personal Notes**: Custom notes and modifications for each recipe
- **Advanced Search**: Find favorites by name, ingredients, or tags
- **View Options**: Grid and list view toggles
- **Recipe Statistics**: Cooking frequency and preference analytics

### 👤 **Profile** (`profile.html`)
- **Shopping Lists**: Create, manage, and share ingredient lists
- **List Management**: Interactive shopping list with checkboxes and organization
- **Recipe Collections**: Organize favorites into custom collections
- **Cooking History**: Track your cooking journey and preferences

## 🔌 API Integration

### **Spoonacular API** (Required)
- **Recipe Discovery**: Search by ingredients with advanced filtering
- **Detailed Information**: Complete recipe data including instructions and nutrition
- **Nutrition Analysis**: Comprehensive nutritional breakdowns and daily values
- **Instruction Parsing**: Structured step-by-step cooking instructions
- **Smart Rate Limiting**: Automatic API key switching and quota management
- **Error Handling**: Graceful fallbacks and user-friendly error messages

### **Gemini AI** (Optional)
- **Context-Aware Tips**: Recipe-specific cooking advice and techniques
- **Interactive Q&A**: Answer specific cooking questions
- **Professional Guidance**: Advanced chef techniques and secrets
- **Smart Fallbacks**: Curated cooking tips when AI is unavailable
- **Natural Language**: Easy-to-understand cooking guidance

### **Serverless Architecture**
- **Secure API Keys**: Environment variables protect sensitive credentials
- **Automatic Scaling**: Vercel serverless functions handle traffic spikes
- **Global CDN**: Fast response times worldwide
- **Local Development**: Fallback to direct API calls for development



## 🚀 Getting Started

### **Production Deployment** (Recommended)

**Deploy to Vercel for full functionality and security**

1. **Fork Repository**
   ```bash
   # Fork this repository to your GitHub account
   # Then clone your fork
   git clone https://github.com/oni1997/chefmate.git
   cd chefmate
   ```

2. **Get API Keys**
   - **Spoonacular API** (Required): [Get API Key](https://spoonacular.com/food-api)
   - **Gemini AI API** (Optional): [Get API Key](https://makersuite.google.com/app/apikey)

3. **Deploy to Vercel**
   - Sign up for [Vercel](https://vercel.com) and connect your GitHub
   - Import your forked repository
   - Add environment variables in Vercel dashboard:
     - `SPOONACULAR_API_KEY` = your_spoonacular_key
     - `SPOONACULAR_API_KEY_2` = backup_spoonacular_key (optional)
     - `GEMINI_API_KEY` = your_gemini_key (optional)
   - Deploy!

**Benefits**: Secure API keys, global CDN, automatic scaling, HTTPS

### **Local Development**

**For development and testing**

1. **Clone the Repository**
   ```bash
   git clone https://github.com/oni1997/chefmate.git
   cd chefmate
   ```

2. **Install Dependencies** (optional)
   ```bash
   npm install
   ```

3. **Start Local Server**
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve .

   # Using PHP
   php -S localhost:8000
   ```

### **Quick Start Guide**

1. **Home Page**: Enter ingredients like "chicken, rice, vegetables"
2. **Search Results**: Browse recipes, use filters, and add favorites
3. **Recipe Details**: View full recipes, start cooking mode, get AI tips
4. **Favorites**: Manage your saved recipes and personal notes
5. **Profile**: Create shopping lists and organize your cooking

## 🎨 Design System

### **Fresh & Clean Color Scheme**
- **Background**: `#fafafa` - Fresh white for clean, airy feel
- **Primary Actions**: `#4caf50` - Natural green for health and freshness
- **Favorites**: `#ff7043` - Warm red for emotional connection
- **AI Features**: `#ffeb3b` - Bright yellow for intelligence and energy
- **Text**: `#424242` - Readable gray for professional appearance
- **Cards**: `#ffffff` - Pure white for clean content areas

### **Typography System**
- **Headers**: Poppins - Modern, friendly headings
- **Body Text**: Open Sans - Highly readable body content
- **Notes/Code**: Roboto Mono - Technical content and notes

### **Design Principles**
- **Fresh & Simple**: Clean, uncluttered interface
- **Mobile-First**: Optimized for kitchen use on all devices
- **Accessibility**: High contrast ratios and clear typography
- **Consistency**: Unified color scheme and spacing throughout

## 🌐 Browser Support

- **Chrome**: 80+ (Recommended)
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+
- **Mobile**: iOS Safari 13+, Chrome Mobile 80+

## 🔧 Technical Features

### **Performance Optimizations**
- **Service Worker**: Offline support and caching
- **Lazy Loading**: Images and content loaded on demand
- **Local Storage**: Persistent favorites and preferences
- **Responsive Images**: Optimized for different screen sizes

### **Security Features**
- **Environment Variables**: Secure API key management
- **HTTPS Only**: Secure connections in production
- **Input Validation**: XSS protection and data sanitization
- **Rate Limiting**: API quota management and fallbacks

### **Accessibility**
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and semantic HTML
- **High Contrast**: Readable color combinations
- **Mobile Friendly**: Touch-optimized interface

## 🤝 Contributing

This project welcomes contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**
- Follow the existing code style and structure
- Test your changes on multiple devices
- Update documentation for new features
- Ensure accessibility standards are met

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

**API Usage**: Subject to respective service terms (Spoonacular, Gemini AI)

---

**Built with ❤️ for home cooks who want to make the most of their ingredients!**
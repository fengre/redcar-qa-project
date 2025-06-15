# Company Question Analyzer

AI-powered web app for analyzing companies by domain and answering related questions.

## Quick Start

1. Clone the repo
2. Install dependencies:  
    ```bash
    npm install
    ```
3. Add `.env.local` with your Perplexity API key:  
    ```
    NEXT_PUBLIC_PERPLEXITY_API_KEY=your_api_key_here
    ```
4. Start the dev server:  
    ```bash
    npm run dev
    ```
5. Visit [http://localhost:3000](http://localhost:3000)

## Architecture & Key Decisions

- **MVC + Service Layer:**  
  Modular, testable, and easy to extend for new AI providers. Controller handles domain extraction, validation, and question processing. Service handles AI provider integration and multi-step processing. 
- **Perplexity AI:**  
  Chosen for its prowess as a real-time search engine that prioritizes accuracy of information and provides citations.

### Structure
- `controllers/` - Business logic and request handling
- `models/` - Data types and interfaces
- `services/` - Core services and AI processing
- `views/` - React components and UI
- `app/` - Next.js app router and configuration


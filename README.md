# Company Question Analyzer

AI-powered web app for analyzing companies by domain and answering related questions.

## Quick Start

1. **Clone the repository**
2. **Install dependencies** for both frontend and backend:
    ```bash
    npm run install:all
    ```
3. **Set up environment variables:**
    In `backend/.env`:
    ```
    PERPLEXITY_API_KEY=your_perity_api_key_here
    ```
4. **Start the frontend and backend:**
    ```bash
    npm run dev
    ```
5. **Visit [http://localhost:3000](http://localhost:3000)** in your browser.

## Architecture & Key Decisions

- **Separation of Frontend and Backend:**  
  The app uses a React frontend and a Nest.js backend for clear separation of concerns, scalability, and maintainability.

- **Perplexity AI as Provider:**  
  Perplexity is chosen for its real-time, accurate search capabilities and citation support, making it ideal for company analysis.

## Testing

  ```bash
  npm run test
  ```
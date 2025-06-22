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

- **Multi-Step AI Prompting:**  
  The backend uses a multi-step AI processing approach to maximize answer quality and reliability. For each user question, the backend:
  1. **Step 1:** Asks the AI if the company/domain is legitimate, expecting a `'true'` or `'false'` response.
  2. **Step 2:** If legitimate, prompts the AI for industry background and main products/services; if not, expects `'false'`.
  3. **Step 3:** If previous responses are not `'false'`, builds a context-rich, concise answer to the user's question. Otherwise, it explains the company does not seem to exist or is not legitimate.
  
  Each step builds context for the next, and the final answer is streamed back to the frontend. The output is post-processed to clean up markdown, references, and formatting for clarity.

  This method helps in identifying fake websites.

- **Database Schema Design:**  
  The backend uses a relational database (SQLite by default) with the following key tables:
  - **History Table:** Stores each question, its answer, timestamp, and the associated user ID. This enables efficient retrieval of user-specific question/answer history and supports features like history browsing and analytics.
  - **User Table:** Stores user credentials and authentication tokens for secure access.
  
  The schema is designed for extensibility and efficient querying, supporting both authentication and per-user history.

- **Perplexity AI as Provider:**  
  Perplexity is chosen for its real-time, accurate search capabilities and citation support, making it ideal for company analysis.


## Testing

  ```bash
  npm run test
  ```
# RedCar QA Backend

Nest.js backend for the Company Question Analyzer application.

## Features

- **Question Analysis**: Multi-step AI processing for company analysis
- **History Management**: Persistent storage of question-answer pairs
- **Domain Validation**: Robust domain extraction and validation
- **Streaming Responses**: Real-time streaming of AI responses
- **Database Integration**: SQLite database with TypeORM

## Tech Stack

- **Framework**: Nest.js
- **Database**: SQLite with TypeORM
- **AI Provider**: Perplexity API
- **Language**: TypeScript

## Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   PERPLEXITY_API_KEY=your_perplexity_api_key_here
   PORT=3001
   NODE_ENV=development
   ```

3. **Database Setup**:
   The SQLite database will be automatically created on first run.

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Questions
- `POST /questions/analyze` - Analyze a question about a company
  - Body: `{ "question": "What does microsoft.com do?" }`
  - Response: Streaming text response

### History
- `GET /history` - Get all history items
- `POST /history` - Save a new history item
  - Body: `{ "question": "...", "domain": "...", "answer": "..." }`
- `DELETE /history/:id` - Delete a history item

## Architecture

### Modules
- **QuestionsModule**: Handles question processing and domain validation
- **HistoryModule**: Manages question-answer history
- **AiModule**: Coordinates AI providers and processing

### Services
- **QuestionsService**: Domain extraction and validation
- **HistoryService**: Database operations for history
- **AiService**: AI provider coordination
- **MultiStepProcessor**: Complex analysis workflow
- **PerplexityProvider**: Perplexity API integration

### Entities
- **HistoryItem**: Database entity for storing question-answer pairs

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Database Schema

```sql
CREATE TABLE history_item (
  id VARCHAR PRIMARY KEY,
  question TEXT NOT NULL,
  domain TEXT NOT NULL,
  answer TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
``` 
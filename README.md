# Company Question Analyzer

A full-stack application for analyzing companies based on questions and domains, built with Next.js frontend and Nest.js backend.

## Architecture

This project is split into two main parts:

- **Frontend**: Next.js application with React and TypeScript
- **Backend**: Nest.js API server with TypeORM and SQLite

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Perplexity API key

### 1. Backend Setup

```bash
cd backend
npm install
cp env.example .env
```

Edit `.env` and add your Perplexity API key:
```env
PERPLEXITY_API_KEY=your_api_key_here
```

Start the backend:
```bash
npm run start:dev
```

The backend will run on `http://localhost:3001`

### 2. Frontend Setup

```bash
# From the root directory
npm install
```

Start the frontend:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Features

- **Company Analysis**: Ask questions about companies using their domain
- **Multi-step AI Processing**: Sophisticated analysis workflow
- **Real-time Streaming**: Live streaming of AI responses
- **History Management**: Persistent storage of questions and answers
- **Domain Validation**: Robust domain extraction and validation
- **Modern UI**: Clean, responsive interface with Tailwind CSS

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Jest + Testing Library

### Backend
- **Framework**: Nest.js
- **Database**: SQLite with TypeORM
- **AI Provider**: Perplexity API
- **Language**: TypeScript

## API Endpoints

### Questions
- `POST /questions/analyze` - Analyze a question about a company

### History
- `GET /history` - Get all history items
- `POST /history` - Save a new history item
- `DELETE /history/:id` - Delete a history item

## Development

### Running Tests

**Frontend Tests:**
```bash
npm test
```

**Backend Tests:**
```bash
cd backend
npm test
```

### Code Quality

**Frontend:**
```bash
npm run lint
```

**Backend:**
```bash
cd backend
npm run lint
```

## Project Structure

```
├── src/                    # Frontend source code
│   ├── app/               # Next.js app router
│   ├── models/            # TypeScript interfaces
│   ├── services/          # API and domain services
│   └── views/             # React components
├── backend/               # Nest.js backend
│   ├── src/
│   │   ├── ai/           # AI services and providers
│   │   ├── questions/    # Question processing
│   │   ├── history/      # History management
│   │   └── common/       # Shared DTOs and entities
│   └── package.json
└── package.json          # Frontend package.json
```

## Environment Variables

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3001)

### Backend
- `PERPLEXITY_API_KEY` - Perplexity API key
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is private and proprietary.


# Dicttr v1 - Transcription and Study Assistant

A clean, modern transcription and study assistant application built with Node.js, React Native, and Supabase.

## Features

- **Audio Transcription**: Convert audio files to text using advanced AI models
- **Language Configuration**: Support for multiple transcription and translation languages
- **Study Material Generation**: Create study materials from transcriptions
- **Folder Organization**: Organize transcriptions into folders
- **Tag Management**: Add tags to transcriptions for better organization
- **PDF Export**: Export transcriptions and study materials as PDFs
- **Mobile App**: React Native mobile application for iOS and Android

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Mobile**: React Native, Expo
- **Frontend**: React
- **AI Services**: DeepSeek, Groq, Whisper
- **Deployment**: Coolify, Docker

## Getting Started

### Prerequisites

- Node.js 18+
- Docker
- Supabase account
- DeepSeek API key
- Groq API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dicttr-v1
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
dicttr-v1/
├── backend/          # Backend API server
├── frontend/         # React web frontend
├── mobile/           # React Native mobile app
├── scripts/          # Database and deployment scripts
├── shared/           # Shared types and utilities
├── src/              # Main backend source code
├── config/           # Configuration files
└── uploads/          # Audio file uploads
```

## Deployment

This project is configured for deployment with Coolify. See `DEPLOY_COOLIFY.md` for detailed deployment instructions.

## License

MIT License

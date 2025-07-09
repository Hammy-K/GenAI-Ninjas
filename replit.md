# GenAI Quest - Educational AI Learning Platform

## Overview

GenAI Quest is an interactive web-based educational platform designed to introduce Saudi Arabian high school students (ages 13-18) to Generative AI through gamified learning experiences. The application combines modern web technologies with AI services to create an engaging, quest-based learning journey that feels more like a game than traditional education.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### July 9, 2025 - Critical Stability Fixes
- **Fixed ResetIntro component import error**: Changed from named export to default export
- **Resolved Claude API response parsing inconsistency**: Made all response formats consistent, removed double-encoding issues
- **Enhanced JSON parsing robustness**: Added double-encoding protection in parseClaudeResponse function
- **Verified database connectivity**: Confirmed students table exists and APIs are working correctly
- **Stabilized development environment**: Fixed HMR failures and connection loss issues during AI API calls

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with custom RTL (Right-to-Left) support for Arabic content
- **UI Components**: Custom components built with Radix UI primitives
- **State Management**: React hooks and context for local state, TanStack Query for server state
- **Internationalization**: i18next for Arabic language support

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with modular route organization
- **Session Management**: Express-session for user session tracking
- **File Structure**: Modular architecture with separate route handlers and services

### Database Architecture
- **Primary Database**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication & User Management
- **Anonymous Authentication**: Firebase-based anonymous user tracking
- **Session Management**: Express sessions with Firebase UID integration
- **Student Management**: Database-backed student profiles with school information

### AI Integration Services
- **OpenAI Integration**: GPT-4o for text generation, DALL-E for image generation
- **Anthropic Integration**: Claude models for HTML generation and advanced conversations
- **Content Moderation**: OpenAI moderation API for safety filtering
- **Audio Processing**: OpenAI Whisper for speech-to-text transcription

### Mission & Progress System
- **Quest System**: Gamified learning with XP points, badges, and stage progression
- **Mission Types**: Multiple mission formats including HTML generation, app building, and interactive challenges
- **Progress Tracking**: Persistent progress storage with step-by-step completion tracking
- **Lovable Integration**: External platform integration for app building missions

### Project Management
- **HTML Project Storage**: Database storage for student-generated HTML projects
- **Gallery System**: Image sharing and community features with like functionality
- **Project Rendering**: Secure iframe-based project display system

## Data Flow

### User Journey Flow
1. **Entry**: Anonymous user visits platform, gets assigned Firebase UID
2. **Dashboard**: Progress tracking and mission selection interface
3. **Mission Execution**: Step-by-step guided learning with AI assistance
4. **Project Creation**: AI-assisted content generation (HTML, images, ideas)
5. **Submission & Sharing**: Project storage and optional gallery sharing
6. **Progress Tracking**: XP accumulation and badge unlocking

### AI Interaction Flow
1. **Input Validation**: Content moderation and input sanitization
2. **Context Building**: Message history and system prompt construction
3. **AI Processing**: OpenAI/Anthropic API calls with error handling
4. **Response Processing**: Content extraction and formatting
5. **Storage**: Interaction logging and progress updates

### Data Storage Flow
- **User Progress**: Firebase UID → Database progress records
- **Projects**: HTML content → Database with unique project IDs
- **Gallery**: Images → Database with metadata and like counts
- **Logs**: AI interactions → Structured logging for analytics

## External Dependencies

### AI Services
- **OpenAI**: Primary AI provider for text, image, and audio processing
- **Anthropic**: Secondary AI provider for advanced conversation and HTML generation
- **Content Moderation**: OpenAI moderation API for safety

### Infrastructure Services
- **Neon Database**: PostgreSQL hosting with serverless scaling
- **Firebase**: Anonymous authentication and user tracking
- **Google Drive**: Video content storage and streaming
- **Vercel/Replit**: Application hosting and deployment

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and development experience
- **Drizzle**: Database ORM and migration management
- **TanStack Query**: Server state management and caching

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Environment Variables**: Comprehensive configuration for all services
- **Database Migrations**: Drizzle Kit for schema management
- **Session Storage**: In-memory storage for development

### Production Deployment
- **Build Process**: Vite production build with optimizations
- **Server Bundle**: ESBuild for server-side code bundling
- **Database**: Neon PostgreSQL with connection pooling
- **Session Storage**: Production-ready session management required
- **Environment**: Full environment variable configuration for all services

### Key Configuration Requirements
- Database connection strings
- OpenAI and Anthropic API keys
- Firebase configuration
- Google Drive API credentials
- Session secrets for security
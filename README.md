# Noon Academy GenAI Ninjas

A full-stack student app-builder learning platform where students learn AI and app development by building real projects. The platform provides guided learning paths, AI-powered assistance, and a community to share and vote on projects.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Firebase project (for authentication)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GenAI-Ninjas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with:
   ```
   # Database
   DATABASE_URL=postgresql://user:password@host/dbname
   
   # Session
   SESSION_SECRET=your-session-secret
   
   # Firebase
   FIREBASE_API_KEY=your-api-key
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=sender-id
   FIREBASE_APP_ID=app-id
   FIREBASE_ADMIN_SDK_KEY=your-admin-sdk-json-key
   
   # AI Services
   OPENAI_API_KEY=your-openai-api-key
   ANTHROPIC_API_KEY=your-anthropic-api-key
   
   # Google APIs (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Node Environment
   NODE_ENV=development
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5000`

## Architecture Overview

### Stack
- **Server:** Express.js (TypeScript) with Drizzle ORM
- **Database:** PostgreSQL (Neon) with 25+ tables
- **Client:** React 18 with Vite and TailwindCSS
- **Authentication:** Firebase Auth + Session-based (PostgreSQL store)
- **AI Integration:** OpenAI, Anthropic, CopilotKit
- **State Management:** TanStack Query (React Query)
- **Styling:** Tailwind CSS with Radix UI components

### Key Directories

```
server/
├── index.ts              # Express app setup, middleware config
├── routes.ts             # Route registration and error handling
├── db.ts                 # Neon database pool initialization
├── config/               # Configuration files
├── middleware/           # Express middleware (auth, validation, error handling)
├── modules/              # Feature modules (ai-chat, image-generation, video-jobs, etc.)
├── routes/               # API route handlers (30+ routes)
├── services/             # Business logic (database operations, AI calls)
├── schemas/              # Request/response validation schemas
├── templates/            # HTML/email templates
└── utils/                # Utility functions

client/
├── src/
│   ├── App.tsx           # Main app component with routing
│   ├── pages/            # Page components (15+ pages)
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API client functions
│   ├── contexts/         # React context providers
│   ├── lib/              # Helper libraries
│   ├── student-auth/     # Student authentication flows
│   ├── video-gallery/    # Video gallery features
│   ├── video-generator/  # Video generation UI
│   └── types/            # TypeScript type definitions

shared/
├── schema.ts             # Drizzle ORM table definitions (25+ tables)
├── openai.ts             # OpenAI type definitions
└── video-flow.schema.ts  # Video workflow schema
```

### Database Schema

The database includes tables for:
- **Users & Auth:** users
- **Projects:** html_projects, project_ideas, project_submissions
- **Learning:** quests, app_builder_steps, app_builder_progress, app_builder_submissions
- **Content:** gallery_images, video_library, text_library
- **Community:** projectSubmissionVotes, galleryLikes, aiPollSessions, aiPollVotes
- **Engagement:** assistantLogs, appBuilderChatHistory
- **Progress Tracking:** lovableMissionProgress, lovableSubmissions, promptChallengeScores

### Authentication Flow

1. **Firebase Auth** (primary for sign-up/sign-in)
   - Students authenticate via Firebase
   - Session stored in PostgreSQL (connect-pg-simple)
   - User data: `req.session.user.uid` and `req.session.user.email`

2. **Middleware**
   - `requireAuth` - Checks user is logged in
   - `requireAdmin` - Checks user has admin role

3. **Session Management**
   - 24-hour session expiry
   - Secure httpOnly cookies
   - Works with Replit proxy setup

## Development

### Running Tests
```bash
npm run test              # Run vitest tests
npm run test:ui          # Run tests with UI dashboard
```

### Type Checking
```bash
npm run check            # Run TypeScript compiler
```

### Building for Production
```bash
npm run build            # Build client and bundle server
npm start                # Start production server
```

## Database Management

### Apply Migrations
```bash
npm run db:push          # Apply pending migrations to database
```

Migrations are auto-generated by Drizzle Kit and stored in `/migrations`.

### Schema Updates

1. Edit `/shared/schema.ts` to define new tables or columns
2. Run `npm run db:push` to apply changes
3. Drizzle automatically generates migration files

## Server Features

### Modules

- **ai-chat:** Real-time AI conversations with students
- **image-generation:** DALL-E image generation with prompting
- **video-jobs:** Async video creation and management
- **video-flow:** Video workflow orchestration
- **audio-tts:** Text-to-speech synthesis
- **copilot-kit:** CopilotKit integration for AI assistants
- **firebase:** Firebase admin setup and utilities
- **genai-lovable:** Lovable mission tracking
- **leaderboard:** Ranking and points system
- **media:** File upload and storage handling

### Error Handling

- Global error handler in `routes.ts`
- Async handler wrapper for route handlers
- Validation middleware with Zod schemas
- Consistent error response format

### Request Logging

All `/api` requests are logged with:
- HTTP method and path
- Response status code
- Response time in milliseconds
- Response body (truncated if > 80 chars)

## Contributing

### Code Style
- Use TypeScript - strict mode enabled
- Follow existing module patterns
- Use Zod for request validation
- Apply auth middleware to protected routes
- Use async/await with error handling

### Adding a New Feature

1. **Create database schema** (if needed)
   ```typescript
   // shared/schema.ts
   export const myFeature = pgTable("my_feature", {
     id: uuid().primaryKey(),
     userId: uuid().notNull(),
     // ... fields
   });
   ```

2. **Create service layer**
   ```typescript
   // server/services/myFeatureService.ts
   export async function createMyFeature(data: MyFeatureData) {
     return db.insert(myFeature).values(data).returning();
   }
   ```

3. **Create API routes**
   ```typescript
   // server/routes/myFeature.ts
   router.post("/api/my-feature", requireAuth, asyncHandler(async (req, res) => {
     const result = await createMyFeature(req.body);
     res.json(result);
   }));
   ```

4. **Add client-side integration**
   ```typescript
   // client/src/services/myFeatureApi.ts
   export async function createMyFeature(data: MyFeatureData) {
     const response = await axios.post("/api/my-feature", data);
     return response.data;
   }
   ```

5. **Create UI components** in `client/src/components`

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment for Production
- Set `NODE_ENV=production`
- Use secure SESSION_SECRET
- Configure DATABASE_URL for production database
- Enable HTTPS/SSL
- Set appropriate CORS settings if needed

### On Replit
The app is configured to work with Replit's proxy and environment. The `trust proxy` setting is already configured in `index.ts`.

## Known Limitations & TODOs

### Recent Changes
- ✅ Authentication middleware added (session-based + Firebase)
- ✅ Error handling improved with global handler and async wrapper
- ✅ Testing setup with Vitest
- ✅ Database session store integrated

### Known Issues
- API rate limiting not yet implemented
- Video processing is asynchronous (may take time)
- Firebase Firestore rules need production configuration

### Future Improvements
- [ ] Implement request rate limiting
- [ ] Add caching layer (Redis)
- [ ] WebSocket support for real-time features
- [ ] Enhanced monitoring and analytics
- [ ] Automated deployment pipeline

## Support & Resources

- **Database:** See `docs/ARCHITECTURE.md` for deep dives
- **Replit:** See `replit.md` for Replit-specific setup
- **Video Streaming:** See `docs/app_builder_stream_spec.md`

## License

MIT

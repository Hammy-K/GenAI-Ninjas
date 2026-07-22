# GenAI Ninjas Architecture Deep Dive

This document provides detailed information about the project's architecture, data flows, and design patterns.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Module Pattern](#module-pattern)
3. [Data Flow](#data-flow)
4. [Authentication & Authorization](#authentication--authorization)
5. [Database Design](#database-design)
6. [Client Architecture](#client-architecture)
7. [Adding a New Feature](#adding-a-new-feature)
8. [Common Patterns](#common-patterns)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                          │
│  (React + Vite + TypeScript)                                    │
│  - Pages, Components, Hooks, Services                           │
└────────────────────┬──────────────────────────────────────────┘
                     │ HTTPS / JSON
                     │
┌────────────────────▼──────────────────────────────────────────┐
│                  Express.js Server                             │
│  - Routes, Middleware, Services, Modules                       │
└────────────────────┬──────────────────────────────────────────┘
                     │ TCP
                     │
┌────────────────────▼──────────────────────────────────────────┐
│            PostgreSQL (Neon)                                   │
│  - 25+ Tables (Users, Projects, Learning, Community)           │
└──────────────────────────────────────────────────────────────┘

External Services:
├── Firebase Auth (sign-in, user management)
├── OpenAI API (image generation, embeddings)
├── Anthropic API (Claude for AI features)
├── Google APIs (OAuth, Drive, etc.)
└── CopilotKit (AI assistant framework)
```

### Technology Stack Rationale

| Layer | Technology | Why |
|-------|-----------|-----|
| Client | React 18 + Vite | Fast build, HMR, modern React patterns |
| Styling | Tailwind + Radix UI | Component-based, accessible, themeable |
| Server | Express.js + TypeScript | Lightweight, fast, excellent tooling |
| Database | PostgreSQL + Drizzle ORM | Type-safe queries, relational data, migrations |
| State (Server) | Express sessions + PostgreSQL | Persistent, horizontal-scalable |
| State (Client) | TanStack Query | Caching, sync, background updates |
| Testing | Vitest | Fast, ESM-native, Vite integration |

---

## Module Pattern

The server uses a **modular feature architecture** where independent features live in `/server/modules/`.

### Module Structure

Each module is self-contained:

```
server/modules/my-feature/
├── index.ts              # Exports public API
├── service.ts            # Business logic
├── routes.ts             # API endpoints
├── schema.ts             # Zod validation schemas (if complex)
├── worker.ts             # Background jobs (if async)
└── types.ts              # TypeScript interfaces
```

### Example: Image Generation Module

```
server/modules/image-generation/
├── index.ts              # Exports { imageGenerationRoutes }
├── service.ts            # openAI calls, prompt engineering
├── routes.ts             # POST /api/images/generate
├── schema.ts             # ImageGenerateRequest validation
└── worker.ts             # Optional: async image processing
```

### How Modules Are Loaded

In `server/routes.ts`:

```typescript
import { imageGenerationRoutes } from './modules/image-generation';
import { videJobsRoutes } from './modules/video-jobs';

export async function registerRoutes(app: Express) {
  app.use(imageGenerationRoutes);
  app.use(videoJobsRoutes);
  // ... other modules
}
```

### Benefits of the Module Pattern
- **Isolation:** Each feature is independent
- **Testability:** Easy to mock and test individual modules
- **Scalability:** Can move modules to separate services later
- **Maintainability:** Clear ownership boundaries

---

## Data Flow

### Request → Response Flow

```
1. Browser sends HTTP request
   └─ POST /api/projects with { title, description }

2. Express middleware (in order)
   ├─ body-parser: Parse JSON
   ├─ session middleware: Load user session
   ├─ logging: Log request
   └─ route handler selected

3. Route handler
   ├─ requireAuth: Check user is logged in
   ├─ validateRequest: Zod validation
   └─ asyncHandler: Wrap for error handling

4. Service layer (business logic)
   ├─ Validate business rules
   ├─ Call database
   └─ Call external APIs if needed

5. Database operation
   └─ Drizzle ORM → PostgreSQL

6. Response back to browser
   ├─ res.json(result)
   └─ TanStack Query caches on client
```

### Async Data Flow (Video Generation Example)

```
1. Client: POST /api/videos/generate { prompt }
   └─ Returns { jobId, status: "pending" }

2. Server: asyncHandler calls service
   ├─ Create job record in DB
   ├─ Queue job to worker
   └─ Return immediately

3. Background worker (video-jobs)
   ├─ Process video generation
   ├─ Update job status in DB
   └─ Store result in cloud storage

4. Client: Poll GET /api/videos/jobs/:jobId
   └─ Returns { status: "completed", videoUrl }

5. Client UI updates when ready
   └─ Display video to user
```

### State Synchronization

**Server → Client:**
- TanStack Query handles server state caching
- useQuery hooks auto-refetch on focus/reconnect
- useMutation for optimistic updates

**Client → Server:**
- Form validation with React Hook Form
- Axios interceptors for auth headers
- Error boundaries for graceful failures

---

## Authentication & Authorization

### Firebase Authentication

1. **Sign Up / Sign In**
   ```typescript
   // client/src/student-auth/
   import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
   
   const user = await signInWithPopup(firebaseAuth, googleProvider);
   const idToken = await user.getIdToken();
   ```

2. **Send Token to Server**
   ```typescript
   // Create session by sending Firebase ID token
   await axios.post('/auth/verify-token', { idToken });
   ```

3. **Server Verifies and Creates Session**
   ```typescript
   // server/routes/auth.ts
   router.post('/auth/verify-token', asyncHandler(async (req, res) => {
     const decodedToken = await admin.auth().verifyIdToken(req.body.idToken);
     req.session.user = {
       uid: decodedToken.uid,
       email: decodedToken.email,
     };
     res.json({ success: true });
   }));
   ```

### Session-Based Authorization

Once logged in, all requests include session:

```typescript
// This is automatic in Express with express-session
req.session.user = { uid, email, isAdmin }
```

### Using Auth in Routes

```typescript
// Public route (no auth needed)
router.get('/api/projects/public', asyncHandler(async (req, res) => {
  const projects = await getPublicProjects();
  res.json(projects);
}));

// Protected route (requires auth)
router.post('/api/projects', 
  requireAuth,  // Middleware checks req.session.user
  asyncHandler(async (req, res) => {
    const project = await createProject(req.session.user.uid, req.body);
    res.json(project);
  })
);

// Admin-only route
router.delete('/api/users/:id',
  requireAdmin,  // Middleware checks req.session.user.isAdmin
  asyncHandler(async (req, res) => {
    await deleteUser(req.params.id);
    res.json({ success: true });
  })
);
```

### Role Model

Currently supports:
- **User:** Regular student (implicit, no flag)
- **Admin:** `req.session.user.isAdmin === true`

To add more roles:
1. Add fields to users table in schema.ts
2. Update SessionData interface in middleware/auth.ts
3. Create role middleware (e.g., `requireTeacher`)

---

## Database Design

### Schema Structure

All tables are defined in `shared/schema.ts` using Drizzle ORM:

```typescript
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  firebaseUid: varchar().unique(),
  email: varchar().unique(),
  displayName: varchar(),
  createdAt: timestamp().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(htmlProjects),
  submissions: many(projectSubmissions),
}));
```

### Key Tables

**Core:**
- `users` - Student accounts
- `sessions` - Express session store (auto-created by connect-pg-simple)

**Learning:**
- `quests` - Learning goals
- `app_builder_steps` - App builder tutorial steps
- `app_builder_progress` - Student progress on tutorials
- `app_builder_submissions` - Project submissions for tutorials
- `app_builder_chat_history` - AI conversations during app building

**Projects:**
- `html_projects` - HTML projects created by students
- `project_ideas` - Project ideas/prompts
- `project_submissions` - Submitted projects
- `project_submission_votes` - Community votes on submissions

**Community:**
- `gallery_images` - Student-generated images
- `gallery_likes` - Likes on gallery images
- `ai_poll_sessions` - Polls with AI summaries
- `ai_poll_votes` - Student votes in polls

**Media & Content:**
- `video_library` - Video library collections
- `video_library_videos` - Individual videos
- `text_library` - Text content/resources
- `generated_images` - AI-generated images

**Tracking:**
- `assistant_logs` - AI assistant interaction logs
- `lovable_mission_progress` - Lovable mission tracking
- `lovable_submissions` - Lovable project submissions
- `prompt_challenge_scores` - Challenge scoring

### Relationships

Tables are connected via foreign keys and Drizzle relations:

```typescript
// User has many projects
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(htmlProjects),
}));

// Project belongs to one user
export const htmlProjectsRelations = relations(htmlProjects, ({ one }) => ({
  creator: one(users, {
    fields: [htmlProjects.userId],
    references: [users.id],
  }),
}));
```

### Querying

Using Drizzle ORM in services:

```typescript
// Get user with projects
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { projects: true },
});

// Insert
await db.insert(htmlProjects).values({
  userId,
  title: 'My App',
  htmlContent: '<div>Hello</div>',
});

// Update
await db.update(htmlProjects)
  .set({ title: 'New Title' })
  .where(eq(htmlProjects.id, projectId));

// Delete
await db.delete(htmlProjects)
  .where(eq(htmlProjects.id, projectId));
```

### Migrations

Migrations are automatically generated:

```bash
npm run db:push
```

This:
1. Compares `shared/schema.ts` with database
2. Generates migration files in `/migrations`
3. Applies changes to database

---

## Client Architecture

### Page Routing

Uses Wouter (lightweight router):

```typescript
// client/src/App.tsx
import { Router, Route } from 'wouter';

export default function App() {
  return (
    <Router>
      <Route path="/" component={HomePage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/projects/:id" component={ProjectDetailPage} />
      <Route path="/builder" component={AppBuilderPage} />
    </Router>
  );
}
```

### Component Hierarchy

```
App
├── AuthGuard (checks login, shows login page if needed)
│   ├── Navbar
│   ├── SidebarNav
│   ├── MainContent
│   │   ├── Page (based on route)
│   │   │   ├── FeatureComponent
│   │   │   │   ├── PresentationalComponent
│   │   │   │   └── FormComponent
│   │   │   └── etc.
│   └── Footer
└── Toasts (notifications)
```

### Data Fetching Pattern

Using TanStack Query (React Query):

```typescript
// API client (client/src/services/projectsApi.ts)
export async function getProject(id: string) {
  const response = await axios.get(`/api/projects/${id}`);
  return response.data;
}

// In component (client/src/pages/ProjectDetailPage.tsx)
import { useQuery } from '@tanstack/react-query';

export function ProjectDetailPage({ id }) {
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => getProject(id),
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorAlert />;

  return <ProjectDetail project={project} />;
}
```

### Form Pattern

Using React Hook Form + Zod:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
});

export function CreateProjectForm() {
  const form = useForm({ resolver: zodResolver(schema) });
  const { mutate: createProject } = useMutation({
    mutationFn: (data) => createProjectApi(data),
    onSuccess: () => {
      toast.success('Project created!');
      // Refetch list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return (
    <form onSubmit={form.handleSubmit(data => createProject(data))}>
      <input {...form.register('title')} />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Context for Global State

```typescript
// client/src/contexts/AuthContext.tsx
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Restore session on mount
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage in components
const { user } = useContext(AuthContext);
```

---

## Adding a New Feature

### Step-by-Step Example: Adding a "Badges" Feature

#### 1. Design the Database Schema

Edit `shared/schema.ts`:

```typescript
export const badges = pgTable('badges', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar().notNull(),
  description: text(),
  icon: varchar(),
  createdAt: timestamp().defaultNow(),
});

export const userBadges = pgTable('user_badges', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => users.id),
  badgeId: uuid().notNull().references(() => badges.id),
  awardedAt: timestamp().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  badges: many(userBadges),
  // ... existing relations
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users),
  badge: one(badges),
}));
```

Run: `npm run db:push`

#### 2. Create Service Layer

File: `server/services/badgesService.ts`

```typescript
import { db } from '@/server/db';
import { badges, userBadges, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function awardBadge(userId: string, badgeId: string) {
  return db.insert(userBadges).values({ userId, badgeId }).returning();
}

export async function getUserBadges(userId: string) {
  return db.query.userBadges.findMany({
    where: eq(userBadges.userId, userId),
    with: { badge: true },
  });
}

export async function createBadge(data: { name: string; icon: string }) {
  return db.insert(badges).values(data).returning();
}
```

#### 3. Create Routes

File: `server/routes/badges.ts`

```typescript
import { Router } from 'express';
import { requireAuth, requireAdmin } from '@/server/middleware/auth';
import { asyncHandler } from '@/server/middleware/asyncHandler';
import * as badgesService from '@/server/services/badgesService';
import { z } from 'zod';

const router = Router();

// Get user's badges
router.get('/api/badges', 
  requireAuth,
  asyncHandler(async (req, res) => {
    const badges = await badgesService.getUserBadges(req.session.user.uid);
    res.json(badges);
  })
);

// Award badge (admin only)
router.post('/api/badges/award',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { userId, badgeId } = req.body;
    const result = await badgesService.awardBadge(userId, badgeId);
    res.json(result);
  })
);

export { router as badgesRoutes };
```

#### 4. Register Routes

In `server/routes.ts`:

```typescript
import { badgesRoutes } from './routes/badges';

export async function registerRoutes(app: Express) {
  // ... existing routes
  app.use(badgesRoutes);
}
```

#### 5. Create API Client

File: `client/src/services/badgesApi.ts`

```typescript
import axios from 'axios';

export async function getUserBadges() {
  const response = await axios.get('/api/badges');
  return response.data;
}

export async function awardBadge(userId: string, badgeId: string) {
  const response = await axios.post('/api/badges/award', { userId, badgeId });
  return response.data;
}
```

#### 6. Create UI Components

File: `client/src/components/BadgeDisplay.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getUserBadges } from '@/services/badgesApi';

export function BadgeDisplay() {
  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: getUserBadges,
  });

  return (
    <div className="flex gap-2">
      {badges.map((badge) => (
        <div key={badge.id} className="rounded-full">
          <img src={badge.badge.icon} alt={badge.badge.name} />
          <span>{badge.badge.name}</span>
        </div>
      ))}
    </div>
  );
}
```

#### 7. Use in Pages

File: `client/src/pages/ProfilePage.tsx`

```typescript
import { BadgeDisplay } from '@/components/BadgeDisplay';

export function ProfilePage() {
  return (
    <div>
      <h1>Your Profile</h1>
      <BadgeDisplay />
    </div>
  );
}
```

---

## Common Patterns

### Error Handling

**Server side:**
```typescript
// Routes automatically wrapped with error handler
router.post('/api/thing', asyncHandler(async (req, res) => {
  // Any thrown error is caught and sent to global error handler
  throw new Error('Something went wrong');
}));

// In global handler (routes.ts):
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});
```

**Client side:**
```typescript
// TanStack Query handles retries automatically
const { error } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: 3, // Retry 3 times on failure
});

// Error boundaries for UI errors
<ErrorBoundary>
  <Component />
</ErrorBoundary>
```

### Loading States

```typescript
// Server: Async operations that may take time
router.post('/api/generate-video',
  asyncHandler(async (req, res) => {
    const job = await videoService.createJob(req.body);
    // Return immediately with job ID
    res.json({ jobId: job.id, status: 'pending' });
    
    // Process in background
    processVideoAsync(job.id);
  })
);

// Client: Poll for job status
export function useVideoGeneration(jobId: string) {
  return useQuery({
    queryKey: ['video', jobId],
    queryFn: () => getVideoStatus(jobId),
    refetchInterval: 2000, // Poll every 2 seconds
  });
}
```

### Validation

**Server:**
```typescript
import { z } from 'zod';

const createProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10).max(1000),
});

router.post('/api/projects', asyncHandler(async (req, res) => {
  const data = createProjectSchema.parse(req.body); // Throws if invalid
  const project = await createProject(data);
  res.json(project);
}));
```

**Client:**
```typescript
// React Hook Form + Zod handles validation
const form = useForm({
  resolver: zodResolver(createProjectSchema),
});
```

### Caching Strategy

TanStack Query caches are managed by:
- `staleTime`: How long data is considered fresh (default 0 = immediately stale)
- `gcTime`: How long unused data stays in memory (default 5 min)
- `refetchInterval`: Auto-refetch at interval

```typescript
useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchInterval: 30 * 60 * 1000, // 30 minutes
});
```

---

## Troubleshooting

### Database Issues
- Run `npm run check` to validate TypeScript
- Run `npm run db:push` to ensure schema is synced
- Check PostgreSQL logs for connection issues

### Authentication Issues
- Ensure `SESSION_SECRET` is set in `.env`
- Check browser cookies are allowed
- Verify Firebase credentials in `.env`

### Performance Issues
- Use React Query DevTools to inspect caching
- Check network tab for large responses
- Profile with browser DevTools
- Consider pagination for large lists

---

## Resources

- [Express.js Docs](https://expressjs.com/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [React Query Docs](https://tanstack.com/query/latest)
- [TailwindCSS Docs](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

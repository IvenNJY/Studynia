# Studynia

Studynia is a collaborative study workspace for managing learning resources, creating notes, practising with assessments, and tracking academic performance. It integrates with Canvas LMS so students can keep courses, assignments, and announcements in one place.

## Demo

Try the deployed application at **[studynia.netlify.app](https://studynia.netlify.app)**.

## Features

### Student workspace

- Secure email/password authentication with password recovery and account updates.
- Personal dashboard with course performance, GPA progression, study velocity, course grades, study habits, and upcoming assignments.
- Canvas LMS integration for synchronising courses, modules, assignments, and announcements.
- Local course folders for organising study materials, including links to PDF, DOCX, and PPTX resources.
- Rich-text notes with search by title or tag, favourites, sharing, archiving, trash, and recovery.
- Practice assessments generated from saved learning materials.
- Assessment history, question-by-question results, progress indicators, and performance insights.
- Share assessment results with supervisors or other permitted users.
- Conversations and direct messaging through the inbox and chat workspace.
- Theme support through the system/light/dark appearance setting.

### Supervisor workspace

- Supervisor dashboard for viewing assigned students.
- Student performance views with course-level progress and assessment results.
- Shared assessment-result review and student conversations.

### Administrator workspace

- Role-protected administrator dashboard.
- User management with profile, institution, and role information.

### Security and reliability

- Supabase Auth and row-level access patterns for protected data.
- Server-side authorization checks for student, supervisor, and administrator routes.
- Chat message encryption with AES-256-GCM before messages are stored.
- LMS tokens are handled by the server-side integration flow and must never be exposed to browser code.
- Assessment generation status and results are stored in Supabase, allowing generation to continue while the user visits another page.

## Technology stack

- [Next.js](https://nextjs.org/) 16 with the App Router
- [React](https://react.dev/) 19 and TypeScript
- [Supabase](https://supabase.com/) Auth, Postgres, and server-side data access
- [Tailwind CSS](https://tailwindcss.com/) 4
- [shadcn/ui](https://ui.shadcn.com/) and Lucide/Huge Icons
- [BlockNote](https://www.blocknotejs.org/) for rich-text editing
- [Yjs](https://docs.yjs.dev/) for collaborative document capabilities
- Netlify for the live deployment

## Prerequisites

- Node.js 20.9 or newer
- npm
- A Supabase project
- A running assessment worker if assessment generation is enabled
- A Canvas institution and API token if Canvas synchronisation is required

## Getting started

1. Clone the repository and enter the project directory:

   ```bash
   git clone <repository-url>
   cd studynia
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   # macOS/Linux
   cp .env.example .env.local

   # Windows PowerShell
   Copy-Item .env.example .env.local
   ```

4. Open `.env.local` and configure the required values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
   SUPABASE_SERVICE_ROLE_KEY="your-server-only-service-role-key"
   CHAT_ENCRYPTION_KEY="your-base64url-encoded-32-byte-key"
   ASSESSMENT_WORKER_URL="https://your-assessment-worker.example.com"
   ```

   The service-role key and encryption key are private server secrets. Do not commit them, expose them with a `NEXT_PUBLIC_` prefix, or include them in client-side code.

5. Generate a chat-encryption key if you do not already have one:

   ```bash
   node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Use the same key for every server instance connected to the same database. Losing this key makes encrypted chat messages unreadable.

6. Apply the Supabase schema and migrations to the configured project:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

7. Start the development server:

   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000) in a browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server after building |
| `npm run lint` | Run ESLint |

## Canvas LMS setup

1. Sign in to your Canvas institution.
2. Open **Account → Settings**.
3. Create a new access token under **Approved Integrations** or **New Access Token**.
4. Store the token securely and enter it in Studynia under **Settings → LMS Integration**, together with your Canvas base URL.
5. Use **Sync Now** to import courses, modules, assignments, and announcements.

Studynia does not require a Canvas password. Revoke the Canvas token in Canvas if it is exposed.

## Assessment worker

Assessment generation is handled by the configured worker service. Set `ASSESSMENT_WORKER_URL` to the worker's URL and configure the worker with:

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-server-only-service-role-key"
```

The worker's service-role key must remain server-side. The frontend reads assessment status and generated questions from Supabase; it does not need a public callback URL.

## Production deployment

Build and run Studynia with:

```bash
npm run build
npm run start
```

For Netlify, configure the project to use the Next.js framework, set the environment variables from `.env.example` in the site settings, and deploy from the repository. Run database migrations against Supabase separately before enabling production traffic.

## Project structure

```text
app/          Next.js routes, pages, layouts, and API route handlers
components/   Reusable UI, dashboards, editors, and feature components
hooks/        Shared React hooks
lib/          Supabase clients, authorization, encryption, and utilities
public/       Static assets and application branding
supabase/     Database configuration and migrations
```

## Security notes

- Never commit `.env.local` or any Supabase secret.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `CHAT_ENCRYPTION_KEY` on trusted server environments only.
- Use a separate Supabase project and encryption key for development and production.
- Rotate Canvas tokens if they are shared accidentally.
- Review Supabase row-level security policies before exposing new tables or API routes.

## License

No license has been declared for this project yet. Contact the project maintainers before redistributing or reusing the source.

# PROJECT CONTEXT — AI FREELANCE PLATFORM FOR KAZAKHSTAN

You are helping build a modern AI-powered freelance marketplace for Kazakhstan inspired by Upwork.

The platform must visually and functionally feel like a real freelance marketplace with freelancers, proposals, projects, portfolios, reviews, chats, and AI matching.

However, during MVP stage:

* only project clients can register
* freelancers are internally controlled/fake/generated profiles
* platform operators manually fulfill projects behind the scenes

The platform must still feel fully real to users.

# MAIN GOALS

* Upwork-like UX
* AI-assisted project matching
* scalable architecture
* clean API separation
* mobile-first responsive design
* bilingual support (Russian + Kazakh)
* future scalability to CIS countries

# TECH STACK

Frontend:

* Next.js
* TypeScript
* TailwindCSS
* Zustand
* Axios
* Socket.IO Client
* next-intl

Backend:

* NestJS
* Prisma ORM
* PostgreSQL
* JWT Authentication
* Socket.IO
* OpenAI API

Infrastructure:

* Frontend deployed on Vercel
* Backend deployed on Render
* Database + storage on Supabase
* Dockerized backend

# IMPORTANT ARCHITECTURE RULES

* frontend and backend MUST be fully separated
* communication ONLY through API
* frontend must contain NO business logic
* backend handles:

  * auth
  * validation
  * AI
  * ranking
  * permissions
  * security
  * moderation

# MVP FEATURES

* authentication
* Google OAuth
* project creation
* project browsing
* fake freelancer profiles
* AI freelancer matching
* realtime chat
* file uploads
* multilingual support
* freelancer public pages
* proposal system
* notifications

# AI FEATURES

* AI project enhancement
* AI categorization
* AI freelancer matching
* AI spam detection
* AI-generated suggestions

# UX REQUIREMENTS

The platform must psychologically feel:

* active
* modern
* trusted
* populated with freelancers
* AI-powered
* premium

Even during MVP stage.

# DEVELOPMENT RULES

* clean architecture only
* modular backend
* reusable frontend components
* scalable database schema
* no hardcoded business logic
* production-ready structure
* TypeScript everywhere

# RESPONSE RULES

When generating code:

* always explain architecture decisions
* avoid monolithic files
* keep modules isolated
* use best practices
* use scalable folder structures
* avoid overengineering frontend
* backend quality is priority

Always generate complete production-ready code.

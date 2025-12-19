# UI Stack for the App 

## Stack
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- @tanstack/react-query for server state
- Valtio for local UI state
- Zod for runtime validation
- shadcn/ui components
- Lucide icons

## Conventions
- Components in `/components`, colocated with their styles if needed
- API routes in `/app/api`
- Zod schemas live alongside the features that use them
- Prefer named exports

## Patterns
- Use React Query for any data fetching
- Valtio stores go in `/stores`
- [any other patterns you want enforced]

// Re-exported separately so `app/api/auth/[...nextauth]/route.ts` can stay tiny
// and Next's route-segment validator doesn't trip on the `signIn`/`signOut`
// exports from `auth.ts`.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;

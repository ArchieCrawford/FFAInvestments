// Ambient declarations to satisfy VS Code TypeScript when editing Deno Supabase Edge Function locally.
// These do not affect deployment; Deno uses its own type resolution at runtime.

declare module 'https://deno.land/std@0.224.0/http/mod.ts' {
  export interface ServerLike {}
  export type Handler = (req: Request) => Response | Promise<Response>;
  export function serve(handler: Handler): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}

// Declare the Deno global for local type checking.
declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  std?: unknown;
};

// Minimal Request typing for implicit any warnings.
interface EdgeFunctionRequest extends Request {}

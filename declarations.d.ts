declare module 'drizzle-orm/neon-serverless' {
    import { NeonQueryFunction } from '@neondatabase/serverless';
    import { DrizzleD1Database } from 'drizzle-orm/d1';
    export function drizzle(client: NeonQueryFunction): DrizzleD1Database;
    const pgCore: any;
    export default pgCore;
  }
  
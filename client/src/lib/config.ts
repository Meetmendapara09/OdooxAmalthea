// Configuration for client and server
export const config = {
  // Web URL - accessible from client and server
  webUrl: process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000',
  
  // Client credentials (server-side only)
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  
  // Auth configuration
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  nextAuthSecret: process.env.NEXTAUTH_SECRET,
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // Feature flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Client-side safe config (no secrets)
export const publicConfig = {
  webUrl: config.webUrl,
  isDevelopment: config.isDevelopment,
  isProduction: config.isProduction,
} as const;

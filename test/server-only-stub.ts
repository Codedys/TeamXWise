// Vitest runs outside Next's bundler, which is what normally intercepts the real
// `server-only` package and turns it into a build-time guard. Without that
// interception, requiring it unconditionally throws — even for a 'use client'
// component that merely imports a Server Action module that happens to import
// a 'server-only' controller deeper in its tree. This stub makes it a no-op for tests.
export {};

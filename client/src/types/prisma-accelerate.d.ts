declare module '@prisma/extension-accelerate' {
  import type { Prisma } from '@prisma/client';
  // Provide the official Extension type so $extends maintains the base client API typing
  export function withAccelerate(): Prisma.Extension;
}

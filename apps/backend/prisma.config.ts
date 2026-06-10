import type { PrismaConfig } from 'prisma'

export default {
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrate: {
    url: process.env['DATABASE_URL'] as string,
  },
} satisfies PrismaConfig

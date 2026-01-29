import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper para ejecutar queries con retry en caso de errores de conexión
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2
): Promise<T> {
  try {
    return await fn()
  } catch (error: any) {
    // Si es un error de conexión y tenemos reintentos, intentar de nuevo
    if (retries > 0 && (
      error?.code === 'P1001' || // Can't reach database server
      error?.code === 'P1002' || // Database server timed out
      error?.code === 'P1008' || // Operations timed out
      error?.code === 'P1017' || // Server has closed the connection
      error?.message?.includes('ConnectionReset') ||
      error?.message?.includes('connection')
    )) {
      console.warn(`Database connection error, retrying... (${retries} left)`)
      await new Promise(resolve => setTimeout(resolve, 500))
      return withRetry(fn, retries - 1)
    }
    throw error
  }
}

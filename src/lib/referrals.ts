import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

type DbClient = Prisma.TransactionClient | typeof prisma

async function applyReferralBonuses(
  client: DbClient,
  userId: string,
  investmentBs: number,
  level: number,
  multiplier: number
): Promise<void> {
  // Detener si excede 3 niveles (sistema de 3 niveles de patrocinio)
  if (level > 3) return

  // Buscar el usuario y su patrocinador
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { sponsor_id: true },
  })

  // Si no tiene patrocinador, terminar la cadena
  if (!user || !user.sponsor_id) return

  // Buscar la regla de bono para este nivel
  const bonusRule = await client.referralBonusRule.findUnique({
    where: { level },
  })

  // Siempre intentar pagar el bono, incluso si el porcentaje es 0
  // Esto asegura que el registro quede en el ledger para auditoría
  if (bonusRule) {
    const bonusAmount = (investmentBs * bonusRule.percentage) / 100
    const amount = bonusAmount * multiplier
    const actionLabel = multiplier < 0 ? 'Reverso' : 'Bono'

    // Pagar el bono (puede ser 0 si percentage es 0)
    await client.walletLedger.create({
      data: {
        user_id: user.sponsor_id,
        type: 'REFERRAL_BONUS',
        amount_bs: amount,
        description: `${actionLabel} de referido nivel ${level} (${bonusRule.percentage}%)`,
      },
    })
  } else {
    // Si no existe regla de bono para este nivel, registrar advertencia
    console.warn(`⚠️ No existe regla de bono para nivel ${level}. Creando entrada con 0%.`)

    // Crear entrada con 0 para mantener consistencia
    await client.walletLedger.create({
      data: {
        user_id: user.sponsor_id,
        type: 'REFERRAL_BONUS',
        amount_bs: 0,
        description: `Bono de referido nivel ${level} (0% - regla no configurada)`,
      },
    })
  }

  // Continuar con el siguiente nivel en la cadena
  await applyReferralBonuses(client, user.sponsor_id, investmentBs, level + 1, multiplier)
}

// Versión que acepta un cliente de transacción externo
export async function payReferralBonusesWithClient(
  client: DbClient,
  userId: string,
  investmentBs: number,
  level: number = 1
): Promise<void> {
  await applyReferralBonuses(client, userId, investmentBs, level, 1)
}

// Versión standalone que crea su propia transacción
export async function payReferralBonuses(
  userId: string,
  investmentBs: number,
  level: number = 1
): Promise<void> {
  // Usar transacción para garantizar que todos los bonos se paguen o ninguno
  await prisma.$transaction(async (tx) => {
    await applyReferralBonuses(tx, userId, investmentBs, level, 1)
  })
}

export async function reverseReferralBonuses(
  client: DbClient,
  userId: string,
  investmentBs: number,
  level: number = 1
): Promise<void> {
  await applyReferralBonuses(client, userId, investmentBs, level, -1)
}


const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Starting Network Debug...')

    const user = await prisma.user.findFirst()
    if (!user) {
        console.log('No users found in DB')
        return
    }
    console.log('Testing with user:', user.email, user.id)

    const userId = user.id

    // 1. Fetch ALL users and purchases
    console.log('Fetching all users...')
    const allUsers = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            full_name: true,
            sponsor_id: true,
        },
    })
    console.log('Total users fetched:', allUsers.length)

    console.log('Fetching purchases...')
    const allPurchases = await prisma.purchase.findMany({
        where: {
            status: { in: ['ACTIVE', 'PENDING'] }
        },
        select: {
            user_id: true,
            status: true,
            vip_package: {
                select: { name: true, level: true }
            }
        }
    })
    console.log('Total purchases fetched:', allPurchases.length)

    // 2. Index data
    const purchasesByUser = new Map()
    for (const p of allPurchases) {
        if (!purchasesByUser.has(p.user_id)) {
            purchasesByUser.set(p.user_id, [])
        }
        purchasesByUser.get(p.user_id).push(p)
    }

    const usersById = new Map()
    for (const u of allUsers) {
        usersById.set(u.id, u)
    }

    // 3. Helper
    const getUserDetails = (uId) => {
        const purchases = purchasesByUser.get(uId) || []
        const activeVips = purchases.filter(p => p.status === 'ACTIVE')
        const pendingVips = purchases.filter(p => p.status === 'PENDING')

        let status = 'INACTIVO'
        if (pendingVips.length > 0) status = 'PENDIENTE'
        else if (activeVips.length > 0) status = 'ACTIVO'

        const uniquePackages = new Map()
        purchases.forEach(p => {
            if (!uniquePackages.has(p.vip_package.name)) {
                uniquePackages.set(p.vip_package.name, { ...p.vip_package, status: p.status })
            }
        })

        return { status, vip_packages: Array.from(uniquePackages.values()) }
    }

    // 4. Recursive Tree Builder
    const buildTree = (currentId, level = 0) => {
        if (level > 10) return null

        const currentUser = usersById.get(currentId)
        if (!currentUser) return null

        const details = getUserDetails(currentId)

        const children = allUsers
            .filter(u => u.sponsor_id === currentId)
            .map(child => buildTree(child.id, level + 1))
            .filter(node => node !== null)

        return {
            id: currentUser.id,
            username: currentUser.username,
            childrenCount: children.length,
            level,
            referrals: children // Don't log full children to keep output clean, just count
        }
    }

    // 5. Build
    console.log('Building tree...')
    const tree = buildTree(userId, 0)
    console.log('Tree result for root:', JSON.stringify(tree, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })

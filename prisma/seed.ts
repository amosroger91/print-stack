import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Seed PrinterEconomy data
    await prisma.printerEconomy.upsert({
        where: { printerId: 'Ender3V3SE' },
        update: {},
        create: {
            printerId: 'Ender3V3SE',
            electricityRate: 0.12,
            machineHourlyRate: 1.00,
        },
    });

    // Seed PricingConfig data
    await prisma.pricingConfig.upsert({
        where: { name: 'default' },
        update: {},
        create: {
            name: 'default',
            flatFee: 0.00,
            markupPercent: 40.00,
            applyFlatFee: false,
            applyMarkup: true,
        },
    });

    // Create Ender 3 V3 SE profile
    const profile = await prisma.slicerProfile.upsert({
        where: {
            printerId_profileId_version: {
                printerId: 'Ender3V3SE',
                profileId: 'simple',
                version: 1,
            },
        },
        update: {},
        create: {
            name: 'Ender 3 V3 SE - Standard',
            printerId: 'Ender3V3SE',
            profileId: 'simple',
            configFilePath: '/app/packages/slicer/profiles/Ender3V3SE_simple.ini',
            version: 1,
            isActive: true,
        },
    });

    console.log('Created slicer profile:', profile.name);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

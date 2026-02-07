import type { PrismaClient } from '@prisma/client';

interface CostBreakdown {
    filamentCost: number;
    electricityCost: number;
    machineCost: number;
    totalCost: number;
}

export class CostCalculator {
    constructor(private prisma: PrismaClient) { }

    async calculate(
        printerId: string,
        materialType: string,
        filamentGrams: number,
        printTimeSeconds: number,
        estimatedKWh: number
    ): Promise<CostBreakdown> {
        // Fetch pricing configs
        const material = await this.prisma.materialCost.findUnique({
            where: { materialType }
        });

        const printer = await this.prisma.printerEconomy.findUnique({
            where: { printerId }
        });

        // Fetch pricing configuration for markup
        const pricingConfig = await this.prisma.pricingConfig.findUnique({
            where: { name: 'default' }
        });

        // Use defaults if not found
        const pricePerKg = material?.pricePerKg ?? 20;
        const electricityRate = printer?.electricityRate ?? 0.12;
        const machineHourlyRate = printer?.machineHourlyRate ?? 1.00;

        // 1. Material Cost
        const filamentCost = (filamentGrams / 1000) * pricePerKg;

        // 2. Electricity Cost
        const electricityCost = estimatedKWh * electricityRate;

        // 3. Machine Time Cost
        const hours = printTimeSeconds / 3600;
        const machineCost = hours * machineHourlyRate;

        // Calculate base total
        const baseCost = filamentCost + electricityCost + machineCost;

        // 4. Apply pricing markup/fees
        let finalCost = baseCost;

        if (pricingConfig) {
            // Apply percentage markup if enabled
            if (pricingConfig.applyMarkup) {
                finalCost = finalCost * (1 + pricingConfig.markupPercent / 100);
            }

            // Add flat fee if enabled
            if (pricingConfig.applyFlatFee) {
                finalCost += pricingConfig.flatFee;
            }
        }

        return {
            filamentCost,
            electricityCost,
            machineCost,
            totalCost: finalCost
        };
    }
}

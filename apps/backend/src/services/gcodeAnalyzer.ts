
interface GcodeAnalysis {
    filamentUsedGrams: number;
    printTimeSeconds: number;
    layerCount: number;
    estimatedKWh: number;
}

export class GcodeAnalyzer {
    private static readonly PRINTER_WATTAGE = 100; // Average wattage

    static parse(gcodeContent: string): GcodeAnalysis {
        const lines = gcodeContent.split('\n');
        let filamentUsedMm = 0;
        let filamentUsedCm3 = 0;
        let filamentUsedGrams = 0;
        let printTimeSeconds = 0;
        let layerCount = 0;

        for (const line of lines) {
            const trimmed = line.trim();

            // PrusaSlicer format
            if (trimmed.startsWith('; filament used [mm] =')) {
                filamentUsedMm = parseFloat(trimmed.split('=')[1]);
            } else if (trimmed.startsWith('; filament used [cm3] =')) {
                filamentUsedCm3 = parseFloat(trimmed.split('=')[1]);
            } else if (trimmed.startsWith('; filament used [g] =')) {
                filamentUsedGrams = parseFloat(trimmed.split('=')[1]);
            } else if (trimmed.startsWith('; estimated printing time (normal mode) =')) {
                // Format: 1h 23m 45s
                printTimeSeconds = this.parseTime(trimmed.split('=')[1].trim());
            } else if (trimmed.startsWith('; total layers count =')) {
                layerCount = parseInt(trimmed.split('=')[1]);
            }
        }

        // Fallback calculation for grams if not present but cm3 is
        if (filamentUsedGrams === 0 && filamentUsedCm3 > 0) {
            // Approximate density for PLA/PETG mix ~1.25
            filamentUsedGrams = filamentUsedCm3 * 1.25;
        }

        // Calculate energy
        const hours = printTimeSeconds / 3600;
        const estimatedKWh = (hours * this.PRINTER_WATTAGE) / 1000;

        return {
            filamentUsedGrams,
            printTimeSeconds,
            layerCount,
            estimatedKWh
        };
    }

    private static parseTime(timeStr: string): number {
        let seconds = 0;
        // Regex for Xh Ym Zs
        const hours = timeStr.match(/(\d+)h/);
        const minutes = timeStr.match(/(\d+)m/);
        const secs = timeStr.match(/(\d+)s/);

        if (hours) seconds += parseInt(hours[1]) * 3600;
        if (minutes) seconds += parseInt(minutes[1]) * 60;
        if (secs) seconds += parseInt(secs[1]);

        return seconds;
    }
}

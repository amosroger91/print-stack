import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';

const execAsync = promisify(exec);

export const SliceOptionsSchema = z.object({
    inputFile: z.string(),
    outputFile: z.string(),
    printerProfile: z.string(), // Path to .ini
    material: z.string().optional(),
    printProfile: z.string().optional(),
});

export type SliceOptions = z.infer<typeof SliceOptionsSchema>;

export async function slice(options: SliceOptions) {
    const { inputFile, outputFile, printerProfile, material, printProfile } = options;

    // Validate input exists
    try {
        await fs.access(inputFile);
    } catch {
        throw new Error(`Input file not found: ${inputFile}`);
    }

    // Build command
    // prusa-slicer -g --load config.ini --output output.gcode input.stl
    const args = [
        'prusa-slicer',
        '-g',
        '--load', `"${printerProfile}"`,
        '--output', `"${outputFile}"`,
        `"${inputFile}"`
    ];

    /* 
       Note: In a real bundle, you often need to select the specific preset 
       if the ini contains multiple. The CLI flags are:
       --print-settings "My Print Settings"
       --filament "My Filament"
       --printer "My Printer"
    */

    // For v0, we assume the provided ini is a "config export" which has everything flattened,
    // OR we pass the preset names.

    if (material) {
        args.push('--filament', `"${material}"`);
    }

    if (printProfile) {
        args.push('--print-settings', `"${printProfile}"`);
    }

    const command = args.join(' ');
    console.log(`Executing: ${command}`);

    try {
        const { stdout, stderr } = await execAsync(command);
        return { success: true, stdout, stderr };
    } catch (error: any) {
        return { success: false, error: error.message, stderr: error.stderr };
    }
}

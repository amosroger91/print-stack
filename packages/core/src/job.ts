import { z } from 'zod';

export const JobStatus = z.enum([
    'PENDING',
    'SLICING',
    'QUEUED',
    'PRINTING',
    'COMPLETED',
    'FAILED'
]);

export type JobStatus = z.infer<typeof JobStatus>;

export const CreateJobSchema = z.object({
    fileId: z.string(),
    printerId: z.string(),
    profileId: z.string(),
});

export type CreateJob = z.infer<typeof CreateJobSchema>;

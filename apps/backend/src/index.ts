import Fastify, { FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import * as Minio from 'minio';
import { z } from 'zod';
import { randomUUID } from 'crypto';
// import { slice } from '@print-stack/slicer'; // We would need to properly link this or run as separate service
// For Sprint 1 "Vertical Slice", we will exec the slicer locally if running in same container, 
// OR simpler: just implement the logic here for now to prove it works, then refactor.

const server = Fastify({ logger: true });

// MinIO Client
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'minio',
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ROOT_USER || 'admin',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'password123',
});

// For presigned URLs, we need to replace the internal hostname with localhost
const MINIO_EXTERNAL_ENDPOINT = process.env.MINIO_EXTERNAL_ENDPOINT || 'localhost';

const BUCKET_NAME = 'uploads';

server.register(cors);
server.register(multipart);

// Ensure bucket exists
server.ready(async () => {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            console.log(`Bucket ${BUCKET_NAME} created.`);
        }
    } catch (err) {
        console.error('MinIO Init Error:', err);
    }
});

server.post('/upload', async (req: FastifyRequest, reply) => {
    const data = await req.file();
    if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
    }

    const fileId = randomUUID();
    const objectName = `${fileId}-${data.filename}`;

    try {
        await minioClient.putObject(BUCKET_NAME, objectName, data.file, data.fields.size ? Number(data.fields.size) : undefined);
        return { fileId, objectName, filename: data.filename };
    } catch (err) {
        req.log.error(err);
        return reply.status(500).send({ error: 'Upload failed' });
    }
});

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const execAsync = promisify(exec);

server.post('/slice', async (req: FastifyRequest<{ Body: { fileId?: string, objectName?: string, printerId?: string, profileId?: string } }>, reply) => {
    const { fileId, objectName, printerId = 'Ender3V3SE', profileId = 'simple' } = req.body;

    // Use objectName if provided, otherwise fall back to fileId for backwards compatibility
    const minioKey = objectName || fileId;

    if (!minioKey) return reply.status(400).send({ error: 'objectName or fileId required' });

    // Extract file extension from objectName for proper temp file naming
    const fileExt = minioKey.includes('.') ? path.extname(minioKey) : '.stl';
    const tempInput = path.join('/tmp', `${randomUUID()}${fileExt}`);
    const tempOutput = path.join('/tmp', `${randomUUID()}.gcode`);

    try {
        // 1. Download file from MinIO
        const dataStream = await minioClient.getObject(BUCKET_NAME, minioKey);
        await pipeline(dataStream, fs.createWriteStream(tempInput));

        // 2. Run Slicer
        const configPath = path.resolve(__dirname, '../../../packages/slicer/profiles/Ender3V3SE_simple.ini');
        const cmd = `prusa-slicer -g --load "${configPath}" --output "${tempOutput}" "${tempInput}"`;
        console.log('Running slicer:', cmd);

        await execAsync(cmd);

        // 3. Upload GCode to MinIO
        const gcodeFilename = `${minioKey}.gcode`;
        await minioClient.fPutObject(BUCKET_NAME, gcodeFilename, tempOutput);

        // 4. Cleanup temp files
        fs.unlinkSync(tempInput);
        fs.unlinkSync(tempOutput);

        // 5. Return backend download URL instead of presigned MinIO URL
        const downloadUrl = `http://localhost:3000/download/${gcodeFilename}`;

        return { status: 'completed', gcodeUrl: downloadUrl };

    } catch (err: any) {
        req.log.error(err);
        return reply.status(500).send({ error: 'Slicing failed', details: err.message });
    }
});

// Download endpoint - streams file from MinIO
server.get('/download/:filename', async (req: FastifyRequest<{ Params: { filename: string } }>, reply) => {
    const { filename } = req.params;

    try {
        const dataStream = await minioClient.getObject(BUCKET_NAME, filename);
        reply.header('Content-Disposition', `attachment; filename="${filename}"`);
        reply.header('Content-Type', 'application/octet-stream');
        return reply.send(dataStream);
    } catch (err: any) {
        req.log.error(err);
        return reply.status(404).send({ error: 'File not found' });
    }
});

const start = async () => {
    try {
        await server.listen({ port: 3000, host: '0.0.0.0' });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();

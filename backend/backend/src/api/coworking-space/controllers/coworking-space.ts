/**
 * coworking-space controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::coworking-space.coworking-space', ({ strapi }) => ({
    async upload3DModel(ctx) {
        const { id } = ctx.params;
        const { files } = ctx.request;

        if (!files || !files.file) {
            return ctx.badRequest('No file uploaded');
        }

        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        // 1. Validation: Size (max 50MB)
        const MAX_SIZE = 50 * 1024 * 1024;
        // @ts-ignore
        if (file.size > MAX_SIZE) {
            return ctx.badRequest('File size exceeds 50MB limit');
        }

        // 2. Validation: Format
        const allowedExtensions = ['.glb', '.gltf', '.fbx'];
        // @ts-ignore
        const fileName = file.originalFilename || file.name || '';
        const extension = fileName.slice((Math.max(0, fileName.lastIndexOf(".")) || Infinity)).toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            return ctx.badRequest(`Unsupported model format. Allowed: ${allowedExtensions.join(', ')}`);
        }

        try {
            // 3. Check if space exists
            const space = await strapi.entityService.findOne('api::coworking-space.coworking-space', id);
            if (!space) {
                return ctx.notFound('Coworking space not found');
            }

            // 4. Upload to Media Library
            const uploadedFiles = await strapi.plugin('upload').service('upload').upload({
                data: {
                    fileInfo: {
                        name: fileName,
                        caption: `3D Model for ${space.name}`,
                    }
                },
                files: file,
            });

            const uploadedFile = uploadedFiles[0];

            // 5. Generate metadata (Placeholder for now, could be enhanced later)
            const metadata = {
                name: fileName,
                size: uploadedFile.size,
                ext: uploadedFile.ext,
                mime: uploadedFile.mime,
                uploadedAt: new Date().toISOString(),
                // Triangle count and other stats would require a background worker or binary parser
                stats: {
                    triangles: 'pending',
                    meshes: 'pending',
                }
            };

            // 6. Create Model entry
            const modelEntry = await strapi.entityService.create('api::model.model', {
                data: {
                    title: fileName,
                    file: uploadedFile.id,
                    metadata,
                    coworking_space: id,
                    publishedAt: new Date(),
                },
            });

            return ctx.created({
                message: '3D model uploaded and associated successfully',
                model: modelEntry,
                file: uploadedFile,
            });
        } catch (error) {
            strapi.log.error(error);
            return ctx.internalServerError('Failed to process 3D model upload');
        }
    },
}));

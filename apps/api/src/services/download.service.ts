import { prisma } from '@commerce/database';
import { storageService } from './storage.service';
import { ApiError } from '../middleware/error.middleware';

export class DownloadService {
  async getDownloadLinks(token: string) {
    const order = await prisma.order.findUnique({
      where: { downloadToken: token },
      include: {
        product: {
          include: { files: true },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, 'NOT_FOUND', 'Invalid download link');
    }

    if (order.status !== 'completed') {
      throw new ApiError(400, 'ORDER_NOT_COMPLETED', 'Order not completed');
    }

    const now = new Date();
    if (order.downloadExpiresAt && order.downloadExpiresAt < now) {
      throw new ApiError(410, 'LINK_EXPIRED', 'Download link has expired');
    }

    const maxDownloads = parseInt(process.env.MAX_DOWNLOAD_COUNT || '10');
    if (order.downloadCount >= maxDownloads) {
      throw new ApiError(429, 'DOWNLOAD_LIMIT_EXCEEDED', 'Download limit exceeded');
    }

    // Generate signed URLs for all files
    const files = await Promise.all(
      order.product.files.map(async (file) => {
        const key = new URL(file.fileUrl).pathname.substring(1);
        const signedUrl = await storageService.getSignedUrl(key, 3600);
        return {
          fileName: file.fileName,
          fileSize: file.fileSize,
          downloadUrl: signedUrl,
        };
      })
    );

    // Increment download count
    await prisma.order.update({
      where: { id: order.id },
      data: { downloadCount: { increment: 1 } },
    });

    return {
      product: {
        title: order.product.title,
      },
      files,
      downloadCount: order.downloadCount + 1,
      maxDownloads,
    };
  }
}

export const downloadService = new DownloadService();

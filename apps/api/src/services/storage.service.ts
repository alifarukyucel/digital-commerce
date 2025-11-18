import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../middleware/error.middleware';

export class StorageService {
  private s3: AWS.S3;
  private bucketName: string;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      ...(process.env.AWS_ENDPOINT && {
        endpoint: process.env.AWS_ENDPOINT,
        s3ForcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
      }),
    });

    this.bucketName = process.env.AWS_BUCKET_NAME || 'digital-commerce-files';
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: 'products' | 'covers' | 'avatars'
  ): Promise<string> {
    const key = `${folder}/${uuidv4()}-${file.originalname}`;

    try {
      await this.s3
        .putObject({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'private',
        })
        .promise();

      return key;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new ApiError(500, 'UPLOAD_ERROR', 'Failed to upload file');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucketName,
          Key: key,
        })
        .promise();
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new ApiError(500, 'DELETE_ERROR', 'Failed to delete file');
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      });

      return url;
    } catch (error) {
      console.error('S3 signed URL error:', error);
      throw new ApiError(500, 'SIGNED_URL_ERROR', 'Failed to generate signed URL');
    }
  }

  getPublicUrl(key: string): string {
    if (process.env.AWS_ENDPOINT) {
      // LocalStack or custom endpoint
      return `${process.env.AWS_ENDPOINT}/${this.bucketName}/${key}`;
    }
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }
}

export const storageService = new StorageService();

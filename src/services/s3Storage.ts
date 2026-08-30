import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { envConfig } from '../config/environment';
import { logger } from '../lib/logger';
import { v4 as uuidv4 } from 'uuid';

class S3StorageService {
  private client: S3Client | null = null;
  private bucket: string = '';

  constructor() {
    const config = envConfig.getConfig();

    if (
      config.awsAccessKeyId &&
      config.awsSecretAccessKey &&
      config.awsRegion &&
      config.awsS3Bucket
    ) {
      this.bucket = config.awsS3Bucket;

      this.client = new S3Client({
        region: config.awsRegion,
        credentials: {
          accessKeyId: config.awsAccessKeyId,
          secretAccessKey: config.awsSecretAccessKey,
        },
        endpoint: config.awsEndpointUrl,
        // When using Supabase Storage or custom endpoints, forcePathStyle is often required
        forcePathStyle: true,
      });
      logger.info(`[S3 Storage] Initialized targeting bucket: ${this.bucket}`);
    } else {
      logger.warn('[S3 Storage] AWS credentials missing in environment. Storage service disabled.');
    }
  }

  /**
   * Generates a presigned URL that allows the frontend to securely download or upload a file.
   * @param key The file key (path inside the bucket)
   * @param expiresIn Seconds until the URL expires (default 1 hour)
   * @returns A presigned URL string
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.client) throw new Error('S3 Client is not initialized');

    // Default to a GET command (for downloads/streaming)
    // If you need a presigned URL for upload, you would use PutObjectCommand
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const url = await getSignedUrl(this.client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error(`[S3 Storage] Failed to generate presigned URL for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Uploads an audio buffer directly to the S3 bucket.
   * @param buffer The file buffer (e.g., from Multer)
   * @param mimetype The file MIME type (e.g., 'audio/mpeg')
   * @param prefix Optional folder prefix (e.g., 'stems')
   * @returns The generated key of the uploaded file
   */
  async uploadAudio(buffer: Buffer, mimetype: string, prefix: string = 'uploads'): Promise<string> {
    if (!this.client) throw new Error('S3 Client is not initialized');

    const key = `${prefix}/${uuidv4()}-${Date.now()}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      // For Supabase storage, public buckets don't necessarily need an ACL,
      // but standard S3 might use 'public-read' depending on bucket settings.
    });

    try {
      await this.client.send(command);
      logger.info(`[S3 Storage] Successfully uploaded: ${key}`);
      return key;
    } catch (error) {
      logger.error(`[S3 Storage] Failed to upload audio to ${key}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a file from the bucket.
   * @param key The file key to delete
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.client) throw new Error('S3 Client is not initialized');

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.client.send(command);
      logger.info(`[S3 Storage] Successfully deleted: ${key}`);
    } catch (error) {
      logger.error(`[S3 Storage] Failed to delete file ${key}:`, error);
      throw error;
    }
  }
}

export const s3Storage = new S3StorageService();

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');
const { generateRandomString, sanitizeFilename } = require('../utils/helpers');
const logger = require('../utils/logger');

class UploadService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info('Upload directory created:', { path: this.uploadDir });
    }
  }

  /**
   * Get Multer configuration
   */
  getMulterConfig(options = {}) {
    const {
      fileSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    } = options;

    const storage = multer.memoryStorage();

    const fileFilter = (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
      }
    };

    return multer({
      storage,
      limits: { fileSize },
      fileFilter
    });
  }

  /**
   * Unified upload method (works with local storage for testing)
   */
  async upload(file, options = {}) {
    try {
      const { 
        userId, 
        storage = 'local', // local, s3, cloudinary
        subfolder = 'general',
        resize = false,
        width = 800,
        height = 800
      } = options;

      // For now, always use local storage (S3/Cloudinary can be added later)
      if (storage === 'local' || true) { // Force local for testing
        if (resize || file.mimetype.startsWith('image/')) {
          return await this.uploadImage(file, { userId, folder: subfolder, width, height });
        } else {
          return await this.uploadFile(file, { userId, folder: subfolder });
        }
      }

      // TODO: Add S3 and Cloudinary support here
      // if (storage === 's3') { return await this.uploadToS3(file, options); }
      // if (storage === 'cloudinary') { return await this.uploadToCloudinary(file, options); }

      throw new Error('Invalid storage type');
    } catch (error) {
      logger.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Delete file from local storage
   */
  async deleteLocal(filename, subfolder = '') {
    try {
      const filepath = subfolder ? `/uploads/${subfolder}/${filename}` : `/uploads/${filename}`;
      return await this.deleteFile(filepath);
    } catch (error) {
      logger.error('Delete local file error:', error);
      throw error;
    }
  }

  /**
   * Upload file
   */
  async uploadFile(file, options = {}) {
    try {
      const { userId, folder = 'general' } = options;

      // Create folder path
      const folderPath = path.join(this.uploadDir, folder);
      await fs.mkdir(folderPath, { recursive: true });

      // Generate unique filename
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}_${generateRandomString(8)}${ext}`;
      const filepath = path.join(folderPath, filename);

      // Save file
      await fs.writeFile(filepath, file.buffer);

      const fileUrl = `/uploads/${folder}/${filename}`;

      logger.info('File uploaded', { userId, filename, size: file.size });

      return {
        success: true,
        data: {
          filename,
          url: fileUrl,
          path: fileUrl,
          size: file.size,
          mimetype: file.mimetype
        }
      };
    } catch (error) {
      logger.error('File upload error:', error);
      throw new Error('File upload failed');
    }
  }

  /**
   * Upload and resize image
   */
  async uploadImage(file, options = {}) {
    try {
      const { userId, folder = 'images', width = 800, height = 800 } = options;

      // Create folder path
      const folderPath = path.join(this.uploadDir, folder);
      await fs.mkdir(folderPath, { recursive: true });

      // Generate unique filename
      const filename = `${Date.now()}_${generateRandomString(8)}.jpg`;
      const filepath = path.join(folderPath, filename);

      // Resize and optimize image
      await sharp(file.buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(filepath);

      const fileUrl = `/uploads/${folder}/${filename}`;

      logger.info('Image uploaded and resized', { userId, filename });

      return {
        success: true,
        data: {
          filename,
          url: fileUrl,
          path: fileUrl,
          size: file.size,
          mimetype: 'image/jpeg'
        }
      };
    } catch (error) {
      logger.error('Image upload error:', error);
      throw new Error('Image upload failed');
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filepath) {
    try {
      const fullPath = path.join(__dirname, '../..', filepath);
      await fs.unlink(fullPath);
      
      logger.info('File deleted', { filepath });
      
      return { success: true };
    } catch (error) {
      logger.error('File delete error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(filepath) {
    try {
      const fullPath = path.join(__dirname, '../..', filepath);
      const stats = await fs.stat(fullPath);
      
      return {
        success: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return { success: false, error: 'File not found' };
    }
  }
}

module.exports = new UploadService();

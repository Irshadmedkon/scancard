const { query, queryOne } = require('../../config/database');
const uploadService = require('../../services/uploadService');
const logger = require('../../utils/logger');

class UploadModuleService {
  /**
   * Upload image
   */
  async uploadImage(userId, file, options = {}) {
    const result = await uploadService.uploadImage(file, {
      userId,
      folder: options.folder || 'images',
      width: options.width || 800,
      height: options.height || 800
    });

    // Store in database
    const dbResult = await query(
      `INSERT INTO uploads (user_id, file_name, file_path, file_type, file_size, mime_type, created_at)
       VALUES (?, ?, ?, 'image', ?, ?, NOW())`,
      [userId, result.filename, result.filepath, result.size, result.mimetype]
    );

    logger.info('Image uploaded', { userId, uploadId: dbResult.insertId });

    return {
      upload_id: dbResult.insertId,
      ...result
    };
  }

  /**
   * Upload document
   */
  async uploadDocument(userId, file, options = {}) {
    const result = await uploadService.uploadFile(file, {
      userId,
      folder: options.folder || 'documents'
    });

    // Store in database
    const dbResult = await query(
      `INSERT INTO uploads (user_id, file_name, file_path, file_type, file_size, mime_type, created_at)
       VALUES (?, ?, ?, 'document', ?, ?, NOW())`,
      [userId, result.filename, result.filepath, result.size, result.mimetype]
    );

    logger.info('Document uploaded', { userId, uploadId: dbResult.insertId });

    return {
      upload_id: dbResult.insertId,
      ...result
    };
  }

  /**
   * Get user uploads
   */
  async getUserUploads(userId, fileType = null) {
    let sql = 'SELECT * FROM uploads WHERE user_id = ?';
    const params = [userId];

    if (fileType) {
      sql += ' AND file_type = ?';
      params.push(fileType);
    }

    sql += ' ORDER BY created_at DESC';

    const uploads = await query(sql, params);

    return uploads;
  }

  /**
   * Delete upload
   */
  async deleteUpload(uploadId, userId) {
    const upload = await queryOne(
      'SELECT * FROM uploads WHERE upload_id = ? AND user_id = ?',
      [uploadId, userId]
    );

    if (!upload) {
      throw new Error('Upload not found');
    }

    // Delete file from storage
    await uploadService.deleteFile(upload.file_path);

    // Delete from database
    await query('DELETE FROM uploads WHERE upload_id = ?', [uploadId]);

    logger.info('Upload deleted', { userId, uploadId });
  }

  /**
   * Get upload by ID
   */
  async getUploadById(uploadId, userId) {
    const upload = await queryOne(
      'SELECT * FROM uploads WHERE upload_id = ? AND user_id = ?',
      [uploadId, userId]
    );

    if (!upload) {
      throw new Error('Upload not found');
    }

    return upload;
  }
}

module.exports = new UploadModuleService();

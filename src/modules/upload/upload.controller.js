const uploadService = require('../../services/uploadService');
const { formatResponse } = require('../../utils/helpers');
const { STATUS_CODES } = require('../../utils/constants');
const logger = require('../../utils/logger');

class UploadController {
  /**
   * POST /api/v1/upload/profile-picture
   */
  async uploadProfilePicture(req, res, next) {
    try {
      if (!req.file) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
          false,
          null,
          '',
          {
            code: 'FILE_REQUIRED',
            message: 'Profile picture file is required'
          }
        ));
      }

      const result = await uploadService.upload(req.file, {
        storage: 'local', // Force local for testing
        subfolder: 'profile-pictures'
      });

      res.status(STATUS_CODES.OK).json(formatResponse(
        true,
        result.data,
        'Profile picture uploaded successfully'
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/upload/cover-image
   */
  async uploadCoverImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
          false,
          null,
          '',
          {
            code: 'FILE_REQUIRED',
            message: 'Cover image file is required'
          }
        ));
      }

      const result = await uploadService.upload(req.file, {
        storage: 'local',
        subfolder: 'cover-images'
      });

      res.status(STATUS_CODES.OK).json(formatResponse(
        true,
        result.data,
        'Cover image uploaded successfully'
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/upload/company-logo
   */
  async uploadCompanyLogo(req, res, next) {
    try {
      if (!req.file) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
          false,
          null,
          '',
          {
            code: 'FILE_REQUIRED',
            message: 'Company logo file is required'
          }
        ));
      }

      const result = await uploadService.upload(req.file, {
        storage: 'local',
        subfolder: 'company-logos'
      });

      res.status(STATUS_CODES.OK).json(formatResponse(
        true,
        result.data,
        'Company logo uploaded successfully'
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/upload/document
   */
  async uploadDocument(req, res, next) {
    try {
      if (!req.file) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
          false,
          null,
          '',
          {
            code: 'FILE_REQUIRED',
            message: 'Document file is required'
          }
        ));
      }

      const result = await uploadService.upload(req.file, {
        storage: 'local',
        subfolder: 'documents'
      });

      res.status(STATUS_CODES.OK).json(formatResponse(
        true,
        result.data,
        'Document uploaded successfully'
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/upload/menu-item-image
   */
  async uploadMenuItemImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
          false,
          null,
          '',
          {
            code: 'FILE_REQUIRED',
            message: 'Menu item image file is required'
          }
        ));
      }

      const result = await uploadService.upload(req.file, {
        storage: 'local',
        subfolder: 'menu-items'
      });

      res.status(STATUS_CODES.OK).json(formatResponse(
        true,
        result.data,
        'Menu item image uploaded successfully'
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/upload/product-image
   */
  async uploadProductImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(formatResponse(
          false,
          null,
          '',
          {
            code: 'FILE_REQUIRED',
            message: 'Product image file is required'
          }
        ));
      }

      const result = await uploadService.upload(req.file, {
        storage: 'local',
        subfolder: 'products'
      });

      res.status(STATUS_CODES.OK).json(formatResponse(
        true,
        result.data,
        'Product image uploaded successfully'
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/upload/:fileName
   */
  async deleteFile(req, res, next) {
    try {
      const { fileName } = req.params;
      const { subfolder } = req.query;

      await uploadService.deleteLocal(fileName, subfolder || '');

      res.status(STATUS_CODES.OK).json(formatResponse(
        true,
        { fileName },
        'File deleted successfully'
      ));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/upload/info/:fileName
   */
  async getFileInfo(req, res, next) {
    try {
      const { fileName } = req.params;
      const { subfolder } = req.query;

      const fileInfo = await uploadService.getFileInfo(fileName, subfolder || '');

      res.status(STATUS_CODES.OK).json(formatResponse(
        true,
        fileInfo,
        'File info retrieved successfully'
      ));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UploadController();
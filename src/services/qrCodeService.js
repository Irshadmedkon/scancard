const QRCode = require('qrcode');
const logger = require('../utils/logger');

class QRCodeService {
  /**
   * Generate QR code as data URL
   */
  async generateQRCode(data, options = {}) {
    try {
      const qrOptions = {
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        type: 'image/png',
        quality: options.quality || 0.92,
        margin: options.margin || 1,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        width: options.width || 300
      };

      const qrCodeDataURL = await QRCode.toDataURL(data, qrOptions);
      
      return {
        success: true,
        qrCode: qrCodeDataURL,
        data
      };
    } catch (error) {
      logger.error('QR code generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate QR code as buffer
   */
  async generateQRCodeBuffer(data, options = {}) {
    try {
      const qrOptions = {
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        type: 'png',
        quality: options.quality || 0.92,
        margin: options.margin || 1,
        width: options.width || 300
      };

      const buffer = await QRCode.toBuffer(data, qrOptions);
      
      return {
        success: true,
        buffer,
        data
      };
    } catch (error) {
      logger.error('QR code buffer generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate profile QR code
   */
  async generateProfileQRCode(username, options = {}) {
    const profileUrl = `${process.env.FRONTEND_URL}/profile/${username}`;
    return await this.generateQRCode(profileUrl, options);
  }

  /**
   * Generate vCard QR code
   */
  async generateVCardQRCode(contactData) {
    const vCard = this.createVCard(contactData);
    return await this.generateQRCode(vCard);
  }

  /**
   * Create vCard format
   */
  createVCard(data) {
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${data.full_name || ''}`,
      `TEL:${data.phone || ''}`,
      `EMAIL:${data.email || ''}`,
      `ORG:${data.company || ''}`,
      `TITLE:${data.designation || ''}`,
      `URL:${data.website || ''}`,
      'END:VCARD'
    ].join('\n');

    return vCard;
  }
}

module.exports = new QRCodeService();

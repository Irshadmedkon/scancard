const { query, queryOne } = require('../../config/database');
const { cacheService } = require('../../services/cacheService');
const { generateRandomString } = require('../../utils/helpers');
const logger = require('../../utils/logger');

class BookingService {
  async getServices(profileId) {
    return await query(
      'SELECT * FROM booking_services WHERE profile_id = ? AND is_active = TRUE ORDER BY created_at DESC',
      [profileId]
    );
  }

  async getService(profileId, serviceId) {
    const service = await queryOne(
      'SELECT * FROM booking_services WHERE service_id = ? AND profile_id = ? AND is_active = TRUE',
      [serviceId, profileId]
    );

    if (!service) {
      throw new Error('Service not found');
    }

    return service;
  }

  async createService(profileId, userId, serviceData) {
    const { service_name, description, duration_minutes, price, buffer_time } = serviceData;

    const result = await query(
      `INSERT INTO booking_services (profile_id, service_name, description, duration_minutes, price, buffer_time, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [profileId, service_name, description || null, duration_minutes, price, buffer_time || 0]
    );

    return await queryOne('SELECT * FROM booking_services WHERE service_id = ?', [result.insertId]);
  }

  async updateService(profileId, serviceId, userId, serviceData) {
    const service = await queryOne(
      'SELECT * FROM booking_services WHERE service_id = ? AND profile_id = ?',
      [serviceId, profileId]
    );

    if (!service) {
      throw new Error('Service not found');
    }

    const { service_name, description, duration_minutes, price, buffer_time, is_active } = serviceData;

    const allowedFields = ['service_name', 'description', 'duration_minutes', 'price', 'buffer_time', 'is_active'];
    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (serviceData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(serviceData[field]);
      }
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');
      updateValues.push(serviceId);
      await query(`UPDATE booking_services SET ${updateFields.join(', ')} WHERE service_id = ?`, updateValues);
    }

    return await queryOne('SELECT * FROM booking_services WHERE service_id = ?', [serviceId]);
  }

  async deleteService(profileId, serviceId, userId) {
    const service = await queryOne(
      'SELECT * FROM booking_services WHERE service_id = ? AND profile_id = ?',
      [serviceId, profileId]
    );

    if (!service) {
      throw new Error('Service not found');
    }

    // Check if there are any active bookings for this service
    const activeBookings = await queryOne(
      'SELECT COUNT(*) as count FROM bookings WHERE service_id = ? AND status IN ("pending", "confirmed")',
      [serviceId]
    );

    if (activeBookings.count > 0) {
      throw new Error('Cannot delete service with active bookings. Please cancel or complete all bookings first.');
    }

    await query('DELETE FROM booking_services WHERE service_id = ?', [serviceId]);
    
    logger.info('Booking service deleted', { serviceId, profileId, userId });
    
    return { message: 'Service deleted successfully' };
  }

  async createBooking(profileId, bookingData) {
    const { service_id, booking_date, booking_time, customer_name, customer_email, customer_phone, notes } = bookingData;

    // Verify service belongs to this profile
    const service = await queryOne(
      'SELECT * FROM booking_services WHERE service_id = ? AND profile_id = ?',
      [service_id, profileId]
    );

    if (!service) {
      throw new Error('Service not found or does not belong to this profile');
    }

    // Generate confirmation code
    const confirmation_code = generateRandomString(8).toUpperCase();

    const result = await query(
      `INSERT INTO bookings (service_id, booking_date, booking_time, customer_name, customer_email, customer_phone, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [service_id, booking_date, booking_time, customer_name, customer_email || null, customer_phone, notes || null]
    );

    return await queryOne('SELECT * FROM bookings WHERE booking_id = ?', [result.insertId]);
  }

  async getBookings(profileId, filters = {}) {
    const { status, date, customer_phone } = filters;

    try {
      // First check if profile has any services
      const services = await query('SELECT service_id FROM booking_services WHERE profile_id = ?', [profileId]);
      
      if (services.length === 0) {
        // No services, so no bookings
        return [];
      }

      const serviceIds = services.map(s => s.service_id);
      
      // Join with booking_services to get bookings for this profile
      let sql = `SELECT b.*, bs.service_name, bs.price, bs.duration_minutes 
                 FROM bookings b 
                 JOIN booking_services bs ON b.service_id = bs.service_id 
                 WHERE bs.profile_id = ?`;
      const params = [profileId];

      if (status) {
        sql += ' AND b.status = ?';
        params.push(status);
      }

      if (date) {
        sql += ' AND b.booking_date = ?';
        params.push(date);
      }

      if (customer_phone) {
        sql += ' AND b.customer_phone = ?';
        params.push(customer_phone);
      }

      sql += ' ORDER BY b.booking_date DESC, b.booking_time DESC';

      return await query(sql, params);
    } catch (error) {
      logger.error('Get bookings error:', error);
      // Return empty array if there's an error
      return [];
    }
  }

  async getBooking(profileId, bookingId) {
    // Join with booking_services to verify profile ownership
    const booking = await queryOne(
      `SELECT b.*, bs.service_name, bs.price, bs.duration_minutes 
       FROM bookings b 
       JOIN booking_services bs ON b.service_id = bs.service_id 
       WHERE b.booking_id = ? AND bs.profile_id = ?`,
      [bookingId, profileId]
    );

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking;
  }

  async updateBookingStatus(profileId, bookingId, userId, status) {
    // Verify booking belongs to this profile through service
    const booking = await queryOne(
      `SELECT b.*, bs.profile_id 
       FROM bookings b 
       JOIN booking_services bs ON b.service_id = bs.service_id 
       WHERE b.booking_id = ? AND bs.profile_id = ?`,
      [bookingId, profileId]
    );

    if (!booking) {
      throw new Error('Booking not found');
    }

    await query(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE booking_id = ?',
      [status, bookingId]
    );

    return await queryOne('SELECT * FROM bookings WHERE booking_id = ?', [bookingId]);
  }

  async setAvailability(profileId, userId, availabilityData) {
    const { day_of_week, start_time, end_time, is_available = true } = availabilityData;
    
    logger.info('Setting availability:', { profileId, userId, day_of_week, start_time, end_time, is_available });

    // Check if availability exists
    const existing = await queryOne(
      'SELECT * FROM booking_availability WHERE profile_id = ? AND day_of_week = ?',
      [profileId, day_of_week]
    );

    if (existing) {
      logger.info('Updating existing availability:', existing.availability_id);
      await query(
        'UPDATE booking_availability SET start_time = ?, end_time = ?, is_available = ?, updated_at = NOW() WHERE availability_id = ?',
        [start_time, end_time, is_available ? 1 : 0, existing.availability_id]
      );
    } else {
      logger.info('Creating new availability');
      await query(
        'INSERT INTO booking_availability (profile_id, day_of_week, start_time, end_time, is_available, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [profileId, day_of_week, start_time, end_time, is_available ? 1 : 0]
      );
    }

    return await query(
      'SELECT * FROM booking_availability WHERE profile_id = ? ORDER BY day_of_week',
      [profileId]
    );
  }

  async getAvailability(profileId) {
    return await query(
      'SELECT * FROM booking_availability WHERE profile_id = ? ORDER BY day_of_week',
      [profileId]
    );
  }
}

module.exports = new BookingService();

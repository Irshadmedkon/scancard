const logger = require('../utils/logger');
const emailService = require('./emailService');

/**
 * Background Job Queue Service
 * Handles async background jobs like emails, analytics, etc.
 */

class JobQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.workers = 3; // Number of concurrent workers
  }

  /**
   * Add job to queue
   * @param {string} type - Job type
   * @param {Object} data - Job data
   * @param {Object} options - Job options
   */
  async add(type, data, options = {}) {
    const job = {
      id: Date.now() + Math.random(),
      type,
      data,
      options: {
        priority: options.priority || 0,
        retries: options.retries || 3,
        delay: options.delay || 0,
        timeout: options.timeout || 30000
      },
      attempts: 0,
      status: 'pending',
      createdAt: new Date(),
      error: null
    };

    this.queue.push(job);
    logger.info(`Job added to queue: ${type}`, { jobId: job.id });

    // Start processing if not already running
    if (!this.processing) {
      this.process();
    }

    return job.id;
  }

  /**
   * Process jobs in queue
   */
  async process() {
    if (this.processing) return;
    
    this.processing = true;
    logger.info('Job queue processing started');

    while (this.queue.length > 0) {
      // Sort by priority
      this.queue.sort((a, b) => b.options.priority - a.options.priority);

      // Get jobs to process
      const jobs = this.queue.splice(0, this.workers);

      // Process jobs concurrently
      await Promise.all(jobs.map(job => this.processJob(job)));
    }

    this.processing = false;
    logger.info('Job queue processing completed');
  }

  /**
   * Process single job
   * @param {Object} job - Job to process
   */
  async processJob(job) {
    try {
      job.status = 'processing';
      job.attempts++;

      logger.info(`Processing job: ${job.type}`, { 
        jobId: job.id, 
        attempt: job.attempts 
      });

      // Apply delay if specified
      if (job.options.delay > 0) {
        await this.delay(job.options.delay);
      }

      // Process based on job type
      await this.executeJob(job);

      job.status = 'completed';
      logger.info(`Job completed: ${job.type}`, { jobId: job.id });

    } catch (error) {
      logger.error(`Job failed: ${job.type}`, { 
        jobId: job.id, 
        error: error.message 
      });

      job.error = error.message;

      // Retry if attempts remaining
      if (job.attempts < job.options.retries) {
        job.status = 'pending';
        this.queue.push(job);
        logger.info(`Job queued for retry: ${job.type}`, { 
          jobId: job.id, 
          attempt: job.attempts 
        });
      } else {
        job.status = 'failed';
        logger.error(`Job permanently failed: ${job.type}`, { jobId: job.id });
      }
    }
  }

  /**
   * Execute job based on type
   * @param {Object} job - Job to execute
   */
  async executeJob(job) {
    switch (job.type) {
      case 'send_email':
        await this.sendEmailJob(job.data);
        break;

      case 'send_welcome_email':
        await emailService.sendWelcomeEmail(job.data.email, job.data.name);
        break;

      case 'send_lead_notification':
        await emailService.sendLeadNotification(job.data);
        break;

      case 'aggregate_analytics':
        await this.aggregateAnalytics(job.data);
        break;

      case 'cleanup_data':
        await this.cleanupData(job.data);
        break;

      case 'generate_report':
        await this.generateReport(job.data);
        break;

      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Send email job
   */
  async sendEmailJob(data) {
    const { to, subject, html, text } = data;
    await emailService.sendEmail({ to, subject, html, text });
  }

  /**
   * Aggregate analytics job
   */
  async aggregateAnalytics(data) {
    // Placeholder for analytics aggregation
    logger.info('Aggregating analytics', data);
    await this.delay(1000); // Simulate work
  }

  /**
   * Cleanup data job
   */
  async cleanupData(data) {
    // Placeholder for data cleanup
    logger.info('Cleaning up data', data);
    await this.delay(1000); // Simulate work
  }

  /**
   * Generate report job
   */
  async generateReport(data) {
    // Placeholder for report generation
    logger.info('Generating report', data);
    await this.delay(2000); // Simulate work
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      workers: this.workers,
      jobs: this.queue.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        createdAt: job.createdAt
      }))
    };
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue = [];
    logger.info('Job queue cleared');
  }
}

// Export singleton instance
module.exports = new JobQueue();

const nodemailer = require('nodemailer');

/**
 * Email service for sending various types of emails
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content
   * @param {string} options.html - HTML content
   * @returns {Promise} - Nodemailer send result
   */
  async sendEmail(options) {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    return await this.transporter.sendMail(mailOptions);
  }

  /**
   * Send a verification email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.username - User's username
   * @param {string} options.token - Verification token
   * @returns {Promise} - Nodemailer send result
   */
  async sendVerificationEmail(options) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${options.token}`;

    const subject = 'Verify Your Email Address';
    const text = `
      Hello ${options.username},
      
      Thank you for registering with Influencer API Key Marketplace. Please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you did not register for an account, please ignore this email.
      
      Best regards,
      The Influencer API Key Marketplace Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Verify Your Email Address</h2>
        <p>Hello ${options.username},</p>
        <p>Thank you for registering with Influencer API Key Marketplace. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
        </div>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not register for an account, please ignore this email.</p>
        <p>Best regards,<br>The Influencer API Key Marketplace Team</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">If the button above doesn't work, copy and paste this URL into your browser: ${verificationUrl}</p>
      </div>
    `;

    return await this.sendEmail({
      to: options.to,
      subject,
      text,
      html,
    });
  }

  /**
   * Send a password reset email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.username - User's username
   * @param {string} options.token - Reset token
   * @returns {Promise} - Nodemailer send result
   */
  async sendPasswordResetEmail(options) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${options.token}`;

    const subject = 'Reset Your Password';
    const text = `
      Hello ${options.username},
      
      You are receiving this email because you (or someone else) has requested to reset your password. Please click the link below to reset your password:
      
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you did not request this, please ignore this email and your password will remain unchanged.
      
      Best regards,
      The Influencer API Key Marketplace Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Reset Your Password</h2>
        <p>Hello ${options.username},</p>
        <p>You are receiving this email because you (or someone else) has requested to reset your password. Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <p>Best regards,<br>The Influencer API Key Marketplace Team</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">If the button above doesn't work, copy and paste this URL into your browser: ${resetUrl}</p>
      </div>
    `;

    return await this.sendEmail({
      to: options.to,
      subject,
      text,
      html,
    });
  }

  /**
   * Send a welcome email after email verification
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.username - User's username
   * @param {string} options.userType - User type (influencer or advertiser)
   * @returns {Promise} - Nodemailer send result
   */
  async sendWelcomeEmail(options) {
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;

    const subject = 'Welcome to Influencer API Key Marketplace!';
    const text = `
      Hello ${options.username},
      
      Thank you for verifying your email address. Your account is now fully activated!
      
      ${options.userType === 'influencer' 
        ? 'As an influencer, you can now start adding your social media accounts and setting up API keys for rental.'
        : 'As an advertiser, you can now browse influencers and rent API keys for your marketing campaigns.'}
      
      Visit your dashboard to get started:
      ${dashboardUrl}
      
      If you have any questions, feel free to contact our support team.
      
      Best regards,
      The Influencer API Key Marketplace Team
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Welcome to Influencer API Key Marketplace!</h2>
        <p>Hello ${options.username},</p>
        <p>Thank you for verifying your email address. Your account is now fully activated!</p>
        
        ${options.userType === 'influencer' 
          ? '<p>As an influencer, you can now start adding your social media accounts and setting up API keys for rental.</p>'
          : '<p>As an advertiser, you can now browse influencers and rent API keys for your marketing campaigns.</p>'}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Dashboard</a>
        </div>
        
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The Influencer API Key Marketplace Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: options.to,
      subject,
      text,
      html,
    });
  }
}

module.exports = new EmailService();

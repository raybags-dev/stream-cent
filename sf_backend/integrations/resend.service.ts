export interface EmailPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export class ResendEmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim() !== '');
  }

  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    const toRecipients = Array.isArray(payload.to) ? payload.to : [payload.to];

    if (!this.isConfigured()) {
      console.log(`[Resend Email Mock] (RESEND_API_KEY placeholder mode)`);
      console.log(`   To: ${toRecipients.join(', ')}`);
      console.log(`   Subject: ${payload.subject}`);
      console.log(`   From: ${this.fromEmail}`);
      return {
        success: true,
        id: `mock_email_${Date.now()}`,
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: toRecipients,
          subject: payload.subject,
          html: payload.html || payload.text,
          text: payload.text,
        }),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        console.warn('[Resend Email Error]', data);
        return {
          success: false,
          error: data?.message || 'Failed to dispatch email via Resend',
        };
      }

      return {
        success: true,
        id: data?.id,
      };
    } catch (err: any) {
      console.error('[Resend Service Network Error]', err);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<EmailResult> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to Stream Flix Cinema',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0b0f; color: #ffffff; padding: 40px 20px; text-align: center;">
          <h1 style="color: #e50914; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px;">STREAM FLIX</h1>
          <p style="color: #a3a3a3; font-size: 14px; margin-bottom: 24px;">Cinema-Grade Streaming Everywhere</p>
          <div style="background-color: #14141e; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; text-align: left;">
            <h2 style="font-size: 18px; color: #ffffff; margin-top: 0;">Welcome, ${userName}!</h2>
            <p style="color: #d4d4d4; font-size: 14px; line-height: 1.6;">Your 4K Ultra HD and Spatial Audio subscription is now active. Explore trending releases, blockbuster movies, and award-winning series.</p>
            <div style="margin: 28px 0; text-align: center;">
              <a href="https://streamflix.app/browse" style="background-color: #e50914; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">Start Watching Now</a>
            </div>
            <p style="color: #737373; font-size: 12px;">If you have any questions, our support team is available 24/7.</p>
          </div>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<EmailResult> {
    const resetUrl = `https://streamflix.app/reset-password?token=${resetToken}`;
    return this.sendEmail({
      to: userEmail,
      subject: 'Reset your Stream Flix password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0b0b0f; color: #ffffff; padding: 40px 20px; text-align: center;">
          <h1 style="color: #e50914; font-size: 28px; font-weight: 800;">STREAM FLIX</h1>
          <div style="background-color: #14141e; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; text-align: left;">
            <h2 style="font-size: 18px; color: #ffffff; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #d4d4d4; font-size: 14px; line-height: 1.6;">We received a request to reset your Stream Flix password. Click the button below to choose a new password. This link expires in 15 minutes.</p>
            <div style="margin: 28px 0; text-align: center;">
              <a href="${resetUrl}" style="background-color: #e50914; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #737373; font-size: 12px;">If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    });
  }

  async sendAdminAlert(subject: string, details: string): Promise<EmailResult> {
    const adminRecipient = process.env.ADMIN_EMAIL || 'admin@streamflix.local';
    return this.sendEmail({
      to: adminRecipient,
      subject: `[Stream Flix Security Alert] ${subject}`,
      html: `
        <div style="font-family: monospace; background-color: #0b0b0f; color: #f87171; padding: 20px;">
          <h2>Security & System Audit Alert</h2>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <div style="background-color: #1a1a24; padding: 16px; border-left: 4px solid #e50914; color: #ffffff;">
            ${details}
          </div>
        </div>
      `,
    });
  }
}

export const resendEmailService = new ResendEmailService();

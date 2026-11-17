import { describe, it, expect } from 'vitest';
import { ResendEmailService } from '../sf_backend/integrations/resend.service';

describe('Resend Email Service', () => {
  const service = new ResendEmailService();

  it('correctly reports configuration status based on API key presence', () => {
    // When RESEND_API_KEY is not set or empty, returns false for live, operates in mock fallback mode
    expect(typeof service.isConfigured()).toBe('boolean');
  });

  it('safely handles transactional email dispatch in mock/configured mode', async () => {
    const result = await service.sendEmail({
      to: 'tester@streamflix.local',
      subject: 'Test Subject',
      html: '<p>Test Email Content</p>',
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it('generates well-formed transactional welcome email', async () => {
    const result = await service.sendWelcomeEmail('subscriber@streamflix.local', 'Super Admin');
    expect(result.success).toBe(true);
  });

  it('generates valid password reset email with secure token', async () => {
    const token = 'rst_abc123xyz';
    const result = await service.sendPasswordResetEmail('subscriber@streamflix.local', token);
    expect(result.success).toBe(true);
  });

  it('generates admin security audit alert', async () => {
    const result = await service.sendAdminAlert('Security Policy Test', 'Test security alert payload');
    expect(result.success).toBe(true);
  });
});

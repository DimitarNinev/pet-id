import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured.');
    }

    this.resend = new Resend(apiKey);
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    const { error } = await this.resend.emails.send({
      from: 'Pet ID <onboarding@resend.dev>',
      to: email,
      subject: 'Възстановяване на паролата – Pet ID',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333; line-height: 1.4;">
          <h2 style="margin-bottom: 10px;">Възстановяване на паролата</h2>
          <p>Получихме заявка за промяна на паролата за твоя Pet ID профил.</p>
          <p>Натисни бутона по-долу, за да зададеш нова парола:</p>
          <p style="margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: #136d67; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px;">
              Възстанови паролата
            </a>
          </p>
          <p>Линкът е валиден 30 минути и може да бъде използван само веднъж.</p>
          <p>Ако не си поискал възстановяване на паролата, игнорирай този имейл.</p>
          <p>Екипът на Pet ID</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new InternalServerErrorException(
        'Имейлът не можа да бъде изпратен.',
      );
    }
  }
}

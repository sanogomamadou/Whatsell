import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface TrialExpiringWarningParams {
  email: string;
  shopName: string;
  trialEndsAt: Date;
  upgradeUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null = null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('mail.resendApiKey', '');
    this.from = this.configService.get<string>('mail.from', 'Whatsell <noreply@whatsell.io>');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY non configuré — envoi email désactivé');
    }
  }

  async sendTrialExpiringWarning(params: TrialExpiringWarningParams): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        { event: 'mail-skipped', email: params.email },
        'Email non envoyé (Resend non configuré)',
      );
      return;
    }

    const expiryDate = params.trialEndsAt.toLocaleDateString('fr-FR', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const safeShopName = escapeHtml(params.shopName);
    const safeUpgradeUrl = escapeHtml(params.upgradeUrl);

    try {
      await this.resend.emails.send({
        from: this.from,
        to: params.email,
        subject: `⚠️ Votre essai Pro Whatsell expire dans 2 jours`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#0F172A">Votre essai Pro se termine bientôt</h2>
            <p style="color:#475569">Bonjour,</p>
            <p style="color:#475569">
              L'essai gratuit Pro de votre boutique <strong style="color:#0F172A">${safeShopName}</strong>
              sur Whatsell expire le <strong style="color:#0F172A">${expiryDate}</strong>.
            </p>
            <p style="color:#475569">
              Sans souscription, votre compte basculera automatiquement vers le tier Free
              (20 commandes/mois).
            </p>
            <a href="${safeUpgradeUrl}"
               style="display:inline-block;margin-top:16px;padding:12px 24px;background:#6366F1;color:#ffffff;border-radius:6px;text-decoration:none;font-weight:600">
              Passer en Pro maintenant
            </a>
            <p style="color:#94A3B8;font-size:12px;margin-top:32px">
              Vous recevez cet email car vous avez un compte Whatsell.
            </p>
          </div>
        `,
      });
      this.logger.log({ event: 'trial-warning-sent', email: params.email });
    } catch (err) {
      // Log sans propager — l'expiration doit se produire même si l'email échoue (NFR20)
      this.logger.error({ event: 'mail-send-failed', email: params.email, err });
    }
  }
}

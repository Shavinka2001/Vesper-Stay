import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type WhatsAppDispatchResult = {
  message: string;
  waMeUrl: string | null;
  dispatched: boolean;
  channel: 'twilio' | 'meta' | 'wa_me' | 'none';
};

type WelcomeContext = {
  guestFirstName: string;
  guestPhone: string | null;
  propertyName: string;
  roomNumber: string;
  wifiName?: string;
  wifiPassword?: string;
  guideUrl?: string;
  confirmationCode: string;
};

type InvoiceLine = {
  label: string;
  amount: number;
};

type InvoiceContext = {
  guestFirstName: string;
  guestPhone: string | null;
  propertyName: string;
  roomNumber: string;
  confirmationCode: string;
  currency: string;
  lines: InvoiceLine[];
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  reviewUrl?: string;
};

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly configService: ConfigService) {}

  buildWelcomeMessage(ctx: WelcomeContext): string {
    const wifiName = ctx.wifiName ?? 'VesperStay-Guest';
    const wifiPassword = ctx.wifiPassword ?? 'Welcome@Vesper';
    const guideUrl =
      ctx.guideUrl ??
      `https://vesperstay.com/v/guide/${encodeURIComponent(ctx.confirmationCode)}`;

    return [
      `✨ Welcome to ${ctx.propertyName}, ${ctx.guestFirstName}!`,
      ``,
      `Your sanctuary is ready — Room ${ctx.roomNumber}.`,
      `Confirmation: ${ctx.confirmationCode}`,
      ``,
      `📶 Wi-Fi`,
      `Network: ${wifiName}`,
      `Password: ${wifiPassword}`,
      ``,
      `📖 Property guide: ${guideUrl}`,
      ``,
      `Our team is here for anything you need. Wishing you a luminous stay.`,
      `— VesperStay Concierge`,
    ].join('\n');
  }

  buildInvoiceMessage(ctx: InvoiceContext): string {
    const reviewUrl =
      ctx.reviewUrl ??
      'https://g.page/r/vesperstay-review';
    const symbol = this.currencySymbol(ctx.currency);
    const lines = ctx.lines
      .map((line) => `• ${line.label}: ${symbol}${line.amount.toFixed(2)}`)
      .join('\n');

    return [
      `🧾 Check-out folio — ${ctx.propertyName}`,
      `Dear ${ctx.guestFirstName},`,
      ``,
      `Room ${ctx.roomNumber} · ${ctx.confirmationCode}`,
      ``,
      `Itemized charges:`,
      lines || '• Stay charges as agreed',
      ``,
      `Total: ${symbol}${ctx.totalAmount.toFixed(2)}`,
      `Paid: ${symbol}${ctx.paidAmount.toFixed(2)}`,
      `Balance: ${symbol}${ctx.balanceDue.toFixed(2)}`,
      ``,
      `Thank you for choosing twilight hospitality with us.`,
      `We would be honoured by your review: ${reviewUrl}`,
      ``,
      `— VesperStay Front Desk`,
    ].join('\n');
  }

  async sendWelcomeMessage(
    ctx: WelcomeContext,
  ): Promise<WhatsAppDispatchResult> {
    const message = this.buildWelcomeMessage(ctx);
    return this.dispatch(ctx.guestPhone, message);
  }

  async sendInvoiceMessage(
    ctx: InvoiceContext,
  ): Promise<WhatsAppDispatchResult> {
    const message = this.buildInvoiceMessage(ctx);
    return this.dispatch(ctx.guestPhone, message);
  }

  buildWaMeUrl(phone: string | null | undefined, message: string): string | null {
    const digits = this.normalizePhone(phone);
    if (!digits) return null;
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }

  private async dispatch(
    phone: string | null | undefined,
    message: string,
  ): Promise<WhatsAppDispatchResult> {
    const waMeUrl = this.buildWaMeUrl(phone, message);
    const twilioSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const twilioToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const twilioFrom = this.configService.get<string>('TWILIO_WHATSAPP_FROM');
    const metaToken = this.configService.get<string>('META_WHATSAPP_TOKEN');
    const metaPhoneId = this.configService.get<string>(
      'META_WHATSAPP_PHONE_ID',
    );

    if (twilioSid && twilioToken && twilioFrom && phone) {
      this.logger.log(
        `Twilio WhatsApp credentials detected — stub dispatch to ${phone}`,
      );
      // Direct API wiring can be enabled when credentials are production-ready.
      return {
        message,
        waMeUrl,
        dispatched: false,
        channel: 'twilio',
      };
    }

    if (metaToken && metaPhoneId && phone) {
      this.logger.log(
        `Meta WhatsApp credentials detected — stub dispatch to ${phone}`,
      );
      return {
        message,
        waMeUrl,
        dispatched: false,
        channel: 'meta',
      };
    }

    return {
      message,
      waMeUrl,
      dispatched: false,
      channel: waMeUrl ? 'wa_me' : 'none',
    };
  }

  private normalizePhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const digits = phone.replace(/[^\d]/g, '');
    return digits.length >= 8 ? digits : null;
  }

  private currencySymbol(code: string): string {
    const map: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      LKR: 'Rs ',
      AED: 'AED ',
    };
    return map[code.toUpperCase()] ?? `${code} `;
  }
}

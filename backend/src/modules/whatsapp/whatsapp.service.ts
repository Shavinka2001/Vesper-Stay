import { Injectable, Logger } from '@nestjs/common';
import { SecretCipherService } from '@common/crypto/secret-cipher.service';
import { PrismaService } from '@prisma/prisma.service';

export type WhatsAppDispatchResult = {
  message: string;
  waMeUrl: string | null;
  dispatched: boolean;
  channel: 'meta' | 'wa_me' | 'none';
  error?: string;
};

type WelcomeContext = {
  propertyId: string;
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
  propertyId: string;
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

const GRAPH_API_VERSION = 'v21.0';
const SEND_TIMEOUT_MS = 8_000;

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: SecretCipherService,
  ) {}

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
    const reviewUrl = ctx.reviewUrl ?? 'https://g.page/r/vesperstay-review';
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
    return this.dispatch(ctx.propertyId, ctx.guestPhone, this.buildWelcomeMessage(ctx));
  }

  async sendInvoiceMessage(
    ctx: InvoiceContext,
  ): Promise<WhatsAppDispatchResult> {
    return this.dispatch(ctx.propertyId, ctx.guestPhone, this.buildInvoiceMessage(ctx));
  }

  buildWaMeUrl(
    phone: string | null | undefined,
    message: string,
  ): string | null {
    const digits = this.normalizePhone(phone);
    if (!digits) return null;
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Send via the property's WhatsApp Cloud API credentials when configured and
   * enabled; otherwise return a click-to-chat wa.me link (zero-cost fallback).
   * Never throws — a failed send must not break check-in/out.
   */
  private async dispatch(
    propertyId: string,
    phone: string | null | undefined,
    message: string,
  ): Promise<WhatsAppDispatchResult> {
    const waMeUrl = this.buildWaMeUrl(phone, message);
    const to = this.normalizePhone(phone);

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        whatsappEnabled: true,
        whatsappPhoneNumberId: true,
        whatsappTokenEncrypted: true,
      },
    });

    const canSend =
      !!property?.whatsappEnabled &&
      !!property.whatsappPhoneNumberId &&
      !!property.whatsappTokenEncrypted &&
      this.cipher.isAvailable &&
      !!to;

    if (canSend) {
      try {
        const token = this.cipher.decrypt(property.whatsappTokenEncrypted!);
        await this.sendViaMeta(
          property.whatsappPhoneNumberId!,
          token,
          to!,
          message,
        );
        return { message, waMeUrl, dispatched: true, channel: 'meta' };
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : 'unknown error';
        this.logger.warn(
          `WhatsApp Cloud API send failed (${propertyId}): ${errMsg} — falling back to wa.me`,
        );
        return {
          message,
          waMeUrl,
          dispatched: false,
          channel: waMeUrl ? 'wa_me' : 'none',
          error: errMsg,
        };
      }
    }

    return {
      message,
      waMeUrl,
      dispatched: false,
      channel: waMeUrl ? 'wa_me' : 'none',
    };
  }

  /** POST a text message to the WhatsApp Cloud API. Throws on non-2xx. */
  private async sendViaMeta(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    body: string,
  ): Promise<void> {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          // NOTE: free-form text only reaches users who messaged us in the last
          // 24h (or the dev test number's verified recipients). Production
          // proactive sends require a pre-approved message template.
          text: { preview_url: false, body },
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Graph API ${response.status}: ${detail.slice(0, 300)}`);
      }
    } finally {
      clearTimeout(timer);
    }
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

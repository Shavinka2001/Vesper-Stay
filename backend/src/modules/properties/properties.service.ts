import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@generated/prisma/client';
import { SecretCipherService } from '@common/crypto/secret-cipher.service';
import type { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import type { UpdateWhatsAppConfigDto } from '@modules/properties/dto/update-whatsapp-config.dto';
import { PrismaService } from '@prisma/prisma.service';

export interface WhatsAppConfigView {
  enabled: boolean;
  phoneNumberId: string | null;
  hasToken: boolean;
  encryptionAvailable: boolean;
}

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: SecretCipherService,
  ) {}

  findAll(_query: PaginationQueryDto): Promise<unknown[]> {
    return Promise.resolve([]);
  }

  async getWhatsAppConfig(propertyId: string): Promise<WhatsAppConfigView> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        whatsappEnabled: true,
        whatsappPhoneNumberId: true,
        whatsappTokenEncrypted: true,
      },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return {
      enabled: property.whatsappEnabled,
      phoneNumberId: property.whatsappPhoneNumberId,
      hasToken: !!property.whatsappTokenEncrypted,
      encryptionAvailable: this.cipher.isAvailable,
    };
  }

  async updateWhatsAppConfig(
    propertyId: string,
    dto: UpdateWhatsAppConfigDto,
  ): Promise<WhatsAppConfigView> {
    const existing = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        whatsappPhoneNumberId: true,
        whatsappTokenEncrypted: true,
      },
    });
    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    const data: Prisma.PropertyUpdateInput = {};

    if (dto.phoneNumberId !== undefined) {
      data.whatsappPhoneNumberId = dto.phoneNumberId?.trim() || null;
    }

    if (dto.accessToken) {
      if (!this.cipher.isAvailable) {
        throw new BadRequestException(
          'Server encryption key (CREDENTIALS_ENC_KEY) is not configured — cannot store the token securely',
        );
      }
      data.whatsappTokenEncrypted = this.cipher.encrypt(dto.accessToken.trim());
    }

    if (dto.enabled !== undefined) {
      if (dto.enabled) {
        const willHavePhone =
          dto.phoneNumberId?.trim() || existing.whatsappPhoneNumberId;
        const willHaveToken =
          dto.accessToken?.trim() || existing.whatsappTokenEncrypted;
        if (!willHavePhone || !willHaveToken) {
          throw new BadRequestException(
            'Phone Number ID and access token are required to enable WhatsApp',
          );
        }
      }
      data.whatsappEnabled = dto.enabled;
    }

    await this.prisma.property.update({ where: { id: propertyId }, data });
    return this.getWhatsAppConfig(propertyId);
  }
}

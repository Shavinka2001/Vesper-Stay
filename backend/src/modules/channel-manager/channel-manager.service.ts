import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  ChannelSyncDirection,
  ChannelSyncStatus,
  Prisma,
} from '@generated/prisma/client';
import { isBookingOverlapConflict } from '@modules/bookings/bookings.service';
import {
  buildExternalRef,
  channelTypeToBookingSource,
  isOwnFeedEvent,
} from '@modules/channel-manager/channel-mapping';
import type { CreateChannelConnectionDto } from '@modules/channel-manager/dto/create-channel-connection.dto';
import type { UpdateChannelConnectionDto } from '@modules/channel-manager/dto/update-channel-connection.dto';
import {
  generateICal,
  parseICal,
  type CalendarEvent,
} from '@modules/channel-manager/ical';
import { PrismaService } from '@prisma/prisma.service';

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
];

const FETCH_TIMEOUT_MS = 15_000;

export interface SyncResult {
  connectionId: string;
  imported: number;
  cancelled: number;
  failed: number;
  errors: string[];
}

@Injectable()
export class ChannelManagerService {
  private readonly logger = new Logger(ChannelManagerService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Connection CRUD ───────────────────────────────────────────────────────

  async listConnections(propertyId: string) {
    return this.prisma.channelConnection.findMany({
      where: { propertyId },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        room: { select: { id: true, number: true } },
        syncLogs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  /** Legacy status endpoint — now backed by real connections. */
  async getStatus(propertyId: string) {
    const channels = await this.listConnections(propertyId);
    return {
      propertyId,
      channels,
      message:
        channels.length === 0
          ? 'No channels connected yet'
          : `${channels.length} channel connection(s)`,
    };
  }

  async createConnection(propertyId: string, dto: CreateChannelConnectionDto) {
    if (dto.roomId) {
      await this.assertRoomInProperty(propertyId, dto.roomId);
    }

    try {
      return await this.prisma.channelConnection.create({
        data: {
          propertyId,
          roomId: dto.roomId ?? null,
          channelType: dto.channelType,
          name: dto.name.trim(),
          iCalImportUrl: dto.iCalImportUrl ?? null,
          iCalExportUrl: dto.roomId ? this.exportPath(dto.roomId) : null,
          syncDirection: dto.syncDirection ?? ChannelSyncDirection.BIDIRECTIONAL,
          isEnabled: dto.isEnabled ?? false,
        },
        include: { room: { select: { id: true, number: true } } },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A channel with this type and name already exists',
        );
      }
      throw error;
    }
  }

  async updateConnection(
    propertyId: string,
    id: string,
    dto: UpdateChannelConnectionDto,
  ) {
    await this.assertConnectionInProperty(propertyId, id);
    if (dto.roomId) {
      await this.assertRoomInProperty(propertyId, dto.roomId);
    }

    const data: Prisma.ChannelConnectionUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.channelType !== undefined) data.channelType = dto.channelType;
    if (dto.syncDirection !== undefined) data.syncDirection = dto.syncDirection;
    if (dto.isEnabled !== undefined) data.isEnabled = dto.isEnabled;
    if (dto.iCalImportUrl !== undefined) {
      data.iCalImportUrl = dto.iCalImportUrl || null;
    }
    if (dto.roomId !== undefined) {
      data.room = dto.roomId
        ? { connect: { id: dto.roomId } }
        : { disconnect: true };
      data.iCalExportUrl = dto.roomId ? this.exportPath(dto.roomId) : null;
    }

    return this.prisma.channelConnection.update({
      where: { id },
      data,
      include: { room: { select: { id: true, number: true } } },
    });
  }

  async deleteConnection(propertyId: string, id: string) {
    await this.assertConnectionInProperty(propertyId, id);
    await this.prisma.channelConnection.delete({ where: { id } });
    return { success: true as const };
  }

  // ─── Export: publish our bookings as an iCal feed ───────────────────────────

  /**
   * Public per-room iCal feed. Intentionally leaks NO guest PII — every busy
   * block is just "Reserved". The room UUID in the URL acts as the feed secret
   * (same model Airbnb/Google use for private calendar links).
   */
  async buildRoomExportFeed(roomId: string): Promise<string> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, number: true, property: { select: { name: true } } },
    });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const startOfToday = this.startOfUtcDay(new Date());
    const bookings = await this.prisma.booking.findMany({
      where: {
        roomId,
        status: { in: ACTIVE_BOOKING_STATUSES },
        checkOutDate: { gte: startOfToday },
      },
      select: {
        confirmationCode: true,
        checkInDate: true,
        checkOutDate: true,
      },
      orderBy: { checkInDate: 'asc' },
    });

    const events: CalendarEvent[] = bookings.map((b) => ({
      uid: `${b.confirmationCode}@vesperstay`,
      summary: 'Reserved',
      start: this.toIsoDate(b.checkInDate),
      end: this.toIsoDate(b.checkOutDate),
    }));

    return generateICal(events, {
      calName: `${room.property.name} · Room ${room.number}`,
    });
  }

  // ─── Import: pull an external OTA calendar and block those dates ────────────

  async syncConnection(
    propertyId: string,
    connectionId: string,
  ): Promise<SyncResult> {
    const connection = await this.prisma.channelConnection.findFirst({
      where: { id: connectionId, propertyId },
      include: { property: { select: { currency: true } } },
    });
    if (!connection) {
      throw new NotFoundException('Channel connection not found');
    }
    if (!connection.roomId) {
      throw new BadRequestException(
        'Connect this channel to a room before syncing',
      );
    }
    if (!connection.iCalImportUrl) {
      throw new BadRequestException('No iCal import URL configured');
    }

    const roomId = connection.roomId;
    const currency = connection.property.currency;

    const log = await this.prisma.channelSyncLog.create({
      data: {
        channelConnectionId: connectionId,
        direction: ChannelSyncDirection.IMPORT,
        status: ChannelSyncStatus.SYNCING,
      },
    });
    await this.prisma.channelConnection.update({
      where: { id: connectionId },
      data: { lastSyncStatus: ChannelSyncStatus.SYNCING },
    });

    try {
      const text = await this.fetchText(connection.iCalImportUrl);
      const events = parseICal(text).filter((e) => !isOwnFeedEvent(e.uid));

      const guest = await this.findOrCreateChannelGuest(propertyId);
      const source = channelTypeToBookingSource(connection.channelType);

      const seenRefs = new Set<string>();
      const errors: string[] = [];
      let imported = 0;
      let failed = 0;

      for (const event of events) {
        if (event.end <= event.start) continue; // ignore empty/invalid ranges
        const externalRef = buildExternalRef(connectionId, event.uid);
        seenRefs.add(externalRef);

        try {
          await this.upsertBlockingBooking({
            propertyId,
            roomId,
            guestId: guest.id,
            currency,
            source,
            externalRef,
            start: event.start,
            end: event.end,
          });
          imported += 1;
        } catch (error) {
          if (isBookingOverlapConflict(error)) {
            failed += 1;
            errors.push(
              `${event.start} → ${event.end}: room already booked locally`,
            );
            continue;
          }
          throw error;
        }
      }

      const cancelled = await this.cancelVanishedBlocks(
        propertyId,
        roomId,
        connectionId,
        seenRefs,
      );

      await this.finishLog(log.id, ChannelSyncStatus.SUCCESS, {
        recordsProcessed: imported,
        recordsFailed: failed,
        metadata: { imported, cancelled, failed, errors },
      });
      await this.prisma.channelConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncedAt: new Date(),
          lastSyncStatus: ChannelSyncStatus.SUCCESS,
          lastSyncError: null,
        },
      });

      return { connectionId, imported, cancelled, failed, errors };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Channel sync failed';
      this.logger.error(`Sync failed for ${connectionId}: ${message}`);
      await this.finishLog(log.id, ChannelSyncStatus.FAILED, {
        errorMessage: message,
      });
      await this.prisma.channelConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncStatus: ChannelSyncStatus.FAILED,
          lastSyncError: message,
        },
      });
      throw new BadRequestException(`Channel sync failed: ${message}`);
    }
  }

  // ─── internals ──────────────────────────────────────────────────────────────

  private async upsertBlockingBooking(input: {
    propertyId: string;
    roomId: string;
    guestId: string;
    currency: string;
    source: ReturnType<typeof channelTypeToBookingSource>;
    externalRef: string;
    start: string;
    end: string;
  }): Promise<void> {
    const checkInDate = this.isoToDate(input.start);
    const checkOutDate = this.isoToDate(input.end);

    const existing = await this.prisma.booking.findFirst({
      where: {
        propertyId: input.propertyId,
        roomId: input.roomId,
        externalRef: input.externalRef,
      },
      select: { id: true, checkInDate: true, checkOutDate: true, status: true },
    });

    if (existing) {
      const unchanged =
        this.toIsoDate(existing.checkInDate) === input.start &&
        this.toIsoDate(existing.checkOutDate) === input.end &&
        existing.status === BookingStatus.CONFIRMED;
      if (unchanged) return;

      await this.prisma.booking.update({
        where: { id: existing.id },
        data: {
          checkInDate,
          checkOutDate,
          status: BookingStatus.CONFIRMED,
          cancelledAt: null,
          version: { increment: 1 },
        },
      });
      return;
    }

    await this.prisma.booking.create({
      data: {
        propertyId: input.propertyId,
        roomId: input.roomId,
        guestId: input.guestId,
        confirmationCode: this.generateOtaCode(),
        status: BookingStatus.CONFIRMED,
        source: input.source,
        externalRef: input.externalRef,
        checkInDate,
        checkOutDate,
        currency: input.currency,
        totalAmount: new Prisma.Decimal(0),
        notes: 'Imported from channel calendar',
      },
    });
  }

  /** Cancel local OTA blocks whose event disappeared from the feed. */
  private async cancelVanishedBlocks(
    propertyId: string,
    roomId: string,
    connectionId: string,
    seenRefs: Set<string>,
  ): Promise<number> {
    const current = await this.prisma.booking.findMany({
      where: {
        propertyId,
        roomId,
        status: { in: ACTIVE_BOOKING_STATUSES },
        externalRef: { startsWith: `ical:${connectionId}:` },
      },
      select: { id: true, externalRef: true },
    });

    const stale = current.filter(
      (b) => b.externalRef !== null && !seenRefs.has(b.externalRef),
    );
    if (stale.length === 0) return 0;

    await this.prisma.booking.updateMany({
      where: { id: { in: stale.map((b) => b.id) } },
      data: { status: BookingStatus.CANCELLED, cancelledAt: new Date() },
    });
    return stale.length;
  }

  private async findOrCreateChannelGuest(propertyId: string) {
    const email = `channel-reservations+${propertyId}@vesperstay.local`;
    const existing = await this.prisma.guest.findFirst({
      where: { propertyId, email },
      select: { id: true },
    });
    if (existing) return existing;

    return this.prisma.guest.create({
      data: {
        propertyId,
        email,
        firstName: 'Channel',
        lastName: 'Reservation',
      },
      select: { id: true },
    });
  }

  private async fetchText(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'text/calendar, text/plain, */*' },
      });
      if (!response.ok) {
        throw new Error(`feed responded ${response.status}`);
      }
      return await response.text();
    } finally {
      clearTimeout(timer);
    }
  }

  private async finishLog(
    logId: string,
    status: ChannelSyncStatus,
    extra: {
      recordsProcessed?: number;
      recordsFailed?: number;
      errorMessage?: string;
      metadata?: Prisma.InputJsonValue;
    },
  ): Promise<void> {
    await this.prisma.channelSyncLog.update({
      where: { id: logId },
      data: {
        status,
        finishedAt: new Date(),
        recordsProcessed: extra.recordsProcessed ?? 0,
        recordsFailed: extra.recordsFailed ?? 0,
        errorMessage: extra.errorMessage ?? null,
        metadata: extra.metadata,
      },
    });
  }

  private async assertRoomInProperty(
    propertyId: string,
    roomId: string,
  ): Promise<void> {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, propertyId },
      select: { id: true },
    });
    if (!room) {
      throw new BadRequestException('Room does not belong to this property');
    }
  }

  private async assertConnectionInProperty(
    propertyId: string,
    id: string,
  ): Promise<void> {
    const connection = await this.prisma.channelConnection.findFirst({
      where: { id, propertyId },
      select: { id: true },
    });
    if (!connection) {
      throw new NotFoundException('Channel connection not found');
    }
  }

  private exportPath(roomId: string): string {
    return `/api/channel-manager/ical/export/${roomId}.ics`;
  }

  private generateOtaCode(): string {
    return `OTA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  private toIsoDate(date: Date): string {
    return new Date(date).toISOString().slice(0, 10);
  }

  private isoToDate(iso: string): Date {
    return new Date(`${iso}T00:00:00.000Z`);
  }

  private startOfUtcDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }
}

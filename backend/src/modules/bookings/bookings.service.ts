import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  RoomStatus,
} from '@generated/prisma/client';
import type { CheckInDto } from '@modules/bookings/dto/check-in.dto';
import type { CheckOutDto } from '@modules/bookings/dto/check-out.dto';
import type { CreateBookingDto } from '@modules/bookings/dto/create-booking.dto';
import type { UpdatableBookingStatus } from '@modules/bookings/dto/update-booking-status.dto';
import { isBookingOverlapConflict } from '@modules/bookings/booking-errors';
import { computeFolio } from '@modules/bookings/folio';
import { ChannelManagerService } from '@modules/channel-manager/channel-manager.service';
import { WhatsAppService } from '@modules/whatsapp/whatsapp.service';
import { PrismaService } from '@prisma/prisma.service';

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
];

// Re-exported for backwards compatibility; the implementation now lives in
// booking-errors.ts so other modules can use it without importing this service.
export { isBookingOverlapConflict };

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsApp: WhatsAppService,
    private readonly channelManager: ChannelManagerService,
  ) {}

  async createBooking(propertyId: string, dto: CreateBookingDto) {
    try {
      if (!propertyId?.trim()) {
        throw new BadRequestException('propertyId is required');
      }

      const checkInDate = this.toDateOnly(dto.checkInDate);
      const checkOutDate = this.toDateOnly(dto.checkOutDate);

      if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
        throw new BadRequestException('Invalid check-in or check-out date');
      }

      if (checkOutDate <= checkInDate) {
        throw new BadRequestException(
          'checkOutDate must be after checkInDate',
        );
      }

      const totalAmount = Number(dto.totalAmount);
      const paidAmount = Number(dto.paidAmount ?? 0);

      if (!Number.isFinite(totalAmount) || totalAmount < 0) {
        throw new BadRequestException('totalAmount must be a valid number');
      }
      if (!Number.isFinite(paidAmount) || paidAmount < 0) {
        throw new BadRequestException('paidAmount must be a valid number');
      }
      if (paidAmount > totalAmount) {
        throw new BadRequestException(
          'paidAmount cannot exceed totalAmount',
        );
      }

      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, name: true, currency: true },
      });
      if (!property) {
        throw new NotFoundException(`Property ${propertyId} not found`);
      }

      const instantCheckIn =
        dto.instantCheckIn === true ||
        dto.status === BookingStatus.CHECKED_IN;
      const bookingStatus = instantCheckIn
        ? BookingStatus.CHECKED_IN
        : BookingStatus.CONFIRMED;
      const paymentMethod = dto.paymentMethod ?? PaymentMethod.CASH;
      const now = new Date();
      const adults = Number(dto.adultsCount) || 1;
      const children = Number(dto.childrenCount ?? 0) || 0;

      // Event-driven: pull the freshest OTA calendar for this room before we
      // accept the booking, so a reservation made on Airbnb minutes ago is
      // already blocked locally. Resilient by design — never blocks the booking
      // if a feed is slow or down.
      try {
        await this.channelManager.refreshRoomImports(propertyId, dto.roomId);
      } catch (refreshError) {
        console.warn('JIT channel refresh failed (continuing):', refreshError);
      }

      let booking;
      try {
        booking = await this.prisma.$transaction(
          async (tx) => this.persistNewBooking(tx, {
            propertyId,
            propertyCurrency: property.currency,
            dto,
            checkInDate,
            checkOutDate,
            totalAmount,
            paidAmount,
            adults,
            children,
            bookingStatus,
            paymentMethod,
            instantCheckIn,
            now,
          }),
          {
            maxWait: 10_000,
            timeout: 20_000,
          },
        );
      } catch (txnError: unknown) {
        if (
          txnError instanceof BadRequestException ||
          txnError instanceof ConflictException ||
          txnError instanceof NotFoundException
        ) {
          throw txnError;
        }
        // Neon pooler can reject interactive transactions — retry once without txn wrapper.
        console.error(
          'Booking txn failed, retrying without interactive transaction:',
          txnError,
        );
        booking = await this.persistNewBooking(this.prisma, {
          propertyId,
          propertyCurrency: property.currency,
          dto,
          checkInDate,
          checkOutDate,
          totalAmount,
          paidAmount,
          adults,
          children,
          bookingStatus,
          paymentMethod,
          instantCheckIn,
          now,
        });
      }

      let whatsapp = null;
      if (instantCheckIn) {
        whatsapp = await this.whatsApp.sendWelcomeMessage({
          propertyId,
          guestFirstName: booking.guest.firstName,
          guestPhone: booking.guest.phone,
          propertyName: property.name,
          roomNumber: booking.room.number,
          confirmationCode: booking.confirmationCode,
        });
      }

      return {
        booking,
        whatsapp,
      };
    } catch (error: unknown) {
      console.error('Booking Creation Error:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create booking';
      throw new BadRequestException(message);
    }
  }

  /**
   * Active bookings overlapping the Front-Desk Tape Chart window.
   */
  async getBookingsTimeline(
    propertyId: string,
    startDate: string,
    endDate: string,
  ) {
    const rangeStart = this.toDateOnly(startDate);
    const rangeEnd = this.toDateOnly(endDate);

    if (rangeEnd < rangeStart) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    // Inclusive end: treat endDate as end-of-day by using next-day exclusive bound.
    const rangeEndExclusive = new Date(rangeEnd);
    rangeEndExclusive.setUTCDate(rangeEndExclusive.getUTCDate() + 1);

    return this.prisma.booking.findMany({
      where: {
        propertyId,
        status: { in: ACTIVE_BOOKING_STATUSES },
        checkInDate: { lt: rangeEndExclusive },
        checkOutDate: { gt: rangeStart },
      },
      orderBy: [{ checkInDate: 'asc' }, { roomId: 'asc' }],
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            idPassport: true,
            nationality: true,
            country: true,
            vehicleNumber: true,
          },
        },
        room: {
          select: {
            id: true,
            number: true,
            floor: true,
            status: true,
            isCabana: true,
            roomType: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });
  }

  async getDashboardMetrics(propertyId: string) {
    const today = this.startOfUtcDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [
      arrivals,
      departures,
      inHouseBookings,
      rooms,
      revenueAgg,
    ] = await Promise.all([
      this.prisma.booking.count({
        where: {
          propertyId,
          checkInDate: today,
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
          },
        },
      }),
      this.prisma.booking.count({
        where: {
          propertyId,
          checkOutDate: today,
          status: BookingStatus.CHECKED_IN,
        },
      }),
      this.prisma.booking.findMany({
        where: {
          propertyId,
          status: BookingStatus.CHECKED_IN,
        },
        select: { adults: true, children: true },
      }),
      this.prisma.room.findMany({
        where: { propertyId, isActive: true },
        select: { status: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          propertyId,
          status: PaymentStatus.CAPTURED,
          paidAt: { gte: today, lt: tomorrow },
        },
        _sum: { amount: true },
      }),
    ]);

    const inHouseGuests = inHouseBookings.reduce(
      (sum, b) => sum + b.adults + b.children,
      0,
    );

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(
      (r) => r.status === RoomStatus.OCCUPIED,
    ).length;
    const occupancyRate =
      totalRooms === 0
        ? 0
        : Math.round((occupiedRooms / totalRooms) * 1000) / 10;

    return {
      todaysArrivals: arrivals,
      todaysDepartures: departures,
      inHouseGuests,
      occupancyRate,
      todaysRevenue: Number(revenueAgg._sum.amount ?? 0),
      occupiedRooms,
      totalRooms,
      asOf: today.toISOString().slice(0, 10),
    };
  }

  async updateStatus(
    propertyId: string,
    bookingId: string,
    status: UpdatableBookingStatus,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, propertyId },
      });

      if (!booking) {
        throw new NotFoundException(
          `Booking ${bookingId} not found for this property`,
        );
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Cancelled bookings cannot be updated');
      }

      if (
        booking.status === BookingStatus.CHECKED_OUT &&
        status !== BookingStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Checked-out bookings cannot transition to this status',
        );
      }

      const now = new Date();
      const bookingUpdate: Prisma.BookingUpdateInput = {
        status,
        version: { increment: 1 },
      };

      if (status === BookingStatus.CHECKED_IN) {
        bookingUpdate.checkedInAt = now;
      }
      if (status === BookingStatus.CHECKED_OUT) {
        bookingUpdate.checkedOutAt = now;
      }
      if (status === BookingStatus.CANCELLED) {
        bookingUpdate.cancelledAt = now;
      }

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: bookingUpdate,
        include: {
          guest: true,
          room: {
            include: {
              roomType: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });

      // Auto-sync room housekeeping status with guest lifecycle.
      if (status === BookingStatus.CHECKED_IN) {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { status: RoomStatus.OCCUPIED },
        });
      } else if (status === BookingStatus.CHECKED_OUT) {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { status: RoomStatus.DIRTY },
        });
      } else if (
        status === BookingStatus.CANCELLED &&
        booking.status === BookingStatus.CHECKED_IN
      ) {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { status: RoomStatus.DIRTY },
        });
      }

      return updated;
    });
  }

  async listBookings(propertyId: string) {
    return this.prisma.booking.findMany({
      where: {
        propertyId,
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
            BookingStatus.CHECKED_OUT,
          ],
        },
      },
      orderBy: [{ checkInDate: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        guest: true,
        room: {
          include: {
            roomType: { select: { id: true, name: true, code: true, baseRate: true } },
          },
        },
      },
    });
  }

  async getFolio(propertyId: string, bookingId: string) {
    const booking = await this.loadBookingWithFolio(propertyId, bookingId);
    return this.buildFolio(booking);
  }

  async checkIn(propertyId: string, bookingId: string, dto: CheckInDto) {
    const existing = await this.prisma.booking.findFirst({
      where: { id: bookingId, propertyId },
      include: {
        guest: true,
        room: {
          include: {
            roomType: { select: { id: true, name: true, code: true, baseRate: true } },
          },
        },
        property: { select: { id: true, name: true, currency: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }
    if (
      existing.status !== BookingStatus.CONFIRMED &&
      existing.status !== BookingStatus.PENDING
    ) {
      throw new BadRequestException(
        `Cannot check in a booking with status ${existing.status}`,
      );
    }

    const deposit = dto.depositAmount ?? 0;
    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.guest.update({
        where: { id: existing.guestId },
        data: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email?.trim().toLowerCase() || existing.guest.email,
          phone: dto.phone.trim(),
          idPassport: dto.idPassport?.trim() || existing.guest.idPassport,
          country: dto.country?.trim() || existing.guest.country,
          nationality: dto.nationality?.trim() || existing.guest.nationality,
          vehicleNumber:
            dto.vehicleNumber?.trim() || existing.guest.vehicleNumber,
        },
      });

      if (deposit > 0) {
        await tx.payment.create({
          data: {
            propertyId,
            bookingId,
            amount: new Prisma.Decimal(deposit),
            currency: existing.currency,
            method: PaymentMethod.CASH,
            status: PaymentStatus.CAPTURED,
            paidAt: now,
            notes: 'Advance deposit at check-in',
          },
        });
      }

      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CHECKED_IN,
          checkedInAt: now,
          paidAmount: { increment: deposit },
          version: { increment: 1 },
        },
        include: {
          guest: true,
          room: {
            include: {
              roomType: {
                select: { id: true, name: true, code: true, baseRate: true },
              },
            },
          },
          property: { select: { id: true, name: true, currency: true } },
        },
      });

      await tx.room.update({
        where: { id: existing.roomId },
        data: { status: RoomStatus.OCCUPIED },
      });

      return booking;
    });

    const whatsapp = await this.whatsApp.sendWelcomeMessage({
      propertyId,
      guestFirstName: updated.guest.firstName,
      guestPhone: updated.guest.phone,
      propertyName: updated.property.name,
      roomNumber: updated.room.number,
      confirmationCode: updated.confirmationCode,
    });

    return {
      booking: updated,
      whatsapp,
    };
  }

  async checkOut(propertyId: string, bookingId: string, dto: CheckOutDto) {
    const existing = await this.loadBookingWithFolio(propertyId, bookingId);

    if (existing.status !== BookingStatus.CHECKED_IN) {
      throw new BadRequestException('Only in-house guests can check out');
    }

    const folio = this.buildFolio(existing);
    const settleAmount = dto.settleAmount ?? folio.balanceDue;
    if (settleAmount < 0) {
      throw new BadRequestException('settleAmount cannot be negative');
    }

    const now = new Date();
    const method = dto.paymentMethod ?? PaymentMethod.CARD;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (settleAmount > 0) {
        await tx.payment.create({
          data: {
            propertyId,
            bookingId,
            amount: new Prisma.Decimal(settleAmount),
            currency: existing.currency,
            method,
            status: PaymentStatus.CAPTURED,
            paidAt: now,
            notes: 'Balance settled at check-out',
          },
        });
      }

      // Mark pending folio POS charges as captured on settlement.
      await tx.payment.updateMany({
        where: {
          bookingId,
          propertyId,
          method: PaymentMethod.CHARGE_TO_ROOM,
          status: PaymentStatus.PENDING,
        },
        data: {
          status: PaymentStatus.CAPTURED,
          paidAt: now,
        },
      });

      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CHECKED_OUT,
          checkedOutAt: now,
          paidAmount: { increment: settleAmount },
          version: { increment: 1 },
        },
        include: {
          guest: true,
          room: {
            include: {
              roomType: {
                select: { id: true, name: true, code: true, baseRate: true },
              },
            },
          },
          property: { select: { id: true, name: true, currency: true } },
          orders: {
            include: {
              orderItems: {
                include: {
                  menuItem: { select: { name: true, category: true } },
                },
              },
            },
          },
          payments: true,
        },
      });

      await tx.room.update({
        where: { id: existing.roomId },
        data: { status: RoomStatus.DIRTY },
      });

      return booking;
    });

    const settledFolio = this.buildFolio(updated);
    const whatsapp = await this.whatsApp.sendInvoiceMessage({
      propertyId,
      guestFirstName: updated.guest.firstName,
      guestPhone: updated.guest.phone,
      propertyName: updated.property.name,
      roomNumber: updated.room.number,
      confirmationCode: updated.confirmationCode,
      currency: updated.currency,
      lines: settledFolio.lines.map((line) => ({
        label: line.label,
        amount: line.amount,
      })),
      totalAmount: settledFolio.grandTotal,
      paidAmount: settledFolio.paidAmount,
      balanceDue: settledFolio.balanceDue,
    });

    return {
      booking: updated,
      folio: settledFolio,
      whatsapp,
    };
  }

  private async loadBookingWithFolio(propertyId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, propertyId },
      include: {
        guest: true,
        room: {
          include: {
            roomType: {
              select: { id: true, name: true, code: true, baseRate: true },
            },
          },
        },
        property: { select: { id: true, name: true, currency: true } },
        orders: {
          include: {
            orderItems: {
              include: {
                menuItem: { select: { name: true, category: true } },
              },
            },
          },
        },
        payments: {
          orderBy: [{ createdAt: 'asc' }],
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }
    return booking;
  }

  private buildFolio(
    booking: Awaited<ReturnType<BookingsService['loadBookingWithFolio']>>,
  ) {
    // Convert Prisma Decimals → numbers at the edge, then delegate the money
    // math to the pure, exhaustively-tested computeFolio().
    const computed = computeFolio({
      bookingId: booking.id,
      roomNumber: booking.room.number,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      baseRate: Number(booking.room.roomType.baseRate),
      bookingTotalAmount: Number(booking.totalAmount),
      paidAmount: Number(booking.paidAmount),
      orders: booking.orders.map((order) => ({
        id: order.id,
        totalAmount: Number(order.totalAmount),
        itemNames: order.orderItems.map((i) => i.menuItem.name),
      })),
    });

    return {
      bookingId: booking.id,
      confirmationCode: booking.confirmationCode,
      currency: booking.currency,
      ...computed,
      payments: booking.payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        method: payment.method,
        status: payment.status,
        paidAt: payment.paidAt,
        notes: payment.notes,
      })),
      guest: booking.guest,
      room: booking.room,
      status: booking.status,
    };
  }

  private async persistNewBooking(
    db: Prisma.TransactionClient | PrismaService,
    input: {
      propertyId: string;
      propertyCurrency: string;
      dto: CreateBookingDto;
      checkInDate: Date;
      checkOutDate: Date;
      totalAmount: number;
      paidAmount: number;
      adults: number;
      children: number;
      bookingStatus: BookingStatus;
      paymentMethod: PaymentMethod;
      instantCheckIn: boolean;
      now: Date;
    },
  ) {
    const {
      propertyId,
      propertyCurrency,
      dto,
      checkInDate,
      checkOutDate,
      totalAmount,
      paidAmount,
      adults,
      children,
      bookingStatus,
      paymentMethod,
      instantCheckIn,
      now,
    } = input;

    const room = await db.room.findFirst({
      where: {
        id: dto.roomId,
        propertyId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!room) {
      throw new NotFoundException(
        `Room ${dto.roomId} not found for this property`,
      );
    }

    const overlapping = await db.booking.findFirst({
      where: {
        propertyId,
        roomId: dto.roomId,
        status: { in: ACTIVE_BOOKING_STATUSES },
        checkInDate: { lt: checkOutDate },
        checkOutDate: { gt: checkInDate },
      },
      select: { id: true, confirmationCode: true },
    });

    if (overlapping) {
      throw new ConflictException('Room is already booked for these dates!');
    }

    const guest = await this.findOrCreateGuest(db, propertyId, dto.guest);
    const confirmationCode = await this.generateConfirmationCode(
      db,
      propertyId,
    );

    let created;
    try {
      created = await db.booking.create({
        data: {
          propertyId,
          roomId: dto.roomId,
          guestId: guest.id,
          confirmationCode,
          status: bookingStatus,
          source: dto.source,
          checkInDate,
          checkOutDate,
          adults,
          children,
          currency: propertyCurrency,
          totalAmount: new Prisma.Decimal(totalAmount),
          paidAmount: new Prisma.Decimal(paidAmount),
          notes: dto.specialRequests?.trim() || null,
          checkedInAt: instantCheckIn ? now : null,
          version: 1,
        },
        include: {
          guest: true,
          room: {
            include: {
              roomType: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  baseRate: true,
                },
              },
            },
          },
        },
      });
    } catch (error: unknown) {
      // The application-layer SELECT above catches the common case, but under
      // true concurrency two requests can both pass it and race to INSERT. The
      // bookings_no_overlap EXCLUDE constraint is the atomic backstop: the loser
      // lands here, and we translate the raw DB error into a clean 409.
      if (isBookingOverlapConflict(error)) {
        throw new ConflictException('Room is already booked for these dates!');
      }
      throw error;
    }

    if (paidAmount > 0) {
      await db.payment.create({
        data: {
          propertyId,
          bookingId: created.id,
          amount: new Prisma.Decimal(paidAmount),
          currency: propertyCurrency,
          method: paymentMethod,
          status: PaymentStatus.CAPTURED,
          paidAt: now,
          notes: instantCheckIn
            ? 'Advance captured at walk-in check-in'
            : 'Initial payment captured at booking creation',
        },
      });
    }

    if (instantCheckIn) {
      await db.room.update({
        where: { id: dto.roomId },
        data: { status: RoomStatus.OCCUPIED },
      });
    }

    return created;
  }

  private async findOrCreateGuest(
    tx: Prisma.TransactionClient | PrismaService,
    propertyId: string,
    guest: CreateBookingDto['guest'],
  ) {
    const firstName = guest.firstName?.trim();
    const lastName = guest.lastName?.trim();
    if (!firstName || !lastName) {
      throw new BadRequestException('Guest firstName and lastName are required');
    }

    const email = guest.email?.trim().toLowerCase() || null;
    const phone = guest.phone?.trim() || null;
    const idPassport = guest.idPassport?.trim() || null;
    const country = guest.country?.trim() || null;
    const nationality = guest.nationality?.trim() || null;

    const existing =
      (email
        ? await tx.guest.findFirst({ where: { propertyId, email } })
        : null) ??
      (phone
        ? await tx.guest.findFirst({ where: { propertyId, phone } })
        : null) ??
      (idPassport
        ? await tx.guest.findFirst({
            where: { propertyId, idPassport },
          })
        : null);

    if (existing) {
      return tx.guest.update({
        where: { id: existing.id },
        data: {
          firstName,
          lastName,
          phone: phone ?? existing.phone,
          idPassport: idPassport ?? existing.idPassport,
          email: email ?? existing.email,
          country: country ?? existing.country,
          nationality: nationality ?? existing.nationality,
        },
      });
    }

    return tx.guest.create({
      data: {
        propertyId,
        firstName,
        lastName,
        phone,
        email,
        idPassport,
        country,
        nationality,
      },
    });
  }

  private async generateConfirmationCode(
    tx: Prisma.TransactionClient | PrismaService,
    propertyId: string,
  ): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = `VS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const clash = await tx.booking.findFirst({
        where: { propertyId, confirmationCode: code },
        select: { id: true },
      });
      if (!clash) {
        return code;
      }
    }
    return `VS-${Date.now().toString(36).toUpperCase()}`;
  }

  private toDateOnly(isoDate: string): Date {
    const raw = String(isoDate ?? '').trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      return new Date(Date.UTC(year, month - 1, day));
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid date: ${isoDate}`);
    }
    return new Date(
      Date.UTC(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate(),
      ),
    );
  }

  private startOfUtcDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }
}

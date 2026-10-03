import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@generated/prisma/client';
import type { CreateMenuItemDto } from '@modules/pos/dto/create-menu-item.dto';
import {
  CreatePosOrderDto,
  PosPaymentMethodDto,
} from '@modules/pos/dto/create-pos-order.dto';
import { PrismaService } from '@prisma/prisma.service';

const SERVICE_CHARGE_RATE = 0.1;

@Injectable()
export class PosService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenuItems(propertyId: string) {
    const items = await this.prisma.menuItem.findMany({
      where: { propertyId, isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const categories = Array.from(
      new Set(items.map((item) => item.category)),
    ).sort((a, b) => a.localeCompare(b));

    return {
      categories,
      items,
      grouped: categories.map((category) => ({
        category,
        items: items.filter((item) => item.category === category),
      })),
    };
  }

  async createMenuItem(propertyId: string, dto: CreateMenuItemDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { currency: true },
    });
    if (!property) {
      throw new NotFoundException(`Property ${propertyId} not found`);
    }

    return this.prisma.menuItem.create({
      data: {
        propertyId,
        name: dto.name.trim(),
        category: dto.category.trim(),
        description: dto.description?.trim() || null,
        price: new Prisma.Decimal(dto.price),
        currency: property.currency,
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  async getInHouseFolios(propertyId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        propertyId,
        status: BookingStatus.CHECKED_IN,
      },
      orderBy: [{ room: { number: 'asc' } }],
      include: {
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        room: {
          select: {
            id: true,
            number: true,
            isCabana: true,
            status: true,
          },
        },
      },
    });

    return bookings.map((booking) => ({
      bookingId: booking.id,
      confirmationCode: booking.confirmationCode,
      roomId: booking.roomId,
      roomNumber: booking.room.number,
      guestName: `${booking.guest.firstName} ${booking.guest.lastName}`.trim(),
      label: `${booking.room.number} — ${booking.guest.firstName} ${booking.guest.lastName}`,
    }));
  }

  async getOrders(propertyId: string) {
    const start = this.startOfUtcDay(new Date());
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const orders = await this.prisma.order.findMany({
      where: {
        propertyId,
        orderedAt: { gte: start, lt: end },
      },
      orderBy: [{ orderedAt: 'desc' }],
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: { id: true, name: true, category: true },
            },
          },
        },
        room: { select: { id: true, number: true } },
        guest: {
          select: { id: true, firstName: true, lastName: true },
        },
        booking: {
          select: { id: true, confirmationCode: true },
        },
      },
    });

    const salesTotal = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    return {
      date: start.toISOString().slice(0, 10),
      orderCount: orders.length,
      salesTotal,
      orders,
    };
  }

  async createOrder(propertyId: string, dto: CreatePosOrderDto) {
    try {
      if (!dto.items?.length) {
        throw new BadRequestException('Order must include at least one item');
      }

      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, currency: true, name: true },
      });
      if (!property) {
        throw new NotFoundException(`Property ${propertyId} not found`);
      }

      const menuItemIds = dto.items.map((item) => item.menuItemId);
      const menuItems = await this.prisma.menuItem.findMany({
        where: {
          propertyId,
          id: { in: menuItemIds },
          isActive: true,
        },
      });

      if (menuItems.length !== new Set(menuItemIds).size) {
        throw new BadRequestException(
          'One or more menu items are invalid for this property',
        );
      }

      const unavailable = menuItems.filter((item) => !item.isAvailable);
      if (unavailable.length > 0) {
        throw new BadRequestException(
          `Unavailable items: ${unavailable.map((i) => i.name).join(', ')}`,
        );
      }

      const normalizedItems = dto.items.map((line) => ({
        menuItemId: line.menuItemId,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
      }));

      const subtotal = normalizedItems.reduce(
        (sum, line) => sum + line.quantity * line.unitPrice,
        0,
      );
      const serviceCharge =
        Math.round(subtotal * SERVICE_CHARGE_RATE * 100) / 100;
      const computedTotal =
        Math.round((subtotal + serviceCharge) * 100) / 100;
      const requestedTotal = Number(dto.totalAmount);

      if (Math.abs(computedTotal - requestedTotal) > 0.05) {
        throw new BadRequestException(
          `totalAmount mismatch. Expected ${computedTotal} (subtotal + 10% service)`,
        );
      }

      let bookingId: string | null = dto.bookingId ?? null;
      let roomId: string | null = dto.roomId ?? null;
      let guestId: string | null = null;
      let roomNumber: string | null = dto.roomNumber?.trim() || null;

      if (dto.paymentMethod === PosPaymentMethodDto.CHARGE_TO_ROOM) {
        const booking = await this.resolveChargeBooking(propertyId, {
          bookingId: dto.bookingId,
          roomId: dto.roomId,
          roomNumber: dto.roomNumber,
        });
        bookingId = booking.id;
        roomId = booking.roomId;
        guestId = booking.guestId;
        roomNumber = booking.room.number;
      }

      const paymentMethod = dto.paymentMethod as unknown as PaymentMethod;

      const persist = async (tx: Prisma.TransactionClient | typeof this.prisma) => {
        const order = await tx.order.create({
          data: {
            propertyId,
            bookingId,
            roomId,
            guestId,
            orderType: roomId ? OrderType.CABANA : OrderType.RESTAURANT,
            status: OrderStatus.DELIVERED,
            paymentMethod,
            currency: property.currency,
            subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
            taxAmount: new Prisma.Decimal(serviceCharge.toFixed(2)),
            totalAmount: new Prisma.Decimal(computedTotal.toFixed(2)),
            notes: dto.notes?.trim() || null,
            deliveredAt: new Date(),
            orderItems: {
              create: normalizedItems.map((line) => ({
                menuItemId: line.menuItemId,
                quantity: line.quantity,
                unitPrice: new Prisma.Decimal(line.unitPrice.toFixed(2)),
                lineTotal: new Prisma.Decimal(
                  (line.quantity * line.unitPrice).toFixed(2),
                ),
              })),
            },
          },
          include: {
            orderItems: {
              include: {
                menuItem: {
                  select: { id: true, name: true, category: true },
                },
              },
            },
            room: { select: { id: true, number: true } },
            guest: {
              select: { id: true, firstName: true, lastName: true },
            },
            booking: {
              select: { id: true, confirmationCode: true },
            },
          },
        });

        if (
          dto.paymentMethod === PosPaymentMethodDto.CHARGE_TO_ROOM &&
          bookingId
        ) {
          await tx.payment.create({
            data: {
              propertyId,
              bookingId,
              amount: new Prisma.Decimal(computedTotal.toFixed(2)),
              currency: property.currency,
              method: PaymentMethod.CHARGE_TO_ROOM,
              status: PaymentStatus.PENDING,
              notes: `POS folio charge · Order ${order.id.slice(0, 8)}`,
            },
          });

          await tx.booking.update({
            where: { id: bookingId },
            data: {
              totalAmount: { increment: computedTotal },
              version: { increment: 1 },
            },
          });
        }

        return {
          ...order,
          serviceCharge,
          roomNumber,
          propertyName: property.name,
          paymentLabel:
            dto.paymentMethod === PosPaymentMethodDto.CHARGE_TO_ROOM
              ? 'Charge to Room'
              : dto.paymentMethod === PosPaymentMethodDto.CARD
                ? 'Card Payment'
                : 'Direct Cash',
        };
      };

      try {
        return await this.prisma.$transaction((tx) => persist(tx), {
          maxWait: 10_000,
          timeout: 20_000,
        });
      } catch (txnError: unknown) {
        if (
          txnError instanceof BadRequestException ||
          txnError instanceof NotFoundException
        ) {
          throw txnError;
        }
        console.error('POS order txn failed, retrying without txn:', txnError);
        return persist(this.prisma);
      }
    } catch (error: unknown) {
      console.error('POS Order Creation Error:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : 'Unable to place POS order';
      throw new BadRequestException(message);
    }
  }

  private async resolveChargeBooking(
    propertyId: string,
    opts: {
      bookingId?: string;
      roomId?: string;
      roomNumber?: string;
    },
  ) {
    if (opts.bookingId) {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: opts.bookingId,
          propertyId,
          status: BookingStatus.CHECKED_IN,
        },
        include: {
          room: { select: { id: true, number: true } },
          guest: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });
      if (!booking) {
        throw new BadRequestException(
          'No active in-house booking found for charge-to-room',
        );
      }
      return booking;
    }

    let roomId = opts.roomId;
    if (!roomId && opts.roomNumber) {
      const room = await this.prisma.room.findFirst({
        where: {
          propertyId,
          number: opts.roomNumber.trim(),
          isActive: true,
        },
        select: { id: true },
      });
      if (!room) {
        throw new NotFoundException(
          `Room "${opts.roomNumber}" not found on this property`,
        );
      }
      roomId = room.id;
    }

    if (!roomId) {
      throw new BadRequestException(
        'bookingId or roomNumber is required for charge-to-room',
      );
    }

    const booking = await this.prisma.booking.findFirst({
      where: {
        propertyId,
        roomId,
        status: BookingStatus.CHECKED_IN,
      },
      include: {
        room: { select: { id: true, number: true } },
        guest: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: [{ checkedInAt: 'desc' }],
    });

    if (!booking) {
      throw new BadRequestException(
        'No in-house guest found for that room. Check in a booking first.',
      );
    }

    return booking;
  }

  private startOfUtcDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }
}

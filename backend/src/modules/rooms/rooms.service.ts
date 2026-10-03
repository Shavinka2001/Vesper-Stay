import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoomStatus } from '@generated/prisma/client';
import type { CreateRoomDto } from '@modules/rooms/dto/create-room.dto';
import type { CreateRoomTypeDto } from '@modules/rooms/dto/create-room-type.dto';
import type { UpdateRoomTypeDto } from '@modules/rooms/dto/update-room-type.dto';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoomsByProperty(propertyId: string) {
    const roomTypes = await this.prisma.roomType.findMany({
      where: { propertyId, isActive: true },
      orderBy: [{ name: 'asc' }],
      include: {
        rooms: {
          where: { isActive: true },
          orderBy: [{ floor: 'asc' }, { number: 'asc' }],
        },
      },
    });

    return roomTypes.map((roomType) => ({
      roomType: {
        id: roomType.id,
        name: roomType.name,
        code: roomType.code,
        description: roomType.description,
        maxOccupancy: roomType.maxOccupancy,
        baseRate: roomType.baseRate,
        amenities: roomType.amenities,
      },
      rooms: roomType.rooms.map((room) => ({
        id: room.id,
        number: room.number,
        floor: room.floor,
        status: room.status,
        notes: room.notes,
        isCabana: room.isCabana,
        roomTypeId: room.roomTypeId,
      })),
      roomCount: roomType.rooms.length,
      availableCount: roomType.rooms.filter(
        (r) => r.status === RoomStatus.AVAILABLE,
      ).length,
    }));
  }

  async getRoomTypes(propertyId: string) {
    return this.prisma.roomType.findMany({
      where: { propertyId, isActive: true },
      orderBy: [{ name: 'asc' }],
      include: {
        _count: {
          select: { rooms: { where: { isActive: true } } },
        },
      },
    });
  }

  async createRoomType(propertyId: string, dto: CreateRoomTypeDto) {
    const name = dto.name.trim();
    const code = await this.uniqueRoomTypeCode(propertyId, name);
    const maxChildren = dto.maxChildren ?? 0;
    const maxOccupancy = dto.maxAdults + maxChildren;

    return this.prisma.roomType.create({
      data: {
        propertyId,
        name,
        code,
        description: dto.description?.trim() || null,
        maxOccupancy,
        baseRate: new Prisma.Decimal(dto.basePrice),
        amenities: dto.amenities ?? [],
      },
    });
  }

  async updateRoomType(
    propertyId: string,
    roomTypeId: string,
    dto: UpdateRoomTypeDto,
  ) {
    const existing = await this.prisma.roomType.findFirst({
      where: { id: roomTypeId, propertyId },
    });
    if (!existing) {
      throw new NotFoundException(
        `Room type ${roomTypeId} not found for this property`,
      );
    }

    const data: Prisma.RoomTypeUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }
    if (dto.basePrice !== undefined) {
      data.baseRate = new Prisma.Decimal(dto.basePrice);
    }
    if (dto.amenities !== undefined) {
      data.amenities = dto.amenities;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }
    if (dto.maxAdults !== undefined || dto.maxChildren !== undefined) {
      const adults = dto.maxAdults ?? Math.max(1, existing.maxOccupancy);
      const children = dto.maxChildren ?? 0;
      data.maxOccupancy = adults + children;
    }

    return this.prisma.roomType.update({
      where: { id: roomTypeId },
      data,
    });
  }

  async deleteRoomType(propertyId: string, roomTypeId: string) {
    const existing = await this.prisma.roomType.findFirst({
      where: { id: roomTypeId, propertyId },
      include: {
        _count: {
          select: { rooms: { where: { isActive: true } } },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException(
        `Room type ${roomTypeId} not found for this property`,
      );
    }
    if (existing._count.rooms > 0) {
      throw new BadRequestException(
        'Remove or reassign all physical rooms before deleting this room type',
      );
    }

    return this.prisma.roomType.update({
      where: { id: roomTypeId },
      data: { isActive: false },
    });
  }

  async updateRoomStatus(
    propertyId: string,
    roomId: string,
    status: RoomStatus,
  ) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, propertyId },
    });

    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found for this property`);
    }

    return this.prisma.room.update({
      where: { id: roomId },
      data: { status },
      include: {
        roomType: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async createRoom(propertyId: string, dto: CreateRoomDto) {
    const roomType = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, propertyId, isActive: true },
    });

    if (!roomType) {
      throw new NotFoundException(
        `Room type ${dto.roomTypeId} not found for this property`,
      );
    }

    const number = dto.roomNumber.trim();
    const existing = await this.prisma.room.findFirst({
      where: { propertyId, number },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `Room number "${number}" already exists on this property`,
      );
    }

    const typeName = roomType.name.toLowerCase();
    const isCabana =
      dto.isCabana ??
      (typeName.includes('cabana') || number.toLowerCase().includes('cabana'));

    return this.prisma.room.create({
      data: {
        propertyId,
        roomTypeId: dto.roomTypeId,
        number,
        floor: dto.floor?.trim() || null,
        status: dto.status ?? RoomStatus.AVAILABLE,
        notes: dto.notes?.trim() || null,
        isCabana,
      },
      include: {
        roomType: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async deleteRoom(propertyId: string, roomId: string) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, propertyId },
      include: {
        _count: {
          select: {
            bookings: {
              where: {
                status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
              },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found for this property`);
    }

    if (room._count.bookings > 0) {
      throw new BadRequestException(
        'Cannot delete a room with active bookings',
      );
    }

    return this.prisma.room.update({
      where: { id: roomId },
      data: { isActive: false },
    });
  }

  private async uniqueRoomTypeCode(
    propertyId: string,
    name: string,
  ): Promise<string> {
    const base =
      name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 24) || 'TYPE';

    let code = base;
    let attempt = 1;
    while (
      await this.prisma.roomType.findFirst({
        where: { propertyId, code },
        select: { id: true },
      })
    ) {
      attempt += 1;
      code = `${base.slice(0, 20)}_${attempt}`;
    }
    return code;
  }
}

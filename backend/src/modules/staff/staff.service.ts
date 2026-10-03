import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@generated/prisma/client';
import type { CreateStaffDto } from '@modules/staff/dto/create-staff.dto';
import { STAFF_ASSIGNABLE_ROLES } from '@modules/staff/dto/create-staff.dto';
import type { ResetStaffPasswordDto } from '@modules/staff/dto/reset-staff-password.dto';
import type { UpdateStaffRoleDto } from '@modules/staff/dto/update-staff-role.dto';
import { PrismaService } from '@prisma/prisma.service';

const BCRYPT_SALT_ROUNDS = 10;

export type StaffMemberView = {
  id: string;
  membershipId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
};

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async getStaffMembers(propertyId: string): Promise<StaffMemberView[]> {
    const memberships = await this.prisma.propertyMembership.findMany({
      where: { propertyId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    return memberships.map((m) => this.toView(m));
  }

  async createStaffMember(
    propertyId: string,
    dto: CreateStaffDto,
  ): Promise<StaffMemberView> {
    this.assertAssignableRole(dto.role);

    const email = dto.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException(
        `A user with email "${email}" already exists`,
      );
    }

    const membership = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone: dto.phone?.trim() || null,
          isActive: true,
        },
      });

      return tx.propertyMembership.create({
        data: {
          propertyId,
          userId: user.id,
          role: dto.role,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
        },
      });
    });

    return this.toView(membership);
  }

  async toggleStaffStatus(
    propertyId: string,
    staffId: string,
    isActive: boolean,
  ): Promise<StaffMemberView> {
    const membership = await this.findMembershipOrThrow(propertyId, staffId);

    if (membership.role === UserRole.HOTEL_OWNER && !isActive) {
      throw new ForbiddenException('Cannot deactivate the hotel owner');
    }

    const updated = await this.prisma.propertyMembership.update({
      where: { id: membership.id },
      data: { isActive },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    });

    return this.toView(updated);
  }

  async updateStaffRole(
    propertyId: string,
    staffId: string,
    dto: UpdateStaffRoleDto,
  ): Promise<StaffMemberView> {
    this.assertAssignableRole(dto.role);
    const membership = await this.findMembershipOrThrow(propertyId, staffId);

    if (membership.role === UserRole.HOTEL_OWNER) {
      throw new ForbiddenException('Cannot change the hotel owner role');
    }

    const updated = await this.prisma.propertyMembership.update({
      where: { id: membership.id },
      data: { role: dto.role },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    });

    return this.toView(updated);
  }

  async resetStaffPassword(
    propertyId: string,
    staffId: string,
    dto: ResetStaffPasswordDto,
  ): Promise<{ success: true }> {
    const membership = await this.findMembershipOrThrow(propertyId, staffId);

    if (membership.role === UserRole.HOTEL_OWNER) {
      throw new ForbiddenException(
        'Reset the owner password from account settings',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: membership.userId },
      data: { passwordHash },
    });

    return { success: true };
  }

  async deleteStaffMember(
    propertyId: string,
    staffId: string,
    actorUserId: string,
  ): Promise<{ success: true }> {
    if (staffId === actorUserId) {
      throw new BadRequestException('You cannot remove your own access');
    }

    const membership = await this.findMembershipOrThrow(propertyId, staffId);

    if (membership.role === UserRole.HOTEL_OWNER) {
      throw new ForbiddenException('Cannot delete the hotel owner');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.propertyMembership.delete({
        where: { id: membership.id },
      });

      const remaining = await tx.propertyMembership.count({
        where: { userId: membership.userId },
      });

      if (remaining === 0) {
        await tx.user.delete({
          where: { id: membership.userId },
        });
      }
    });

    return { success: true };
  }

  private assertAssignableRole(role: UserRole): void {
    if (
      !(STAFF_ASSIGNABLE_ROLES as readonly UserRole[]).includes(role)
    ) {
      throw new BadRequestException(
        'Role must be MANAGER, FRONT_DESK, or HOUSEKEEPING',
      );
    }
  }

  private async findMembershipOrThrow(propertyId: string, staffId: string) {
    const membership = await this.prisma.propertyMembership.findFirst({
      where: { propertyId, userId: staffId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException(`Staff member ${staffId} not found`);
    }

    return membership;
  }

  private toView(membership: {
    id: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      isActive: boolean;
      lastLoginAt: Date | null;
      createdAt: Date;
    };
  }): StaffMemberView {
    return {
      id: membership.user.id,
      membershipId: membership.id,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
      email: membership.user.email,
      phone: membership.user.phone,
      role: membership.role,
      isActive: membership.isActive && membership.user.isActive,
      lastLoginAt: membership.user.lastLoginAt,
      createdAt: membership.user.createdAt,
    };
  }
}

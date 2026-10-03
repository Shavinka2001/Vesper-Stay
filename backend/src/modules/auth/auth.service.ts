import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@generated/prisma/client';
import type { LoginDto } from '@modules/auth/dto/login.dto';
import type { RegisterPropertyDto } from '@modules/auth/dto/register-property.dto';
import type {
  AuthMeResponse,
  AuthPropertyView,
  AuthSuccessResponse,
  AuthUserView,
  JwtPayload,
} from '@modules/auth/interfaces/auth.interfaces';
import type { RequestUser } from '@common/interfaces/authenticated-request.interface';
import { PrismaService } from '@prisma/prisma.service';

const BCRYPT_SALT_ROUNDS = 10;

type MembershipWithProperty = {
  role: UserRole;
  propertyId: string;
  property: {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    currency: string;
    timezone: string;
    addressLine1: string | null;
    city: string | null;
    country: string | null;
    isActive: boolean;
  };
};

type UserWithMemberships = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  globalRole: UserRole | null;
  isActive: boolean;
  memberships: MembershipWithProperty[];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerProperty(
    dto: RegisterPropertyDto,
  ): Promise<AuthSuccessResponse> {
    const slug = dto.slug.trim().toLowerCase();
    const ownerEmail = dto.ownerEmail.trim().toLowerCase();
    const propertyEmail = dto.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const { user, property, membership } = await this.prisma.$transaction(
      async (tx) => {
        const existingProperty = await tx.property.findUnique({
          where: { slug },
          select: { id: true },
        });
        if (existingProperty) {
          throw new ConflictException(
            `Property slug "${slug}" is already registered`,
          );
        }

        const existingUser = await tx.user.findUnique({
          where: { email: ownerEmail },
          select: { id: true },
        });
        if (existingUser) {
          throw new ConflictException(
            `Owner email "${ownerEmail}" is already registered`,
          );
        }

        const createdProperty = await tx.property.create({
          data: {
            name: dto.propertyName.trim(),
            slug,
            email: propertyEmail,
            phone: dto.phone?.trim() || null,
            addressLine1: dto.address?.trim() || null,
            currency: dto.currency.trim().toUpperCase(),
            timezone: dto.timezone.trim(),
            isActive: true,
          },
        });

        const createdUser = await tx.user.create({
          data: {
            email: ownerEmail,
            passwordHash,
            firstName: dto.ownerFirstName.trim(),
            lastName: dto.ownerLastName.trim(),
            isActive: true,
          },
        });

        const createdMembership = await tx.propertyMembership.create({
          data: {
            propertyId: createdProperty.id,
            userId: createdUser.id,
            role: UserRole.HOTEL_OWNER,
            isActive: true,
          },
        });

        return {
          user: createdUser,
          property: createdProperty,
          membership: createdMembership,
        };
      },
    );

    const authUser: AuthUserView = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      globalRole: user.globalRole,
      roles: [membership.role],
      propertyIds: [property.id],
      isActive: user.isActive,
    };

    const authProperty: AuthPropertyView = {
      id: property.id,
      name: property.name,
      slug: property.slug,
      email: property.email,
      phone: property.phone,
      currency: property.currency,
      timezone: property.timezone,
      addressLine1: property.addressLine1,
      city: property.city,
      country: property.country,
      role: membership.role,
    };

    const token = await this.signAccessToken({
      sub: user.id,
      email: user.email,
      propertyId: property.id,
      role: membership.role,
      propertyIds: [property.id],
      roles: [membership.role],
    });

    return {
      success: true,
      token,
      user: authUser,
      property: authProperty,
    };
  }

  async login(dto: LoginDto): Promise<AuthSuccessResponse> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            property: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const activeMemberships = user.memberships.filter(
      (membership) => membership.property.isActive,
    );

    const primaryMembership = activeMemberships[0] ?? null;
    const propertyIds = activeMemberships.map((m) => m.propertyId);
    const roles = this.collectRoles(user.globalRole, activeMemberships);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authUser = this.toAuthUserView(user, propertyIds, roles);
    const authProperty = primaryMembership
      ? this.toAuthPropertyView(primaryMembership)
      : null;

    const token = await this.signAccessToken({
      sub: user.id,
      email: user.email,
      propertyId: primaryMembership?.propertyId ?? null,
      role: primaryMembership?.role ?? user.globalRole,
      propertyIds,
      roles,
    });

    return {
      success: true,
      token,
      user: authUser,
      property: authProperty,
    };
  }

  async validateUserById(userId: string): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { isActive: true },
          include: { property: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or does not exist');
    }

    const activeMemberships = user.memberships.filter(
      (membership) => membership.property.isActive,
    );
    const primaryMembership = activeMemberships[0] ?? null;
    const propertyIds = activeMemberships.map((m) => m.propertyId);
    const roles = this.collectRoles(user.globalRole, activeMemberships);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      globalRole: user.globalRole,
      propertyId: primaryMembership?.propertyId ?? null,
      role: primaryMembership?.role ?? user.globalRole,
      propertyIds,
      roles,
      isActive: user.isActive,
    };
  }

  async getMe(requestUser: RequestUser): Promise<AuthMeResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: requestUser.id },
      include: {
        memberships: {
          where: { isActive: true },
          include: { property: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or does not exist');
    }

    const activeMemberships = user.memberships.filter(
      (membership) => membership.property.isActive,
    );
    const primaryMembership =
      activeMemberships.find((m) => m.propertyId === requestUser.propertyId) ??
      activeMemberships[0] ??
      null;
    const propertyIds = activeMemberships.map((m) => m.propertyId);
    const roles = this.collectRoles(user.globalRole, activeMemberships);

    return {
      success: true,
      user: this.toAuthUserView(user, propertyIds, roles),
      property: primaryMembership
        ? this.toAuthPropertyView(primaryMembership)
        : null,
    };
  }

  private async signAccessToken(payload: JwtPayload): Promise<string> {
    const expiresIn = this.configService.get<string>('jwt.expiresIn', '1d');

    return this.jwtService.signAsync(payload, {
      expiresIn: expiresIn as `${number}d` | `${number}h` | `${number}s`,
    });
  }

  private collectRoles(
    globalRole: UserRole | null,
    memberships: Array<{ role: UserRole }>,
  ): UserRole[] {
    const roles = new Set<UserRole>();
    if (globalRole) {
      roles.add(globalRole);
    }
    for (const membership of memberships) {
      roles.add(membership.role);
    }
    return [...roles];
  }

  private toAuthUserView(
    user: Pick<
      UserWithMemberships,
      | 'id'
      | 'email'
      | 'firstName'
      | 'lastName'
      | 'globalRole'
      | 'isActive'
    >,
    propertyIds: string[],
    roles: UserRole[],
  ): AuthUserView {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      globalRole: user.globalRole,
      roles,
      propertyIds,
      isActive: user.isActive,
    };
  }

  private toAuthPropertyView(
    membership: MembershipWithProperty,
  ): AuthPropertyView {
    const { property, role } = membership;
    return {
      id: property.id,
      name: property.name,
      slug: property.slug,
      email: property.email,
      phone: property.phone,
      currency: property.currency,
      timezone: property.timezone,
      addressLine1: property.addressLine1,
      city: property.city,
      country: property.country,
      role,
    };
  }
}

import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  RoomStatus,
  UserRole,
} from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to run the seed script.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const PROPERTY_SLUG = 'vesper-luxury-villas-cabanas-mirissa';
const BCRYPT_ROUNDS = 12;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

async function seed(): Promise<void> {
  console.log('🌱 Seeding VesperStay luxury hospitality data…');

  const [adminPasswordHash, frontDeskPasswordHash] = await Promise.all([
    hashPassword('Admin@123'),
    hashPassword('FrontDesk@123'),
  ]);

  // ─── Property ──────────────────────────────────────────────────────────────
  const property = await prisma.property.upsert({
    where: { slug: PROPERTY_SLUG },
    update: {
      name: 'Vesper Luxury Villas & Cabanas - Mirissa',
      legalName: 'VesperStay Mirissa (Pvt) Ltd',
      timezone: 'Asia/Colombo',
      currency: 'USD',
      email: 'mirissa@vesperstay.com',
      phone: '+94 41 225 0100',
      addressLine1: 'Ocean Drive, Mirissa Beach',
      city: 'Mirissa',
      country: 'Sri Lanka',
      postalCode: '81740',
      isActive: true,
    },
    create: {
      name: 'Vesper Luxury Villas & Cabanas - Mirissa',
      slug: PROPERTY_SLUG,
      legalName: 'VesperStay Mirissa (Pvt) Ltd',
      timezone: 'Asia/Colombo',
      currency: 'USD',
      email: 'mirissa@vesperstay.com',
      phone: '+94 41 225 0100',
      addressLine1: 'Ocean Drive, Mirissa Beach',
      city: 'Mirissa',
      country: 'Sri Lanka',
      postalCode: '81740',
      isActive: true,
    },
  });

  console.log(`✓ Property: ${property.name}`);

  // ─── Users & RBAC ──────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vesperstay.com' },
    update: {
      passwordHash: adminPasswordHash,
      firstName: 'Ava',
      lastName: 'Vesper',
      globalRole: UserRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email: 'admin@vesperstay.com',
      passwordHash: adminPasswordHash,
      firstName: 'Ava',
      lastName: 'Vesper',
      globalRole: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  const frontDesk = await prisma.user.upsert({
    where: { email: 'frontdesk@vesperstay.com' },
    update: {
      passwordHash: frontDeskPasswordHash,
      firstName: 'Nimal',
      lastName: 'Fernando',
      globalRole: null,
      isActive: true,
    },
    create: {
      email: 'frontdesk@vesperstay.com',
      passwordHash: frontDeskPasswordHash,
      firstName: 'Nimal',
      lastName: 'Fernando',
      isActive: true,
    },
  });

  await prisma.propertyMembership.upsert({
    where: {
      propertyId_userId: {
        propertyId: property.id,
        userId: admin.id,
      },
    },
    update: {
      role: UserRole.HOTEL_OWNER,
      isActive: true,
    },
    create: {
      propertyId: property.id,
      userId: admin.id,
      role: UserRole.HOTEL_OWNER,
      isActive: true,
    },
  });

  await prisma.propertyMembership.upsert({
    where: {
      propertyId_userId: {
        propertyId: property.id,
        userId: frontDesk.id,
      },
    },
    update: {
      role: UserRole.FRONT_DESK,
      isActive: true,
    },
    create: {
      propertyId: property.id,
      userId: frontDesk.id,
      role: UserRole.FRONT_DESK,
      isActive: true,
    },
  });

  console.log(`✓ Users: ${admin.email}, ${frontDesk.email}`);

  // ─── Room Types ────────────────────────────────────────────────────────────
  const oceanfrontVilla = await prisma.roomType.upsert({
    where: {
      propertyId_code: {
        propertyId: property.id,
        code: 'OLV',
      },
    },
    update: {
      name: 'Oceanfront Luxury Villa',
      description:
        'Private oceanfront villa with plunge pool, king bed, and sunset deck.',
      maxOccupancy: 3,
      baseRate: 250,
      amenities: [
        'Private plunge pool',
        'Ocean view',
        'King bed',
        'Outdoor rain shower',
        'Minibar',
      ],
      isActive: true,
    },
    create: {
      propertyId: property.id,
      name: 'Oceanfront Luxury Villa',
      code: 'OLV',
      description:
        'Private oceanfront villa with plunge pool, king bed, and sunset deck.',
      maxOccupancy: 3,
      baseRate: 250,
      amenities: [
        'Private plunge pool',
        'Ocean view',
        'King bed',
        'Outdoor rain shower',
        'Minibar',
      ],
      isActive: true,
    },
  });

  const ecoCabana = await prisma.roomType.upsert({
    where: {
      propertyId_code: {
        propertyId: property.id,
        code: 'DEC',
      },
    },
    update: {
      name: 'Deluxe Eco Cabana',
      description:
        'Sustainable beachfront cabana with open-air living and garden shower.',
      maxOccupancy: 2,
      baseRate: 140,
      amenities: [
        'Beach access',
        'Eco design',
        'Queen bed',
        'Garden shower',
        'Ceiling fan',
      ],
      isActive: true,
    },
    create: {
      propertyId: property.id,
      name: 'Deluxe Eco Cabana',
      code: 'DEC',
      description:
        'Sustainable beachfront cabana with open-air living and garden shower.',
      maxOccupancy: 2,
      baseRate: 140,
      amenities: [
        'Beach access',
        'Eco design',
        'Queen bed',
        'Garden shower',
        'Ceiling fan',
      ],
      isActive: true,
    },
  });

  console.log(`✓ Room types: ${oceanfrontVilla.name}, ${ecoCabana.name}`);

  // ─── Physical Rooms / Cabanas ──────────────────────────────────────────────
  const villaNumbers = ['Villa 01', 'Villa 02', 'Villa 03'] as const;
  for (const number of villaNumbers) {
    await prisma.room.upsert({
      where: {
        propertyId_number: {
          propertyId: property.id,
          number,
        },
      },
      update: {
        roomTypeId: oceanfrontVilla.id,
        status: RoomStatus.AVAILABLE,
        floor: 'Ground',
        isCabana: false,
        isActive: true,
      },
      create: {
        propertyId: property.id,
        roomTypeId: oceanfrontVilla.id,
        number,
        floor: 'Ground',
        status: RoomStatus.AVAILABLE,
        isCabana: false,
        isActive: true,
      },
    });
  }

  const cabanaNumbers = ['Cabana 101', 'Cabana 102'] as const;
  for (const number of cabanaNumbers) {
    await prisma.room.upsert({
      where: {
        propertyId_number: {
          propertyId: property.id,
          number,
        },
      },
      update: {
        roomTypeId: ecoCabana.id,
        status: RoomStatus.AVAILABLE,
        floor: 'Beach',
        isCabana: true,
        isActive: true,
      },
      create: {
        propertyId: property.id,
        roomTypeId: ecoCabana.id,
        number,
        floor: 'Beach',
        status: RoomStatus.AVAILABLE,
        isCabana: true,
        isActive: true,
      },
    });
  }

  console.log('✓ Rooms: Villa 01–03, Cabana 101–102');

  // ─── Restaurant / Bar Menu ─────────────────────────────────────────────────
  const menuItems = [
    {
      name: 'Club Sandwich',
      category: 'Food',
      price: 8.5,
      description: 'Toasted triple-decker with chicken, bacon, egg, and greens.',
    },
    {
      name: 'Grilled Jumbo Prawns',
      category: 'Food',
      price: 22.0,
      description: 'Chargrilled prawns with garlic butter and lime.',
    },
    {
      name: 'Ceylon Chicken Curry',
      category: 'Food',
      price: 16.0,
      description: 'Slow-cooked with basmati rice and papadam.',
    },
    {
      name: 'Fresh King Coconut',
      category: 'Beverages',
      price: 3.0,
      description: 'Chilled Ceylon king coconut, served in the shell.',
    },
    {
      name: 'Lion Beer (Can)',
      category: 'Beverages',
      price: 4.5,
      description: 'Ice-cold Sri Lankan lager, 330ml can.',
    },
    {
      name: 'Espresso Martini',
      category: 'Cocktails',
      price: 14.0,
      description: 'Vodka, coffee liqueur, and fresh espresso.',
    },
    {
      name: 'Sunset Spritz',
      category: 'Cocktails',
      price: 12.0,
      description: 'Aperol, prosecco, and soda with orange.',
    },
    {
      name: 'Still Water 1L',
      category: 'Minibar',
      price: 2.5,
      description: 'Chilled still mineral water.',
    },
    {
      name: 'Assorted Nuts',
      category: 'Minibar',
      price: 6.0,
      description: 'Roasted cashews and almonds.',
    },
  ] as const;

  for (const item of menuItems) {
    const existing = await prisma.menuItem.findFirst({
      where: {
        propertyId: property.id,
        name: item.name,
      },
    });

    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: {
          category: item.category,
          price: item.price,
          description: item.description,
          currency: 'USD',
          isAvailable: true,
          isActive: true,
        },
      });
    } else {
      await prisma.menuItem.create({
        data: {
          propertyId: property.id,
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          currency: 'USD',
          isAvailable: true,
          isActive: true,
        },
      });
    }
  }

  console.log('✓ Menu items: 4 restaurant / bar offerings');

  // ─── Inventory ─────────────────────────────────────────────────────────────
  const inventoryItems = [
    {
      name: 'Luxury Bath Towels',
      sku: 'LBT-001',
      category: 'Housekeeping',
      quantityOnHand: 50,
      lowStockAlertQty: 10,
      reorderLevel: 10,
    },
    {
      name: 'Organic Spa Shampoo 50ml',
      sku: 'OSS-050',
      category: 'Amenities',
      quantityOnHand: 120,
      lowStockAlertQty: 20,
      reorderLevel: 20,
    },
  ] as const;

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: {
        propertyId_sku: {
          propertyId: property.id,
          sku: item.sku,
        },
      },
      update: {
        name: item.name,
        category: item.category,
        quantityOnHand: item.quantityOnHand,
        lowStockAlertQty: item.lowStockAlertQty,
        reorderLevel: item.reorderLevel,
        isActive: true,
      },
      create: {
        propertyId: property.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        quantityOnHand: item.quantityOnHand,
        lowStockAlertQty: item.lowStockAlertQty,
        reorderLevel: item.reorderLevel,
        isActive: true,
      },
    });
  }

  console.log('✓ Inventory: Luxury Bath Towels, Organic Spa Shampoo 50ml');
  console.log('✅ Seed completed successfully.');
}

seed()
  .catch((error: unknown) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

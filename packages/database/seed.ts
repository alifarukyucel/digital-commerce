import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash: hashedPassword,
      username: 'democreator',
      displayName: 'Demo Creator',
      bio: 'I create amazing digital products!',
      emailVerified: true,
    },
  });

  console.log('Created user:', user.email);

  // Create demo products
  const product1 = await prisma.product.upsert({
    where: {
      userId_slug: {
        userId: user.id,
        slug: 'ultimate-ebook'
      }
    },
    update: {},
    create: {
      userId: user.id,
      title: 'The Ultimate eBook',
      slug: 'ultimate-ebook',
      description: 'Learn everything you need to know about digital products.',
      priceCents: 2999,
      currency: 'USD',
      productType: 'download',
      isPublished: true,
    },
  });

  const product2 = await prisma.product.upsert({
    where: {
      userId_slug: {
        userId: user.id,
        slug: 'starter-template'
      }
    },
    update: {},
    create: {
      userId: user.id,
      title: 'Starter Template Pack',
      slug: 'starter-template',
      description: 'Ready-to-use templates for your projects.',
      priceCents: 4999,
      currency: 'USD',
      productType: 'download',
      isPublished: true,
    },
  });

  console.log('Created products:', product1.title, product2.title);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

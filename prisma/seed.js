import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const hash = (pw) => bcrypt.hash(pw, 10);

async function main() {
  console.log('Seeding...');

  // Roles
  const roles = await Promise.all(
    ['CUSTOMER', 'OWNER', 'ADMIN'].map((role) =>
      prisma.role.upsert({ where: { role }, update: {}, create: { role } })
    )
  );
  const roleMap = Object.fromEntries(roles.map((r) => [r.role, r.id]));

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@foodhub.test' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@foodhub.test',
      password: await hash('Admin@123'),
      userRoles: { create: { roleId: roleMap.ADMIN } },
    },
  });

  // Owners + restaurants
  const ownerData = [
    { email: 'owner1@foodhub.test', name: 'Lahore Biryani House', address: 'Gulberg, Lahore', cuisine: 'Pakistani' },
    { email: 'owner2@foodhub.test', name: 'Karachi Karahi Corner', address: 'Clifton, Karachi', cuisine: 'BBQ' },
  ];

  const restaurants = [];
  for (const o of ownerData) {
    const owner = await prisma.user.upsert({
      where: { email: o.email },
      update: {},
      create: {
        username: o.email.split('@')[0],
        email: o.email,
        password: await hash('Owner@123'),
        userRoles: { create: { roleId: roleMap.OWNER } },
      },
    });

    const cuisine = await prisma.cuisine.upsert({
      where: { name: o.cuisine },
      update: {},
      create: { name: o.cuisine },
    });

    const restaurant = await prisma.restaurant.create({
      data: {
        userId: owner.id,
        name: o.name,
        address: o.address,
        deliveryFee: 150,
        minimumOrder: 500,
        applicationStatus: 'APPROVED',
        openTime: new Date('1970-01-01T09:00:00Z'),
        closeTime: new Date('1970-01-01T22:00:00Z'),
        restaurantCuisines: { create: { cuisineId: cuisine.id } },
      },
    });

    const category = await prisma.menuCategory.create({
      data: { restId: restaurant.id, name: 'Main Course' },
    });

    const items = await Promise.all(
      [
        { name: 'Chicken Biryani', price: 450 },
        { name: 'Beef Karahi', price: 900 },
        { name: 'Seekh Kabab', price: 350 },
      ].map((item) =>
        prisma.menuItem.create({
          data: { ...item, restId: restaurant.id, categoryId: category.id },
        })
      )
    );

    restaurants.push({ restaurant, items, owner });
  }

  // Customers + orders in various states
  const customer = await prisma.user.upsert({
    where: { email: 'customer1@foodhub.test' },
    update: {},
    create: {
      username: 'customer1',
      email: 'customer1@foodhub.test',
      password: await hash('Customer@123'),
      address: '123 Test St',
      userRoles: { create: { roleId: roleMap.CUSTOMER } },
    },
  });

  const statuses = ['PENDING', 'ACCEPTED', 'DELIVERED', 'DELIVERED', 'REJECTED'];
  for (const status of statuses) {
    const { restaurant, items } = restaurants[0];
    const item = items[0];
    await prisma.order.create({
      data: {
        customerId: customer.id,
        restaurantId: restaurant.id,
        subtotal: item.price,
        deliveryFee: 150,
        total: Number(item.price) + 150,
        addressSnapshot: '123 Test St',
        status,
        rejectionReason: status === 'REJECTED' ? 'Out of ingredients' : null,
        orderItems: {
          create: { menuItemId: item.id, name: item.name, price: item.price, quantity: 1, total: item.price },
        },
        statusHistory: { create: { status } },
      },
    });
  }

  console.log('✅ Seed complete');
  console.log('Admin: admin@foodhub.test / Admin@123');
  console.log('Owners: owner1@foodhub.test, owner2@foodhub.test / Owner@123');
  console.log('Customer: customer1@foodhub.test / Customer@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
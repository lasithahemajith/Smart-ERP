import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Electronics' }, update: {}, create: { name: 'Electronics' } }),
    prisma.category.upsert({ where: { name: 'Office Supplies' }, update: {}, create: { name: 'Office Supplies' } }),
    prisma.category.upsert({ where: { name: 'Furniture' }, update: {}, create: { name: 'Furniture' } }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // Create warehouses
  const warehouses = await Promise.all([
    prisma.warehouse.create({ data: { name: 'Main Warehouse', location: 'Building A, Floor 1' } }),
    prisma.warehouse.create({ data: { name: 'Secondary Warehouse', location: 'Building B, Floor 2' } }),
  ]);
  console.log(`✅ Created ${warehouses.length} warehouses`);

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smarterp.com' },
    update: {},
    create: {
      email: 'admin@smarterp.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  // Create manager
  const managerPassword = await bcrypt.hash('manager123!', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@smarterp.com' },
    update: {},
    create: {
      email: 'manager@smarterp.com',
      password: managerPassword,
      firstName: 'John',
      lastName: 'Manager',
      role: 'MANAGER',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created manager user: ${manager.email}`);

  // Create employee
  const employeePassword = await bcrypt.hash('employee123!', 10);
  const employee = await prisma.user.upsert({
    where: { email: 'employee@smarterp.com' },
    update: {},
    create: {
      email: 'employee@smarterp.com',
      password: employeePassword,
      firstName: 'Jane',
      lastName: 'Employee',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created employee user: ${employee.email}`);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'ELEC-001',
        name: 'Laptop Pro 15"',
        description: 'High-performance laptop',
        price: 1299.99,
        costPrice: 800.00,
        lowStockAlert: 5,
        unit: 'pcs',
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'ELEC-002',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        price: 49.99,
        costPrice: 20.00,
        lowStockAlert: 20,
        unit: 'pcs',
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'OFFC-001',
        name: 'A4 Paper (500 sheets)',
        description: 'Premium office paper',
        price: 9.99,
        costPrice: 5.00,
        lowStockAlert: 50,
        unit: 'ream',
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'FURN-001',
        name: 'Executive Office Chair',
        description: 'Ergonomic office chair',
        price: 299.99,
        costPrice: 150.00,
        lowStockAlert: 3,
        unit: 'pcs',
        categoryId: categories[2].id,
      },
    }),
  ]);
  console.log(`✅ Created ${products.length} products`);

  // Add stock
  for (const product of products) {
    await prisma.warehouseStock.create({
      data: {
        productId: product.id,
        warehouseId: warehouses[0].id,
        quantity: Math.floor(Math.random() * 100) + 10,
      },
    });
  }
  console.log('✅ Added stock to warehouses');

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Tech Supplies Co.',
        email: 'contact@techsupplies.com',
        phone: '+1-555-0100',
        address: '123 Tech Street, Silicon Valley',
        contactPerson: 'Bob Smith',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Office World',
        email: 'orders@officeworld.com',
        phone: '+1-555-0200',
        address: '456 Business Ave, New York',
        contactPerson: 'Alice Johnson',
      },
    }),
  ]);
  console.log(`✅ Created ${suppliers.length} suppliers`);

  // Create a customer
  const customer = await prisma.customer.create({
    data: {
      name: 'Acme Corporation',
      email: 'orders@acme.com',
      phone: '+1-555-0300',
      address: '789 Commerce Blvd, Chicago',
    },
  });
  console.log(`✅ Created customer: ${customer.name}`);

  // Create a sample order
  const order = await prisma.order.create({
    data: {
      orderNumber: 'ORD-000001',
      customerId: customer.id,
      createdById: employee.id,
      status: 'PENDING',
      totalAmount: 1349.98,
      items: {
        create: [
          { productId: products[0].id, quantity: 1, unitPrice: 1299.99, total: 1299.99 },
          { productId: products[1].id, quantity: 1, unitPrice: 49.99, total: 49.99 },
        ],
      },
    },
  });
  console.log(`✅ Created sample order: ${order.orderNumber}`);

  // Create some expenses
  await Promise.all([
    prisma.expense.create({
      data: {
        title: 'Office Rent - January',
        amount: 2500.00,
        category: 'RENT',
        description: 'Monthly office rent',
        date: new Date('2025-01-01'),
        createdById: admin.id,
      },
    }),
    prisma.expense.create({
      data: {
        title: 'Staff Salaries - January',
        amount: 15000.00,
        category: 'SALARIES',
        date: new Date('2025-01-31'),
        createdById: admin.id,
      },
    }),
    prisma.expense.create({
      data: {
        title: 'Internet & Phone',
        amount: 300.00,
        category: 'UTILITIES',
        date: new Date('2025-01-15'),
        createdById: admin.id,
      },
    }),
  ]);
  console.log('✅ Created sample expenses');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin:    admin@smarterp.com    / admin123!');
  console.log('  Manager:  manager@smarterp.com  / manager123!');
  console.log('  Employee: employee@smarterp.com / employee123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

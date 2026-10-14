require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');
const Warranty = require('../src/models/Warranty');
const { calculateExpiryDate } = require('../src/utils/dateUtils');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('[Seed] Clearing existing test data...');
    await Warranty.deleteMany({});
    await User.deleteMany({ email: 'demo@example.com' });

    console.log('[Seed] Creating demo user...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    const demoUser = await User.create({
      name: 'Demo Person',
      email: 'demo@example.com',
      passwordHash,
    });

    console.log('[Seed] Creating sample warranties...');
    const now = new Date();

    const p1Date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 10));
    const exp1 = calculateExpiryDate(p1Date, 12, 'months');

    const exp2 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const p2Date = new Date(exp2.getTime() - 365 * 24 * 60 * 60 * 1000);

    const exp3 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const p3Date = new Date(exp3.getTime() - 180 * 24 * 60 * 60 * 1000);

    const p4Date = new Date(Date.UTC(now.getUTCFullYear() - 2, 0, 15));
    const exp4 = calculateExpiryDate(p4Date, 1, 'years');

    const p5Date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const exp5 = calculateExpiryDate(p5Date, 2, 'years');

    const warranties = [
      {
        userId: demoUser._id,
        productName: 'Sony WH-1000XM5 Headphones',
        brand: 'Sony',
        model: 'WH1000XM5/B',
        serialNumber: 'SN-SNY-884920',
        purchaseDate: p1Date,
        warrantyValue: 12,
        warrantyUnit: 'months',
        expiryDate: exp1,
        shopName: 'BestBuy Electronics',
        price: 399.99,
        notes: 'Includes standard manufacturer one-year hardware warranty.',
        files: [],
      },
      {
        userId: demoUser._id,
        productName: 'Dell UltraSharp 27" Monitor',
        brand: 'Dell',
        model: 'U2723QE',
        serialNumber: 'CN-09K11-744',
        purchaseDate: p2Date,
        warrantyValue: 1,
        warrantyUnit: 'years',
        expiryDate: exp2,
        shopName: 'Amazon',
        price: 549.0,
        notes: 'Expiring in roughly two weeks. Check display for backlight bleed before claim.',
        files: [],
      },
      {
        userId: demoUser._id,
        productName: 'KitchenAid Stand Mixer',
        brand: 'KitchenAid',
        model: 'KSM150PSER',
        serialNumber: 'W1098442',
        purchaseDate: p3Date,
        warrantyValue: 6,
        warrantyUnit: 'months',
        expiryDate: exp3,
        shopName: 'Target',
        price: 320.0,
        notes: 'Expiring in 2 days. Gears make slight clicking noise on high speeds.',
        files: [],
      },
      {
        userId: demoUser._id,
        productName: 'Samsung Galaxy Watch 4',
        brand: 'Samsung',
        model: 'SM-R870',
        serialNumber: 'R52N90ABCD',
        purchaseDate: p4Date,
        warrantyValue: 1,
        warrantyUnit: 'years',
        expiryDate: exp4,
        shopName: 'Samsung Official Store',
        price: 249.99,
        notes: 'Fully expired warranty card filed for record keeping.',
        files: [],
      },
      {
        userId: demoUser._id,
        productName: 'Apple MacBook Pro 14"',
        brand: 'Apple',
        model: 'A2779 (M2 Pro)',
        serialNumber: 'C02G99XXMD6R',
        purchaseDate: p5Date,
        warrantyValue: 2,
        warrantyUnit: 'years',
        expiryDate: exp5,
        shopName: 'Apple Regent Street',
        price: 1999.0,
        notes: 'Purchased with 2 years AppleCare+ extended service agreement.',
        files: [],
      },
    ];

    await Warranty.insertMany(warranties);

    console.log('--------------------------------------------------');
    console.log('[Seed] Database successfully seeded!');
    console.log('Demo Credentials:');
    console.log('  Email:    demo@example.com');
    console.log('  Password: Password123!');
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedData();

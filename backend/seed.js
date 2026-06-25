require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Manufacturer = require('./models/Manufacturer');
const Pharmacy = require('./models/Pharmacy');
const DeliveryPartner = require('./models/DeliveryPartner');
const Medicine = require('./models/Medicine');
const LinkHistory = require('./models/LinkHistory');
const StockHistory = require('./models/StockHistory');
const UsedDevice = require('./models/UsedDevice');
const DemoLog = require('./models/DemoLog');
const Payment = require('./models/Payment');
const Order = require('./models/Order');
const Shipment = require('./models/Shipment');
const Notification = require('./models/Notification');
const Cart = require('./models/Cart');
const PharmacyInventory = require('./models/PharmacyInventory');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    await User.deleteMany({});
    await Manufacturer.deleteMany({});
    await Pharmacy.deleteMany({});
    await DeliveryPartner.deleteMany({});
    await Medicine.deleteMany({});
    await LinkHistory.deleteMany({});
    await StockHistory.deleteMany({});
    await UsedDevice.deleteMany({});
    await DemoLog.deleteMany({});
    await Payment.deleteMany({});
    await Order.deleteMany({});
    await Shipment.deleteMany({});
    await Notification.deleteMany({});
    await Cart.deleteMany({});
    await PharmacyInventory.deleteMany({});

    const mfrId = 'MFR-99E3';
    const phmId = 'PHR-8ECD';
    const dlvId = 'DLV-17E1';
    const cstId = 'CST-0001';

    await Manufacturer.create({
      id: mfrId,
      name: 'Apex Pharmaceuticals',
      region: 'Punjab',
      email: 'Manufacturer1@pharmix.com',
      phone: '+92 300 1234567',
      address: '12-Industrial Area, Lahore',
      status: 'active',
      joinedDate: '2026-01-01',
      totalSkus: 5,
      shippingFee: 500,
      linkedDeliveryPartners: [dlvId]
    });

    await Pharmacy.create({
      id: phmId,
      name: 'CurePlus Pharmacy',
      region: 'Punjab',
      email: 'Pharmacy1@pharmix.com',
      phone: '+92 321 7654321',
      address: '45-Main Boulevard, Gulberg, Lahore',
      status: 'active',
      joinedDate: '2026-01-10',
      totalSkus: 2,
      linkedManufacturers: [mfrId]
    });

    await DeliveryPartner.create({
      id: dlvId,
      name: 'Express Riders Ltd',
      email: 'Rider1@pharmix.com',
      phone: '+92 333 9876543',
      vehicle: 'Motorcycle',
      zone: 'Lahore Central',
      status: 'active',
      joinedDate: '2026-01-15',
      rating: 4.9,
      totalDeliveries: 121,
      linkedManufacturers: [mfrId]
    });

    await User.create({
      id: 'usr_mfr1',
      email: 'Manufacturer1@pharmix.com',
      password: 'd9NFiocBC5!',
      role: 'manufacturer',
      name: 'Apex Admin',
      entityId: mfrId,
      linkedEntities: [dlvId]
    });

    await User.create({
      id: 'usr_phm1',
      email: 'Pharmacy1@pharmix.com',
      password: 'lcT6XC4hPG!',
      role: 'pharmacy',
      name: 'CurePlus Manager',
      entityId: phmId,
      linkedEntities: [mfrId]
    });

    await User.create({
      id: 'usr_dlv1',
      email: 'Rider1@pharmix.com',
      password: '5KyDrE4Gx0!',
      role: 'delivery',
      name: 'Rider One',
      entityId: dlvId,
      linkedEntities: [mfrId]
    });

    await User.create({
      id: 'usr_cst1',
      email: 'customer1@pharmix.com',
      password: 'customer123!',
      role: 'customer',
      name: 'Ali Khan',
      entityId: cstId,
      linkedEntities: []
    });

    await Medicine.create({
      id: 'MED-0001',
      name: 'Panadol 500mg',
      category: 'Analgesic',
      manufacturer: 'Apex Pharmaceuticals',
      manufacturerId: mfrId,
      batch: 'PAN-102',
      price: 250,
      stock: 500,
      expiry: '2028-12-31',
      rx: false,
      description: 'Paracetamol for pain and fever relief.'
    });

    await Medicine.create({
      id: 'MED-0002',
      name: 'Amoxicillin 250mg',
      category: 'Antibiotic',
      manufacturer: 'Apex Pharmaceuticals',
      manufacturerId: mfrId,
      batch: 'AMX-204',
      price: 450,
      stock: 200,
      expiry: '2027-06-30',
      rx: true,
      description: 'Broad-spectrum antibiotic medication.'
    });

    await Medicine.create({
      id: 'MED-0003',
      name: 'Loprin 75mg',
      category: 'Cardiovascular',
      manufacturer: 'Apex Pharmaceuticals',
      manufacturerId: mfrId,
      batch: 'LOP-501',
      price: 120,
      stock: 1000,
      expiry: '2028-03-15',
      rx: false,
      description: 'Low dose aspirin for cardiovascular protection.'
    });

    await Medicine.create({
      id: 'MED-0004',
      name: 'Surbex-Z',
      category: 'Vitamins',
      manufacturer: 'Apex Pharmaceuticals',
      manufacturerId: mfrId,
      batch: 'SBX-998',
      price: 380,
      stock: 300,
      expiry: '2027-11-30',
      rx: false,
      description: 'Multivitamin supplement with Zinc.'
    });

    await Medicine.create({
      id: 'MED-0005',
      name: 'Augmentin 375mg',
      category: 'Antibiotic',
      manufacturer: 'Apex Pharmaceuticals',
      manufacturerId: mfrId,
      batch: 'AUG-881',
      price: 620,
      stock: 150,
      expiry: '2027-04-15',
      rx: true,
      description: 'Co-amoxiclav formulation antibiotic.'
    });

    await LinkHistory.create({
      id: 'LNK-0001',
      sourceId: phmId,
      sourceType: 'pharmacy',
      targetId: mfrId,
      targetType: 'manufacturer',
      status: 'active',
      linkedAt: new Date(),
      linkedBy: 'admin_sys'
    });

    await LinkHistory.create({
      id: 'LNK-0002',
      sourceId: mfrId,
      sourceType: 'manufacturer',
      targetId: dlvId,
      targetType: 'delivery',
      status: 'active',
      linkedAt: new Date(),
      linkedBy: 'admin_sys'
    });

    await StockHistory.create({
      id: 'STK-0001',
      medicineId: 'MED-0001',
      medicineName: 'Panadol 500mg',
      manufacturerId: mfrId,
      oldQty: 0,
      newQty: 620,
      type: 'manual',
      changedBy: 'usr_mfr1',
      role: 'manufacturer',
      createdAt: new Date('2026-06-01T10:00:00Z')
    });

    await StockHistory.create({
      id: 'STK-0002',
      medicineId: 'MED-0002',
      medicineName: 'Amoxicillin 250mg',
      manufacturerId: mfrId,
      oldQty: 0,
      newQty: 230,
      type: 'manual',
      changedBy: 'usr_mfr1',
      role: 'manufacturer',
      createdAt: new Date('2026-06-01T10:05:00Z')
    });

    await StockHistory.create({
      id: 'STK-0003',
      medicineId: 'MED-0003',
      medicineName: 'Loprin 75mg',
      manufacturerId: mfrId,
      oldQty: 0,
      newQty: 1050,
      type: 'manual',
      changedBy: 'usr_mfr1',
      role: 'manufacturer',
      createdAt: new Date('2026-06-01T10:10:00Z')
    });

    await StockHistory.create({
      id: 'STK-0004',
      medicineId: 'MED-0004',
      medicineName: 'Surbex-Z',
      manufacturerId: mfrId,
      oldQty: 0,
      newQty: 300,
      type: 'manual',
      changedBy: 'usr_mfr1',
      role: 'manufacturer',
      createdAt: new Date('2026-06-01T10:15:00Z')
    });

    await StockHistory.create({
      id: 'STK-0005',
      medicineId: 'MED-0005',
      medicineName: 'Augmentin 375mg',
      manufacturerId: mfrId,
      oldQty: 0,
      newQty: 150,
      type: 'manual',
      changedBy: 'usr_mfr1',
      role: 'manufacturer',
      createdAt: new Date('2026-06-01T10:20:00Z')
    });

    await Order.create({
      id: 'ORD-0001',
      pharmacyId: phmId,
      manufacturerId: mfrId,
      items: [
        { medicineId: 'MED-0001', name: 'Panadol 500mg', price: 250, qty: 100 },
        { medicineId: 'MED-0003', name: 'Loprin 75mg', price: 120, qty: 50 }
      ],
      subtotal: 31000,
      shippingFee: 500,
      tax: 0,
      total: 31500,
      status: 'delivered',
      paymentStatus: 'paid',
      stripePaymentIntentId: 'pi_test_ord1',
      date: new Date('2026-06-10T12:00:00Z'),
      expectedDeliveryDate: new Date('2026-06-12T18:00:00Z'),
      deliveredAt: new Date('2026-06-12T15:30:00Z'),
      deliveryStatus: 'on-time'
    });

    await Payment.create({
      id: 'PAY-0001',
      stripePaymentIntentId: 'pi_test_ord1',
      orderId: 'ORD-0001',
      amount: 31500,
      currency: 'pkr',
      status: 'succeeded',
      manufacturerId: mfrId,
      pharmacyId: phmId,
      paymentMethod: 'card'
    });

    await Shipment.create({
      id: 'SHP-0001',
      orderId: 'ORD-0001',
      manufacturerId: mfrId,
      pharmacyId: phmId,
      riderId: dlvId,
      origin: '12-Industrial Area, Lahore',
      destination: '45-Main Boulevard, Gulberg, Lahore',
      status: 'delivered',
      riderLocation: {
        lat: 31.5204,
        lng: 74.3587,
        updatedAt: new Date('2026-06-12T15:30:00Z')
      },
      trackingEvents: [
        { type: 'start', timestamp: new Date('2026-06-12T11:00:00Z') },
        { type: 'stop', timestamp: new Date('2026-06-12T15:30:00Z') }
      ],
      path: [
        { lat: 31.4800, lng: 74.3200, timestamp: new Date('2026-06-12T11:15:00Z') },
        { lat: 31.5000, lng: 74.3400, timestamp: new Date('2026-06-12T13:00:00Z') },
        { lat: 31.5204, lng: 74.3587, timestamp: new Date('2026-06-12T15:30:00Z') }
      ]
    });

    await PharmacyInventory.create({
      pharmacyId: phmId,
      medicineId: 'MED-0001',
      name: 'Panadol 500mg',
      category: 'Analgesic',
      price: 250,
      stock: 100,
      expiry: '2028-12-31',
      manufacturerId: mfrId
    });

    await PharmacyInventory.create({
      pharmacyId: phmId,
      medicineId: 'MED-0003',
      name: 'Loprin 75mg',
      category: 'Cardiovascular',
      price: 120,
      stock: 50,
      expiry: '2028-03-15',
      manufacturerId: mfrId
    });

    await StockHistory.create({
      id: 'STK-0006',
      medicineId: 'MED-0001',
      medicineName: 'Panadol 500mg',
      manufacturerId: mfrId,
      oldQty: 620,
      newQty: 520,
      type: 'order',
      referenceId: 'ORD-0001',
      changedBy: 'usr_phm1',
      role: 'pharmacy',
      createdAt: new Date('2026-06-10T12:00:00Z')
    });

    await StockHistory.create({
      id: 'STK-0007',
      medicineId: 'MED-0003',
      medicineName: 'Loprin 75mg',
      manufacturerId: mfrId,
      oldQty: 1050,
      newQty: 1000,
      type: 'order',
      referenceId: 'ORD-0001',
      changedBy: 'usr_phm1',
      role: 'pharmacy',
      createdAt: new Date('2026-06-10T12:00:00Z')
    });

    await Order.create({
      id: 'ORD-0002',
      pharmacyId: phmId,
      manufacturerId: mfrId,
      items: [
        { medicineId: 'MED-0002', name: 'Amoxicillin 250mg', price: 450, qty: 30 }
      ],
      subtotal: 13500,
      shippingFee: 500,
      tax: 0,
      total: 14000,
      status: 'shipped',
      paymentStatus: 'paid',
      stripePaymentIntentId: 'pi_test_ord2',
      date: new Date('2026-06-20T09:00:00Z'),
      expectedDeliveryDate: new Date('2026-06-23T18:00:00Z')
    });

    await Payment.create({
      id: 'PAY-0002',
      stripePaymentIntentId: 'pi_test_ord2',
      orderId: 'ORD-0002',
      amount: 14000,
      currency: 'pkr',
      status: 'succeeded',
      manufacturerId: mfrId,
      pharmacyId: phmId,
      paymentMethod: 'card'
    });

    await Shipment.create({
      id: 'SHP-0002',
      orderId: 'ORD-0002',
      manufacturerId: mfrId,
      pharmacyId: phmId,
      riderId: dlvId,
      origin: '12-Industrial Area, Lahore',
      destination: '45-Main Boulevard, Gulberg, Lahore',
      status: 'in_transit',
      riderLocation: {
        lat: 31.4700,
        lng: 74.3000,
        updatedAt: new Date()
      },
      trackingEvents: [
        { type: 'start', timestamp: new Date() }
      ],
      path: [
        { lat: 31.4600, lng: 74.2800, timestamp: new Date() },
        { lat: 31.4700, lng: 74.3000, timestamp: new Date() }
      ]
    });

    await StockHistory.create({
      id: 'STK-0008',
      medicineId: 'MED-0002',
      medicineName: 'Amoxicillin 250mg',
      manufacturerId: mfrId,
      oldQty: 230,
      newQty: 200,
      type: 'order',
      referenceId: 'ORD-0002',
      changedBy: 'usr_phm1',
      role: 'pharmacy',
      createdAt: new Date('2026-06-20T09:00:00Z')
    });

    await Order.create({
      id: 'ORD-0003',
      pharmacyId: phmId,
      manufacturerId: mfrId,
      items: [
        { medicineId: 'MED-0001', name: 'Panadol 500mg', price: 250, qty: 20 }
      ],
      subtotal: 5000,
      shippingFee: 500,
      tax: 0,
      total: 5500,
      status: 'processing',
      paymentStatus: 'paid',
      stripePaymentIntentId: 'pi_test_ord3',
      date: new Date('2026-06-21T08:00:00Z'),
      expectedDeliveryDate: new Date('2026-06-24T18:00:00Z')
    });

    await Payment.create({
      id: 'PAY-0003',
      stripePaymentIntentId: 'pi_test_ord3',
      orderId: 'ORD-0003',
      amount: 5500,
      currency: 'pkr',
      status: 'succeeded',
      manufacturerId: mfrId,
      pharmacyId: phmId,
      paymentMethod: 'card'
    });

    await StockHistory.create({
      id: 'STK-0009',
      medicineId: 'MED-0001',
      medicineName: 'Panadol 500mg',
      manufacturerId: mfrId,
      oldQty: 520,
      newQty: 500,
      type: 'order',
      referenceId: 'ORD-0003',
      changedBy: 'usr_phm1',
      role: 'pharmacy',
      createdAt: new Date('2026-06-21T08:00:00Z')
    });

    await Order.create({
      id: 'ORD-0004',
      pharmacyId: phmId,
      manufacturerId: mfrId,
      items: [
        { medicineId: 'MED-0003', name: 'Loprin 75mg', price: 120, qty: 10 }
      ],
      subtotal: 1200,
      shippingFee: 500,
      tax: 0,
      total: 1700,
      status: 'pending',
      paymentStatus: 'pending',
      date: new Date()
    });

    await Notification.create({
      id: 'NTF-0001',
      recipientRole: 'pharmacy',
      recipientId: phmId,
      title: 'Welcome to Pharmix',
      message: 'Your account has been set up successfully. You are now linked to Apex Pharmaceuticals.',
      type: 'system',
      metadata: {},
      isOpened: false
    });

    await Notification.create({
      id: 'NTF-0002',
      recipientRole: 'manufacturer',
      recipientId: mfrId,
      title: 'New Order Received',
      message: 'You have received a new order ORD-0004 from CurePlus Pharmacy.',
      type: 'order',
      metadata: { orderId: 'ORD-0004' },
      isOpened: false
    });

    console.log('Database seeded successfully.');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Seeding error:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

module.exports = seed;

if (require.main === module) {
  seed();
}

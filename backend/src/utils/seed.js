import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import ClientProfile from '../models/ClientProfile.js';
import WorkerProfile from '../models/WorkerProfile.js';
import Portfolio from '../models/Portfolio.js';
import Project from '../models/Project.js';
import Quotation from '../models/Quotation.js';
import Agreement from '../models/Agreement.js';
import Milestone from '../models/Milestone.js';
import Review from '../models/Review.js';
import VerificationDocument from '../models/VerificationDocument.js';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/buildconnect');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await ClientProfile.deleteMany({});
    await WorkerProfile.deleteMany({});
    await Portfolio.deleteMany({});
    await Project.deleteMany({});
    await Quotation.deleteMany({});
    await Agreement.deleteMany({});
    await Milestone.deleteMany({});
    await Review.deleteMany({});
    await VerificationDocument.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // 1. Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@buildconnect.com',
      passwordHash,
      role: 'ADMIN',
      city: 'Hyderabad',
      isVerified: true,
      isOnboarded: true,
    });

    // 2. Create Workers
    const rajWorker = await User.create({
      name: 'Raj Interior Studio',
      email: 'raj@buildconnect.com',
      passwordHash,
      role: 'WORKER',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200',
      phone: '+91 98765 43210',
      city: 'Hyderabad',
      isVerified: true,
      isOnboarded: true,
    });

    const rajProfile = await WorkerProfile.create({
      user: rajWorker._id,
      businessName: 'Raj Interiors & Modular Kitchens',
      description: 'Premium interior designer & turnkey renovation contractor with 8+ years of expertise in luxury 3BHK and villa designs.',
      categories: ['Interior Design', 'Modular Kitchen', 'False Ceiling', 'Architecture'],
      experienceYears: 8,
      city: 'Hyderabad',
      serviceRadiusKm: 30,
      serviceAreas: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Hitec City', 'Kondapur'],
      pricingInfo: { hourlyRate: 1500, avgProjectBudget: '₹3,000,00 - ₹15,000,00' },
      availabilityStatus: 'AVAILABLE',
      verificationStatus: 'VERIFIED',
      avgRating: 4.9,
      reviewsCount: 24,
      completedProjectsCount: 38,
      responseTimeHours: 1,
    });

    await Portfolio.create([
      {
        worker: rajWorker._id,
        title: 'Modern Minimalist 3BHK Living Room & Kitchen',
        category: 'Interior Design',
        description: 'Custom veneer panelling, Italian marble flooring, and concealed LED profile lighting.',
        locationCity: 'Hyderabad',
        budgetRange: '₹6,50,000',
        images: [{ url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800', caption: 'Living room' }],
        materialsUsed: ['Teak Veneer', 'Quartz Countertop', 'Hafele Hardware'],
        servicesProvided: ['3D Design Renders', 'Carpentry', 'False Ceiling', 'Electrical'],
      },
      {
        worker: rajWorker._id,
        title: 'Luxury Villa Modular Kitchen with Quartz Island',
        category: 'Modular Kitchen',
        description: 'L-shaped acrylic finish modular kitchen with soft-closing drawers and built-in appliances.',
        locationCity: 'Hyderabad',
        budgetRange: '₹4,20,000',
        images: [{ url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800', caption: 'Kitchen view' }],
        materialsUsed: ['Marine Plywood', 'Calacatta Quartz', 'Blum Hettich Fittings'],
        servicesProvided: ['Kitchen Design', 'Civil Plumbing Modification', 'Cabinetry Installation'],
      },
    ]);

    const masterCraftWorker = await User.create({
      name: 'MasterCraft Woodworks',
      email: 'carpenter@buildconnect.com',
      passwordHash,
      role: 'WORKER',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      phone: '+91 98123 45678',
      city: 'Hyderabad',
      isVerified: true,
      isOnboarded: true,
    });

    await WorkerProfile.create({
      user: masterCraftWorker._id,
      businessName: 'MasterCraft Custom Carpentry',
      description: 'Specialists in custom wardrobes, TV units, wooden partitions, and bespoke teak furniture.',
      categories: ['Carpentry', 'Furniture', 'Modular Kitchen'],
      experienceYears: 12,
      city: 'Hyderabad',
      serviceRadiusKm: 25,
      serviceAreas: ['Kukatpally', 'Miyapur', 'Madhapur', 'Gachibowli'],
      pricingInfo: { hourlyRate: 800, avgProjectBudget: '₹1,50,000 - ₹6,000,00' },
      availabilityStatus: 'AVAILABLE',
      verificationStatus: 'VERIFIED',
      avgRating: 4.8,
      reviewsCount: 19,
      completedProjectsCount: 52,
      responseTimeHours: 2,
    });

    const sharmaWorker = await User.create({
      name: 'Sharma Color & Ceiling',
      email: 'sharma@buildconnect.com',
      passwordHash,
      role: 'WORKER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      phone: '+91 97777 88888',
      city: 'Bangalore',
      isVerified: false,
      isOnboarded: true,
    });

    await WorkerProfile.create({
      user: sharmaWorker._id,
      businessName: 'Sharma Ceiling & Paint Solutions',
      description: 'Expert POP and Gypsum false ceiling design, royal texture painting, and waterproofing services.',
      categories: ['Painting', 'False Ceiling', 'Flooring'],
      experienceYears: 6,
      city: 'Bangalore',
      serviceRadiusKm: 20,
      serviceAreas: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield'],
      pricingInfo: { hourlyRate: 600, avgProjectBudget: '₹50,000 - ₹3,000,00' },
      availabilityStatus: 'AVAILABLE',
      verificationStatus: 'PENDING',
      avgRating: 4.6,
      reviewsCount: 11,
      completedProjectsCount: 18,
    });

    await VerificationDocument.create({
      worker: sharmaWorker._id,
      documentType: 'BUSINESS_REGISTRATION',
      fileKey: 'sample_gst_cert.pdf',
      originalName: 'GST_Registration_Sharma.pdf',
      mimeType: 'application/pdf',
      size: 452000,
      status: 'PENDING',
    });

    // 3. Create Client
    const client = await User.create({
      name: 'Ananya Sharma',
      email: 'client@buildconnect.com',
      passwordHash,
      role: 'CLIENT',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
      phone: '+91 99887 76655',
      city: 'Hyderabad',
      isVerified: true,
      isOnboarded: true,
    });

    await ClientProfile.create({
      user: client._id,
      address: {
        street: 'Flat 402, Green Meadows Apartment, Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500033',
      },
      preferredLanguage: 'English',
      projectInterests: ['Interior Design', 'Modular Kitchen', 'False Ceiling'],
    });

    // 4. Create Sample Project
    const sampleProject = await Project.create({
      client: client._id,
      assignedWorker: rajWorker._id,
      title: '3BHK Apartment Turnkey Interior Design',
      description: 'Complete interior design including modular kitchen, false ceiling in living room, TV unit, and master bedroom wardrobe.',
      category: 'Interior Design',
      propertyType: '3BHK Apartment',
      estimatedBudget: 850000,
      publicLocation: { city: 'Hyderabad', area: 'Jubilee Hills' },
      exactAddress: {
        street: 'Flat 402, Green Meadows Apartment, Road No 36, Jubilee Hills',
        landmark: 'Opposite Metro Station',
        pincode: '500033',
      },
      locationSharedWithWorker: true,
      status: 'IN_PROGRESS',
      stage: 'EXECUTION',
    });

    // Sample Quote
    const quote = await Quotation.create({
      project: sampleProject._id,
      worker: rajWorker._id,
      client: client._id,
      quoteNumber: 'QT-2026-884129',
      version: 1,
      status: 'ACCEPTED',
      items: [
        { title: 'Living Room TV Unit & Partition', quantity: 1, unit: 'lump sum', unitPrice: 150000, labourCost: 30000, materialCost: 120000, totalPrice: 150000 },
        { title: 'Acrylic Finish Modular Kitchen', quantity: 1, unit: 'set', unitPrice: 350000, labourCost: 50000, materialCost: 300000, totalPrice: 350000 },
        { title: 'Gypsum False Ceiling with LED Profiles', quantity: 1200, unit: 'sq ft', unitPrice: 120, labourCost: 50000, materialCost: 94000, totalPrice: 144000 },
      ],
      subtotal: 644000,
      taxAmount: 115920,
      discountAmount: 20000,
      otherCharges: 10000,
      grandTotal: 749920,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: 'Includes 10-year warranty on modular kitchen fittings.',
    });

    const agreement = await Agreement.create({
      project: sampleProject._id,
      quotation: quote._id,
      client: client._id,
      worker: rajWorker._id,
      scopeOfWork: 'Turnkey interior design execution for 3BHK flat.',
      totalAmount: quote.grandTotal,
      signedByClientAt: new Date(),
      signedByWorkerAt: new Date(),
      status: 'ACTIVE',
    });

    await Milestone.create([
      { project: sampleProject._id, agreement: agreement._id, title: 'Booking Advance (10%)', amount: 75000, status: 'COMPLETED', paymentStatus: 'PAID', completionPercentage: 100 },
      { project: sampleProject._id, agreement: agreement._id, title: 'Design & Renders Approval (20%)', amount: 150000, status: 'COMPLETED', paymentStatus: 'PAID', completionPercentage: 100 },
      { project: sampleProject._id, agreement: agreement._id, title: 'Material Procurement (30%)', amount: 225000, status: 'IN_PROGRESS', paymentStatus: 'PAYABLE', completionPercentage: 60 },
      { project: sampleProject._id, agreement: agreement._id, title: 'Carpentry & Installation (30%)', amount: 225000, status: 'PENDING', paymentStatus: 'UNPAID', completionPercentage: 0 },
      { project: sampleProject._id, agreement: agreement._id, title: 'Final Handover & Inspection (10%)', amount: 74920, status: 'PENDING', paymentStatus: 'UNPAID', completionPercentage: 0 },
    ]);

    await Review.create({
      project: sampleProject._id,
      reviewer: client._id,
      reviewee: rajWorker._id,
      reviewerRole: 'CLIENT',
      rating: 5,
      comment: 'Raj and his team did an outstanding job on our Jubilee Hills 3BHK! Super professional, transparent quotations, and top quality materials.',
    });

    console.log('Seeding completed successfully!');
    console.log('Demo Credentials:');
    console.log('----------------------------------------------------');
    console.log('CLIENT:  client@buildconnect.com  / Password123!');
    console.log('WORKER:  raj@buildconnect.com     / Password123!');
    console.log('ADMIN:   admin@buildconnect.com   / Password123!');
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seed();

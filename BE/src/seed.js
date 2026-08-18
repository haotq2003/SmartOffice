require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Tenant = require('./models/Tenant');
const User = require('./models/User');
const Resource = require('./models/Resource');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartoffice';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing database collections...');
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Resource.deleteMany({});
    await Booking.deleteMany({});
    await Notification.deleteMany({});

    console.log('Creating initial Tenant...');
    const defaultTenant = await Tenant.create({
      name: 'SmartOffice Corporation',
      domain: 'smartoffice.com',
      plan: 'enterprise'
    });

    console.log('Hashing passwords...');
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('123456', salt);

    console.log('Creating initial Users...');
    const superAdmin = await User.create({
      name: 'Super Admin System',
      email: 'superadmin@smartoffice.com',
      password: defaultPassword,
      role: 'super_admin'
    });

    const admin = await User.create({
      tenantId: defaultTenant._id,
      name: 'Tenant Admin',
      email: 'admin@smartoffice.com',
      password: defaultPassword,
      role: 'admin'
    });

    const manager = await User.create({
      tenantId: defaultTenant._id,
      name: 'Nguyễn Văn Manager',
      email: 'manager@smartoffice.com',
      password: defaultPassword,
      role: 'manager'
    });

    const employee = await User.create({
      tenantId: defaultTenant._id,
      name: 'Trần Văn Employee',
      email: 'employee@smartoffice.com',
      password: defaultPassword,
      role: 'employee'
    });

    console.log('Creating 6 Fixed Meeting Rooms (Auto-approve = TRUE)...');
    
    await Resource.create([
      {
        tenantId: defaultTenant._id,
        name: 'Phòng họp Innovation (Tầng 3)',
        type: 'room',
        capacity: 10,
        quantity: 1,
        location: 'Tầng 3 - Tòa nhà A',
        description: 'Phòng họp hiện đại trang bị TV 75 inch, bảng tương tác thông minh và webcam 4K họp trực tuyến.',
        status: 'available',
        isAutoApprove: true,
        images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80']
      },
      {
        tenantId: defaultTenant._id,
        name: 'Phòng họp Executive (Tầng 5)',
        type: 'room',
        capacity: 20,
        location: 'Tầng 5 - Tòa nhà A',
        description: 'Phòng hội thảo sang trọng thiết kế theo phong cách Châu Âu dành cho họp ban giám đốc & ký kết hợp đồng.',
        status: 'available',
        isAutoApprove: true,
        images: ['https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80']
      },
      {
        tenantId: defaultTenant._id,
        name: 'Phòng họp Creative Hub (Tầng 2)',
        type: 'room',
        capacity: 8,
        location: 'Tầng 2 - Khối Sáng tạo',
        description: 'Không gian mở năng động, bảng kính 360 độ, phù hợp cho thảo luận UI/UX và thiết kế sản phẩm.',
        status: 'available',
        isAutoApprove: true,
        images: ['https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80']
      },
      {
        tenantId: defaultTenant._id,
        name: 'Phòng họp Brainstorming (Tầng 3)',
        type: 'room',
        capacity: 6,
        location: 'Tầng 3 - Tòa nhà A',
        description: 'Phòng họp nhỏ riêng tư cách âm tuyệt đối, sofa thư giãn, thích hợp cho nhóm nhỏ họp nhanh 30-45 phút.',
        status: 'available',
        isAutoApprove: true,
        images: ['https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=800&q=80']
      },
      {
        tenantId: defaultTenant._id,
        name: 'Phòng họp Boardroom (Tầng 5)',
        type: 'room',
        capacity: 15,
        location: 'Tầng 5 - Tòa nhà A',
        description: 'Phòng họp chuẩn tập đoàn trang bị hệ thống âm thanh đa điểm Sennheiser và máy chiếu siêu nét.',
        status: 'available',
        isAutoApprove: true,
        images: ['https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80']
      },
      {
        tenantId: defaultTenant._id,
        name: 'Phòng họp Tech Lab (Tầng 4)',
        type: 'room',
        capacity: 12,
        location: 'Tầng 4 - Khối Công nghệ',
        description: 'Trang bị 2 màn hình lớn kép, cổng kết nối đa thiết bị cho các buổi Code Review & Tech Sharing.',
        status: 'available',
        isAutoApprove: true,
        images: ['https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80']
      }
    ]);

    console.log('Creating Equipment with Quantities (Auto-approve = FALSE)...');

    await Resource.create([
      {
        tenantId: defaultTenant._id,
        name: 'Máy chiếu 4K Wireless Sony Laser',
        type: 'equipment',
        capacity: 1,
        quantity: 3,
        location: 'Phòng thiết bị',
        description: 'Dùng cho thuyết trình, training, meeting ngoài phòng họp. Độ sáng 5000 lumens kết nối không dây.',
        status: 'available',
        isAutoApprove: false,
        images: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80']
      },
      {
        tenantId: defaultTenant._id,
        name: 'Camera 4K Cinema Sony FX3',
        type: 'equipment',
        capacity: 1,
        quantity: 2,
        location: 'Phòng thiết bị',
        description: 'Ghi hình chất lượng điện ảnh cho sự kiện công ty, quay video marketing & phỏng vấn lãnh đạo.',
        status: 'available',
        isAutoApprove: false,
        images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80']
      },
      {
        tenantId: defaultTenant._id,
        name: 'Bộ Studio Livestream & Webinar Pro',
        type: 'equipment',
        capacity: 1,
        quantity: 2,
        location: 'Phòng thiết bị',
        description: 'Trọn bộ Micro cài áo Rode, Bàn mixer Blackmagic ATEM Mini, Đèn LED Godox & Capture Card 4K.',
        status: 'available',
        isAutoApprove: false,
        images: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80']
      },
      {
        tenantId: defaultTenant._id,
        name: 'Màn hình di động LG StanbyME 27"',
        type: 'equipment',
        capacity: 1,
        quantity: 4,
        location: 'Phòng thiết bị',
        description: 'Màn hình di động có bánh xe & pin tích hợp 3 giờ, cảm ứng xoay 180 độ phục vụ Demo & Presentation di động.',
        status: 'available',
        isAutoApprove: false,
        images: ['https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80']
      },
      {
        tenantId: defaultTenant._id,
        name: 'Bộ Micro không dây Sennheiser EW-D',
        type: 'equipment',
        capacity: 1,
        quantity: 5,
        location: 'Phòng thiết bị',
        description: 'Bộ 2 micro cầm tay không dây chống nhiễu sóng, khoảng cách thu phát 100m cho sự kiện & hội thảo.',
        status: 'available',
        isAutoApprove: false,
        images: ['https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80']
      }
    ]);

    console.log('----------------------------------------------------');
    console.log('✅ DATABASE RE-SEEDED SUCCESSFULLY!');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Reset database error:', error);
    process.exit(1);
  }
};

seedDB();

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Tenant = require('./models/Tenant');
const User = require('./models/User');
const Resource = require('./models/Resource');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');
const Plan = require('./models/Plan');
const Transaction = require('./models/Transaction');

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
    await Plan.deleteMany({});
    await Transaction.deleteMany({});

    console.log('Creating standard Plans...');
    await Plan.create([
      {
        name: 'Gói Trải Nghiệm (Free)',
        code: 'free',
        price: 0,
        maxUsers: 20,
        maxResources: 5,
        features: ['Quản lý tối đa 20 nhân sự', '5 tài nguyên phòng & thiết bị', 'Đặt lịch phòng họp cơ bản'],
        description: 'Dành cho các nhóm khởi nghiệp hoặc doanh nghiệp nhỏ trải nghiệm nền tảng.'
      },
      {
        name: 'Gói Chuyên Nghiệp (Premium)',
        code: 'premium',
        price: 49,
        maxUsers: 100,
        maxResources: 25,
        features: ['Tối đa 100 nhân sự', '25 tài nguyên phòng & thiết bị', 'Mô phỏng quẹt cửa Smart Lock', 'Báo cáo thống kê chi tiết'],
        description: 'Gói cước tối ưu cho các doanh nghiệp đang mở rộng quy mô văn phòng.'
      },
      {
        name: 'Gói Tập Đoàn (Enterprise)',
        code: 'enterprise',
        price: 199,
        maxUsers: -1,
        maxResources: -1,
        features: ['Không giới hạn nhân sự & tài nguyên', 'Đầy đủ tính năng cao cấp', 'Hỗ trợ ưu tiên 24/7'],
        description: 'Giải pháp toàn diện không giới hạn cho các tập đoàn lớn.'
      }
    ]);

    console.log('Creating initial Tenant...');
    const defaultTenant = await Tenant.create({
      name: 'SmartOffice Corporation',
      domain: 'smartoffice.com',
      plan: 'enterprise',
      status: 'active',
      planExpiredAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });

    console.log('Hashing passwords...');
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('123456', salt);
    const superAdminPassword = await bcrypt.hash('superadmin123', salt);

    console.log('Creating initial Users...');
    const superAdmin = await User.create({
      name: 'Super Admin System',
      email: 'superadmin@smartoffice.com',
      password: superAdminPassword,
      role: 'super_admin',
      rfidCardId: 'RFID-1001'
    });

    const admin = await User.create({
      tenantId: defaultTenant._id,
      name: 'Tenant Admin',
      email: 'admin@smartoffice.com',
      password: defaultPassword,
      role: 'admin',
      rfidCardId: 'RFID-1002'
    });

    const manager = await User.create({
      tenantId: defaultTenant._id,
      name: 'Nguyễn Văn Manager',
      email: 'manager@smartoffice.com',
      password: defaultPassword,
      role: 'manager',
      rfidCardId: 'RFID-1003'
    });

    const employee = await User.create({
      tenantId: defaultTenant._id,
      name: 'Trần Văn Employee',
      email: 'employee@smartoffice.com',
      password: defaultPassword,
      role: 'employee',
      rfidCardId: 'RFID-1004'
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

    console.log('Creating Corporate Vehicles (Auto-approve = FALSE)...');
    await Resource.create([
      {
        tenantId: defaultTenant._id,
        name: 'Xe 7 chỗ Toyota Fortuner (Biển số 29A-888.68)',
        type: 'vehicle',
        capacity: 7,
        quantity: 1,
        location: 'Hầm B2 - Vị trí C05',
        description: 'Xe SUV phục vụ đưa đón lãnh đạo, chuyên gia và các chuyến công tác ngoại tỉnh. Đã trang bị camera hành trình và thẻ ETC.',
        status: 'available',
        isAutoApprove: false,
        images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80']
      },
      {
        tenantId: defaultTenant._id,
        name: 'Xe 16 chỗ Ford Transit (Biển số 29B-123.45)',
        type: 'vehicle',
        capacity: 16,
        quantity: 1,
        location: 'Bãi xe ngoài trời Tòa nhà A',
        description: 'Phục vụ teambuilding, đưa đón nhân viên sự kiện, các chuyến đào tạo tập trung.',
        status: 'available',
        isAutoApprove: false,
        images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80']
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

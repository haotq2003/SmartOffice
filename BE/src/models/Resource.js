const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Tên tài nguyên không được để trống'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['room', 'equipment', 'vehicle'],
      required: true,
    },
    capacity: {
      type: Number, // Dành cho Phòng họp (sức chứa số người) hoặc Xe (số chỗ ngồi)
      default: 1,
    },
    quantity: {
      type: Number, // Dành cho Thiết bị (tổng số lượng trong kho)
      default: 1,
    },
    location: {
      type: String, // Vị trí (VD: Tầng 3 - Phòng 302)
    },
    description: {
      type: String,
    },
    images: {
      type: [String], // Danh sách URL hình ảnh
      default: [],
    },
    isAutoApprove: {
      type: Boolean, // Tự động duyệt đơn khi mượn hay cần Manager duyệt
      default: false,
    },
    status: {
      type: String,
      enum: ['available', 'maintenance'], // Hoạt động sẵn sàng hoặc Đang bảo trì
      default: 'available',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', resourceSchema);

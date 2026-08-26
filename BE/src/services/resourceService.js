const Resource = require('../models/Resource');
const Booking = require('../models/Booking');

/**
 * Create a new resource
 * @param {Object} data - Resource data including tenantId
 * @returns {Object} Created resource
 */
const createResource = async (data) => {
  const resource = new Resource(data);
  return await resource.save();
};

/**
 * Get all resources for a specific tenant with optional filters
 * @param {String} tenantId - Tenant ID
 * @param {Object} [filters={}] - Filtering options (type, status, search)
 * @returns {Array} List of resources
 */
const getAllResources = async (tenantId, filters = {}) => {
  const query = { tenantId };

  if (filters.type) query.type = filters.type;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.name = { $regex: filters.search, $options: 'i' };
  }

  return await Resource.find(query).sort({ createdAt: -1 });
};

/**
 * Get a specific resource by ID for a tenant
 * @param {String} id - Resource ID
 * @param {String} tenantId - Tenant ID
 * @returns {Object|null} The resource, or null if not found
 */
const getResourceById = async (id, tenantId) => {
  return await Resource.findOne({ _id: id, tenantId });
};

/**
 * Update a resource
 * @param {String} id - Resource ID
 * @param {String} tenantId - Tenant ID
 * @param {Object} updateData - Data to update
 * @returns {Object|null} Updated resource, or null if not found
 */
const updateResource = async (id, tenantId, updateData) => {
  return await Resource.findOneAndUpdate(
    { _id: id, tenantId },
    updateData,
    { new: true, runValidators: true }
  );
};

/**
 * Delete a resource safely (verifies no active bookings exist)
 * @param {String} id - Resource ID
 * @param {String} tenantId - Tenant ID
 * @returns {Object|null} Deleted resource, or null if not found
 */
const deleteResource = async (id, tenantId) => {
  const activeBooking = await Booking.findOne({
    resourceId: id,
    tenantId,
    status: { $in: ['pending', 'approved', 'checked_in'] }
  });

  if (activeBooking) {
    const error = new Error('Không thể xóa tài nguyên đang có đơn mượn/đặt chưa hoàn thành.');
    error.statusCode = 400;
    throw error;
  }

  return await Resource.findOneAndDelete({ _id: id, tenantId });
};

module.exports = {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
};

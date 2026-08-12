const Resource = require('../models/Resource');

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
 * Get all resources for a specific tenant
 * @param {String} tenantId - Tenant ID
 * @returns {Array} List of resources
 */
const getAllResources = async (tenantId) => {
  return await Resource.find({ tenantId });
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
 * Delete a resource
 * @param {String} id - Resource ID
 * @param {String} tenantId - Tenant ID
 * @returns {Object|null} Deleted resource, or null if not found
 */
const deleteResource = async (id, tenantId) => {
  return await Resource.findOneAndDelete({ _id: id, tenantId });
};

module.exports = {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
};

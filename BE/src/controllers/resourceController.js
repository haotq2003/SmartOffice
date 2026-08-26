const resourceService = require('../services/resourceService');

const createResource = async (req, res) => {
  try {
    const data = {
      ...req.body,
      tenantId: req.user.tenantId,
    };
    const resource = await resourceService.createResource(data);
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getAllResources = async (req, res) => {
  try {
    const resources = await resourceService.getAllResources(req.user.tenantId, req.query);
    res.status(200).json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getResourceById = async (req, res) => {
  try {
    const resource = await resourceService.getResourceById(req.params.id, req.user.tenantId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const updateResource = async (req, res) => {
  try {
    const resource = await resourceService.updateResource(req.params.id, req.user.tenantId, req.body);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    const resource = await resourceService.deleteResource(req.params.id, req.user.tenantId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    res.status(200).json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
};

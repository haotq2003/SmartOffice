const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartOffice SaaS API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for SmartOffice Multi-tenant Resource Booking System',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & User Management' },
      { name: 'Resources', description: 'Resource Management (Rooms, Equipment, Vehicles)' },
      { name: 'Bookings', description: 'Resource Booking & Availability Operations' },
      { name: 'Notifications', description: 'In-app Notifications & Status Updates' },
      { name: 'Tenants', description: 'Super Admin Tenant Administration' },
      { name: 'Upload', description: 'Cloudinary Image & Asset Uploads' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
            tenantId: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d0' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['super_admin', 'admin', 'manager', 'employee'], example: 'employee' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Tenant: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d0' },
            name: { type: 'string', example: 'Acme Corp' },
            domain: { type: 'string', example: 'acme' },
            plan: { type: 'string', enum: ['free', 'premium', 'enterprise'], example: 'free' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d2' },
            tenantId: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d0' },
            userId: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
            title: { type: 'string', example: 'Booking Approved' },
            message: { type: 'string', example: 'Your booking request for Meeting Room A has been approved.' },
            type: {
              type: 'string',
              enum: ['booking_created', 'booking_approved', 'booking_rejected', 'booking_cancelled'],
              example: 'booking_approved',
            },
            referenceId: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d3' },
            isRead: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;

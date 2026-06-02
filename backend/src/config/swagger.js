const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CardioAI Patient Monitoring API',
      version: '1.0.0',
      description: 'API documentation for CardioAI real-time patient monitoring system',
      contact: {
        name: 'API Support',
        email: 'support@cardioai.com'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'Current environment server (Dynamic)'
      },
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'doctor', 'nurse'] },
            isActive: { type: 'boolean' }
          }
        },
        Patient: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            age: { type: 'number' },
            gender: { type: 'string' },
            bed: { type: 'string' },
            ward: { type: 'string' },
            status: { type: 'string', enum: ['normal', 'warning', 'critical'] },
            heartRate: { type: 'number' },
            spo2: { type: 'number' },
            bp: { type: 'string' },
            temp: { type: 'number' },
            deviceId: { type: 'string' }
          }
        },
        Alert: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            patient: { type: 'string' },
            patientName: { type: 'string' },
            severity: { type: 'string', enum: ['normal', 'warning', 'critical'] },
            message: { type: 'string' },
            acknowledged: { type: 'boolean' },
            resolved: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Vitals: {
          type: 'object',
          properties: {
            heartRate: { type: 'number' },
            spo2: { type: 'number' },
            bp: { type: 'string' },
            temp: { type: 'number' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            role: { type: 'string', enum: ['admin', 'doctor', 'nurse'] }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array' },
            page: { type: 'number' },
            totalPages: { type: 'number' },
            totalRecords: { type: 'number' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CardioAI API Docs'
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = setupSwagger;

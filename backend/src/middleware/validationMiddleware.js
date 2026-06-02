const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/"/g, '')
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Request validation failed',
      details: errors
    });
  }
  
  next();
};

const authSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name must not exceed 50 characters'
      }),
    email: Joi.string().email().required().trim()
      .messages({
        'string.email': 'Please provide a valid email',
        'string.empty': 'Email is required'
      }),
    password: Joi.string().min(6).max(100).required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.max': 'Password must not exceed 100 characters',
        'string.empty': 'Password is required'
      }),
    role: Joi.string().valid('admin', 'doctor', 'nurse').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required().trim()
      .messages({
        'string.email': 'Please provide a valid email',
        'string.empty': 'Email is required'
      }),
    password: Joi.string().required()
      .messages({
        'string.empty': 'Password is required'
      })
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional().trim()
      .messages({
        'string.email': 'Please provide a valid email'
      }),
    password: Joi.string().min(6).max(100).optional()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.max': 'Password must not exceed 100 characters'
      })
  })
};

const patientSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required()
      .messages({
        'string.empty': 'Patient name is required',
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name must not exceed 100 characters'
      }),
    age: Joi.number().integer().min(0).max(150).optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    phone: Joi.string().max(20).optional(),
    address: Joi.string().max(500).optional(),
    bed: Joi.string().max(20).optional(),
    ward: Joi.string().max(50).optional(),
    heartRate: Joi.number().min(0).max(300).optional(),
    spo2: Joi.number().min(0).max(100).optional(),
    bloodPressure: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/).optional()
      .messages({
        'string.pattern.base': 'Blood pressure must be in format: systolic/diastolic (e.g., 120/80)'
      }),
    temperature: Joi.number().min(30).max(45).optional(),
    medicalHistory: Joi.string().max(2000).optional()
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    age: Joi.number().integer().min(0).max(150).optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    phone: Joi.string().max(20).optional(),
    address: Joi.string().max(500).optional(),
    bed: Joi.string().max(20).optional(),
    ward: Joi.string().max(50).optional(),
    heartRate: Joi.number().min(0).max(300).optional(),
    spo2: Joi.number().min(0).max(100).optional(),
    bloodPressure: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/).optional()
      .messages({
        'string.pattern.base': 'Blood pressure must be in format: systolic/diastolic'
      }),
    temperature: Joi.number().min(30).max(45).optional(),
    medicalHistory: Joi.string().max(2000).optional(),
    notes: Joi.string().max(5000).optional(),
    doctorInstructions: Joi.string().max(5000).optional()
  }),

  addVitals: Joi.object({
    heartRate: Joi.number().min(0).max(300).optional(),
    spo2: Joi.number().min(0).max(100).optional(),
    bp: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/).optional()
      .messages({
        'string.pattern.base': 'Blood pressure must be in format: systolic/diastolic'
      }),
    temp: Joi.number().min(30).max(45).optional(),
    bpSystolic: Joi.number().min(50).max(250).optional(),
    bpDiastolic: Joi.number().min(30).max(150).optional()
  })
};

const alertSchemas = {
  acknowledge: Joi.object({
    alertId: Joi.string().optional()
  })
};

const settingsSchemas = {
  update: Joi.object({
    heartRateLow: Joi.number().integer().min(20).max(150).optional(),
    heartRateHigh: Joi.number().integer().min(20).max(220).optional(),
    spo2Low: Joi.number().integer().min(50).max(100).optional(),
    tempHigh: Joi.number().min(35).max(42).optional(),
    bpSystolicHigh: Joi.number().integer().min(80).max(250).optional(),
    bpDiastolicHigh: Joi.number().integer().min(50).max(150).optional()
  }).min(1)
    .messages({
      'object.min': 'At least one setting must be provided'
    })
};

module.exports = {
  validate,
  authSchemas,
  patientSchemas,
  alertSchemas,
  settingsSchemas
};

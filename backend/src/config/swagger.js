const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Bus Booking Management System API',
    version: '1.0.0',
    description:
      'Production-ready REST API for Bus Booking Management System featuring atomic concurrency locking, multi-tier cancellation refunds, RBAC, and real-time passenger manifests.'
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT Bearer token in the format: Bearer <token>'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['customer', 'operator', 'admin'] }
        }
      },
      BookingRequest: {
        type: 'object',
        required: ['tripId', 'seatNumbers', 'passengerDetails', 'contactPhone', 'contactEmail'],
        properties: {
          tripId: { type: 'string' },
          seatNumbers: {
            type: 'array',
            items: { type: 'string' },
            example: ['1A', '1B']
          },
          passengerDetails: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Alice Smith' },
                age: { type: 'integer', example: 28 },
                gender: { type: 'string', enum: ['Male', 'Female', 'Other'] },
                seatNumber: { type: 'string', example: '1A' }
              }
            }
          },
          boardingPoint: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Majestic Bus Stand' },
              time: { type: 'string', format: 'date-time' }
            }
          },
          droppingPoint: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Ameerpet Metro' },
              time: { type: 'string', format: 'date-time' }
            }
          },
          contactPhone: { type: 'string', example: '+91 9876543210' },
          contactEmail: { type: 'string', example: 'alice@example.com' }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'API Health Check',
        responses: {
          200: { description: 'API service is running and healthy' }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register new customer or staff account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  phone: { type: 'string' },
                  role: { type: 'string', enum: ['customer', 'operator', 'admin'] }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User created successfully with auth token' },
          409: { description: 'Email address already registered' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate and receive JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid email or password' }
        }
      }
    },
    '/trips/search': {
      get: {
        summary: 'Search scheduled trips by origin, destination & date',
        parameters: [
          { name: 'origin', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'destination', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['departure', 'fare'] } }
        ],
        responses: {
          200: { description: 'Matching scheduled trips' },
          400: { description: 'Missing required query parameters' }
        }
      }
    },
    '/trips/{id}': {
      get: {
        summary: 'Get single trip with seat matrix layout and real-time status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Trip details including seat map' },
          404: { description: 'Trip not found' }
        }
      }
    },
    '/bookings': {
      post: {
        summary: 'Atomically reserve seats and generate confirmed PNR',
        description: 'Implements conditional atomic document matching to guarantee zero double bookings.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BookingRequest' }
            }
          }
        },
        responses: {
          201: { description: 'Booking confirmed with unique PNR reference' },
          409: { description: 'Concurrency Conflict: Seat was just booked by another user' },
          400: { description: 'Validation failed or missing fields' }
        }
      }
    },
    '/bookings/my': {
      get: {
        summary: 'Get booking history for the authenticated passenger',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of confirmed and cancelled bookings' }
        }
      }
    },
    '/bookings/{id}/cancel': {
      patch: {
        summary: 'Cancel booking, compute refund, and release seats back to pool',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { reason: { type: 'string' } }
              }
            }
          }
        },
        responses: {
          200: { description: 'Booking cancelled and refund processed' }
        }
      }
    },
    '/reports/manifest/{tripId}': {
      get: {
        summary: 'Get confirmed passenger manifest for a trip (Operator / Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'tripId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Passenger manifest matching confirmed tickets' }
        }
      }
    },
    '/reports/occupancy': {
      get: {
        summary: 'Get fleet occupancy summaries reconciled with confirmed tickets',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Capacity, booked seats, and revenue per route' }
        }
      }
    },
    '/reports/dashboard': {
      get: {
        summary: 'System metrics and high-level KPIs',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Total revenue, active trips, confirmed bookings' }
        }
      }
    },
    '/audit': {
      get: {
        summary: 'Immutable business action audit trail (Admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Audit trail records' }
        }
      }
    }
  }
};

module.exports = swaggerSpec;


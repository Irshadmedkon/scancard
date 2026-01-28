## 3. Backend Architecture (Node.js + Express.js)

### 3.1 Scalable Backend Structure (Modular Monolith)

```
backend/
├── src/
│   ├── server.js                      # App entry point
│   ├── app.js                         # Express app setup
│   │
│   ├── config/                        # Configuration
│   │   ├── database.js                # MySQL connection pool
│   │   ├── redis.js                   # Redis client
│   │   ├── auth.js                    # JWT config
│   │   ├── storage.js                 # S3/Cloud storage config
│   │   ├── email.js                   # Email service config
│   │   └── constants.js               # App constants
│   │
│   ├── modules/                       # Feature modules (Modular)
│   │   ├── auth/
│   │   │   ├── auth.controller.js     # Auth endpoints
│   │   │   ├── auth.service.js        # Business logic
│   │   │   ├── auth.validator.js      # Input validation
│   │   │   ├── auth.routes.js         # Route definitions
│   │   │   └── auth.test.js           # Unit tests
│   │   │
│   │   ├── profile/
│   │   │   ├── profile.controller.js
│   │   │   ├── profile.service.js
│   │   │   ├── profile.validator.js
│   │   │   ├── profile.routes.js
│   │   │   └── profile.test.js
│   │   │
│   │   ├── lead/
│   │   │   ├── lead.controller.js
│   │   │   ├── lead.service.js
│   │   │   ├── lead.validator.js
│   │   │   ├── lead.routes.js
│   │   │   └── lead.test.js
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.controller.js
│   │   │   ├── analytics.service.js
│   │   │   ├── analytics.routes.js
│   │   │   └── analytics.test.js
│   │   │
│   │   ├── nfc/
│   │   │   ├── nfc.controller.js
│   │   │   ├── nfc.service.js
│   │   │   ├── nfc.routes.js
│   │   │   └── nfc.test.js
│   │   │
│   │   └── team/
│   │       ├── team.controller.js
│   │       ├── team.service.js
│   │       ├── team.routes.js
│   │       └── team.test.js
│   │
│   ├── models/                        # Database models (MySQL)
│   │   ├── User.js
│   │   ├── Profile.js
│   │   ├── Link.js
│   │   ├── Lead.js
│   │   ├── Analytics.js
│   │   ├── NfcCard.js
│   │   └── Team.js
│   │
│   ├── middleware/                    # Express middleware
│   │   ├── authMiddleware.js          # JWT verification
│   │   ├── errorHandler.js            # Global error handler
│   │   ├── validateRequest.js         # Request validation
│   │   ├── rateLimiter.js             # Rate limiting
│   │   ├── corsMiddleware.js          # CORS configuration
│   │   ├── requestLogger.js           # Request logging
│   │   └── fileUpload.js              # Multer file upload
│   │
│   ├── services/                      # Shared services
│   │   ├── emailService.js            # SendGrid/NodeMailer
│   │   ├── qrCodeService.js           # QR generation
│   │   ├── uploadService.js           # S3/Cloudinary upload
│   │   ├── cacheService.js            # Redis caching
│   │   ├── notificationService.js     # Push notifications
│   │   └── analyticsService.js        # Analytics processing
│   │
│   ├── utils/                         # Utility functions
│   │   ├── logger.js                  # Winston logger
│   │   ├── jwt.js                     # JWT helpers
│   │   ├── encryption.js              # Bcrypt helpers
│   │   ├── validators.js              # Input validators
│   │   ├── helpers.js                 # General helpers
│   │   └── constants.js               # Constants
│   │
│   ├── database/                      # Database management
│   │   ├── migrations/                # DB migrations
│   │   │   ├── 001_create_users.sql
│   │   │   ├── 002_create_profiles.sql
│   │   │   ├── 003_create_leads.sql
│   │   │   └── ...
│   │   ├── seeders/                   # Seed data
│   │   │   ├── users.seed.js
│   │   │   └── profiles.seed.js
│   │   └── queries/                   # Complex queries
│   │       ├── analytics.queries.js
│   │       └── reports.queries.js
│   │
│   └── jobs/                          # Background jobs
│       ├── emailQueue.js              # Email queue processor
│       ├── analyticsAggregator.js     # Daily analytics
│       └── cleanupJob.js              # Database cleanup
│
├── tests/                             # Integration tests
│   ├── auth.test.js
│   ├── profile.test.js
│   └── lead.test.js
│
├── .env.example                       # Environment variables template
├── .env                               # Environment variables (gitignored)
├── package.json                       # Dependencies
├── ecosystem.config.js                # PM2 config
├── docker-compose.yml                 # Docker setup
└── README.md                          # Documentation
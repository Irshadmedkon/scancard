# TapOnn Backend API

A complete, production-ready backend API for TapOnn - Digital Business Card Platform.

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- MySQL v8.0+
- Redis (optional but recommended)

### Installation
```bash
# Install dependencies
npm install

# Setup database
mysql -u root -p < COMPLETE_DATABASE_SETUP.sql

# Start server
npm start
```

Server runs on: `http://localhost:5000`

## 📚 Documentation

- **Setup Guide**: `FINAL_SETUP_GUIDE.md` - Complete setup instructions
- **API Documentation**: `COMPLETE_API_DOCUMENTATION_POSTMAN.md` - All 133+ endpoints
- **Postman Collection**: `TapOnn_Complete_Collection.postman_collection.json`
- **API Tests**: `COMPREHENSIVE_API_TEST.http` - Complete test suite

## 🏗️ Architecture

### Core Modules (18)
- **Authentication** - JWT-based auth with refresh tokens
- **Profiles** - Digital business card management
- **Menu** - Restaurant menu system
- **Catalog** - Product catalog with images
- **Booking** - Service booking system
- **Leads** - CRM functionality
- **Analytics** - Business insights
- **Team** - Multi-user collaboration
- **Notifications** - Real-time notifications
- **Payments** - Multiple gateway support
- **Search** - Global search functionality
- **Export** - CSV/PDF exports
- **Upload** - File upload system
- **Webhooks** - External integrations
- **API Keys** - Secure API access
- **NFC** - NFC card management
- **Subscriptions** - Plan management
- **Batch** - Bulk operations

### Database
- **28 Tables** - Fully normalized schema
- **MySQL** - Primary database
- **Redis** - Caching and sessions

## 🔐 Security Features

- JWT Authentication with refresh tokens
- Password hashing (bcrypt)
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration
- Security headers

## 📊 API Endpoints

**Total: 133+ endpoints**

### Core Endpoints
- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/profiles` - List profiles
- `GET /api/v1/catalog/:profileId/products` - Product catalog
- `GET /api/v1/menu/:profileId` - Public menu
- `POST /api/v1/leads` - Create lead
- `GET /api/v1/analytics/dashboard` - Analytics data

### Health Check
- `GET /health` - Server health status

## 🛠️ Environment Variables

```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=scancard
JWT_SECRET=your_jwt_secret
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🚀 Production Deployment

1. **Setup Production Database**
2. **Configure Environment Variables**
3. **Install Dependencies**: `npm install`
4. **Start with PM2**: `pm2 start src/server.js --name taponn-api`
5. **Setup Nginx Reverse Proxy**
6. **Configure SSL Certificate**

## 📈 Performance Features

- Connection pooling
- Redis caching
- Query optimization
- Pagination
- Compression
- Background job processing

## 🧪 Testing

Import the Postman collection and run the comprehensive test suite:
- Authentication flow
- All CRUD operations
- File uploads
- Search functionality
- Error handling

## 📞 Support

For issues or questions, check the setup guide or API documentation.

---

**Status**: ✅ Production Ready  
**Version**: 2.0.0  
**Last Updated**: January 2026
# Neon Database Integration Guide

Memory Safe Guard hiện đã hỗ trợ tích hợp với Neon PostgreSQL Database để lưu trữ dữ liệu trên cloud thay vì chỉ sử dụng IndexedDB cục bộ.

## 🎯 Tổng quan

### Tính năng mới:
- **Hybrid Storage**: Hỗ trợ cả IndexedDB (local) và Neon PostgreSQL (cloud)
- **Auto-detection**: Tự động chọn database phù hợp dựa trên configuration
- **Seamless Migration**: Chuyển đổi dễ dàng giữa các storage options
- **Real-time Sync**: Đồng bộ dữ liệu real-time với cloud database
- **Fallback Support**: Tự động fallback về IndexedDB khi Neon DB không khả dụng

## 🚀 Cài đặt và Cấu hình

### 1. Tạo Neon Database

1. Đăng ký tài khoản tại [Neon.tech](https://neon.tech)
2. Tạo project mới
3. Lấy connection string từ dashboard
4. Copy connection string có dạng:
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### 2. Cấu hình Environment Variables

Tạo file `.env.local` từ `.env.example`:

```bash
cp .env.example .env.local
```

Cập nhật các biến môi trường:

```env
# Neon Database Configuration
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/memorysafeguard?sslmode=require
VITE_USE_NEONDB=true

# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_ENABLE_API_SYNC=true

# Security (Optional)
VITE_ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret-for-auth
```

### 3. Khởi tạo Database Schema

Chạy migration script để tạo tables và indexes:

```bash
# Tạo schema và migrate sample data
npm run migrate:neon

# Chỉ xem statistics
npm run migrate:stats

# Reset database (xóa tất cả data)
npm run migrate:reset
```

### 4. Khởi chạy Application

```bash
# Development với full stack (frontend + backend)
npm run dev:full

# Hoặc chạy riêng biệt
npm run server  # Backend server
npm run dev     # Frontend only
```

## 🏗️ Kiến trúc

### Service Layer Architecture

```
Frontend (React)
    ↓
ServiceFactory (Auto-detection)
    ↓
┌─────────────────┬─────────────────┐
│  NeonPasswordService  │  PasswordService    │
│  (Cloud Storage)      │  (IndexedDB)        │
└─────────────────┴─────────────────┘
    ↓                     ↓
Neon PostgreSQL      IndexedDB
```

### Auto-detection Logic

```typescript
// ServiceFactory tự động chọn service dựa trên:
1. VITE_USE_NEONDB environment variable
2. DATABASE_URL có tồn tại không
3. Production vs Development environment
4. API connectivity test
```

## 📊 Database Schema

### Passwords Table

```sql
CREATE TABLE passwords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password TEXT NOT NULL,
    url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service, username)
);
```

### Indexes cho Performance

```sql
-- Search optimization
CREATE INDEX idx_passwords_service ON passwords(service);
CREATE INDEX idx_passwords_username ON passwords(username);
CREATE INDEX idx_passwords_updated_at ON passwords(updated_at DESC);
```

## 🔧 API Endpoints

### RESTful API Design

```typescript
// Password Management
GET    /api/passwords           // List all passwords
POST   /api/passwords           // Create new password
GET    /api/passwords/:id       // Get password by ID
PUT    /api/passwords/:id       // Update password
DELETE /api/passwords/:id       // Delete password

// Search & Stats
GET    /api/passwords?search=query  // Search passwords
GET    /api/passwords/stats         // Get statistics

// System
GET    /api/health              // Health check
```

### Request/Response Examples

#### Create Password
```bash
POST /api/passwords
Content-Type: application/json

{
  "service": "Gmail",
  "username": "user@gmail.com",
  "password": "secure_password_123",
  "url": "https://gmail.com",
  "notes": "Personal email account"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "service": "Gmail",
    "username": "user@gmail.com",
    "password": "secure_password_123",
    "url": "https://gmail.com",
    "notes": "Personal email account",
    "created_at": "2024-01-07T10:30:00Z",
    "updated_at": "2024-01-07T10:30:00Z"
  }
}
```

## 🔄 Migration từ IndexedDB

### Automatic Migration

Application sẽ tự động detect và migrate data khi:
1. Có Neon DB configuration
2. IndexedDB có data existing
3. Neon DB trống hoặc có ít data hơn

### Manual Migration

```bash
# Export data từ IndexedDB
npm run migrate:export

# Import vào Neon DB
npm run migrate:import
```

## 🛠️ Development Tools

### DevTools Component

Trong development mode, sử dụng DevTools component:

```typescript
import { DevTools } from '@/components/DevTools';

// Trong component
<DevTools />
```

### Available Tools:
- **Service Info**: Xem thông tin service hiện tại
- **Connection Test**: Test kết nối database
- **Switch Database**: Chuyển đổi giữa Neon DB và IndexedDB
- **Export/Import**: Xuất/nhập dữ liệu
- **Clear Data**: Xóa toàn bộ dữ liệu

### Database Status

Hiển thị trạng thái kết nối real-time:

```typescript
import { DatabaseStatus } from '@/components/DatabaseStatus';

// Compact view
<DatabaseStatus />

// Detailed view
<DatabaseStatus showDetails={true} />
```

## 🔒 Security Considerations

### Data Encryption

```typescript
// Optional: Enable client-side encryption
VITE_ENCRYPTION_KEY=your-32-character-key

// Passwords sẽ được encrypt trước khi lưu vào database
```

### Connection Security

- Tất cả connections sử dụng SSL/TLS
- Connection string chứa `sslmode=require`
- Environment variables không được commit vào git

### Authentication (Future)

```sql
-- User authentication schema (prepared)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
CREATE POLICY passwords_user_policy ON passwords
    FOR ALL TO authenticated
    USING (user_id = auth.uid());
```

## 📈 Performance Optimization

### Connection Pooling

```javascript
// Server-side connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000
});
```

### Caching Strategy

```typescript
// Client-side caching với React Query
const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false
};
```

### Database Indexes

```sql
-- Optimized for common queries
CREATE INDEX idx_passwords_service ON passwords(service);
CREATE INDEX idx_passwords_search ON passwords USING GIN(
  to_tsvector('english', service || ' ' || username)
);
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Connection Failed
```
Error: Database connection failed
```
**Solution**: Kiểm tra DATABASE_URL và network connectivity

#### 2. SSL Certificate Error
```
Error: SSL certificate verification failed
```
**Solution**: Thêm `?sslmode=require` vào connection string

#### 3. Migration Failed
```
Error: Table already exists
```
**Solution**: Chạy `npm run migrate:reset` để reset database

### Debug Mode

Enable debug logging:

```env
VITE_LOG_LEVEL=debug
NODE_ENV=development
```

### Health Check

```bash
# Test API health
curl http://localhost:3001/api/health

# Test database connection
npm run test:neon
```

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Query Documentation](https://tanstack.com/query/latest)

## 🔄 Roadmap

### Planned Features:
- [ ] User Authentication với JWT
- [ ] Real-time collaboration
- [ ] Data encryption at rest
- [ ] Backup và restore functionality
- [ ] Multi-tenant support
- [ ] Advanced search với full-text search
- [ ] Password sharing với permissions
- [ ] Audit logging và compliance

---

**Note**: Đây là tích hợp beta. Trong production, nên sử dụng proper authentication và authorization mechanisms.
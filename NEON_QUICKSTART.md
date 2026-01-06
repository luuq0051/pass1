# 🚀 Neon Database Quick Start Guide

Hướng dẫn nhanh để tích hợp Memory Safe Guard với Neon PostgreSQL Database.

## ⚡ Quick Setup (5 phút)

### 1. Tạo Neon Database
```bash
# 1. Đăng ký tại https://neon.tech (miễn phí)
# 2. Tạo project mới
# 3. Copy connection string
```

### 2. Cấu hình Environment
```bash
# Copy environment template
cp .env.example .env.local

# Cập nhật .env.local với Neon connection string
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/memorysafeguard?sslmode=require
VITE_USE_NEONDB=true
VITE_ENABLE_API_SYNC=true
```

### 3. Khởi tạo Database
```bash
# Cài đặt dependencies
npm install

# Tạo database schema và sample data
npm run migrate:neon

# Kiểm tra kết nối
npm run test:neon:integration
```

### 4. Chạy Application
```bash
# Khởi chạy full stack (frontend + backend)
npm run dev:full

# Hoặc riêng biệt:
npm run server  # Backend (port 3001)
npm run dev     # Frontend (port 8080)
```

## 🎯 Kiểm tra Integration

### Database Status
- Mở http://localhost:8080
- Kiểm tra **Database Status** badge ở header
- Nên hiển thị "Neon DB" với màu xanh

### DevTools Testing
```bash
# Mở DevTools trong app (góc phải header)
# Test các chức năng:
- Get Service Info
- Test Connection  
- Switch Database
- Export/Import Data
```

### API Testing
```bash
# Test API endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/api/passwords
```

## 🔧 Commands Cheat Sheet

```bash
# Database Management
npm run migrate:neon        # Setup database + sample data
npm run migrate:stats       # View database statistics  
npm run migrate:reset       # Reset database (clear all)

# Testing
npm run test:neon           # Basic connection test
npm run test:neon:integration  # Full integration test

# Development
npm run dev:full           # Full stack development
npm run server             # Backend only
npm run dev                # Frontend only

# Data Operations
npm run migrate:export     # Export data to JSON
npm run migrate:import     # Import data from JSON
```

## 🚨 Troubleshooting

### Connection Issues
```bash
# Check environment variables
echo $DATABASE_URL

# Test connection manually
npm run test:neon

# Check server logs
npm run server
```

### Common Errors

**Error: "Database connection failed"**
```bash
# Solution: Check DATABASE_URL format
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

**Error: "Table does not exist"**
```bash
# Solution: Run migration
npm run migrate:neon
```

**Error: "Port 3001 already in use"**
```bash
# Solution: Kill existing process or change port
PORT=3002 npm run server
```

## 📊 Verification Checklist

- [ ] Neon database created và accessible
- [ ] Environment variables configured
- [ ] Database schema created (`npm run migrate:neon`)
- [ ] Connection test passed (`npm run test:neon:integration`)
- [ ] Frontend shows "Neon DB" status
- [ ] API endpoints responding (`curl http://localhost:3001/api/health`)
- [ ] CRUD operations working (add/edit/delete passwords)
- [ ] Search functionality working

## 🎉 Success!

Nếu tất cả checklist items đều ✅, bạn đã tích hợp thành công Neon Database!

### Next Steps:
- Explore DevTools để test advanced features
- Check out `docs/NEON_DB_INTEGRATION.md` để hiểu sâu hơn
- Deploy to production với proper environment variables

---

**Need Help?** Check `docs/NEON_DB_INTEGRATION.md` cho detailed documentation.
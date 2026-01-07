# Hướng dẫn Setup và Chạy Backend

## Bước 1: Cài đặt Dependencies

```bash
cd backend
npm install
```

Nếu thiếu các package, cài thêm:
```bash
npm install @nestjs/mapped-types class-validator class-transformer axios cheerio @nestjs/schedule @prisma/adapter-mariadb
npm install -D @types/cheerio
```

## Bước 2: Cấu hình Database

Tạo file `.env` trong thư mục `backend/`:

```env
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=webfilm

PORT=3000
FRONTEND_URL=http://localhost:3001
```

**Lưu ý**: Thay `your_password` bằng mật khẩu MySQL của bạn.

## Bước 3: Tạo Database

Đăng nhập vào MySQL và tạo database:

```sql
CREATE DATABASE webfilm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Bước 4: Generate Prisma Client

```bash
npx prisma generate
```

Lệnh này sẽ tạo Prisma Client trong `src/generated/prisma/`

## Bước 5: Chạy Migrations

```bash
npx prisma migrate dev --name init
```

Hoặc nếu muốn tạo migration mới:
```bash
npx prisma migrate dev
```

## Bước 6: (Tùy chọn) Xem Database với Prisma Studio

```bash
npx prisma studio
```

Mở trình duyệt tại `http://localhost:5555` để xem và quản lý database.

## Bước 7: Chạy Backend Server

### Development mode (với hot reload):
```bash
npm run start:dev
```

### Production mode:
```bash
npm run build
npm run start:prod
```

Server sẽ chạy tại `http://localhost:3000`

## Bước 8: Test API

Mở trình duyệt hoặc dùng Postman/curl để test:

- `GET http://localhost:3000/films/home` - Trang chủ
- `GET http://localhost:3000/films` - List phim
- `GET http://localhost:3000/categories` - List categories
- `GET http://localhost:3000/actors` - List actors
- `GET http://localhost:3000/keywords` - List keywords

## Troubleshooting

### Lỗi kết nối database:
- Kiểm tra MySQL đã chạy chưa
- Kiểm tra thông tin trong file `.env` đúng chưa
- Kiểm tra user có quyền truy cập database

### Lỗi Prisma Client:
- Chạy lại `npx prisma generate`
- Xóa thư mục `node_modules` và `src/generated` rồi cài lại

### Lỗi import:
- Đảm bảo đã cài đủ dependencies
- Chạy `npm install` lại

## Các lệnh hữu ích

```bash
# Format code
npm run format

# Lint code
npm run lint

# Chạy crawler
npm run crawl

# Xem Prisma Studio
npx prisma studio

# Reset database (XÓA TẤT CẢ DATA!)
npx prisma migrate reset
```












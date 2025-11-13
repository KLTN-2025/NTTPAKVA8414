# HEALTHYCRAVE - WEBSITE BÁN THỰC PHẨM ĂN KIÊNG TÍCH HỢP CHATBOT AI CÁ NHÂN HÓA LỘ TRÌNH DINH DƯỠNG VÀ CÔNG THỨC NẤU ĂN

## Công nghệ sử dụng:
### Backend:
* Node.js
* Express.js
* Mongoose
* JSON Web Token
### Frontend:
* Vue.js 3 + Vite
* Tailwind CSS
* Axios
* Vue Router
* Pinia
### Cơ sở dữ liệu
* MongoDB
### Xác thực người dùng
* Clerk

## Yêu cầu cấu hình
| Tool | Version | Mô tả |
|------|----------|--------------|
| [Node.js](https://nodejs.org/) | ≥ 22.x | Môi trường runtime |
| [npm](https://www.npmjs.com/) | ≥ 10.x | Package manager |
| [MongoDB](https://www.mongodb.com/try/download/community) | ≥ 6.x | Local database (via MongoDB Compass) |
| [Clerk](https://clerk.com/) | — | Công cụ xác thực người dùng |


### Clone repo từ Github:
```bash
git clone https://github.com/KLTN-2025/NTTPAKVA8414
cd NTTPAKVA8414
```

### Cài dependencies:
```bash
cd backend
npm install

cd user
npm install

cd admin
npm install
```

### Chạy project:
*Backend* (Port 5000, chạy đầu tiên)
```bash
cd backend
cp .env.example .env
node scripts/seedProduct.js 
node scripts/computeRecommendation.js
node server.js
```

*User frontend* (Port 5173, chạy terminal riêng)
```bash
cd user
npm run dev
```

*Admin frontend* (Port 5174, chạy terminal riêng)
```bash
cd admin
npm run dev
```

Mở MongoDB Compass và connect:
```bash
mongodb://localhost:27017/HealthyCrave
```

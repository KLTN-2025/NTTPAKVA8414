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
### Caching
* Redis / Memurai
### Third-party API:
* Chatbot: OpenAI API (GPT 4o-mini)
* Tìm thưc đơn: Spoonacular API

## Yêu cầu cấu hình
| Tool | Version | Mô tả |
|------|----------|--------------|
| [Node.js](https://nodejs.org/) | ≥ 22.x | Môi trường runtime |
| [npm](https://www.npmjs.com/) | ≥ 10.x | Package manager |
| [MongoDB](https://www.mongodb.com/try/download/community) | ≥ 6.x | CSDL cục bộ (via MongoDB Compass) |
| [Clerk](https://clerk.com/) | — | Công cụ xác thực người dùng |
| [Memurai (Redis Windows)](https://www.memurai.com/get-memurai) <br> [Redis (MacOS)](https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/install-redis-on-mac-os/) | — | Lưu trữ dữ liệu trên RAM, tăng tốc độ truy xuất dữ liệu |


## Cài đặt và sử dung
### Cài đặt Redis: 
**I/ Windows**
1. Download Memurai Developer Edition: [Link](https://www.memurai.com/get-memurai)
2. Mở thư mục có chứa file cài đặt -> Click vào file -> Ctrl+Shift+C
3. Mở Command Prompt với quyền admin và gõ:
```bash
msiexec /i <đường_dẫn_vừa_copy>
```
4. Cài đặt theo hướng dẫn
5. Kiểm tra kết nối bằng câu lệnh sau:
```bash
memurai-cli PING
> PONG <- cài đặt thành công
```

**II/ MacOS**
1. Cài đặt Homebrew:  [Link](https://brew.sh)
2. Mở terminal và gõ:
```bash
brew install redis
brew services start redis
```
3. Kiểm tra kết nối bằng câu lệnh sau:
```bash
redis-cli ping
> PONG <- thành công
```

### Clone repo từ Github:
```bash
git clone https://github.com/KLTN-2025/NTTPAKVA8414
cd NTTPAKVA8414
```

### Cài dependencies:
```bash
cd backend
npm install

cd ../user
npm install

cd ../admin
npm install
```

### Chạy project:
*Backend* (Port 5000, chạy đầu tiên)
```bash
cd backend
cp .env.example .env
```
Điền key vào: **OPENAI_API_KEY**, **CLERK_SECRET_KEY**, **SPOONACULAR_API_KEY**<br>
Sau đó chạy:

```bash
node scripts/syncUsers.js
node scripts/init.js
node scripts/createTrx.js
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

Mở MongoDB Compass và kiểm tra dữ liệu:
```bash
mongodb://localhost:27017/HealthyCrave
```

### Lưu ý cho tester
Chạy script này (ở backend) mỗi khi tạo người dùng mới hoặc thay đổi thông tin cá nhân <br>
(không nên thường xuyên vì sẽ bị giới hạn lượt dùng API)
```
node scripts/syncUsers.js
```

Test bằng tài khoản sau đây: <br>
**Email**: nguyenvana@gmail.com <br>
**Password**: nguyenvana123 <br>
(Có quyền admin)
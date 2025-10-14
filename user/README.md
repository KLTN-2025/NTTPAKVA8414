## Cài đặt dependency

### Chỉ cài bằng câu lệnh sau:
```
npm ci
```

### Khi muốn cài dependency mới:
```
npm install <package-name> --save-exact
git add package.json package-lock.json
git commit -m "Add <package-name>"
git push
```

### Nếu dependency bị lỗi, chạy hai câu lênh sau:
```
rm -rf node_modules 
npm ci
```
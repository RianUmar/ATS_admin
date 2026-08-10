# Gunakan Node.js LTS versi Alpine yang ringan
FROM node:20-alpine

# Set direktori kerja di dalam container
WORKDIR /app

# Salin package.json dan package-lock.json terlebih dahulu untuk efisiensi caching layer
COPY package*.json ./

# Install seluruh dependencies
RUN npm install

# Salin seluruh kode frontend
COPY . .

# Expose port Vite (5173)
EXPOSE 5173

# Jalankan Vite dev server dengan flag host agar dapat diakses dari luar container
CMD ["npm", "run", "dev", "--", "--host"]

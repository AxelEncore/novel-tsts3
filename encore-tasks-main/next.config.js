/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Отключаем ESLint во время сборки в режиме разработки
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Игнорируем ошибки TypeScript во время сборки
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
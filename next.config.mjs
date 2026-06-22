/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 单 Docker 镜像自托管(standalone 产物自带所需 node_modules)
  output: 'standalone',
};

export default nextConfig;

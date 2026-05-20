/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-zxing", "@zxing/browser", "@zxing/library"],
};

export default nextConfig;

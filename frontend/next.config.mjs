/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['cesium'],
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          CESIUM_BASE_URL: JSON.stringify('/cesium'),
        })
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        http: false,
        https: false,
        zlib: false,
      };
    }
    return config;
  },
};

export default nextConfig;

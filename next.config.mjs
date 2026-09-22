import CopyWebpackPlugin from 'copy-webpack-plugin';

/**
 * CesiumJS ships its Workers/ThirdParty/Assets/Widgets as static files that
 * are NOT bundled by webpack — they must be copied into /public and loaded
 * at runtime via a global CESIUM_BASE_URL. This is the standard integration
 * pattern for Cesium + Next.js/webpack (see cesium/cesium#9264 and the
 * official "Uploading" / bundler guides).
 *
 * NOTE: this repo could not be `npm install`-ed or `next build`-ed inside
 * the sandbox that generated it (no network egress to the npm registry).
 * The config below is written to the known-correct pattern for
 * cesium ^1.120 + next 14, but has not been build-verified here — verify
 * with `npm run build` in an environment with network access, and open an
 * issue against this file if the copy source paths have moved in a future
 * Cesium release.
 */
const cesiumSource = 'node_modules/cesium/Build/Cesium';

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
    }
    return config;
  },
};

export default nextConfig;

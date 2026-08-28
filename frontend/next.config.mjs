/* global process */

const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const basePath = isGithubActions ? '/hanko-master-kentei' : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: isGithubActions ? '/hanko-master-kentei/' : '',
  images: {
    unoptimized: true,
  },
  env: {
    // クライアントサイドで public/ 配下の静的アセット（音声ファイル等）を
    // 直接参照する際、basePath（GitHub Pages配信用）を反映するために使う。
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;

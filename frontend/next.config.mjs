/* global process */

const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: isGithubActions ? '/hanko-master-kentei' : '',
  assetPrefix: isGithubActions ? '/hanko-master-kentei/' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

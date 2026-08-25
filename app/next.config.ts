import type { NextConfig } from 'next';

const githubPagesBasePath =
  process.env.GITHUB_PAGES === 'true' ? '/killteam_ptbr' : '';

const nextConfig: NextConfig = {
  assetPrefix: githubPagesBasePath || undefined,
};

export default nextConfig;

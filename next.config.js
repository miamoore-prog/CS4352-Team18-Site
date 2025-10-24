/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "images.unsplash.com",
      "storage.googleapis.com",
      "pbs.twimg.com",
      "cdn.pixabay.com",
      "raw.githubusercontent.com"
    ]
  }
}

module.exports = nextConfig

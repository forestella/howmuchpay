/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",  // Correct for SSG/SPA deployment on Vercel without server
    images: {
        unoptimized: true, // Required for static export
    },
};

module.exports = nextConfig;

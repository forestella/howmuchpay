/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: "export",  <-- 주석 처리: 구글 소유권 확인(.html)을 위해 서버 모드로 전환
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;

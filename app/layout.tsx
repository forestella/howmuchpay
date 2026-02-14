import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: '얼마낼까 - 축의금 계산기',
    description: '한국소비자원 공식 데이터를 기반으로 합리적인 축의금을 계산해드립니다.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    );
}

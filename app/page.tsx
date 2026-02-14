export default function Home() {
    return (
        <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <header style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '24px', color: 'var(--primary-color)' }}>얼마낼까</h1>
                <p style={{ fontSize: '14px', color: '#666' }}>국가 통계 기반 축의금 계산기</p>
            </header>

            <section>
                {/* 계산기 컴포넌트가 들어갈 자리 */}
                <div style={{ padding: '20px', background: 'var(--gray-100)', borderRadius: '12px', textAlign: 'center' }}>
                    <p>지역을 선택해주세요</p>
                    {/* 임시 버튼 */}
                    <button style={{
                        marginTop: '10px',
                        padding: '12px 24px',
                        background: 'var(--primary-color)',
                        color: 'white',
                        borderRadius: '8px',
                        width: '100%'
                    }}>
                        서울(강남)
                    </button>
                </div>
            </section>

            <footer style={{ marginTop: '60px', textAlign: 'center' }}>
                <span style={{
                    fontSize: '12px',
                    background: 'var(--gray-200)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    color: '#555'
                }}>
                    대한민국 소비자원 2026.01.30 공식 데이터 기반
                </span>
            </footer>
        </main>
    );
}

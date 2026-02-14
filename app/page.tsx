'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import stats from '@/data/stats.json';

// --- Types ---
type RegionId = string;
type MealType = 'yes' | 'no' | 'n/a';
type Relationship = 'acquaintance' | 'friend' | 'close';
type VenueType = 'hall' | 'hotel';

const STEPS = [30000, 50000, 70000, 100000, 150000, 200000, 300000, 500000];

function Calculator() {
    const searchParams = useSearchParams();

    // --- State ---
    const [regionId, setRegionId] = useState<RegionId | null>(null);
    const [mealType, setMealType] = useState<MealType | null>(null);
    const [relationship, setRelationship] = useState<Relationship | null>(null);
    const [venueType, setVenueType] = useState<VenueType | null>(null);

    // --- Init from URL ---
    useEffect(() => {
        const r = searchParams.get('r');
        const m = searchParams.get('m') as MealType;
        const l = searchParams.get('l') as Relationship;
        const v = searchParams.get('v') as VenueType;

        if (r) setRegionId(r);
        if (m) setMealType(m);
        if (l) setRelationship(l);
        if (v) setVenueType(v);
    }, [searchParams]);

    // --- Logic ---
    const result = useMemo(() => {
        if (!regionId || !mealType || !relationship || !venueType) return null;

        const regionData = stats.regions.find((r) => r.id === regionId);
        if (!regionData) return null;

        let baseMealCost = regionData.avgMealCost;

        if (venueType === 'hotel') {
            baseMealCost = Math.round(baseMealCost * 1.5);
        }

        let recommended = 0;
        let explanation = '';

        if (mealType === 'n/a') {
            if (relationship === 'close') recommended = 100000;
            else recommended = 50000;
            explanation = '불참 시에는 기본 예의 표시로 50,000원이 적당하며, 가까운 사이라면 100,000원을 추천합니다.';
        } else {
            const minAmountByMeal = baseMealCost + 10000;
            let target = minAmountByMeal;

            if (relationship === 'friend') target += 30000;
            if (relationship === 'close') target += 50000;

            recommended = STEPS.find(s => s >= target) || STEPS[STEPS.length - 1];

            explanation = `선택하신 ${regionData.name} 지역의 평균 식대(약 ${(baseMealCost / 10000).toFixed(1)}만원)를 고려하여 산출되었습니다.`;
        }

        return {
            amount: recommended,
            explanation,
            mealCost: baseMealCost
        };
    }, [regionId, mealType, relationship, venueType]);

    // --- Handlers ---
    const handleShare = () => {
        // 쿼리 파라미터 생성
        const params = new URLSearchParams();
        if (regionId) params.set('r', regionId);
        if (venueType) params.set('v', venueType);
        if (mealType) params.set('m', mealType);
        if (relationship) params.set('l', relationship);

        const shareUrl = `${window.location.origin}?${params.toString()}`;

        if (navigator.share) {
            navigator.share({
                title: '얼마낼까 - 축의금 계산기',
                text: `내 추천 축의금은 ${result?.amount.toLocaleString()}원입니다!`,
                url: shareUrl,
            });
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('결과 링크가 복사되었습니다!');
            });
        }
    };

    const isComplete = !!result;

    return (
        <div className="container">
            <header className="header">
                <h1>얼마낼까</h1>
                <p className="subtitle">국가 통계 기반 축의금 계산기</p>
            </header>

            <div className="calculator-form">
                <section className="section">
                    <h2 className="section-title">어디서 결혼하나요?</h2>
                    <div className="grid-buttons">
                        {stats.regions.map((region) => (
                            <button
                                key={region.id}
                                className={`card-button ${regionId === region.id ? 'active' : ''}`}
                                onClick={() => setRegionId(region.id)}
                            >
                                {region.name}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="section">
                    <h2 className="section-title">어떤 식장인가요?</h2>
                    <div className="grid-buttons col-2">
                        <button
                            className={`card-button ${venueType === 'hall' ? 'active' : ''}`}
                            onClick={() => setVenueType('hall')}
                        >
                            일반 웨딩홀
                        </button>
                        <button
                            className={`card-button ${venueType === 'hotel' ? 'active' : ''}`}
                            onClick={() => setVenueType('hotel')}
                        >
                            호텔 (프리미엄)
                        </button>
                    </div>
                </section>

                <section className="section">
                    <h2 className="section-title">식사는 하시나요?</h2>
                    <div className="grid-buttons col-3">
                        <button className={`card-button ${mealType === 'yes' ? 'active' : ''}`} onClick={() => setMealType('yes')}>식사 함</button>
                        <button className={`card-button ${mealType === 'no' ? 'active' : ''}`} onClick={() => setMealType('no')}>안 함 (답례품)</button>
                        <button className={`card-button ${mealType === 'n/a' ? 'active' : ''}`} onClick={() => setMealType('n/a')}>불참 (봉투만)</button>
                    </div>
                </section>

                <section className="section">
                    <h2 className="section-title">얼마나 친한가요?</h2>
                    <div className="grid-buttons col-3">
                        <button className={`card-button ${relationship === 'acquaintance' ? 'active' : ''}`} onClick={() => setRelationship('acquaintance')}>그냥 아는 사이</button>
                        <button className={`card-button ${relationship === 'friend' ? 'active' : ''}`} onClick={() => setRelationship('friend')}>친한 친구</button>
                        <button className={`card-button ${relationship === 'close' ? 'active' : ''}`} onClick={() => setRelationship('close')}>아주 가까움</button>
                    </div>
                </section>
            </div>

            {isComplete && (
                <div className="result-dashboard">
                    <div className="result-card">
                        <p className="result-label">추천 축의금</p>
                        <p className="result-amount">{result.amount.toLocaleString()}원</p>
                        <div className="result-divider"></div>
                        <p className="result-desc">{result.explanation}</p>
                        {venueType === 'hotel' && <p className="result-sub-desc">* 호텔 식대는 일반 예식장보다 높게 반영되었습니다.</p>}
                    </div>

                    <button className="share-button" onClick={handleShare}>
                        카카오톡 공유하기
                    </button>
                </div>
            )}

            <footer className="footer-badge">
                <span className="badge-text">대한민국 소비자원 2026.01.30 공식 데이터 기반</span>
            </footer>

            <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 800;
          color: var(--primary-color);
          margin-bottom: 8px;
        }
        .subtitle {
          color: #666;
          font-size: 14px;
        }
        .section {
          margin-bottom: 32px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #333;
        }
        .grid-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
        }
        .col-2 { grid-template-columns: 1fr 1fr; }
        .col-3 { grid-template-columns: 1fr 1fr 1fr; }

        .card-button {
          padding: 16px 8px;
          border: 1px solid #E9ECEF;
          border-radius: 12px;
          background: white;
          color: #495057;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          height: 100%;
        }
        .card-button:active { transform: scale(0.98); }
        .card-button.active {
          border-color: var(--primary-color);
          background-color: var(--primary-color);
          color: white;
          font-weight: 700;
          box-shadow: 0 4px 6px rgba(26, 43, 75, 0.2);
        }

        .result-dashboard {
          margin-top: 40px;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .result-card {
          background: var(--gray-100);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          margin-bottom: 16px;
        }
        .result-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }
        .result-amount {
          font-size: 40px;
          font-weight: 800;
          color: var(--primary-color);
          margin-bottom: 16px;
        }
        .result-divider {
          height: 1px;
          background: #DEE2E6;
          margin: 16px 0;
        }
        .result-desc {
          font-size: 14px;
          color: #495057;
          line-height: 1.6;
        }
        .result-sub-desc {
          font-size: 12px;
          color: #868E96;
          margin-top: 8px;
        }

        .share-button {
          width: 100%;
          padding: 16px;
          background: #FAE100;
          color: #3C1E1E;
          font-weight: 700;
          border-radius: 12px;
          font-size: 16px;
        }

        .footer-badge {
          margin-top: auto;
          text-align: center;
          padding-top: 40px;
        }
        .badge-text {
          font-size: 11px;
          color: #868E96;
          background: #F8F9FA;
          padding: 6px 12px;
          border-radius: 20px;
          display: inline-block;
        }
      `}</style>
        </div>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Calculator />
        </Suspense>
    );
}

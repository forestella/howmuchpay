'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import stats from '@/data/stats.json';

// --- Types ---
type RegionId = string;
type MealType = 'yes' | 'no' | 'n/a';
type Relationship = 'acquaintance' | 'colleague' | 'friend' | 'close' | 'family';
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

        // 메시지 객체 (제목, 내용)
        let message = { title: '', desc: '' };

        // 1. 금액 산출 로직
        if (mealType === 'n/a') {
            // 불참
            if (relationship === 'close' || relationship === 'family') recommended = 100000;
            else recommended = 50000;
        } else {
            // 참석 (식사/답례품)
            const minAmountByMeal = baseMealCost + 10000; // 최소한 식대 + 1만원
            let target = minAmountByMeal;

            // 관계에 따른 가산점
            if (relationship === 'friend') target += 20000;
            if (relationship === 'close') target += 50000;
            if (relationship === 'family') target += 100000; // 가족은 더 높게

            // 금액 보정 (STEPS에 맞춤)
            recommended = STEPS.find(s => s >= target) || STEPS[STEPS.length - 1];
        }

        // 2. 메시지 선정 로직 (우선순위: 식장/식사 -> 관계)

        // Case 7. 프리미엄 호텔 (최우선)
        if (venueType === 'hotel') {
            message.title = "장소의 격에 맞는 센스 있는 선택";
            message.desc = "이곳은 식대가 일반적인 수준을 훨씬 상회합니다. 호스트의 부담을 덜어주는 당신은 정말 배려 깊은 하객입니다.";
        }
        // Case 2. 불참/식사 안 함
        else if (mealType !== 'yes') {
            message.title = "부담은 덜고 마음은 전하고";
            message.desc = "식대 지출이 없으므로, 서로 주고받기에 가장 깔끔하고 뒷말 없는 표준 금액입니다.";
        }
        // 관계별 메시지
        else {
            switch (relationship) {
                case 'acquaintance': // 그냥 아는 사이
                    message.title = "멀어지지 않는 적당한 거리감";
                    message.desc = "밥값 때문에 미안해할 필요 없습니다. 통계적 식대를 기준으로 실례되지 않을 최소한의 예의를 담았습니다.";
                    break;
                case 'colleague': // 직장 동료
                    message.title = "사무실 매너와 예의를 동시에!";
                    message.desc = "식장 평균 식대를 방어하면서, 월요일 출근길이 어색하지 않을 딱 적당한 사회생활용 금액입니다.";
                    break;
                case 'friend': // 친구/모임
                    message.title = "함께해서 더 즐거운 축하";
                    message.desc = "모임의 평균적인 분위기를 해치지 않으면서, 하객으로서 1인분 몫을 충분히 하는 금액입니다.";
                    break;
                case 'close': // 친한 친구/은사님
                    message.title = "돈보다 깊은 우리 우정!";
                    message.desc = "식대 계산을 넘어, 인생의 소중한 순간을 함께 축하하는 진심이 담긴 금액입니다.";
                    break;
                case 'family': // 가족/베프
                    message.title = "가족의 새로운 시작을 위해";
                    message.desc = "일반 하객과는 다른, 끈끈한 유대감과 축복의 의미를 담아 넉넉하게 산출했습니다.";
                    break;
            }
        }

        return {
            amount: recommended,
            message,
            explanation: `* ${regionData.name} 지역 평균 식대: 약 ${(baseMealCost / 10000).toFixed(1)}만원`
        };
    }, [regionId, mealType, relationship, venueType]);

    // --- Handlers ---
    const handleShare = () => {
        const params = new URLSearchParams();
        if (regionId) params.set('r', regionId);
        if (venueType) params.set('v', venueType);
        if (mealType) params.set('m', mealType);
        if (relationship) params.set('l', relationship);

        const shareUrl = `${window.location.origin}?${params.toString()}`;

        // 랜덤 공유 멘트
        const shareMentions = [
            "나 방금 '얼마낼까'로 축의금 정함. 너도 이거 보고 가라. (내 우정 점수 00점)",
            "호텔 결혼식 가는데 식대 얼마인지 몰라서 쫄았음; 여기서 계산해보니 답 나오네.",
            `소비자원 통계로 돌려보니 나는 ${result?.amount.toLocaleString()}원 나옴. 넌 얼마 낼 거임?`
        ];
        const randomText = shareMentions[Math.floor(Math.random() * shareMentions.length)];

        if (navigator.share) {
            navigator.share({
                title: '얼마낼까 - 2026년 국룰 축의금 계산기',
                text: randomText,
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
                    <div className="grid-buttons col-3-wrap">
                        <button className={`card-button ${relationship === 'acquaintance' ? 'active' : ''}`} onClick={() => setRelationship('acquaintance')}>그냥 아는 사이</button>
                        <button className={`card-button ${relationship === 'colleague' ? 'active' : ''}`} onClick={() => setRelationship('colleague')}>직장 동료</button>
                        <button className={`card-button ${relationship === 'friend' ? 'active' : ''}`} onClick={() => setRelationship('friend')}>친구/모임</button>
                        <button className={`card-button ${relationship === 'close' ? 'active' : ''}`} onClick={() => setRelationship('close')}>친한 친구/은사</button>
                        <button className={`card-button ${relationship === 'family' ? 'active' : ''}`} onClick={() => setRelationship('family')}>가족/베프</button>
                    </div>
                </section>
            </div>

            {isComplete && (
                <div className="result-dashboard">
                    <div className="result-card">
                        <p className="result-label">추천 축의금</p>
                        <p className="result-amount">{result.amount.toLocaleString()}원</p>
                        <div className="result-divider"></div>

                        <div className="result-message">
                            <p className="message-title">{result.message.title}</p>
                            <p className="message-desc">{result.message.desc}</p>
                        </div>

                        <p className="result-sub-desc">{result.explanation}</p>
                    </div>

                    <button className="share-button" onClick={handleShare}>
                        카카오톡 공유하기
                    </button>
                </div>
            )}

            <footer className="footer">
                <div className="badge-container">
                    <span className="badge-text">대한민국 소비자원 2026.01.30 공식 데이터 기반</span>
                </div>
                <div className="disclaimer">
                    <p><strong>[확인해 주세요!]</strong></p>
                    <p>본 서비스는 한국소비자원 '참가격' 서비스의 지역별 외식비 통계 및 웨딩 업계 평균 식대를 기초로 산출합니다.</p>
                    <p>실제 예식장의 메뉴(코스 vs 뷔페)나 요일(주말 vs 평일)에 따라 식대는 최대 30% 이상 차이 날 수 있습니다.</p>
                    <p>본 결과는 참고용이며, 개인 간의 친밀도나 경제적 상황에 따른 최종 판단의 책임은 사용자에게 있습니다.</p>
                    <p>데이터는 매 분기 업데이트되나, 급격한 물가 변동이 즉각 반영되지 않을 수 있습니다.</p>
                </div>
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
        .col-3-wrap { 
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }

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
          word-break: keep-all;
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
        .result-message {
            margin-bottom: 16px;
        }
        .message-title {
            font-size: 16px;
            font-weight: 700;
            color: #1A2B4B;
            margin-bottom: 8px;
        }
        .message-desc {
            font-size: 14px;
            color: #495057;
            line-height: 1.6;
            word-break: keep-all;
        }
        .result-sub-desc {
          font-size: 12px;
          color: #868E96;
          margin-top: 12px;
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

        .footer {
          margin-top: auto;
          text-align: center;
          padding-top: 40px;
          padding-bottom: 20px;
        }
        .badge-container {
            margin-bottom: 20px;
        }
        .badge-text {
          font-size: 11px;
          color: #868E96;
          background: #F8F9FA;
          padding: 6px 12px;
          border-radius: 20px;
          display: inline-block;
        }
        .disclaimer {
            font-size: 11px;
            color: #ADB5BD;
            line-height: 1.5;
            text-align: left;
            background: #FAFAFA;
            padding: 16px;
            border-radius: 8px;
        }
        .disclaimer p {
            margin-bottom: 4px;
        }
        .disclaimer strong {
            color: #868E96;
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

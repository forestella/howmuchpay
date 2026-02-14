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

        // 2. 메시지 선정 로직 (감성/상황 중심)

        // Case 6. 호텔/프리미엄 웨딩 (최우선)
        if (venueType === 'hotel') {
            message.title = "장소의 격식에 맞춘 세심한 배려";
            message.desc = "신랑/신부가 기분 좋게 손님을 맞이할 수 있는 기준입니다. 호스트의 부담을 덜어주는 당신은 센스 있는 하객입니다.";
        }
        // Case 4. 식사 없이 마음만 (불참/식사 안 함)
        else if (mealType !== 'yes') {
            message.title = "자리를 비우는 미안함 대신 정성을!";
            message.desc = "식대 지출이 없음을 고려해 합리적으로 산출했습니다. 봉투만 전달하더라도 충분히 센스 있는 하객이 되실 거예요.";
        }
        // 관계별 메시지
        else {
            switch (relationship) {
                case 'acquaintance': // Case 2. 평범한 지인
                    message.title = "서로 부담 없는 깔끔한 예의";
                    message.desc = "하객으로서의 도리를 다하는 가장 표준적인 선택입니다.";
                    break;
                case 'colleague': // Case 3. 직장 동료
                    message.title = "월요일 출근길이 가벼워지는 센스!";
                    message.desc = "조직의 분위기와 최근 물가 흐름을 고려한 적정선입니다.";
                    break;
                case 'friend': // Case 5. 맛있게 식사 (친구/모임)
                    message.title = "초대해 준 정성에 보답하는 한 끼";
                    message.desc = "최근 예식장 환경을 반영해 실례가 되지 않는 금액입니다.";
                    break;
                case 'close': // Case 1. 끈끈한 의리파
                    message.title = "금액보다 앞선 우리의 시간!";
                    message.desc = "밥값 걱정 없이 가장 축복하는 마음을 담았습니다.";
                    break;
                case 'family': // Case 8. 가족/친척
                    message.title = "가문의 경사를 축하하며!";
                    message.desc = "일반 하객과는 다른 끈끈한 유대감과 축복의 무게를 실었습니다.";
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

        // 랜덤 공유 멘트 (사용자 요청 3종)
        const shareMentions = [
            "아직도 축의금 5만원 내니? 2026년 국룰 계산기 돌려봐라.",
            `소비자원 데이터로 뽑아본 내 적정 축의금은 ${result?.amount.toLocaleString()}원! 너는 얼마 나와?`,
            "결혼식 갈 때마다 고민되는 축의금, 여기서 10초 만에 종결함."
        ];
        const randomText = shareMentions[Math.floor(Math.random() * shareMentions.length)];
        const fullText = `${randomText}\n${shareUrl}`;

        // 가장 확실한 클립보드 복사 + 안내 방식 사용
        navigator.clipboard.writeText(fullText).then(() => {
            alert('공유 문구가 복사되었습니다!\n카카오톡 채팅방에 "붙여넣기" 해주세요.');
        }).catch(() => {
            // 클립보드 권한 이슈 등으로 실패 시 URL만이라도 시도 (fallback)
            prompt('아이쿠, 복사에 실패했습니다. 아래 링크를 직접 복사해 주세요!', fullText);
        });
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
                    <span className="badge-text">2026년 웨딩 물가 및 지역별 평균 식대 기준</span>
                </div>
                <div className="disclaimer">
                    <p><strong>[알려드립니다]</strong></p>
                    <p>본 결과는 최근 물가 트렌드와 지역별 평균 식대를 참고하여 제안하는 '가이드라인'일 뿐입니다.</p>
                    <p>축의금은 개인의 경제 상황이나 신랑/신부와의 특별한 사연에 따라 얼마든지 달라질 수 있습니다.</p>
                    <p>본인의 마음이 가장 편안한 금액이 정답이며, 최종 결정의 책임은 사용자에게 있습니다.</p>
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

import React, { useState } from 'react';
import type { AffiliationItem, JacketTypeOption } from '../data/affiliationData';

interface JacketPreviewProps {
  affiliation: AffiliationItem;
  jacketType: JacketTypeOption;
  size: string;
  hasNameEmbroidery: boolean;
  hasSidEmbroidery: boolean;
  hasPatch: boolean;
  hasFleece: boolean;
  applicantName: string;
  studentId: string;
}

export const JacketPreview: React.FC<JacketPreviewProps> = ({
  affiliation,
  jacketType,
  size,
  hasNameEmbroidery,
  hasSidEmbroidery,
  hasPatch,
  hasFleece,
  applicantName,
  studentId,
}) => {
  const [viewMode, setViewMode] = useState<'front' | 'back'>('front');

  // 학번 8자리 중 입학년도 2자리 추출 (예: 20241234 -> 24)
  const sidDigits = studentId && studentId.length >= 4 
    ? studentId.slice(2, 4) 
    : '24';

  const displayName = applicantName.trim() ? applicantName.trim() : '이름 자수';

  const { bodyColor, sleeveColor, ribColor = '#3b82c4', logoText, subLogoText, name: deptName } = affiliation;

  return (
    <div className="w-full flex flex-col items-center">
      {/* 앞면/뒷면 전환 버튼 & 상태 배지 */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bodyColor }}></span>
          <span>{deptName}</span>
          <span>·</span>
          <span>{jacketType.name}</span>
          <span>·</span>
          <span className="font-semibold text-[#1f3a6e]">{size}</span>
        </div>

        <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode('front')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'front'
                ? 'bg-white text-[#1f3a6e] shadow-sm'
                : 'text-slate-600 hover:text-[#1f3a6e]'
            }`}
          >
            앞면
          </button>
          <button
            type="button"
            onClick={() => setViewMode('back')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'back'
                ? 'bg-white text-[#1f3a6e] shadow-sm'
                : 'text-slate-600 hover:text-[#1f3a6e]'
            }`}
          >
            뒷면
          </button>
        </div>
      </div>

      {/* SVG 잠바 일러스트 렌더링 컨테이너 */}
      <div className="relative w-full aspect-[4/3] max-w-[420px] rounded-xl bg-gradient-to-b from-slate-50 to-slate-100/90 border border-slate-200/90 shadow-inner flex items-center justify-center p-3 overflow-hidden select-none">
        
        {/* 기모 안감 뱃지 표시 */}
        {hasFleece && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 text-[11px] font-semibold flex items-center gap-1">
            <span>🔥 4온스 퀼팅 안감</span>
          </div>
        )}

        {/* 바닥 그림자 */}
        <div className="absolute bottom-4 w-52 h-4 rounded-full bg-slate-400/20 blur-sm pointer-events-none"></div>

        <svg
          viewBox="0 0 400 320"
          className="w-full h-full max-h-[290px] drop-shadow-md transition-all duration-300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 소매 주름 및 가죽 그라데이션 필터 */}
            <linearGradient id="sleeveShadowLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#000" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
            </linearGradient>
            <linearGradient id="bodyDepth" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.16" />
            </linearGradient>
            <pattern id="quiltPattern" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 0 8 L 8 0 L 16 8 L 8 16 Z" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* ===================== 뒷면 렌더링 ===================== */}
          {viewMode === 'back' && (
            <g id="jacket-back">
              {/* 왼쪽 소매 (뒷면) */}
              <path
                d="M 125,75 L 48,175 Q 35,190 52,202 L 92,165 L 126,145 Z"
                fill={sleeveColor}
                stroke="#000"
                strokeOpacity="0.15"
                strokeWidth="1.5"
              />
              {/* 왼쪽 손목 시보리 */}
              <polygon
                points="48,175 40,186 64,204 70,192"
                fill={ribColor}
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray="2,2"
              />

              {/* 오른쪽 소매 (뒷면) */}
              <path
                d="M 275,75 L 352,175 Q 365,190 348,202 L 308,165 L 274,145 Z"
                fill={sleeveColor}
                stroke="#000"
                strokeOpacity="0.15"
                strokeWidth="1.5"
              />
              {/* 오른쪽 손목 시보리 */}
              <polygon
                points="352,175 360,186 336,204 330,192"
                fill={ribColor}
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray="2,2"
              />

              {/* 몸통 (뒷면) */}
              <path
                d="M 125,75 Q 200,88 275,75 L 285,245 Q 200,252 115,245 Z"
                fill={bodyColor}
                stroke="#000"
                strokeOpacity="0.2"
                strokeWidth="2"
              />
              <path
                d="M 125,75 Q 200,88 275,75 L 285,245 Q 200,252 115,245 Z"
                fill="url(#bodyDepth)"
              />

              {/* 밑단 시보리 */}
              <path
                d="M 115,245 Q 200,252 285,245 L 285,264 Q 200,270 115,264 Z"
                fill={ribColor}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="4,2"
              />

              {/* 목덜미 시보리 (뒷면) */}
              <path
                d="M 152,70 Q 200,82 248,70 Q 242,52 200,52 Q 158,52 152,70 Z"
                fill={ribColor}
                stroke="#ffffff"
                strokeWidth="1"
              />

              {/* 뒷면 대형 아치 로고 (SOONGSIL UNIVERSITY) */}
              <path
                id="archPath"
                d="M 140,140 Q 200,105 260,140"
                fill="none"
              />
              <text fill="#ffffff" stroke="#000" strokeWidth="0.8" fontSize="20" fontWeight="900" letterSpacing="3" textAnchor="middle">
                <textPath href="#archPath" startOffset="50%" textAnchor="middle">
                  SOONGSIL
                </textPath>
              </text>

              {/* 뒷면 학과 영문/동아리 대형 텍스트 */}
              <rect x="145" y="152" width="110" height="26" rx="4" fill="#ffffff" fillOpacity="0.12" />
              <text
                x="200"
                y="170"
                fill="#ffffff"
                fontSize="13"
                fontWeight="800"
                letterSpacing="1.5"
                textAnchor="middle"
                filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
              >
                {logoText}
              </text>
              <text
                x="200"
                y="194"
                fill="#cbd5e1"
                fontSize="10"
                fontWeight="700"
                letterSpacing="1.2"
                textAnchor="middle"
              >
                {subLogoText || 'UNIVERSITY'}
              </text>

              {/* 뒷면 하단 1897 헤리티지 마크 */}
              <text
                x="200"
                y="228"
                fill="#e2e8f0"
                fillOpacity="0.85"
                fontSize="11"
                fontWeight="bold"
                letterSpacing="2"
                textAnchor="middle"
              >
                EST. 1897
              </text>
            </g>
          )}

          {/* ===================== 앞면 렌더링 ===================== */}
          {viewMode === 'front' && (
            <g id="jacket-front">
              {/* 왼쪽 소매 (착용자 기준 오른쪽) */}
              <path
                d="M 125,75 L 48,175 Q 35,190 52,202 L 92,165 L 126,145 Z"
                fill={sleeveColor}
                stroke="#000"
                strokeOpacity="0.18"
                strokeWidth="1.5"
              />
              <path
                d="M 125,75 L 48,175 Q 35,190 52,202 L 92,165 L 126,145 Z"
                fill="url(#sleeveShadowLeft)"
              />
              {/* 왼쪽 손목 시보리 */}
              <polygon
                points="48,175 40,186 64,204 70,192"
                fill={ribColor}
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray="2,2"
              />

              {/* 오른쪽 소매 (착용자 기준 왼쪽) */}
              <path
                d="M 275,75 L 352,175 Q 365,190 348,202 L 308,165 L 274,145 Z"
                fill={sleeveColor}
                stroke="#000"
                strokeOpacity="0.18"
                strokeWidth="1.5"
              />
              <path
                d="M 275,75 L 352,175 Q 365,190 348,202 L 308,165 L 274,145 Z"
                fill="url(#sleeveShadowLeft)"
                transform="scale(-1, 1) translate(-400, 0)"
              />
              {/* 오른쪽 손목 시보리 */}
              <polygon
                points="352,175 360,186 336,204 330,192"
                fill={ribColor}
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray="2,2"
              />

              {/* 어깨 학번 자수 (옵션: 왼쪽 어깨 소매) */}
              {hasSidEmbroidery && (
                <g transform="translate(76, 125) rotate(-22)">
                  <rect x="-14" y="-12" width="28" height="24" rx="4" fill="#ffffff" stroke="#1f3a6e" strokeWidth="1.5" />
                  <text
                    x="0"
                    y="5"
                    fill="#1f3a6e"
                    fontSize="13"
                    fontWeight="900"
                    textAnchor="middle"
                    fontFamily="Impact, sans-serif"
                  >
                    {sidDigits}
                  </text>
                </g>
              )}

              {/* 팔 로고 패치 (옵션: 오른쪽 어깨 소매) */}
              {hasPatch && (
                <g transform="translate(322, 125) rotate(22)">
                  <circle cx="0" cy="0" r="13" fill="#1f3a6e" stroke="#ffffff" strokeWidth="1.5" />
                  {/* 백마/숭실 엠블럼 심볼 */}
                  <path
                    d="M -6,5 L -3,-5 L 4,-6 L 6,1 L 2,6 Z"
                    fill="#ffffff"
                  />
                  <circle cx="0" cy="0" r="11" fill="none" stroke="#eab308" strokeWidth="0.8" strokeDasharray="1,1" />
                </g>
              )}

              {/* 메인 몸통 */}
              <path
                d="M 125,75 Q 200,90 275,75 L 285,245 Q 200,252 115,245 Z"
                fill={bodyColor}
                stroke="#000"
                strokeOpacity="0.25"
                strokeWidth="2"
              />
              <path
                d="M 125,75 Q 200,90 275,75 L 285,245 Q 200,252 115,245 Z"
                fill="url(#bodyDepth)"
              />

              {/* 밑단 시보리 */}
              <path
                d="M 115,245 Q 200,252 285,245 L 285,264 Q 200,270 115,264 Z"
                fill={ribColor}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="4,2"
              />

              {/* 잠바 종류별 앞섶(앞단) 및 여밈 디테일 */}
              {jacketType.id === 'baseball' ? (
                // 1. 야구잠바(과잠): 스냅 단추 라인
                <g id="snaps">
                  <line x1="200" y1="88" x2="200" y2="245" stroke="#000" strokeOpacity="0.2" strokeWidth="2.5" />
                  <rect x="194" y="88" width="12" height="157" fill="#ffffff" fillOpacity="0.08" />
                  {[108, 138, 168, 198, 226].map((cy) => (
                    <g key={cy}>
                      <circle cx="200" cy={cy} r="4.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                      <circle cx="200" cy={cy} r="2.5" fill="#e2e8f0" />
                    </g>
                  ))}
                </g>
              ) : jacketType.id === 'hoodie' ? (
                // 2. 후드집업: 지퍼 & 캥거루 주머니 & 후드 끈
                <g id="zipper-hoodie">
                  <line x1="200" y1="88" x2="200" y2="245" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3,1" />
                  {/* 지퍼 슬라이더 */}
                  <rect x="197" y="100" width="6" height="10" rx="1.5" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                  {/* 후드 끈 */}
                  <path d="M 185,82 Q 183,115 186,132" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M 215,82 Q 217,115 214,132" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />
                  {/* 캥거루 포켓 */}
                  <path
                    d="M 148,225 L 165,190 L 235,190 L 252,225 Z"
                    fill="#000"
                    fillOpacity="0.12"
                    stroke="#ffffff"
                    strokeOpacity="0.15"
                    strokeWidth="1.5"
                  />
                </g>
              ) : (
                // 3. 바람막이: 스포티 방수 지퍼 & 배색 절개선
                <g id="windbreaker-front">
                  <line x1="200" y1="72" x2="200" y2="245" stroke="#334155" strokeWidth="2.5" />
                  {/* 방수 테이프 지퍼 풀러 */}
                  <rect x="197" y="90" width="6" height="12" rx="1.5" fill="#38bdf8" />
                  {/* 사선 컷팅 라인 */}
                  <path d="M 125,120 L 195,160" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.5" />
                  <path d="M 275,120 L 205,160" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.5" />
                </g>
              )}

              {/* 양쪽 사선 포켓 (주머니 입구) */}
              <line x1="140" y1="200" x2="162" y2="228" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.9" />
              <line x1="260" y1="200" x2="238" y2="228" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.9" />

              {/* 목 시보리/카라 */}
              {jacketType.id === 'hoodie' ? (
                // 후드 넥라인
                <path
                  d="M 150,75 Q 165,48 200,48 Q 235,48 250,75 Q 200,90 150,75 Z"
                  fill={bodyColor}
                  stroke="#ffffff"
                  strokeOpacity="0.3"
                  strokeWidth="1.5"
                />
              ) : jacketType.id === 'windbreaker' ? (
                // 바람막이 하이넥 스탠드 카라
                <path
                  d="M 160,78 L 165,56 Q 200,52 235,56 L 240,78 Q 200,88 160,78 Z"
                  fill={bodyColor}
                  stroke="#0ea5e9"
                  strokeWidth="1.5"
                />
              ) : (
                // 과잠 밴딩 립 카라
                <path
                  d="M 152,70 Q 200,88 248,70 Q 242,54 200,54 Q 158,54 152,70 Z"
                  fill={ribColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeDasharray="3,1.5"
                />
              )}

              {/* 왼쪽 가슴 (착용자 기준 오른쪽): 학교/학과 로고 텍스트 */}
              <g transform="translate(162, 130)">
                {/* 엠블럼 바탕 서클/패치 */}
                <circle cx="0" cy="0" r="16" fill="#ffffff" fillOpacity="0.15" />
                <text
                  x="0"
                  y="5"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="'Pretendard', sans-serif"
                  filter="drop-shadow(0 1px 2px rgba(0,0,0,0.6))"
                >
                  {logoText.split(' ')[0] || 'SSU'}
                </text>
              </g>

              {/* 이름 자수 (옵션: 가슴 아래 필기체 자수) */}
              {hasNameEmbroidery && (
                <g transform="translate(162, 155)">
                  <rect x="-24" y="-8" width="48" height="15" rx="3" fill="#000" fillOpacity="0.25" />
                  <text
                    x="0"
                    y="3"
                    fill="#fef08a"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="serif"
                  >
                    {displayName}
                  </text>
                </g>
              )}

              {/* 오른쪽 가슴 백마 심볼 (옵션/기본) */}
              <g transform="translate(238, 130)">
                <circle cx="0" cy="0" r="14" fill="#ffffff" fillOpacity="0.1" />
                <text
                  x="0"
                  y="4"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  fillOpacity="0.9"
                >
                  1897
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* 잠바 스펙 요약 정보바 */}
      <div className="w-full mt-2 grid grid-cols-3 gap-1 text-[11px] text-center text-slate-500 bg-white/70 py-1.5 px-2 rounded-lg border border-slate-200/60">
        <div>
          <span className="text-slate-400 block text-[10px]">몸통 컬러</span>
          <span className="font-semibold text-slate-700 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block border border-slate-300" style={{ backgroundColor: bodyColor }}></span>
            {bodyColor}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">소매 컬러</span>
          <span className="font-semibold text-slate-700 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block border border-slate-300" style={{ backgroundColor: sleeveColor }}></span>
            {sleeveColor === '#ffffff' ? '화이트 레더' : sleeveColor}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">가슴 로고</span>
          <span className="font-semibold text-[#1f3a6e] truncate max-w-[80px] inline-block">
            {logoText}
          </span>
        </div>
      </div>
    </div>
  );
};

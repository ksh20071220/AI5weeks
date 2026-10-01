/**
 * ============================================================================
 * 숭실대학교 잠바 공동구매 - 소속 및 가격 설정 데이터
 * ============================================================================
 * 숭실대학교 공식 홈페이지(ssu.ac.kr) 학사 안내 및 단과대학/동아리 기준
 * 나중에 단가나 신설 학과, 동아리가 변경되어도 이 파일만 수정하면 손쉽게 반영됩니다.
 */

// 1. 잠바 종류별 가격 변동 데이터
export interface JacketTypeOption {
  id: string;
  name: string;
  priceDelta: number; // 기본가 대비 변동 금액 (원)
  description: string;
}

export const JACKET_TYPES: JacketTypeOption[] = [
  { id: 'baseball', name: '과잠(야구잠바)', priceDelta: 0, description: '멜톤 울 + 고급 습식 가죽 소매 (기본가)' },
  { id: 'hoodie', name: '후드집업', priceDelta: -3000, description: '특양면 고급 기모 원단 (-3,000원)' },
  { id: 'windbreaker', name: '바람막이', priceDelta: -5000, description: '생활방수 윈드스토퍼 소재 (-5,000원)' },
];

// 2. 사이즈별 가격 변동 데이터
export interface SizeOption {
  id: string;
  name: string;
  priceDelta: number;
}

export const SIZE_OPTIONS: SizeOption[] = [
  { id: 'S', name: 'S (90)', priceDelta: 0 },
  { id: 'M', name: 'M (95)', priceDelta: 0 }, // 기본 선택값
  { id: 'L', name: 'L (100)', priceDelta: 0 },
  { id: 'XL', name: 'XL (105)', priceDelta: 2000 },
  { id: 'XXL', name: 'XXL (110)', priceDelta: 3000 },
];

// 3. 추가 옵션 목록 데이터
export interface CustomOption {
  id: string;
  name: string;
  price: number;
  description: string;
}

export const ADDITIONAL_OPTIONS: CustomOption[] = [
  { id: 'name_embroidery', name: '이름 자수', price: 5000, description: '가슴/손목 한글·영문 필기체 자수 (+5,000원)' },
  { id: 'sid_embroidery', name: '학번 자수', price: 3000, description: '어깨 소매 학번 2자리 아플리케 (+3,000원)' },
  { id: 'sleeve_patch', name: '팔 로고 패치', price: 2000, description: '팔 소매 숭실대 공식 백마 와펜 패치 (+2,000원)' },
  { id: 'fleece_lining', name: '기모 안감', price: 4000, description: '겨울철 대비 4온스 퀼팅 기모 안감 (+4,000원)' },
];

// 4. 소속 데이터 세부 항목 인터페이스
export interface AffiliationItem {
  id: string;
  name: string;
  category: string; // '학교 공용' | '단과대학(과잠)' | '동아리(동아리잠바)'
  group: string;    // 예: '본교 공용', 'IT대학', '공과대학', '중앙동아리' 등
  bodyColor: string; // 헥스코드 몸통색
  sleeveColor: string; // 헥스코드 소매색
  ribColor?: string; // 시보리 배색
  logoText: string;  // 가슴/등판 로고 텍스트
  subLogoText?: string;
  basePrice: number; // 기본 단가 (원)
  currentCount: number; // 현재 신청 인원
  targetCount: number;  // 공동구매 목표 인원 (도달 시 공구 확정)
}

// 5. 전체 소속 데이터베이스 (학교 공용, 단과대학별 학과, 동아리)
export const AFFILIATION_DATA: AffiliationItem[] = [
  // --- 1. 학교 공용 ---
  {
    id: 'ssu_classic',
    name: '숭실대 학교잠바 (기본형)',
    category: '학교 공용',
    group: '본교 공용',
    bodyColor: '#1f3a6e', // 숭실 네이비
    sleeveColor: '#ffffff', // 화이트 레더
    ribColor: '#3b82c4',
    logoText: 'SOONGSIL',
    subLogoText: '1897 SSU',
    basePrice: 65000,
    currentCount: 24,
    targetCount: 30,
  },
  {
    id: 'ssu_black',
    name: '숭실대 학교잠바 (올블랙 로고형)',
    category: '학교 공용',
    group: '본교 공용',
    bodyColor: '#1a1d20', // 올블랙
    sleeveColor: '#2b2e34', // 다크 차콜
    ribColor: '#1a1d20',
    logoText: 'SSU 1897',
    subLogoText: 'EST. 1897',
    basePrice: 66000,
    currentCount: 28,
    targetCount: 30,
  },

  // --- 2. 단과대학(과잠) : IT대학 ---
  {
    id: 'it_cse',
    name: '컴퓨터학부',
    category: '단과대학(과잠)',
    group: 'IT대학',
    bodyColor: '#1a2e56', // 딥 네이비
    sleeveColor: '#ffffff',
    ribColor: '#3b82c4',
    logoText: 'SSU CSE',
    subLogoText: 'COMPUTER SCIENCE',
    basePrice: 65000,
    currentCount: 23,
    targetCount: 30,
  },
  {
    id: 'it_sw',
    name: '소프트웨어학부',
    category: '단과대학(과잠)',
    group: 'IT대학',
    bodyColor: '#142a4a', // 로얄 딥블루
    sleeveColor: '#f8fafc',
    ribColor: '#2563eb',
    logoText: 'SSU SW',
    subLogoText: 'SOFTWARE ENG',
    basePrice: 65000,
    currentCount: 19,
    targetCount: 30,
  },
  {
    id: 'it_ai',
    name: 'AI융합학부',
    category: '단과대학(과잠)',
    group: 'IT대학',
    bodyColor: '#1e3050', // 딥 잉크블루
    sleeveColor: '#e2e8f0', // 실버 그레이
    ribColor: '#0ea5e9',
    logoText: 'SSU AI',
    subLogoText: 'AI CONVERGENCE',
    basePrice: 65000,
    currentCount: 25,
    targetCount: 30,
  },
  {
    id: 'it_ece',
    name: '전자정보공학부',
    category: '단과대학(과잠)',
    group: 'IT대학',
    bodyColor: '#16233b', // 미드나잇 블루
    sleeveColor: '#ffffff',
    ribColor: '#f59e0b',
    logoText: 'SSU ECE',
    subLogoText: 'ELECTRONIC & INFO',
    basePrice: 65000,
    currentCount: 18,
    targetCount: 30,
  },
  {
    id: 'it_gmedia',
    name: '글로벌미디어학부',
    category: '단과대학(과잠)',
    group: 'IT대학',
    bodyColor: '#2c3240', // 모던 슬레이트
    sleeveColor: '#ffffff',
    ribColor: '#8b5cf6',
    logoText: 'G-MEDIA',
    subLogoText: 'GLOBAL MEDIA',
    basePrice: 65000,
    currentCount: 21,
    targetCount: 30,
  },
  {
    id: 'it_mm',
    name: '미디어경영학과',
    category: '단과대학(과잠)',
    group: 'IT대학',
    bodyColor: '#203254', // 인디고 네이비
    sleeveColor: '#f1f5f9',
    ribColor: '#0284c7',
    logoText: 'SSU MM',
    subLogoText: 'MEDIA MGMT',
    basePrice: 65000,
    currentCount: 14,
    targetCount: 25,
  },

  // --- 2. 단과대학(과잠) : 공과대학 ---
  {
    id: 'eng_chem',
    name: '화학공학과',
    category: '단과대학(과잠)',
    group: '공과대학',
    bodyColor: '#153e35', // 에메랄드 딥그린
    sleeveColor: '#ffffff',
    ribColor: '#10b981',
    logoText: 'SSU CBE',
    subLogoText: 'CHEMICAL ENG',
    basePrice: 65000,
    currentCount: 22,
    targetCount: 30,
  },
  {
    id: 'eng_mech',
    name: '기계공학부',
    category: '단과대학(과잠)',
    group: '공과대학',
    bodyColor: '#1d2838', // 메탈릭 다크블루
    sleeveColor: '#ffffff',
    ribColor: '#64748b',
    logoText: 'SSU MECH',
    subLogoText: 'MECHANICAL ENG',
    basePrice: 65000,
    currentCount: 26,
    targetCount: 30,
  },
  {
    id: 'eng_mse',
    name: '신소재공학과',
    category: '단과대학(과잠)',
    group: '공과대학',
    bodyColor: '#282b34', // 티타늄 차콜
    sleeveColor: '#e2e8f0',
    ribColor: '#94a3b8',
    logoText: 'SSU MSE',
    subLogoText: 'MATERIALS SCI',
    basePrice: 65000,
    currentCount: 17,
    targetCount: 25,
  },
  {
    id: 'eng_ee',
    name: '전기공학부',
    category: '단과대학(과잠)',
    group: '공과대학',
    bodyColor: '#172e54', // 딥 네이비
    sleeveColor: '#ffffff',
    ribColor: '#eab308',
    logoText: 'SSU EE',
    subLogoText: 'ELECTRICAL ENG',
    basePrice: 65000,
    currentCount: 20,
    targetCount: 30,
  },
  {
    id: 'eng_arch',
    name: '건축학부',
    category: '단과대학(과잠)',
    group: '공과대학',
    bodyColor: '#363942', // 모던 콘크리트 그레이
    sleeveColor: '#1c1e24', // 블랙 소매
    ribColor: '#71717a',
    logoText: 'SSU ARCH',
    subLogoText: 'ARCHITECTURE',
    basePrice: 65000,
    currentCount: 29,
    targetCount: 30,
  },
  {
    id: 'eng_ise',
    name: '산업·정보시스템공학과',
    category: '단과대학(과잠)',
    group: '공과대학',
    bodyColor: '#1d3356', // 딥 사파이어
    sleeveColor: '#ffffff',
    ribColor: '#38bdf8',
    logoText: 'SSU ISE',
    subLogoText: 'IND & SYSTEM ENG',
    basePrice: 65000,
    currentCount: 16,
    targetCount: 25,
  },

  // --- 2. 단과대학(과잠) : 경영대학 ---
  {
    id: 'biz_biz',
    name: '경영학부',
    category: '단과대학(과잠)',
    group: '경영대학',
    bodyColor: '#1a325e', // 클래식 네이비
    sleeveColor: '#fffbeb', // 웜 아이보리
    ribColor: '#d97706',
    logoText: 'SSU BIZ',
    subLogoText: 'BUSINESS SCHOOL',
    basePrice: 65000,
    currentCount: 32,
    targetCount: 30, // 이미 초과 달성 예시
  },
  {
    id: 'biz_venture',
    name: '벤처중소기업학과',
    category: '단과대학(과잠)',
    group: '경영대학',
    bodyColor: '#4a1525', // 딥 버건디/와인
    sleeveColor: '#ffffff',
    ribColor: '#f43f5e',
    logoText: 'SSU VENTURE',
    subLogoText: 'ENTREPRENEURSHIP',
    basePrice: 65000,
    currentCount: 21,
    targetCount: 25,
  },
  {
    id: 'biz_acct',
    name: '회계학과',
    category: '단과대학(과잠)',
    group: '경영대학',
    bodyColor: '#1e293b', // 차분한 네이비슬레이트
    sleeveColor: '#ffffff',
    ribColor: '#64748b',
    logoText: 'SSU ACCT',
    subLogoText: 'ACCOUNTING',
    basePrice: 65000,
    currentCount: 15,
    targetCount: 25,
  },
  {
    id: 'biz_fin',
    name: '금융학부',
    category: '단과대학(과잠)',
    group: '경영대학',
    bodyColor: '#162b4d', // 딥 뱅커블루
    sleeveColor: '#fef3c7', // 샴페인 골드
    ribColor: '#ca8a04',
    logoText: 'SSU FINANCE',
    subLogoText: 'GLOBAL FINANCE',
    basePrice: 65000,
    currentCount: 24,
    targetCount: 30,
  },

  // --- 2. 단과대학(과잠) : 법과대학 ---
  {
    id: 'law_law',
    name: '법학과',
    category: '단과대학(과잠)',
    group: '법과대학',
    bodyColor: '#3c1824', // 버건디 옥스포드
    sleeveColor: '#ffffff',
    ribColor: '#b91c1c',
    logoText: 'SSU LAW',
    subLogoText: 'COLLEGE OF LAW',
    basePrice: 65000,
    currentCount: 19,
    targetCount: 25,
  },
  {
    id: 'law_ilaw',
    name: '국제법무학과',
    category: '단과대학(과잠)',
    group: '법과대학',
    bodyColor: '#1a2b4c', // 인터내셔널 네이비
    sleeveColor: '#f1f5f9',
    ribColor: '#2563eb',
    logoText: 'SSU I-LAW',
    subLogoText: 'INTL LEGAL STUDIES',
    basePrice: 65000,
    currentCount: 13,
    targetCount: 20,
  },

  // --- 2. 단과대학(과잠) : 인문대학 ---
  {
    id: 'hum_kor',
    name: '국어국문학과',
    category: '단과대학(과잠)',
    group: '인문대학',
    bodyColor: '#2d251e', // 앤틱 딥우드
    sleeveColor: '#fafaf9',
    ribColor: '#78716c',
    logoText: 'SSU KOR',
    subLogoText: 'KOREAN LIT',
    basePrice: 65000,
    currentCount: 18,
    targetCount: 25,
  },
  {
    id: 'hum_eng',
    name: '영어영문학과',
    category: '단과대학(과잠)',
    group: '인문대학',
    bodyColor: '#17362d', // 브리티시 딥그린
    sleeveColor: '#ffffff',
    ribColor: '#059669',
    logoText: 'SSU ENG',
    subLogoText: 'ENGLISH LIT',
    basePrice: 65000,
    currentCount: 23,
    targetCount: 30,
  },
  {
    id: 'hum_philo',
    name: '철학과',
    category: '단과대학(과잠)',
    group: '인문대학',
    bodyColor: '#2b2d35', // 사색의 차콜
    sleeveColor: '#e7e5e4',
    ribColor: '#57534e',
    logoText: 'SSU PHILO',
    subLogoText: 'PHILOSOPHY',
    basePrice: 65000,
    currentCount: 12,
    targetCount: 20,
  },
  {
    id: 'hum_hist',
    name: '사학과',
    category: '단과대학(과잠)',
    group: '인문대학',
    bodyColor: '#34261d', // 헤리티지 브라운
    sleeveColor: '#f5f5f4',
    ribColor: '#a8a29e',
    logoText: 'SSU HIST',
    subLogoText: 'DEPT OF HISTORY',
    basePrice: 65000,
    currentCount: 16,
    targetCount: 20,
  },

  // --- 2. 단과대학(과잠) : 자연과학대학 ---
  {
    id: 'sci_math',
    name: '수학과',
    category: '단과대학(과잠)',
    group: '자연과학대학',
    bodyColor: '#182b4a', // 딥 네이비
    sleeveColor: '#ffffff',
    ribColor: '#0284c7',
    logoText: 'SSU MATH',
    subLogoText: 'MATHEMATICS',
    basePrice: 65000,
    currentCount: 21,
    targetCount: 25,
  },
  {
    id: 'sci_phys',
    name: '물리학과',
    category: '단과대학(과잠)',
    group: '자연과학대학',
    bodyColor: '#121e33', // 딥 코스모스
    sleeveColor: '#e2e8f0',
    ribColor: '#6366f1',
    logoText: 'SSU PHYS',
    subLogoText: 'PHYSICS',
    basePrice: 65000,
    currentCount: 17,
    targetCount: 20,
  },
  {
    id: 'sci_chem',
    name: '화학과',
    category: '단과대학(과잠)',
    group: '자연과학대학',
    bodyColor: '#12382c', // 사이언스 그린
    sleeveColor: '#ffffff',
    ribColor: '#14b8a6',
    logoText: 'SSU CHEM',
    subLogoText: 'CHEMISTRY',
    basePrice: 65000,
    currentCount: 18,
    targetCount: 25,
  },
  {
    id: 'sci_bio',
    name: '의생명시스템학부',
    category: '단과대학(과잠)',
    group: '자연과학대학',
    bodyColor: '#153a42', // 바이오 딥틸
    sleeveColor: '#f0fdfa',
    ribColor: '#0d9488',
    logoText: 'SSU BIO',
    subLogoText: 'BIOMEDICAL SYS',
    basePrice: 65000,
    currentCount: 27,
    targetCount: 30,
  },

  // --- 2. 단과대학(과잠) : 사회과학대학 ---
  {
    id: 'soc_welfare',
    name: '사회복지학부',
    category: '단과대학(과잠)',
    group: '사회과학대학',
    bodyColor: '#1e3352', // 온화한 네이비
    sleeveColor: '#fef08a', // 따뜻한 버터아이보리
    ribColor: '#eab308',
    logoText: 'SSU SWF',
    subLogoText: 'SOCIAL WELFARE',
    basePrice: 65000,
    currentCount: 28,
    targetCount: 30,
  },
  {
    id: 'soc_pa',
    name: '행정학부',
    category: '단과대학(과잠)',
    group: '사회과학대학',
    bodyColor: '#1b2c4e', // 정통 네이비
    sleeveColor: '#ffffff',
    ribColor: '#3b82c4',
    logoText: 'SSU PA',
    subLogoText: 'PUBLIC ADMIN',
    basePrice: 65000,
    currentCount: 22,
    targetCount: 30,
  },
  {
    id: 'soc_comm',
    name: '언론홍보학과',
    category: '단과대학(과잠)',
    group: '사회과학대학',
    bodyColor: '#262444', // 딥 퍼플네이비
    sleeveColor: '#ffffff',
    ribColor: '#a855f7',
    logoText: 'SSU COMM',
    subLogoText: 'MEDIA & COMM',
    basePrice: 65000,
    currentCount: 24,
    targetCount: 30,
  },

  // --- 2. 단과대학(과잠) : 경제통상대학 ---
  {
    id: 'eco_econ',
    name: '경제학과',
    category: '단과대학(과잠)',
    group: '경제통상대학',
    bodyColor: '#172e50', // 딥 네이비
    sleeveColor: '#ffffff',
    ribColor: '#0284c7',
    logoText: 'SSU ECON',
    subLogoText: 'ECONOMICS',
    basePrice: 65000,
    currentCount: 27,
    targetCount: 30,
  },
  {
    id: 'eco_trade',
    name: '글로벌통상학과',
    category: '단과대학(과잠)',
    group: '경제통상대학',
    bodyColor: '#132845', // 오션 딥네이비
    sleeveColor: '#e0f2fe',
    ribColor: '#0ea5e9',
    logoText: 'SSU G-TRADE',
    subLogoText: 'GLOBAL COMMERCE',
    basePrice: 65000,
    currentCount: 25,
    targetCount: 30,
  },

  // --- 3. 동아리(동아리잠바) ---
  {
    id: 'club_yourssu',
    name: '유어슈 (YOURSSU)',
    category: '동아리(동아리잠바)',
    group: 'IT/학술 동아리',
    bodyColor: '#0051ff', // 유어슈 시그니처 일렉트릭 블루
    sleeveColor: '#ffffff',
    ribColor: '#0038b8',
    logoText: 'YOURSSU',
    subLogoText: 'IT PRODUCT TEAM',
    basePrice: 67000,
    currentCount: 28,
    targetCount: 30,
  },
  {
    id: 'club_sscc',
    name: 'SSCC (숭실 컴퓨터 연구회)',
    category: '동아리(동아리잠바)',
    group: 'IT/학술 동아리',
    bodyColor: '#0f172a', // 사이버 딥블랙
    sleeveColor: '#cbd5e1', // 쿨 실버
    ribColor: '#38bdf8',
    logoText: 'SSCC 1978',
    subLogoText: 'SINCE 1978',
    basePrice: 66000,
    currentCount: 22,
    targetCount: 25,
  },
  {
    id: 'club_dasom',
    name: '다솜 (DASOM - 컴퓨터학술)',
    category: '동아리(동아리잠바)',
    group: 'IT/학술 동아리',
    bodyColor: '#1c1b33', // 미드나잇 퍼플
    sleeveColor: '#ffffff',
    ribColor: '#818cf8',
    logoText: 'DASOM',
    subLogoText: 'COMP STUDY CLUB',
    basePrice: 65000,
    currentCount: 19,
    targetCount: 25,
  },
  {
    id: 'club_sso',
    name: '숭실 오케스트라 (SSO)',
    category: '동아리(동아리잠바)',
    group: '문화/예술 동아리',
    bodyColor: '#171717', // 클래식 콘서트 블랙
    sleeveColor: '#fdfbf7', // 크림 화이트
    ribColor: '#d4af37', // 골드 악센트
    logoText: 'SSU ORCH',
    subLogoText: 'ORCHESTRA',
    basePrice: 67000,
    currentCount: 26,
    targetCount: 30,
  },
  {
    id: 'club_baedari',
    name: '배다리 (로봇연구회)',
    category: '동아리(동아리잠바)',
    group: '공학/연구 동아리',
    bodyColor: '#262930', // 엔지니어링 메탈
    sleeveColor: '#94a3b8', // 스틸 그레이
    ribColor: '#f97316',
    logoText: 'BAEDARI',
    subLogoText: 'ROBOTICS CLUB',
    basePrice: 66000,
    currentCount: 16,
    targetCount: 20,
  },
  {
    id: 'club_cheer',
    name: '백마 응원단 (SSU CHEER)',
    category: '동아리(동아리잠바)',
    group: '응원/체육 동아리',
    bodyColor: '#1d3b75', // 숭실 백마 블루
    sleeveColor: '#ffffff',
    ribColor: '#f59e0b',
    logoText: 'SSU CHEER',
    subLogoText: 'BLUE PEGASUS',
    basePrice: 68000,
    currentCount: 25,
    targetCount: 25, // 목표 달성 상태
  },
];

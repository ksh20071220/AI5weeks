/**
 * ============================================================================
 * 숭실대학교 잠바 공동구매 플랫폼 (SSU Jamba Group Buy)
 * ============================================================================
 * 메인 애플리케이션 컴포넌트
 * - 숭실대학교 공식 컬러 시스템 (Navy #1f3a6e, SkyBlue #3b82c4, SoftBlue #f2f6fb)
 * - 4단계 순차적 카드 UI (최대 560px, 모바일 반응형)
 * - 실시간 SVG/CSS 잠바 커스터마이징 일러스트 미리보기
 * - 실시간 금액 계산 (천 단위 콤마 toLocaleString)
 * - 공구 진행률 바 및 목표 달성 시 공구 확정 배지
 * - 엄격한 유효성 검사 및 신청 내역 누적 관리
 * ============================================================================
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  AFFILIATION_DATA,
  JACKET_TYPES,
  SIZE_OPTIONS,
  ADDITIONAL_OPTIONS,
  type AffiliationItem,
  type JacketTypeOption,
} from './data/affiliationData';
import { JacketPreview } from './components/JacketPreview';

// 신청 내역 항목 타입 정의
interface ApplicationRecord {
  id: string;
  applicantName: string;
  studentId: string;
  phone: string;
  affiliationName: string;
  jacketTypeName: string;
  size: string;
  selectedOptionsText: string;
  quantity: number;
  totalPrice: number;
  requestNote: string;
  createdAt: string;
}

export default function App() {
  // --------------------------------------------------------------------------
  // 1. 소속 3단계 연동 드롭다운 상태
  // --------------------------------------------------------------------------
  // 대분류 목록 추출 ('학교 공용', '단과대학(과잠)', '동아리(동아리잠바)')
  const categoryList = useMemo(() => {
    return Array.from(new Set(AFFILIATION_DATA.map((item) => item.category)));
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>('단과대학(과잠)');

  // 중분류 목록 (선택한 대분류에 해당하는 단과대학/그룹)
  const groupList = useMemo(() => {
    return Array.from(
      new Set(
        AFFILIATION_DATA.filter((item) => item.category === selectedCategory).map(
          (item) => item.group
        )
      )
    );
  }, [selectedCategory]);

  const [selectedGroup, setSelectedGroup] = useState<string>('IT대학');

  // 소분류/세부 목록 (선택한 중분류에 속하는 학과/동아리)
  const subitemList = useMemo(() => {
    return AFFILIATION_DATA.filter(
      (item) => item.category === selectedCategory && item.group === selectedGroup
    );
  }, [selectedCategory, selectedGroup]);

  // 선택된 세부 소속 항목 ID (초기값: 컴퓨터학부)
  const [selectedItemId, setSelectedItemId] = useState<string>('it_cse');

  // 대분류 변경 핸들러
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value;
    setSelectedCategory(newCat);
    const availableGroups = Array.from(
      new Set(AFFILIATION_DATA.filter((item) => item.category === newCat).map((i) => i.group))
    );
    const nextGroup = availableGroups[0] || '';
    setSelectedGroup(nextGroup);
    const availableItems = AFFILIATION_DATA.filter(
      (item) => item.category === newCat && item.group === nextGroup
    );
    setSelectedItemId(availableItems[0]?.id || '');
  };

  // 중분류 변경 핸들러
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGroup = e.target.value;
    setSelectedGroup(newGroup);
    const availableItems = AFFILIATION_DATA.filter(
      (item) => item.category === selectedCategory && item.group === newGroup
    );
    setSelectedItemId(availableItems[0]?.id || '');
  };

  // 세부 항목 변경 핸들러
  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedItemId(e.target.value);
  };

  // --------------------------------------------------------------------------
  // 2. 공동구매 참여 인원 실시간 카운트 관리 (동적 상태)
  // --------------------------------------------------------------------------
  const [groupBuyCounts, setGroupBuyCounts] = useState<{ [id: string]: number }>(() => {
    const initialMap: { [id: string]: number } = {};
    AFFILIATION_DATA.forEach((item) => {
      initialMap[item.id] = item.currentCount;
    });
    return initialMap;
  });

  // 현재 선택된 소속 정보
  const currentAffiliation: AffiliationItem = useMemo(() => {
    const found = AFFILIATION_DATA.find((item) => item.id === selectedItemId);
    if (found) {
      return {
        ...found,
        currentCount: groupBuyCounts[found.id] ?? found.currentCount,
      };
    }
    return {
      ...AFFILIATION_DATA[0],
      currentCount: groupBuyCounts[AFFILIATION_DATA[0].id] ?? AFFILIATION_DATA[0].currentCount,
    };
  }, [selectedItemId, groupBuyCounts]);

  // --------------------------------------------------------------------------
  // 3. 잠바 종류, 사이즈, 추가 옵션, 수량 상태
  // --------------------------------------------------------------------------
  const [selectedJacketTypeId, setSelectedJacketTypeId] = useState<string>('baseball');
  const [selectedSizeId, setSelectedSizeId] = useState<string>('M'); // 기본값 M
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  // --------------------------------------------------------------------------
  // 4. 신청자 개인정보 및 요청사항
  // --------------------------------------------------------------------------
  const [name, setName] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [requestNote, setRequestNote] = useState<string>('');

  // 알림 및 성공 메시지 상태
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 내 신청 내역 목록
  const [myApplications, setMyApplications] = useState<ApplicationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ssu_jamba_orders');
      if (saved) return JSON.parse(saved);
    } catch {
      // 로컬스토리지 접근 제한 시 무시
    }
    return [];
  });

  // 신청 내역 저장
  useEffect(() => {
    try {
      localStorage.setItem('ssu_jamba_orders', JSON.stringify(myApplications));
    } catch {
      // ignore
    }
  }, [myApplications]);

  // --------------------------------------------------------------------------
  // 5. 실시간 예상 금액 계산 (단가 + 변동액 + 옵션) * 수량
  // --------------------------------------------------------------------------
  const currentJacketType = useMemo(() => {
    return JACKET_TYPES.find((j) => j.id === selectedJacketTypeId) || JACKET_TYPES[0];
  }, [selectedJacketTypeId]);

  const currentSizeOption = useMemo(() => {
    return SIZE_OPTIONS.find((s) => s.id === selectedSizeId) || SIZE_OPTIONS[1];
  }, [selectedSizeId]);

  // 추가 옵션별 합계
  const optionsPriceTotal = useMemo(() => {
    return selectedOptions.reduce((sum, optId) => {
      const opt = ADDITIONAL_OPTIONS.find((o) => o.id === optId);
      return sum + (opt ? opt.price : 0);
    }, 0);
  }, [selectedOptions]);

  // 1벌당 단가
  const unitPrice = useMemo(() => {
    return (
      currentAffiliation.basePrice +
      currentJacketType.priceDelta +
      currentSizeOption.priceDelta +
      optionsPriceTotal
    );
  }, [currentAffiliation, currentJacketType, currentSizeOption, optionsPriceTotal]);

  // 총 예상 금액
  const totalPrice = useMemo(() => {
    return Math.max(0, unitPrice * quantity);
  }, [unitPrice, quantity]);

  // 추가 옵션 토글 핸들러
  const handleToggleOption = (optId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
    );
  };

  // --------------------------------------------------------------------------
  // 6. 신청하기 유효성 검사 및 접수 처리
  // --------------------------------------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1) 이름 필수 체크
    if (!name.trim()) {
      setFormError('이름을 입력해주세요');
      const nameInput = document.getElementById('applicant-name');
      nameInput?.focus();
      return;
    }

    // 2) 학번 8자리 숫자 체크
    const cleanStudentId = studentId.trim();
    const isEightDigits = /^\d{8}$/.test(cleanStudentId);
    if (!isEightDigits) {
      setFormError('학번을 올바르게 입력해주세요 (숫자 8자리)');
      const sidInput = document.getElementById('applicant-sid');
      sidInput?.focus();
      return;
    }

    // 3) 소속 선택 여부 확인
    if (!selectedItemId) {
      setFormError('소속을 선택해주세요');
      const itemSelect = document.getElementById('select-subitem');
      itemSelect?.focus();
      return;
    }

    // 선택된 옵션 명칭 텍스트 포맷 (예: "(이름 자수, 학번 자수)")
    const selectedOptionNames = selectedOptions
      .map((optId) => ADDITIONAL_OPTIONS.find((o) => o.id === optId)?.name)
      .filter(Boolean);
    const optionsText =
      selectedOptionNames.length > 0 ? ` (${selectedOptionNames.join(', ')})` : '';

    // 정상 접수 확인 메시지
    // 형식: "홍길동님, 컴퓨터학부 과잠 M사이즈 (이름 자수) 1벌, 총 68,000원 신청이 접수되었습니다!"
    const formattedPriceStr = totalPrice.toLocaleString('ko-KR');
    const confirmationText = `${name.trim()}님, ${currentAffiliation.name} ${currentJacketType.name} ${selectedSizeId}사이즈${optionsText} ${quantity}벌, 총 ${formattedPriceStr}원 신청이 접수되었습니다!`;
    setSuccessMessage(confirmationText);

    // 공구 참여 인원 증가
    setGroupBuyCounts((prev) => ({
      ...prev,
      [currentAffiliation.id]: (prev[currentAffiliation.id] || currentAffiliation.currentCount) + quantity,
    }));

    // 신청 내역에 추가
    const newRecord: ApplicationRecord = {
      id: 'ORDER_' + Date.now(),
      applicantName: name.trim(),
      studentId: cleanStudentId,
      phone: phone.trim() || '미기재',
      affiliationName: currentAffiliation.name,
      jacketTypeName: currentJacketType.name,
      size: selectedSizeId,
      selectedOptionsText: selectedOptionNames.length > 0 ? selectedOptionNames.join(', ') : '없음',
      quantity,
      totalPrice,
      requestNote: requestNote.trim() || '없음',
      createdAt: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMyApplications((prev) => [newRecord, ...prev]);

    // 성공 메시지 영역으로 부드럽게 스크롤
    setTimeout(() => {
      document.getElementById('confirmation-message-box')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // --------------------------------------------------------------------------
  // 7. 다시 작성 버튼 (모든 입력, 미리보기, 금액 초기화)
  // --------------------------------------------------------------------------
  const handleReset = () => {
    setSelectedCategory('단과대학(과잠)');
    setSelectedGroup('IT대학');
    setSelectedItemId('it_cse');
    setSelectedJacketTypeId('baseball');
    setSelectedSizeId('M');
    setSelectedOptions([]);
    setQuantity(1);
    setName('');
    setStudentId('');
    setPhone('');
    setRequestNote('');
    setFormError(null);
    setSuccessMessage(null);
  };

  // 신청 내역 개별 취소/삭제 핸들러
  const handleDeleteApplication = (recordId: string, affiliationId: string, recordQty: number) => {
    if (window.confirm('이 신청 내역을 취소하시겠습니까?')) {
      setMyApplications((prev) => prev.filter((item) => item.id !== recordId));
      // 공동구매 인원 복구
      setGroupBuyCounts((prev) => ({
        ...prev,
        [affiliationId]: Math.max(0, (prev[affiliationId] || 0) - recordQty),
      }));
    }
  };

  // 공구 진행률 및 목표 달성 여부
  const progressRatio = Math.min(
    100,
    Math.round((currentAffiliation.currentCount / currentAffiliation.targetCount) * 100)
  );
  const isTargetAchieved = currentAffiliation.currentCount >= currentAffiliation.targetCount;

  // HTML 한 파일(HTML+CSS+JS) 다운로드 및 복사 모달 상태
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const handleDownloadHtml = () => {
    const link = document.createElement('a');
    link.href = '/soongsil-jamba.html';
    link.download = 'soongsil-jamba.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyHtml = async () => {
    try {
      const res = await fetch('/soongsil-jamba.html');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    } catch {
      alert('클립보드 복사 중 오류가 발생했습니다. 직접 다운로드 버튼을 이용해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f6fb] py-6 px-3 sm:px-4 text-[#1e293b] flex flex-col items-center">
      {/* 560px 최대 너비 중앙 정렬 메인 래퍼 */}
      <main className="w-full max-w-[560px] flex flex-col gap-4">
        
        {/* =================================================================== */}
        {/* 페이지 상단 헤더 */}
        {/* =================================================================== */}
        <header className="text-center pt-2 pb-1 relative">
          <div className="text-4xl sm:text-5xl mb-2 select-none" role="img" aria-label="잠바 아이콘">
            🧥
          </div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-[#1f3a6e] tracking-tight">
            숭실 잠바 공구
          </h1>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            우리 소속의 잠바, 함께 모아 더 저렴하게
          </p>

          <div className="mt-2.5 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-[#1f3a6e]">숭실대학교 1897</span>
            <span>·</span>
            <span>과잠 · 돕바 · 동아리잠바</span>
            <span>·</span>
            <span className="text-[#3b82c4] font-medium">공동구매 특가</span>
          </div>

          {/* HTML 단일 파일 다운로드 / 복사 버튼 */}
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => setIsHtmlModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#3b82c4]/40 text-[#1f3a6e] text-xs font-semibold hover:bg-blue-50 transition-colors shadow-xs cursor-pointer"
            >
              <span>📄 HTML 한 파일(HTML+CSS+JS) 다운로드 / 복사</span>
            </button>
          </div>
        </header>

        {/* 폼 전체 감싸기 */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

          {/* =================================================================== */}
          {/* [1단계 카드] 소속 선택 및 실시간 디자인 미리보기 */}
          {/* =================================================================== */}
          <section className="app-card p-4 sm:p-5">
            {/* 단계 번호 및 제목 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1f3a6e] text-white text-xs font-bold">
                1
              </span>
              <h2 className="text-base font-bold text-[#1f3a6e]">
                소속 선택 & 디자인 미리보기
              </h2>
            </div>

            {/* 3단계 연동 드롭다운: 분류 → 소속 → 세부 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
              {/* 1) 분류 선택 */}
              <div>
                <label
                  htmlFor="select-category"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  분류 <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-category"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="form-select text-xs font-medium cursor-pointer"
                >
                  {categoryList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2) 소속/단과대 선택 */}
              <div>
                <label
                  htmlFor="select-group"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  소속/단과대 <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-group"
                  value={selectedGroup}
                  onChange={handleGroupChange}
                  className="form-select text-xs font-medium cursor-pointer"
                >
                  {groupList.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3) 세부 학과/동아리 선택 */}
              <div>
                <label
                  htmlFor="select-subitem"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  세부 전공/동아리 <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-subitem"
                  value={selectedItemId}
                  onChange={handleItemChange}
                  className="form-select text-xs font-medium cursor-pointer"
                >
                  {subitemList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 공동구매 현황 프로그레스 바 카드 */}
            <div className="p-3 mb-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>{currentAffiliation.name} 공구 현황</span>
                  {isTargetAchieved && (
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                      🎉 공구 확정!
                    </span>
                  )}
                </span>
                <span className="text-slate-600 font-semibold tabular-nums">
                  현재 <strong className="text-[#1f3a6e]">{currentAffiliation.currentCount}명</strong> / 목표 {currentAffiliation.targetCount}명
                </span>
              </div>

              {/* 스카이블루 진행률 바 */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3b82c4] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressRatio}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>달성률 {progressRatio}%</span>
                <span>
                  {isTargetAchieved
                    ? '목표 인원을 채워 제작이 확정되었습니다!'
                    : `목표까지 ${currentAffiliation.targetCount - currentAffiliation.currentCount}명 남음`}
                </span>
              </div>
            </div>

            {/* 실시간 CSS/SVG 일러스트 디자인 미리보기 */}
            <JacketPreview
              affiliation={currentAffiliation}
              jacketType={currentJacketType}
              size={selectedSizeId}
              hasNameEmbroidery={selectedOptions.includes('name_embroidery')}
              hasSidEmbroidery={selectedOptions.includes('sid_embroidery')}
              hasPatch={selectedOptions.includes('sleeve_patch')}
              hasFleece={selectedOptions.includes('fleece_lining')}
              applicantName={name}
              studentId={studentId}
            />
          </section>

          {/* =================================================================== */}
          {/* [2단계 카드] 잠바 종류 및 사이즈 선택 */}
          {/* =================================================================== */}
          <section className="app-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1f3a6e] text-white text-xs font-bold">
                2
              </span>
              <h2 className="text-base font-bold text-[#1f3a6e]">
                잠바 종류 & 사이즈 선택
              </h2>
            </div>

            {/* 잠바 종류 (라디오 버튼, 가로 배치) */}
            <fieldset className="mb-4">
              <legend className="text-xs font-semibold text-slate-700 mb-2">
                잠바 종류 <span className="text-rose-500">*</span>
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {JACKET_TYPES.map((type) => {
                  const isChecked = selectedJacketTypeId === type.id;
                  const deltaText =
                    type.priceDelta === 0
                      ? '기본가'
                      : type.priceDelta > 0
                      ? `+${type.priceDelta.toLocaleString()}원`
                      : `${type.priceDelta.toLocaleString()}원`;

                  return (
                    <label
                      key={type.id}
                      htmlFor={`jacket-type-${type.id}`}
                      className={`relative flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#1f3a6e] bg-[#f0f5fc] text-[#1f3a6e] ring-1 ring-[#1f3a6e]'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`jacket-type-${type.id}`}
                          name="jacket-type"
                          value={type.id}
                          checked={isChecked}
                          onChange={() => setSelectedJacketTypeId(type.id)}
                          className="w-4 h-4 text-[#1f3a6e] focus:ring-[#3b82c4]"
                        />
                        <span className="text-xs font-bold">{type.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {deltaText}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* 사이즈 (라디오 버튼, 가로 배치) */}
            <fieldset>
              <legend className="text-xs font-semibold text-slate-700 mb-2">
                사이즈 <span className="text-rose-500">*</span>
              </legend>
              <div className="grid grid-cols-5 gap-1.5">
                {SIZE_OPTIONS.map((size) => {
                  const isChecked = selectedSizeId === size.id;
                  const deltaText =
                    size.priceDelta > 0 ? `+${size.priceDelta.toLocaleString()}` : '';

                  return (
                    <label
                      key={size.id}
                      htmlFor={`size-option-${size.id}`}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer text-center transition-all ${
                        isChecked
                          ? 'border-[#1f3a6e] bg-[#1f3a6e] text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        id={`size-option-${size.id}`}
                        name="size-option"
                        value={size.id}
                        checked={isChecked}
                        onChange={() => setSelectedSizeId(size.id)}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold">{size.name}</span>
                      {deltaText && (
                        <span
                          className={`text-[10px] mt-0.5 ${
                            isChecked ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {deltaText}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </section>

          {/* =================================================================== */}
          {/* [3단계 카드] 추가 옵션 및 수량 */}
          {/* =================================================================== */}
          <section className="app-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1f3a6e] text-white text-xs font-bold">
                3
              </span>
              <h2 className="text-base font-bold text-[#1f3a6e]">
                추가 옵션 & 수량
              </h2>
            </div>

            {/* 추가 옵션 (체크박스, 가로 배치) */}
            <fieldset className="mb-4">
              <legend className="text-xs font-semibold text-slate-700 mb-2">
                추가 자수 및 디테일 옵션 (복수 선택 가능)
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ADDITIONAL_OPTIONS.map((opt) => {
                  const isChecked = selectedOptions.includes(opt.id);

                  return (
                    <label
                      key={opt.id}
                      htmlFor={`custom-opt-${opt.id}`}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#3b82c4] bg-[#f0f7ff] text-[#1f3a6e]'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`custom-opt-${opt.id}`}
                          checked={isChecked}
                          onChange={() => handleToggleOption(opt.id)}
                          className="w-4 h-4 rounded text-[#1f3a6e] focus:ring-[#3b82c4] cursor-pointer"
                        />
                        <span className="text-xs font-bold">{opt.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[#3b82c4]">
                        +{opt.price.toLocaleString()}원
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* 수량 선택 (number 타입, 최소 1, 최대 5, 기본값 1) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label
                  htmlFor="order-quantity"
                  className="block text-xs font-bold text-slate-800"
                >
                  주문 수량 <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  1인당 최대 5벌까지 신청 가능합니다.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center transition-colors"
                  aria-label="수량 감소"
                >
                  -
                </button>
                <input
                  type="number"
                  id="order-quantity"
                  min="1"
                  max="5"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val)) setQuantity(1);
                    else setQuantity(Math.min(5, Math.max(1, val)));
                  }}
                  className="w-12 text-center py-1 text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-[#1f3a6e] focus:ring-2 focus:ring-[#3b82c4]/20 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(5, q + 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center transition-colors"
                  aria-label="수량 증가"
                >
                  +
                </button>
              </div>
            </div>
          </section>

          {/* =================================================================== */}
          {/* [4단계 카드] 신청자 정보 및 최종 신청 */}
          {/* =================================================================== */}
          <section className="app-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1f3a6e] text-white text-xs font-bold">
                4
              </span>
              <h2 className="text-base font-bold text-[#1f3a6e]">
                신청자 정보 & 주문 확정
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {/* 1. 이름 (필수, text) */}
              <div>
                <label
                  htmlFor="applicant-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="applicant-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="예: 홍길동"
                  className="form-input"
                  required
                />
              </div>

              {/* 2. 학번 (필수, text, 숫자 8자리) */}
              <div>
                <label
                  htmlFor="applicant-sid"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  학번 <span className="text-rose-500">*</span>{' '}
                  <span className="text-[11px] text-slate-400 font-normal">
                    (숫자 8자리 입력, 예: 20241234)
                  </span>
                </label>
                <input
                  type="text"
                  id="applicant-sid"
                  maxLength={8}
                  value={studentId}
                  onChange={(e) => {
                    // 숫자만 허용
                    const filtered = e.target.value.replace(/[^0-9]/g, '');
                    setStudentId(filtered);
                    if (formError) setFormError(null);
                  }}
                  placeholder="20240000"
                  className="form-input"
                  required
                />
              </div>

              {/* 3. 전화번호 (tel) */}
              <div>
                <label
                  htmlFor="applicant-phone"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  전화번호{' '}
                  <span className="text-[11px] text-slate-400 font-normal">
                    (공구 수령 안내 문자 발송용)
                  </span>
                </label>
                <input
                  type="tel"
                  id="applicant-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className="form-input"
                />
              </div>

              {/* 4. 요청사항 (textarea) */}
              <div>
                <label
                  htmlFor="applicant-note"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  요청사항
                </label>
                <textarea
                  id="applicant-note"
                  rows={2}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="특이사항(예: 소매 길이 조절 요청, 영문 이니셜 표기 등)이 있으시면 적어주세요."
                  className="form-textarea"
                />
              </div>
            </div>

            {/* 에러 메시지 알림 박스 */}
            {formError && (
              <div
                role="alert"
                className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2"
              >
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {/* =============================================================== */}
            {/* 예상 금액 표시 영역: 신청하기 버튼 바로 위에 큰 글씨 (24px, 네이비, 굵게, 가운데) */}
            {/* =============================================================== */}
            <div className="mt-5 pt-4 border-t border-slate-200 text-center">
              <span className="text-xs font-medium text-slate-500 block mb-1">
                실시간 주문 금액 산출
              </span>
              <div className="text-[24px] font-bold text-[#1f3a6e] tracking-tight">
                예상 금액: {totalPrice.toLocaleString('ko-KR')}원
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                (기본단가 {currentAffiliation.basePrice.toLocaleString()}원 + 옵션 변동 포함) × {quantity}벌
              </div>
            </div>

            {/* 버튼 영역: 신청하기 & 다시 작성 */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-lg bg-[#1f3a6e] text-white font-bold text-sm hover:bg-[#284988] active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>공동구매 신청하기</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="py-3 px-4 rounded-lg bg-slate-100 text-slate-600 font-semibold text-xs hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
              >
                다시 작성
              </button>
            </div>
          </section>
        </form>

        {/* =================================================================== */}
        {/* 신청 완료 메시지 박스 (연두색 배경, 초록 글씨, 둥근 모서리) */}
        {/* =================================================================== */}
        {successMessage && (
          <div
            id="confirmation-message-box"
            role="status"
            className="p-4 rounded-[14px] bg-[#eafaf1] border border-[#a3e9c0] text-[#1e7e34] shadow-sm animate-fade-in"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-lg">✅</span>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-[#1e7e34] mb-0.5">
                  신청이 정상적으로 완료되었습니다!
                </h3>
                <p className="text-xs leading-relaxed font-medium">
                  {successMessage}
                </p>
                <div className="mt-2 text-[11px] text-[#2c974b] flex items-center gap-2">
                  <span>공구 최소 인원 달성 시 등록하신 연락처로 입금 계좌 및 상세 일정이 안내됩니다.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 화면 하단: 내 신청 내역 목록 카드 */}
        {/* =================================================================== */}
        <section className="app-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-[#1f3a6e]">
                내 신청 내역
              </span>
              <span className="text-xs font-semibold text-[#3b82c4] tabular-nums">
                ({myApplications.length}건)
              </span>
            </div>
            {myApplications.length > 0 && (
              <span className="text-[11px] text-slate-400">
                실시간 브라우저 보관
              </span>
            )}
          </div>

          {myApplications.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs rounded-xl bg-slate-50 border border-dashed border-slate-200">
              아직 접수된 신청 내역이 없습니다.
              <br />
              위 신청서를 작성하여 공동구매에 참여해보세요!
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {myApplications.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/90 text-xs flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#1f3a6e]">{rec.affiliationName}</span>
                      <span>·</span>
                      <span>{rec.jacketTypeName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600">
                        {rec.size}
                      </span>
                    </div>
                    <span className="text-[#1f3a6e] font-bold text-sm tabular-nums">
                      {rec.totalPrice.toLocaleString()}원
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                    <div>신청자: <strong className="text-slate-700">{rec.applicantName}</strong> ({rec.studentId})</div>
                    <div>수량: <strong className="text-slate-700">{rec.quantity}벌</strong></div>
                    <div>추가 옵션: {rec.selectedOptionsText}</div>
                    <div>신청 일시: {rec.createdAt}</div>
                  </div>

                  {rec.requestNote !== '없음' && (
                    <div className="text-[11px] text-slate-500 bg-white/70 p-1.5 rounded border border-slate-200/60 mt-0.5">
                      요청: {rec.requestNote}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteApplication(rec.id, selectedItemId, rec.quantity)}
                      className="text-[11px] text-rose-500 hover:text-rose-700 underline font-medium cursor-pointer"
                    >
                      신청 취소
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 푸터 영역 */}
        <footer className="text-center text-[11px] text-slate-400 py-3 mb-4">
          <p>© 숭실대학교 총학생회 및 단과대학 연합 잠바 공동구매</p>
          <p className="mt-0.5">숭실대학교 공식 블루 톤 (#1f3a6e / #3b82c4 / #f2f6fb) 적용</p>
        </footer>

        {/* HTML 한 파일 모달 */}
        {isHtmlModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-[14px] shadow-2xl border border-slate-200 w-full max-w-[520px] p-5 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📄</span>
                  <h3 className="font-bold text-base text-[#1f3a6e]">
                    HTML 한 파일(HTML+CSS+JS) 내보내기
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHtmlModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                요청하신 스펙 그대로 <strong>HTML 한 파일 안에 CSS, 바닐라 JS, SVG 일러스트, 소속 데이터</strong>가 전부 포함되어 있어 브라우저에서 더블 클릭만으로 단독 실행됩니다.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-[#1f3a6e] text-white font-bold text-xs hover:bg-[#284988] transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>💾 단일 HTML 파일 다운로드</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyHtml}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-[#3b82c4] text-white font-bold text-xs hover:bg-[#2b6ba8] transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>{copiedHtml ? '✅ 복사 완료!' : '📋 HTML 전체 소스 복사'}</span>
                </button>

                <a
                  href="/soongsil-jamba.html"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer text-center"
                >
                  <span>새 창에서 열기 ↗</span>
                </a>
              </div>

              <div className="bg-slate-900 rounded-lg p-3 text-slate-200 font-mono text-[11px] overflow-auto flex-1 border border-slate-800">
                <div className="text-slate-400 text-[10px] mb-1.5 border-b border-slate-800 pb-1 flex justify-between">
                  <span>soongsil-jamba.html (단독 실행 가능 파일)</span>
                  <span>HTML5 / Pure Vanilla JS</span>
                </div>
                <pre className="text-slate-300 leading-tight">
{`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>숭실 잠바 공구 - 숭실대학교</title>
  <style>
    /* 숭실대 블루톤: #f2f6fb, #1f3a6e, #3b82c4 */
    ... (자체 내장 스타일 및 SVG 잠바 일러스트) ...
  </style>
</head>
<body>
  ... (소속 3단계 연동 드롭다운 & 실시간 계산) ...
  <script>
    // 외부 라이브러리 없이 바닐라 JS 100% 동작
    ...
  </script>
</body>
</html>`}
                </pre>
              </div>

              <div className="mt-3 pt-2 text-right border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHtmlModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

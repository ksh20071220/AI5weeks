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
 * - 학과 학생회 및 동아리 운영진용 각 잠바별 실시간 구매 집계 및 전문 엑셀(.xlsx) 대장 지원
 * - 완벽한 신청 취소 (모달 확인, 인원 즉시 차감, 로컬스토리지 동기화)
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
import {
  exportCouncilExecutiveExcel,
  exportSingleAffiliationExcel,
  type ExportApplicationItem,
} from './utils/excelExport';

// 신청 내역 항목 타입 정의 (엑셀 내보내기 항목 확장)
interface ApplicationRecord extends ExportApplicationItem {
  affiliationId: string;
  depositStatus: '미입금' | '입금완료';
  receivedStatus: '미수령' | '수령완료';
}

export default function App() {
  // --------------------------------------------------------------------------
  // 1. 소속 3단계 연동 드롭다운 상태
  // --------------------------------------------------------------------------
  // 대분류 목록 ('학교 공용', '단과대학(과잠)', '동아리(동아리잠바)')
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
  // 2. 전체 신청 내역 목록 (localStorage 보관 - 학생회·운영진 공용 데이터베이스)
  // --------------------------------------------------------------------------
  const [myApplications, setMyApplications] = useState<ApplicationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ssu_jamba_orders_v2');
      if (saved) return JSON.parse(saved);
      // 구 버전 마이그레이션 호환
      const oldSaved = localStorage.getItem('ssu_jamba_orders');
      if (oldSaved) {
        const parsed = JSON.parse(oldSaved);
        return parsed.map((item: any) => ({
          ...item,
          depositStatus: item.depositStatus || '미입금',
          receivedStatus: item.receivedStatus || '미수령',
        }));
      }
    } catch {
      // ignore
    }
    return [];
  });

  // 신청 내역 로컬스토리지 동기화
  useEffect(() => {
    try {
      localStorage.setItem('ssu_jamba_orders_v2', JSON.stringify(myApplications));
    } catch {
      // ignore
    }
  }, [myApplications]);

  // --------------------------------------------------------------------------
  // 3. 공동구매 참여 인원 실시간 카운트 관리 (더미 데이터 없이 실제 주문 수량만 집계)
  // --------------------------------------------------------------------------
  const groupBuyCounts = useMemo(() => {
    const map: { [id: string]: number } = {};
    AFFILIATION_DATA.forEach((item) => {
      map[item.id] = 0;
    });
    myApplications.forEach((app) => {
      const targetId = app.affiliationId || AFFILIATION_DATA.find((a) => a.name === app.affiliationName)?.id;
      if (targetId && map[targetId] !== undefined) {
        map[targetId] += app.quantity;
      }
    });
    return map;
  }, [myApplications]);

  // 현재 선택된 소속 정보 (실제 신청 인원 반영)
  const currentAffiliation: AffiliationItem = useMemo(() => {
    const found = AFFILIATION_DATA.find((item) => item.id === selectedItemId);
    const base = found || AFFILIATION_DATA[0];
    return {
      ...base,
      currentCount: groupBuyCounts[base.id] ?? 0,
    };
  }, [selectedItemId, groupBuyCounts]);

  // --------------------------------------------------------------------------
  // 4. 잠바 종류, 사이즈, 추가 옵션, 수량 상태
  // --------------------------------------------------------------------------
  const [selectedJacketTypeId, setSelectedJacketTypeId] = useState<string>('baseball');
  const [selectedSizeId, setSelectedSizeId] = useState<string>('M'); // 기본값 M
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  // --------------------------------------------------------------------------
  // 5. 신청자 개인정보 및 요청사항
  // --------------------------------------------------------------------------
  const [name, setName] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [requestNote, setRequestNote] = useState<string>('');

  // 폼 오류 및 제출 성공 메시지 상태
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [latestSubmittedRecord, setLatestSubmittedRecord] = useState<ApplicationRecord | null>(null);

  // 취소 확인 모달 대상 레코드
  const [cancelTargetRecord, setCancelTargetRecord] = useState<ApplicationRecord | null>(null);
  const [cancelToastMessage, setCancelToastMessage] = useState<string | null>(null);

  // 상단 탭 전환: 'apply' (공구 신청서 작성) vs 'executive' (학생회 & 동아리 운영진 관리 센터)
  const [viewTab, setViewTab] = useState<'apply' | 'executive'>('apply');

  // 학생회·운영진 모드 소속/잠바 선택 상태 및 검색어
  const [executiveSelectedJacketName, setExecutiveSelectedJacketName] = useState<string>('all');
  const [executiveSearchTerm, setExecutiveSearchTerm] = useState<string>('');

  // --------------------------------------------------------------------------
  // 6. 실시간 예상 금액 계산 (단가 + 변동액 + 옵션) * 수량
  // --------------------------------------------------------------------------
  const currentJacketType: JacketTypeOption = useMemo(() => {
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
  // 7. 신청하기 유효성 검사 및 접수 처리
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

    // 신청 내역 객체 생성 (입금 및 수령 기본값: 미입금, 미수령)
    const newRecord: ApplicationRecord = {
      id: 'SSU_' + Date.now().toString().slice(-6),
      applicantName: name.trim(),
      studentId: cleanStudentId,
      phone: phone.trim() || '미기재',
      category: selectedCategory,
      group: selectedGroup,
      affiliationId: currentAffiliation.id,
      affiliationName: currentAffiliation.name,
      jacketTypeName: currentJacketType.name,
      size: selectedSizeId,
      selectedOptionsText: selectedOptionNames.length > 0 ? selectedOptionNames.join(', ') : '없음',
      quantity,
      unitPrice,
      totalPrice,
      requestNote: requestNote.trim() || '없음',
      depositStatus: '미입금',
      receivedStatus: '미수령',
      createdAt: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setLatestSubmittedRecord(newRecord);
    setMyApplications((prev) => [newRecord, ...prev]);

    // 성공 메시지 영역으로 부드럽게 스크롤
    setTimeout(() => {
      document.getElementById('confirmation-message-box')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // --------------------------------------------------------------------------
  // 8. 다시 작성 버튼 (모든 입력, 미리보기, 금액 초기화)
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
    setLatestSubmittedRecord(null);
  };

  // --------------------------------------------------------------------------
  // 9. 확실한 신청 취소 실행 핸들러 (모달 확인 후 실행)
  // --------------------------------------------------------------------------
  const handleExecuteCancel = (recordId: string) => {
    const target = myApplications.find((a) => a.id === recordId);
    setMyApplications((prev) => prev.filter((item) => item.id !== recordId));
    setCancelTargetRecord(null);

    // 만약 방금 제출한 최신 건을 취소했다면 상단 성공 박스도 초기화
    if (latestSubmittedRecord && latestSubmittedRecord.id === recordId) {
      setSuccessMessage(null);
      setLatestSubmittedRecord(null);
    }

    setCancelToastMessage(
      target
        ? `${target.applicantName}님의 [${target.affiliationName} ${target.jacketTypeName}] 신청이 정상 취소되었습니다. (공구 인원 차감 완료)`
        : '신청 내역이 정상적으로 취소되었습니다.'
    );
    setTimeout(() => setCancelToastMessage(null), 4000);
  };

  // --------------------------------------------------------------------------
  // 10. 학생회·운영진 관리자 기능 (입금 확인 & 수령 확인 토글)
  // --------------------------------------------------------------------------
  const handleToggleDeposit = (recordId: string) => {
    setMyApplications((prev) =>
      prev.map((item) => {
        if (item.id === recordId) {
          const next = item.depositStatus === '입금완료' ? '미입금' : '입금완료';
          return { ...item, depositStatus: next };
        }
        return item;
      })
    );
  };

  const handleToggleReceived = (recordId: string) => {
    setMyApplications((prev) =>
      prev.map((item) => {
        if (item.id === recordId) {
          const next = item.receivedStatus === '수령완료' ? '미수령' : '수령완료';
          return { ...item, receivedStatus: next };
        }
        return item;
      })
    );
  };

  // --------------------------------------------------------------------------
  // 11. 운영진 테스트 지원: 샘플 주문 생성 및 전체 초기화
  // --------------------------------------------------------------------------
  const handleSeedSampleOrders = () => {
    const sampleSeeds: ApplicationRecord[] = [
      {
        id: 'SSU_TEST01',
        applicantName: '김숭실',
        studentId: '20231234',
        phone: '010-1234-5678',
        category: '단과대학(과잠)',
        group: 'IT대학',
        affiliationId: 'it_cse',
        affiliationName: '컴퓨터학부',
        jacketTypeName: '과잠(야구잠바)',
        size: 'L',
        selectedOptionsText: '이름 자수, 학번 자수',
        quantity: 1,
        unitPrice: 73000,
        totalPrice: 73000,
        requestNote: '오른쪽 팔에 23 학번 자수 부탁드립니다.',
        depositStatus: '입금완료',
        receivedStatus: '미수령',
        createdAt: '2026. 10. 01. 10:15',
      },
      {
        id: 'SSU_TEST02',
        applicantName: '이소프트',
        studentId: '20242468',
        phone: '010-2345-6789',
        category: '단과대학(과잠)',
        group: 'IT대학',
        affiliationId: 'it_cse',
        affiliationName: '컴퓨터학부',
        jacketTypeName: '과잠(야구잠바)',
        size: 'M',
        selectedOptionsText: '이름 자수',
        quantity: 2,
        unitPrice: 70000,
        totalPrice: 140000,
        requestNote: '친구와 함께 주문합니다.',
        depositStatus: '입금완료',
        receivedStatus: '수령완료',
        createdAt: '2026. 10. 01. 11:20',
      },
      {
        id: 'SSU_TEST03',
        applicantName: '박기계',
        studentId: '20223579',
        phone: '010-3456-7890',
        category: '단과대학(과잠)',
        group: '공과대학',
        affiliationId: 'eng_mech',
        affiliationName: '기계공학부',
        jacketTypeName: '과잠(야구잠바)',
        size: 'XL',
        selectedOptionsText: '기모 안감, 팔 로고 패치',
        quantity: 1,
        unitPrice: 71000,
        totalPrice: 71000,
        requestNote: '따뜻한 기모 안감 확인 부탁드립니다.',
        depositStatus: '미입금',
        receivedStatus: '미수령',
        createdAt: '2026. 10. 01. 12:05',
      },
      {
        id: 'SSU_TEST04',
        applicantName: '최유어',
        studentId: '20239999',
        phone: '010-9876-5432',
        category: '동아리(동아리잠바)',
        group: '중앙·IT동아리',
        affiliationId: 'club_yourssu',
        affiliationName: '유어슈 (YOURSSU)',
        jacketTypeName: '후드집업',
        size: 'M',
        selectedOptionsText: '이름 자수',
        quantity: 1,
        unitPrice: 65000,
        totalPrice: 65000,
        requestNote: '유어슈 백엔드팀입니다.',
        depositStatus: '입금완료',
        receivedStatus: '미수령',
        createdAt: '2026. 10. 01. 13:40',
      },
      {
        id: 'SSU_TEST05',
        applicantName: '정경영',
        studentId: '20241111',
        phone: '010-5555-6666',
        category: '단과대학(과잠)',
        group: '경영대학',
        affiliationId: 'biz_biz',
        affiliationName: '경영학부',
        jacketTypeName: '과잠(야구잠바)',
        size: 'S',
        selectedOptionsText: '없음',
        quantity: 1,
        unitPrice: 65000,
        totalPrice: 65000,
        requestNote: '없음',
        depositStatus: '미입금',
        receivedStatus: '미수령',
        createdAt: '2026. 10. 01. 14:10',
      },
      {
        id: 'SSU_TEST06',
        applicantName: '한숭실',
        studentId: '20210001',
        phone: '010-7777-8888',
        category: '학교 공용',
        group: '숭실대학교 전체',
        affiliationId: 'school_main',
        affiliationName: '숭실대 학교잠바 (기본형)',
        jacketTypeName: '과잠(야구잠바)',
        size: 'L',
        selectedOptionsText: '학번 자수',
        quantity: 1,
        unitPrice: 65000,
        totalPrice: 65000,
        requestNote: '졸업생 기념 구매입니다.',
        depositStatus: '입금완료',
        receivedStatus: '수령완료',
        createdAt: '2026. 10. 01. 15:30',
      },
    ];

    setMyApplications(sampleSeeds);
    setCancelToastMessage('운영진 검토를 위한 6건의 샘플 주문이 등록되었습니다. 잠바별 엑셀을 바로 확인하실 수 있습니다.');
    setTimeout(() => setCancelToastMessage(null), 3500);
  };

  const handleClearAllOrders = () => {
    if (myApplications.length === 0) return;
    setMyApplications([]);
    setSuccessMessage(null);
    setLatestSubmittedRecord(null);
    setCancelToastMessage('모든 신청 내역이 초기화되었습니다.');
    setTimeout(() => setCancelToastMessage(null), 2500);
  };

  // --------------------------------------------------------------------------
  // 12. 학생회·운영진 모드 데이터 파생 (선택된 잠바 기준 상세 통계 및 필터링)
  // --------------------------------------------------------------------------
  // 선택된 특정 잠바 정보 (all이 아닐 때)
  const executiveSelectedAffiliation = useMemo(() => {
    if (executiveSelectedJacketName === 'all') return null;
    return AFFILIATION_DATA.find((item) => item.name === executiveSelectedJacketName) || null;
  }, [executiveSelectedJacketName]);

  // 필터링된 구매자 명단 (운영진용)
  const filteredExecutiveApplications = useMemo(() => {
    return myApplications.filter((app) => {
      const matchAffiliation =
        executiveSelectedJacketName === 'all' || app.affiliationName === executiveSelectedJacketName;
      const matchSearch =
        !executiveSearchTerm.trim() ||
        app.applicantName.toLowerCase().includes(executiveSearchTerm.toLowerCase()) ||
        app.studentId.includes(executiveSearchTerm) ||
        app.phone.includes(executiveSearchTerm);
      return matchAffiliation && matchSearch;
    });
  }, [myApplications, executiveSelectedJacketName, executiveSearchTerm]);

  // 선택된 잠바의 사이즈별 주문 분포
  const selectedJacketSizeBreakdown = useMemo(() => {
    const list =
      executiveSelectedJacketName === 'all'
        ? myApplications
        : myApplications.filter((a) => a.affiliationName === executiveSelectedJacketName);

    const counts: { [s: string]: number } = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
    list.forEach((item) => {
      counts[item.size] = (counts[item.size] || 0) + item.quantity;
    });
    return counts;
  }, [myApplications, executiveSelectedJacketName]);

  // 선택된 잠바의 옵션별 주문 분포
  const selectedJacketOptionBreakdown = useMemo(() => {
    const list =
      executiveSelectedJacketName === 'all'
        ? myApplications
        : myApplications.filter((a) => a.affiliationName === executiveSelectedJacketName);

    let nameEmb = 0;
    let sidEmb = 0;
    let patch = 0;
    let fleece = 0;

    list.forEach((item) => {
      if (item.selectedOptionsText.includes('이름 자수')) nameEmb += item.quantity;
      if (item.selectedOptionsText.includes('학번 자수')) sidEmb += item.quantity;
      if (item.selectedOptionsText.includes('로고 패치')) patch += item.quantity;
      if (item.selectedOptionsText.includes('기모')) fleece += item.quantity;
    });

    return { nameEmb, sidEmb, patch, fleece };
  }, [myApplications, executiveSelectedJacketName]);

  // 공구 진행률 및 목표 달성 여부 (신청 폼 1단계용)
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
      // fallback
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

        {/* =================================================================== */}
        {/* 상단 탭 전환: [공구 신청서 작성 (학생용)] vs [학생회 & 운영진 구매관리 센터] */}
        {/* =================================================================== */}
        <div className="flex p-1 bg-slate-200/90 rounded-xl border border-slate-300 shadow-inner">
          <button
            type="button"
            onClick={() => setViewTab('apply')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewTab === 'apply'
                ? 'bg-white text-[#1f3a6e] shadow-sm'
                : 'text-slate-600 hover:text-[#1f3a6e]'
            }`}
          >
            <span>📝 공구 신청하기</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('executive')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewTab === 'executive'
                ? 'bg-[#1f3a6e] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#1f3a6e]'
            }`}
          >
            <span>📊 학생회·운영진 구매관리</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                viewTab === 'executive'
                  ? 'bg-white text-[#1f3a6e]'
                  : 'bg-slate-300 text-slate-700'
              }`}
            >
              {myApplications.length}건
            </span>
          </button>
        </div>

        {/* 상단 알림 토스트 (취소/안내 등) */}
        {cancelToastMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
            <span className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <span>{cancelToastMessage}</span>
            </span>
            <button
              type="button"
              onClick={() => setCancelToastMessage(null)}
              className="text-emerald-600 hover:text-emerald-950 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* 모드 1: 학생용 공구 신청서 작성 폼 */}
        {/* =================================================================== */}
        {viewTab === 'apply' ? (
          <>
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              
              {/* =============================================================== */}
              {/* [1단계 카드] 소속 선택 및 실시간 디자인 미리보기 */}
              {/* =============================================================== */}
              <section className="app-card p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="step-badge">1</span>
                  <h2 className="text-base font-bold text-[#1f3a6e]">
                    소속 선택 & 디자인 미리보기
                  </h2>
                </div>

                {/* 소속 선택: 3단계 연동 드롭다운 (분류 → 소속 → 세부) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                  <div>
                    <label htmlFor="select-category" className="field-label">
                      분류 <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-category"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      className="form-control text-xs"
                    >
                      {categoryList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="select-group" className="field-label">
                      소속 <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-group"
                      value={selectedGroup}
                      onChange={handleGroupChange}
                      className="form-control text-xs"
                    >
                      {groupList.map((grp) => (
                        <option key={grp} value={grp}>
                          {grp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="select-subitem" className="field-label">
                      세부 <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-subitem"
                      value={selectedItemId}
                      onChange={handleItemChange}
                      className="form-control text-xs"
                    >
                      {subitemList.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 공동구매 현황: 진행률 바(스카이블루), 현재 인원/목표 인원 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                    <span className="text-[#1f3a6e] flex items-center gap-1.5">
                      <span>{currentAffiliation.name} 공구 현황</span>
                      {isTargetAchieved && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-300">
                          공구 확정!
                        </span>
                      )}
                    </span>
                    <span className="text-slate-600 font-semibold tabular-nums">
                      현재 <strong className="text-[#3b82c4]">{currentAffiliation.currentCount}명</strong> / 목표 {currentAffiliation.targetCount}명
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3b82c4] rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progressRatio}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>진행률: {progressRatio}%</span>
                    <span>
                      {isTargetAchieved
                        ? '최소 제작 인원 달성완료'
                        : `확정까지 ${currentAffiliation.targetCount - currentAffiliation.currentCount}벌 남음`}
                    </span>
                  </div>
                </div>

                {/* 디자인 미리보기: CSS/SVG 잠바 일러스트 */}
                <div className="mt-2">
                  <span className="text-xs font-semibold text-slate-600 block mb-2">
                    실시간 잠바 디자인 미리보기
                  </span>
                  <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-inner bg-slate-50/50">
                    <JacketPreview
                      affiliation={currentAffiliation}
                      jacketType={currentJacketType}
                      size={selectedSizeId}
                      hasNameEmbroidery={selectedOptions.includes('opt_name')}
                      hasSidEmbroidery={selectedOptions.includes('opt_sid')}
                      hasPatch={selectedOptions.includes('opt_patch')}
                      hasFleece={selectedOptions.includes('opt_fleece')}
                      applicantName={name}
                      studentId={studentId}
                    />
                  </div>
                </div>
              </section>

              {/* =============================================================== */}
              {/* [2단계 카드] 잠바 종류, 사이즈, 추가 옵션, 수량 */}
              {/* =============================================================== */}
              <section className="app-card p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="step-badge">2</span>
                  <h2 className="text-base font-bold text-[#1f3a6e]">
                    종류 · 사이즈 · 옵션 선택
                  </h2>
                </div>

                {/* 5. 잠바 종류 (라디오 버튼, 가로 배치) */}
                <div className="mb-4">
                  <label className="field-label">
                    잠바 종류 <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {JACKET_TYPES.map((type) => {
                      const isSelected = selectedJacketTypeId === type.id;
                      return (
                        <label
                          key={type.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#1f3a6e] bg-blue-50/60 shadow-xs ring-1 ring-[#1f3a6e]'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="jacketType"
                              value={type.id}
                              checked={isSelected}
                              onChange={() => setSelectedJacketTypeId(type.id)}
                              className="accent-[#1f3a6e]"
                            />
                            <span className="font-semibold text-slate-800">{type.name}</span>
                          </div>
                          <span
                            className={`text-[11px] font-medium ${
                              type.priceDelta < 0
                                ? 'text-emerald-600'
                                : type.priceDelta > 0
                                ? 'text-rose-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {type.priceDelta === 0
                              ? '기본가'
                              : `${type.priceDelta > 0 ? '+' : ''}${type.priceDelta.toLocaleString()}원`}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 6. 사이즈 (라디오 버튼, 가로 배치) */}
                <div className="mb-4">
                  <label className="field-label">
                    사이즈 <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {SIZE_OPTIONS.map((sizeOpt) => {
                      const isSelected = selectedSizeId === sizeOpt.id;
                      return (
                        <label
                          key={sizeOpt.id}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#1f3a6e] bg-blue-50/70 shadow-xs ring-1 ring-[#1f3a6e]'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="jacketSize"
                            value={sizeOpt.id}
                            checked={isSelected}
                            onChange={() => setSelectedSizeId(sizeOpt.id)}
                            className="sr-only"
                          />
                          <span className="font-bold text-xs text-slate-800">{sizeOpt.id}</span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {sizeOpt.priceDelta > 0
                              ? `+${sizeOpt.priceDelta.toLocaleString()}원`
                              : '기본'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 7. 추가 옵션 (체크박스, 가로 배치) */}
                <div className="mb-4">
                  <label className="field-label">추가 옵션 (다중 선택 가능)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ADDITIONAL_OPTIONS.map((opt) => {
                      const isChecked = selectedOptions.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'border-[#1f3a6e] bg-blue-50/50 shadow-xs ring-1 ring-[#1f3a6e]'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleOption(opt.id)}
                              className="accent-[#1f3a6e] rounded"
                            />
                            <span className="font-medium text-slate-800">{opt.name}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-[#3b82c4]">
                            +{opt.price.toLocaleString()}원
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 8. 수량 (number 타입, 최소 1, 최대 5, 기본값 1) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="jacket-quantity" className="field-label mb-0">
                      수량 <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">1벌 ~ 최대 5벌</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      id="jacket-quantity"
                      type="number"
                      min={1}
                      max={5}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setQuantity(Math.min(5, Math.max(1, val)));
                        }
                      }}
                      className="form-control text-center font-bold text-base flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(5, q + 1))}
                      className="w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </section>

              {/* =============================================================== */}
              {/* [3단계 카드] 신청자 정보 입력 */}
              {/* =============================================================== */}
              <section className="app-card p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="step-badge">3</span>
                  <h2 className="text-base font-bold text-[#1f3a6e]">
                    신청자 인적사항
                  </h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="applicant-name" className="field-label">
                      이름 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="applicant-name"
                      type="text"
                      placeholder="신청자 본인 실명 (예: 홍길동)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-control text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="applicant-sid" className="field-label">
                      학번 <span className="text-rose-500">* (숫자 8자리)</span>
                    </label>
                    <input
                      id="applicant-sid"
                      type="text"
                      maxLength={8}
                      placeholder="학번 8자리 (예: 20241234)"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value.replace(/[^0-9]/g, ''))}
                      className="form-control text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="applicant-phone" className="field-label">
                      전화번호 (선택)
                    </label>
                    <input
                      id="applicant-phone"
                      type="tel"
                      placeholder="010-0000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-control text-xs"
                    />
                  </div>
                </div>
              </section>

              {/* =============================================================== */}
              {/* [4단계 카드] 요청사항 & 실시간 예상 금액 & 제출 */}
              {/* =============================================================== */}
              <section className="app-card p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="step-badge">4</span>
                  <h2 className="text-base font-bold text-[#1f3a6e]">
                    요청사항 및 금액 확인
                  </h2>
                </div>

                <div className="mb-4">
                  <label htmlFor="applicant-request" className="field-label">
                    요청사항 (자수 문구 상세, 기타 전달사항)
                  </label>
                  <textarea
                    id="applicant-request"
                    rows={2}
                    placeholder="이름 자수나 학번 자수 문구의 맞춤법, 영문 표기 등을 적어주세요."
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    className="form-control text-xs resize-none"
                  ></textarea>
                </div>

                {/* 에러 메시지 배너 */}
                {formError && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2"
                  >
                    <span>⚠️</span>
                    <span>{formError}</span>
                  </div>
                )}

                {/* 예상 금액 표시 영역: 신청하기 버튼 바로 위에 큰 글씨 (24px, 네이비, 굵게, 가운데) */}
                <div className="mt-4 pt-3 border-t border-slate-200 text-center">
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

            {/* =============================================================== */}
            {/* 신청 완료 메시지 박스 (연두색 배경, 초록 글씨, 둥근 모서리) */}
            {/* =============================================================== */}
            {successMessage && (
              <div
                id="confirmation-message-box"
                role="status"
                className="p-4 rounded-[14px] bg-[#eafaf1] border border-[#a3e9c0] text-[#1e7e34] shadow-sm animate-fade-in"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">✅</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-[#1e7e34] mb-1">
                      신청이 정상적으로 완료되었습니다!
                    </h3>
                    <p className="text-xs leading-relaxed font-semibold text-[#15803d]">
                      {successMessage}
                    </p>
                    <p className="text-[11px] text-[#2c974b] mt-1.5">
                      ※ 주문 내역은 학과 학생회 및 동아리 운영진 관리대장에 실시간으로 자동 등록되었습니다.
                    </p>

                    {/* 바로 취소하기 및 운영진 관리 이동 버튼 */}
                    <div className="mt-3 pt-2.5 border-t border-[#86efac]/60 flex items-center justify-between flex-wrap gap-2">
                      {latestSubmittedRecord && (
                        <button
                          type="button"
                          onClick={() => setCancelTargetRecord(latestSubmittedRecord)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-100 border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>❌ 방금 신청 취소하기</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setViewTab('executive')}
                        className="px-3 py-1.5 rounded-lg bg-[#1f3a6e] text-white text-xs font-bold hover:bg-[#284988] transition-colors shadow-xs cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <span>📊 학생회·운영진 관리대장 보기 ↗</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 화면 하단: 내 신청 내역 목록 카드 (신청자 모드) */}
            {/* =============================================================== */}
            <section className="app-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-[#1f3a6e]">
                    내 신청 내역
                  </span>
                  <span className="text-xs font-semibold text-[#3b82c4] tabular-nums">
                    ({myApplications.length}건)
                  </span>
                </div>

                {myApplications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setViewTab('executive')}
                    className="text-xs font-semibold text-[#1f3a6e] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>운영진 관리대장 엑셀 받기 ↗</span>
                  </button>
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
                        <div>
                          신청자: <strong className="text-slate-700">{rec.applicantName}</strong> ({rec.studentId})
                        </div>
                        <div>
                          수량: <strong className="text-slate-700">{rec.quantity}벌</strong>
                        </div>
                        <div>추가 옵션: {rec.selectedOptionsText}</div>
                        <div>신청 일시: {rec.createdAt}</div>
                      </div>

                      {rec.requestNote !== '없음' && (
                        <div className="text-[11px] text-slate-500 bg-white/70 p-1.5 rounded border border-slate-200/60 mt-0.5">
                          요청: {rec.requestNote}
                        </div>
                      )}

                      {/* 신청 취소 버튼: 클릭 시 전용 확인 모달 오픈 */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 mt-1">
                        <span className="text-[10px] text-slate-400">
                          접수번호: {rec.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCancelTargetRecord(rec)}
                          className="px-2.5 py-1 rounded bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          신청 취소
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          /* =================================================================== */
          /* 모드 2: [학과 학생회 & 동아리 운영진 구매관리 센터] */
          /* =================================================================== */
          <div className="flex flex-col gap-4">
            
            {/* 운영진 상단 KPI 대시보드 카드 */}
            <section className="app-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎓</span>
                  <div>
                    <h2 className="text-base font-bold text-[#1f3a6e]">
                      학생회 & 동아리 운영진 관리 센터
                    </h2>
                    <p className="text-xs text-slate-500">
                      각 학과 학생회 및 동아리 운영진용 전체 공동구매 장부 & 엑셀 내보내기
                    </p>
                  </div>
                </div>
              </div>

              {/* 통계 지표 그리드 */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center mb-3">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">총 주문 수량</span>
                  <span className="text-base font-extrabold text-[#1f3a6e] tabular-nums">
                    {myApplications.reduce((s, a) => s + a.quantity, 0)}벌
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">총 수납 예정액</span>
                  <span className="text-base font-extrabold text-[#1f3a6e] tabular-nums">
                    {myApplications.reduce((s, a) => s + a.totalPrice, 0).toLocaleString()}원
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">주문 발생 소속</span>
                  <span className="text-base font-extrabold text-[#3b82c4] tabular-nums">
                    {Array.from(new Set(myApplications.map((a) => a.affiliationName))).length}곳
                  </span>
                </div>
              </div>

              {/* 운영진 테스트용 데이터 컨트롤 버튼 */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleSeedSampleOrders}
                  className="text-xs font-semibold text-[#3b82c4] hover:underline cursor-pointer"
                >
                  ✨ 운영진 데모용 샘플 주문 생성 (6건)
                </button>
                {myApplications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllOrders}
                    className="text-xs font-medium text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    🗑️ 주문 전체 비우기
                  </button>
                )}
              </div>
            </section>

            {/* [핵심 기능] 엑셀(XLSX) 내보내기 전용 카드 */}
            <section className="app-card p-4 sm:p-5 bg-gradient-to-br from-white via-blue-50/20 to-slate-50 border border-blue-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">📊</span>
                  <h3 className="text-sm font-bold text-[#1f3a6e]">
                    운영진 전용 엑셀(.xlsx) 관리대장 다운로드
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
                  Excel 지원
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                학과 학생회나 동아리 운영진이 주문 취합, 계좌 입금 확인, 공장 발주 및 배부를 즉시 처리할 수 있도록 완벽하게 서식이 정리된 엑셀 파일입니다.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                {/* 1. 전체 잠바 통합 엑셀 다운로드 */}
                <button
                  type="button"
                  onClick={() => {
                    if (myApplications.length === 0) {
                      setCancelToastMessage('다운로드할 공동구매 내역이 없습니다.');
                      setTimeout(() => setCancelToastMessage(null), 2500);
                      return;
                    }
                    exportCouncilExecutiveExcel(myApplications);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-[#1f3a6e] text-white font-bold text-xs hover:bg-[#284988] transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>📑 숭실대 전체 잠바 총괄 통합본 (.xlsx)</span>
                </button>

                {/* 2. 특정 소속 전용 엑셀 다운로드 */}
                {executiveSelectedJacketName !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      const success = exportSingleAffiliationExcel(myApplications, executiveSelectedJacketName);
                      if (!success) {
                        setCancelToastMessage(`[${executiveSelectedJacketName}]의 접수된 공동구매 내역이 없습니다.`);
                        setTimeout(() => setCancelToastMessage(null), 3000);
                      }
                    }}
                    className="py-2.5 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>📥 [{executiveSelectedJacketName}] 전용 엑셀 (.xlsx)</span>
                  </button>
                )}
              </div>

              <div className="mt-2 text-[10px] text-slate-400 bg-white/70 p-2 rounded-lg border border-slate-200/60">
                <strong>시트 구성:</strong> ① 잠바별 총괄 집계표 (모든 소속 목표 대비 달성률) ② 구매자 수납·배부 체크대장 ③ 사이즈별 공장 발주 매트릭스 ④ 주문 발생 학과/동아리별 개별 탭
              </div>
            </section>

            {/* 각 잠바별 상세 구매 현황 & 선택 섹션 */}
            <section className="app-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🧥</span>
                  <h3 className="text-sm font-bold text-[#1f3a6e]">
                    소속별·잠바별 구매 상세 현황
                  </h3>
                </div>

                {/* 소속 선택 드롭다운 (숭실대 모든 잠바 목록 포함) */}
                <select
                  value={executiveSelectedJacketName}
                  onChange={(e) => setExecutiveSelectedJacketName(e.target.value)}
                  className="py-1.5 px-2.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1f3a6e] shadow-xs"
                >
                  <option value="all">전체 소속 잠바 통합 보기</option>
                  <optgroup label="학교 공용">
                    {AFFILIATION_DATA.filter((i) => i.category === '학교 공용').map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="단과대학(과잠)">
                    {AFFILIATION_DATA.filter((i) => i.category === '단과대학(과잠)').map((item) => (
                      <option key={item.id} value={item.name}>
                        [{item.group}] {item.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="동아리(동아리잠바)">
                    {AFFILIATION_DATA.filter((i) => i.category === '동아리(동아리잠바)').map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* 선택된 특정 잠바가 있을 때의 핵심 스펙 및 실시간 수량 카드 */}
              {executiveSelectedAffiliation ? (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: executiveSelectedAffiliation.bodyColor }}
                      ></span>
                      <strong className="text-sm text-[#1f3a6e]">
                        {executiveSelectedAffiliation.name}
                      </strong>
                      <span className="text-[10px] text-slate-400">
                        ({executiveSelectedAffiliation.group})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const success = exportSingleAffiliationExcel(
                          myApplications,
                          executiveSelectedAffiliation.name
                        );
                        if (!success) {
                          setCancelToastMessage(`[${executiveSelectedAffiliation.name}]의 접수된 주문이 없습니다.`);
                          setTimeout(() => setCancelToastMessage(null), 3000);
                        }
                      }}
                      className="text-xs text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-md font-bold transition-colors cursor-pointer"
                    >
                      이 잠바 엑셀 다운로드 ↗
                    </button>
                  </div>

                  {/* 진행률 바 */}
                  {(() => {
                    const orders = myApplications.filter(
                      (a) => a.affiliationName === executiveSelectedAffiliation.name
                    );
                    const count = orders.reduce((s, a) => s + a.quantity, 0);
                    const rev = orders.reduce((s, a) => s + a.totalPrice, 0);
                    const target = executiveSelectedAffiliation.targetCount;
                    const pct = Math.min(100, Math.round((count / target) * 100));
                    const isConfirmed = count >= target;

                    return (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">
                            주문: <span className="text-[#1f3a6e]">{count}벌</span> / 목표: {target}벌 ({pct}%)
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isConfirmed
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isConfirmed ? '🎉 공구 확정' : '⏳ 진행 중'}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#3b82c4] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>

                        <div className="text-[11px] text-slate-500 flex justify-between">
                          <span>기본단가: {executiveSelectedAffiliation.basePrice.toLocaleString()}원</span>
                          <span>누적 수납액: <strong className="text-slate-800">{rev.toLocaleString()}원</strong></span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : null}

              {/* 사이즈 및 옵션 집계표 (선택된 소속 기준) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-3 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>
                    {executiveSelectedJacketName === 'all'
                      ? '전체 잠바 사이즈별 발주 수량'
                      : `[${executiveSelectedJacketName}] 사이즈별 발주 수량`}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {(['S', 'M', 'L', 'XL', 'XXL'] as const).map((sz) => (
                    <div key={sz} className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-medium">{sz}</span>
                      <strong className="text-xs text-[#1f3a6e] tabular-nums">
                        {selectedJacketSizeBreakdown[sz] || 0}벌
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="pt-1.5 border-t border-slate-200/80 grid grid-cols-4 gap-1 text-[11px] text-slate-500">
                  <div>이름자수: <strong className="text-slate-700">{selectedJacketOptionBreakdown.nameEmb}</strong></div>
                  <div>학번자수: <strong className="text-slate-700">{selectedJacketOptionBreakdown.sidEmb}</strong></div>
                  <div>로고패치: <strong className="text-slate-700">{selectedJacketOptionBreakdown.patch}</strong></div>
                  <div>기모안감: <strong className="text-slate-700">{selectedJacketOptionBreakdown.fleece}</strong></div>
                </div>
              </div>

              {/* 검색 필터 */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="이름, 학번, 전화번호로 구매자 검색..."
                  value={executiveSearchTerm}
                  onChange={(e) => setExecutiveSearchTerm(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#1f3a6e] bg-white"
                />
              </div>

              {/* 구매자 명단 리스트 (입금 확인 & 수령 확인 & 취소) */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">
                  구매자 관리 명단 ({filteredExecutiveApplications.length}건)
                </span>
                <span className="text-[11px] text-slate-400">
                  입금/수령 버튼 클릭 시 즉시 상태 변경
                </span>
              </div>

              {filteredExecutiveApplications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  {myApplications.length === 0
                    ? '아직 접수된 주문이 없습니다. 학생용 공구 신청서를 작성하거나 상단 샘플 주문 버튼을 눌러보세요.'
                    : '조건에 일치하는 구매 내역이 없습니다.'}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {filteredExecutiveApplications.map((rec, idx) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-normal">#{idx + 1}</span>
                          <span className="text-[#1f3a6e]">{rec.affiliationName}</span>
                          <span>·</span>
                          <span>{rec.jacketTypeName}</span>
                          <span className="px-1.5 py-0.2 rounded bg-white border border-slate-200 text-[10px] text-slate-600">
                            {rec.size}
                          </span>
                        </div>
                        <span className="text-[#1f3a6e] font-extrabold text-sm tabular-nums">
                          {rec.totalPrice.toLocaleString()}원
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                        <div>
                          신청자: <strong className="text-slate-800">{rec.applicantName}</strong> ({rec.studentId})
                        </div>
                        <div>
                          연락처: <span className="text-slate-700">{rec.phone}</span>
                        </div>
                        <div>
                          수량: <strong className="text-slate-800">{rec.quantity}벌</strong>
                        </div>
                        <div>
                          추가옵션: <span className="text-slate-700">{rec.selectedOptionsText}</span>
                        </div>
                        <div className="col-span-2 text-slate-400 text-[10px]">
                          접수번호: {rec.id} · 일시: {rec.createdAt}
                        </div>
                      </div>

                      {rec.requestNote !== '없음' && (
                        <div className="text-[11px] text-slate-600 bg-white/80 p-1.5 rounded border border-slate-200/60">
                          요청사항: {rec.requestNote}
                        </div>
                      )}

                      {/* 학생회 관리 액션 바: 입금 확인 토글, 배부 확인 토글, 신청 취소 */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 mt-1 flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          {/* 입금 확인 토글 */}
                          <button
                            type="button"
                            onClick={() => handleToggleDeposit(rec.id)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                              rec.depositStatus === '입금완료'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                            title="클릭하여 입금 여부를 토글합니다"
                          >
                            {rec.depositStatus === '입금완료' ? '✓ 입금완료' : '○ 미입금'}
                          </button>

                          {/* 물품 수령 토글 */}
                          <button
                            type="button"
                            onClick={() => handleToggleReceived(rec.id)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                              rec.receivedStatus === '수령완료'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-blue-50'
                            }`}
                            title="클릭하여 수령/배부 여부를 토글합니다"
                          >
                            {rec.receivedStatus === '수령완료' ? '✓ 배부완료' : '○ 미수령'}
                          </button>
                        </div>

                        {/* 신청 취소 버튼: 모달 오픈 */}
                        <button
                          type="button"
                          onClick={() => setCancelTargetRecord(rec)}
                          className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          신청 취소
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* 푸터 영역 */}
        <footer className="text-center text-[11px] text-slate-400 py-3 mb-4">
          <p>© 숭실대학교 총학생회 및 단과대학 연합 잠바 공동구매</p>
          <p className="mt-0.5">숭실대학교 공식 학과 및 동아리 디자인 규격 준수</p>
        </footer>
      </main>

      {/* ===================================================================== */}
      {/* 확실한 신청 취소 확인 모달 (iframe 차단 방지 및 명확한 확인) */}
      {/* ===================================================================== */}
      {cancelTargetRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-rose-600 mb-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-base font-bold text-slate-800">
                공동구매 신청 취소 확인
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
              선택하신 공동구매 주문을 취소하시겠습니까?<br />
              취소 시 <strong>해당 잠바의 공구 참여 인원에서 즉시 차감</strong>되며, <strong>학생회/동아리 관리대장에서도 삭제</strong>됩니다.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-4 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">신청 소속</span>
                <span className="font-bold text-[#1f3a6e]">{cancelTargetRecord.affiliationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">신청자</span>
                <span className="font-bold text-slate-700">{cancelTargetRecord.applicantName} ({cancelTargetRecord.studentId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">품목 및 사이즈</span>
                <span className="text-slate-700">{cancelTargetRecord.jacketTypeName} ({cancelTargetRecord.size}) × {cancelTargetRecord.quantity}벌</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">추가 옵션</span>
                <span className="text-slate-700">{cancelTargetRecord.selectedOptionsText}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                <span className="text-slate-600">취소 예정 금액</span>
                <span className="text-rose-600 font-extrabold">{cancelTargetRecord.totalPrice.toLocaleString()}원</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleExecuteCancel(cancelTargetRecord.id)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
              >
                네, 신청 취소합니다
              </button>
              <button
                type="button"
                onClick={() => setCancelTargetRecord(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                돌아가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* HTML 한 파일(HTML+CSS+JS) 다운로드 및 소스코드 복사 모달 */}
      {/* ===================================================================== */}
      {isHtmlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <div>
                  <h3 className="font-bold text-sm text-[#1f3a6e]">
                    단일 HTML 파일(HTML+CSS+JS) 내보내기
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    외부 라이브러리 없이 웹 브라우저에서 바로 더블클릭 실행 가능한 파일
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHtmlModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-3 text-xs text-slate-600 space-y-2">
              <p>
                요청하신 <strong>'숭실대 잠바 공동구매' 단일 파일 버전 (soongsil-jamba.html)</strong>이 준비되어 있습니다.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500 text-[11px]">
                <li>별도 서버나 npm 빌드 없이, 크롬/사파리 등 브라우저에서 바로 열립니다.</li>
                <li>HTML, CSS, 바닐라 JavaScript가 모두 한 파일 안에 포함되어 있습니다.</li>
                <li>학과 학생회 및 동아리 운영진을 위한 구매 명단 엑셀(.csv) 내보내기 및 신청 취소 기능이 동일하게 포함되어 있습니다.</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={handleDownloadHtml}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#1f3a6e] text-white font-bold text-xs hover:bg-[#284988] transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>💾 soongsil-jamba.html 파일 다운로드</span>
              </button>

              <button
                type="button"
                onClick={handleCopyHtml}
                className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{copiedHtml ? '✓ 복사완료' : '📋 코드 전체 복사'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * 숭실대학교 잠바 공동구매 - 학과 학생회 및 동아리 운영진용 엑셀 관리대장
 * ============================================================================
 * 학과 학생회나 동아리 운영진이 전체 구매 내역을 효과적으로 관리할 수 있도록
 * 각 잠바별 구매 집계, 신청자 명단, 입금/수령 체크리스트를 포함한 엑셀 파일(.xlsx)을 생성합니다.
 */

import * as XLSX from 'xlsx';
import { AFFILIATION_DATA } from '../data/affiliationData';

export interface ExportApplicationItem {
  id: string;
  applicantName: string;
  studentId: string;
  phone: string;
  category: string;
  group: string;
  affiliationName: string;
  jacketTypeName: string;
  size: string;
  selectedOptionsText: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  requestNote: string;
  createdAt: string;
  depositStatus?: '미입금' | '입금완료';
  receivedStatus?: '미수령' | '수령완료';
}

/**
 * 1. 학생회 및 동아리 운영진용 전체 통합 관리대장 엑셀 파일 생성
 * - 시트 1: [총괄] 잠바별_구매_집계현황 (각 소속별 누적 수량, 달성률, 총금액)
 * - 시트 2: [명단] 전체_구매자_관리대장 (입금확인 및 잠바수령 체크란 포함)
 * - 시트 3: [발주] 사이즈별_제작집계표 (공장 발주용)
 * - 시트 4~: 주문이 발생한 각 학과/동아리별 개별 전용 명단 시트 자동 생성!
 */
export function exportCouncilExecutiveExcel(
  applications: ExportApplicationItem[],
  customFilename?: string
): boolean {
  if (!applications || applications.length === 0) {
    return false;
  }

  const workbook = XLSX.utils.book_new();

  // --------------------------------------------------------------------------
  // 시트 1: [총괄] 각 잠바별 구매 집계현황 (모든 소속 잠바 기준)
  // --------------------------------------------------------------------------
  const affiliationStatsMap: {
    [name: string]: {
      category: string;
      group: string;
      name: string;
      basePrice: number;
      targetCount: number;
      orderedCount: number;
      totalRevenue: number;
    };
  } = {};

  // 전체 소속 초기화
  AFFILIATION_DATA.forEach((item) => {
    affiliationStatsMap[item.name] = {
      category: item.category,
      group: item.group,
      name: item.name,
      basePrice: item.basePrice,
      targetCount: item.targetCount,
      orderedCount: 0,
      totalRevenue: 0,
    };
  });

  // 실제 주문 누적 반영
  applications.forEach((app) => {
    if (affiliationStatsMap[app.affiliationName]) {
      affiliationStatsMap[app.affiliationName].orderedCount += app.quantity;
      affiliationStatsMap[app.affiliationName].totalRevenue += app.totalPrice;
    }
  });

  const summarySheetRows = Object.values(affiliationStatsMap).map((stat, idx) => {
    const rate = stat.targetCount > 0 ? Math.round((stat.orderedCount / stat.targetCount) * 100) : 0;
    return {
      '연번': idx + 1,
      '분류': stat.category,
      '단과대/그룹': stat.group,
      '잠바/소속명': stat.name,
      '기본 단가(원)': stat.basePrice,
      '총 주문수량(벌)': stat.orderedCount,
      '목표 수량(벌)': stat.targetCount,
      '달성률': `${rate}%`,
      '공구 확정 상태': stat.orderedCount >= stat.targetCount ? '공구 확정 (발주 가능)' : `진행중 (${stat.targetCount - stat.orderedCount}벌 남음)`,
      '누적 총 수납금액(원)': stat.totalRevenue,
    };
  });

  const summarySheet = XLSX.utils.json_to_sheet(summarySheetRows);
  summarySheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
    { wch: 14 },
    { wch: 15 },
    { wch: 14 },
    { wch: 10 },
    { wch: 22 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, '잠바별_총괄_집계표');

  // --------------------------------------------------------------------------
  // 시트 2: [명단] 전체 구매자 관리대장 (입금 및 수령 체크리스트 포함)
  // --------------------------------------------------------------------------
  const masterRows = applications.map((item, index) => ({
    '연번': index + 1,
    '접수번호': item.id,
    '신청일시': item.createdAt,
    '잠바/소속명': item.affiliationName,
    '잠바 종류': item.jacketTypeName,
    '신청자 성명': item.applicantName,
    '학번 (8자리)': item.studentId,
    '연락처': item.phone || '미기재',
    '사이즈': item.size,
    '추가 옵션': item.selectedOptionsText,
    '수량(벌)': item.quantity,
    '총 결제예정금액(원)': item.totalPrice,
    '입금확인': item.depositStatus === '입금완료' ? '입금완료' : '[  ] 미입금',
    '물품수령': item.receivedStatus === '수령완료' ? '수령완료' : '[  ] 미수령',
    '학생회 비고/요청사항': item.requestNote || '없음',
  }));

  const masterSheet = XLSX.utils.json_to_sheet(masterRows);
  masterSheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 20 },
    { wch: 22 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 16 },
    { wch: 8 },
    { wch: 24 },
    { wch: 10 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(workbook, masterSheet, '전체_구매자_관리대장');

  // --------------------------------------------------------------------------
  // 시트 3: [제작발주] 소속 x 종류 x 사이즈별 제작 수량 매트릭스
  // --------------------------------------------------------------------------
  const productionMap: {
    [key: string]: {
      affiliation: string;
      type: string;
      size: string;
      count: number;
      revenue: number;
    };
  } = {};

  applications.forEach((app) => {
    const key = `${app.affiliationName}__${app.jacketTypeName}__${app.size}`;
    if (!productionMap[key]) {
      productionMap[key] = {
        affiliation: app.affiliationName,
        type: app.jacketTypeName,
        size: app.size,
        count: 0,
        revenue: 0,
      };
    }
    productionMap[key].count += app.quantity;
    productionMap[key].revenue += app.totalPrice;
  });

  const productionRows = Object.values(productionMap).map((row, idx) => ({
    '발주순번': idx + 1,
    '잠바/소속명': row.affiliation,
    '잠바 형태': row.type,
    '사이즈': row.size,
    '제작 수량(벌)': row.count,
    '총 제작금액(원)': row.revenue,
  }));

  const productionSheet = XLSX.utils.json_to_sheet(productionRows);
  productionSheet['!cols'] = [
    { wch: 10 },
    { wch: 24 },
    { wch: 16 },
    { wch: 10 },
    { wch: 14 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(workbook, productionSheet, '사이즈별_발주요약');

  // --------------------------------------------------------------------------
  // 시트 4~: 주문이 존재하는 각 학과/동아리별 개별 명단 시트 자동 생성
  // (예: 컴퓨터학부 학생회는 '컴퓨터학부' 시트만 확인하여 사용 가능)
  // --------------------------------------------------------------------------
  const affiliationsWithOrders = Array.from(new Set(applications.map((a) => a.affiliationName)));

  affiliationsWithOrders.forEach((deptName) => {
    const deptOrders = applications.filter((a) => a.affiliationName === deptName);
    const deptRows = deptOrders.map((item, idx) => ({
      '순번': idx + 1,
      '성명': item.applicantName,
      '학번': item.studentId,
      '연락처': item.phone || '미기재',
      '잠바 종류': item.jacketTypeName,
      '사이즈': item.size,
      '옵션': item.selectedOptionsText,
      '수량': item.quantity,
      '금액(원)': item.totalPrice,
      '입금확인': item.depositStatus === '입금완료' ? '입금완료' : '[  ] 미입금',
      '수령확인': item.receivedStatus === '수령완료' ? '수령완료' : '[  ] 미수령',
      '특이사항': item.requestNote || '',
    }));

    const deptSheet = XLSX.utils.json_to_sheet(deptRows);
    deptSheet['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 8 },
      { wch: 24 },
      { wch: 8 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 20 },
    ];

    // 시트 이름 최대 길이 31자 제한 및 특수문자 정제
    const safeSheetName = deptName.replace(/[\\/?*[\]]/g, '').slice(0, 28);
    XLSX.utils.book_append_sheet(workbook, deptSheet, safeSheetName);
  });

  // 파일 다운로드 실행
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = customFilename || `숭실대_잠바공구_학생회_운영진_관리대장_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, filename);
  return true;
}

/**
 * 2. 특정 학과 학생회나 특정 동아리 운영진을 위한 '단일 소속 전용' 엑셀 다운로드
 */
export function exportSingleAffiliationExcel(
  applications: ExportApplicationItem[],
  targetAffiliationName: string
): boolean {
  const filtered = applications.filter((a) => a.affiliationName === targetAffiliationName);

  if (filtered.length === 0) {
    return false;
  }

  const workbook = XLSX.utils.book_new();

  // 1) 신청자 명단 시트
  const rows = filtered.map((item, idx) => ({
    '연번': idx + 1,
    '접수번호': item.id,
    '신청일시': item.createdAt,
    '성명': item.applicantName,
    '학번 (8자리)': item.studentId,
    '연락처': item.phone || '미기재',
    '잠바종류': item.jacketTypeName,
    '사이즈': item.size,
    '추가옵션': item.selectedOptionsText,
    '수량(벌)': item.quantity,
    '총금액(원)': item.totalPrice,
    '입금확인': item.depositStatus === '입금완료' ? '입금완료' : '[  ] 미입금',
    '배부확인': item.receivedStatus === '수령완료' ? '수령완료' : '[  ] 미수령',
    '요청사항': item.requestNote || '',
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 8 },
    { wch: 24 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(workbook, sheet, '구매자_수납관리대장');

  // 2) 사이즈별 발주 요약 시트
  const sizeMap: { [size: string]: number } = {};
  filtered.forEach((item) => {
    sizeMap[item.size] = (sizeMap[item.size] || 0) + item.quantity;
  });

  const sizeRows = Object.entries(sizeMap).map(([size, count]) => ({
    '사이즈': size,
    '신청수량(벌)': count,
  }));

  const sizeSheet = XLSX.utils.json_to_sheet(sizeRows);
  sizeSheet['!cols'] = [{ wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, sizeSheet, '사이즈별_발주수량');

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const cleanName = targetAffiliationName.replace(/\s+/g, '_');
  XLSX.writeFile(workbook, `${cleanName}_잠바공구_학생회관리대장_${dateStr}.xlsx`);
  return true;
}

import Holidays from 'date-holidays';

const hd = new Holidays('KR');

// date-holidays 라이브러리에 아직 반영되지 않은 임시공휴일 등을 수동으로 추가
// 예: '2026-10-05': '임시공휴일'
const EXTRA_HOLIDAYS: Record<string, string> = {};

/**
 * 해당 날짜가 대한민국 공휴일이면 이름을 반환, 아니면 null
 */
export function getHolidayName(dateString: string): string | null {
  if (EXTRA_HOLIDAYS[dateString]) {
    return EXTRA_HOLIDAYS[dateString];
  }

  const result = hd.isHoliday(new Date(dateString));
  if (!result) return null;

  const publicHoliday = result.find((holiday) => holiday.type === 'public');
  return publicHoliday?.name ?? null;
}

export type WeekendType = 'saturday' | 'sunday' | null;

export function getWeekendType(dateString: string): WeekendType {
  const day = new Date(dateString).getDay();
  if (day === 6) return 'saturday';
  if (day === 0) return 'sunday';
  return null;
}

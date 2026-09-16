import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { fontSize, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getHolidayName, getWeekendType } from '@/lib/holidays';

// 기분 히트맵 색상 (골드/호박색 기반, 낮은 기분엔 회색을 살짝 섞음)
const MOOD_COLOR_LOW: [number, number, number] = [233, 191, 122];
const MOOD_COLOR_HIGH: [number, number, number] = [250, 181, 45];

function getMoodBackground(feeling: number): string {
  const t = Math.max(0, Math.min(1, feeling / 10));
  const r = Math.round(MOOD_COLOR_LOW[0] + (MOOD_COLOR_HIGH[0] - MOOD_COLOR_LOW[0]) * t);
  const g = Math.round(MOOD_COLOR_LOW[1] + (MOOD_COLOR_HIGH[1] - MOOD_COLOR_LOW[1]) * t);
  const b = Math.round(MOOD_COLOR_LOW[2] + (MOOD_COLOR_HIGH[2] - MOOD_COLOR_LOW[2]) * t);
  const alpha = 0.3 + t * 0.22;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface CalendarDayDate {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
}

interface CalendarDayProps {
  date?: CalendarDayDate;
  state?: string;
  marking?: { selected?: boolean; marked?: boolean; dotColor?: string; feeling?: number };
  onPress?: (date?: CalendarDayDate) => void;
  onLongPress?: (date?: CalendarDayDate) => void;
}

export function CalendarDay({ date, state, marking, onPress, onLongPress }: CalendarDayProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  if (!date) return null;

  const holidayName = getHolidayName(date.dateString);
  const weekendType = getWeekendType(date.dateString);
  const isSelected = !!marking?.selected;
  const isToday = state === 'today';
  const isDisabled = state === 'disabled' || state === 'inactive';

  const moodBackground =
    marking?.feeling !== undefined ? getMoodBackground(marking.feeling) : undefined;

  let textColor: string = colors.text;
  if (isDisabled) {
    textColor = colors.border;
  } else if (isSelected) {
    textColor = colors.white;
  } else if (isToday) {
    textColor = colors.primary;
  } else if (holidayName || weekendType === 'sunday') {
    textColor = colors.error;
  } else if (weekendType === 'saturday') {
    textColor = colors.link;
  }

  return (
    <TouchableOpacity
      style={[styles.container, moodBackground && { backgroundColor: moodBackground }]}
      onPress={() => onPress?.(date)}
      onLongPress={() => onLongPress?.(date)}
      disabled={isDisabled}
      activeOpacity={0.6}
    >
      <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
        <Text style={[styles.dayText, { color: textColor }]}>{date.day}</Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    width: 42,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: fontSize.md,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { fontSize, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getHolidayName, getWeekendType } from '@/lib/holidays';

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
  marking?: { selected?: boolean; marked?: boolean; dotColor?: string };
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
      style={styles.container}
      onPress={() => onPress?.(date)}
      onLongPress={() => onLongPress?.(date)}
      disabled={isDisabled}
      activeOpacity={0.6}
    >
      <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
        <Text style={[styles.dayText, { color: textColor }]}>{date.day}</Text>
      </View>
      <View style={[styles.dot, !marking?.marked && styles.hidden]} />
      <Text
        style={[styles.holidayText, !holidayName && styles.hidden]}
        numberOfLines={1}
      >
        {holidayName || ' '}
      </Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    width: 42,
    height: 50,
    alignItems: 'center',
  },
  hidden: {
    opacity: 0,
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
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 0,
  },
  holidayText: {
    fontSize: 9,
    lineHeight: 10,
    color: colors.error,
    marginTop: -2,
  },
});

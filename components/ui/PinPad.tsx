import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { fontSize, spacing, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

interface PinPadProps {
  onPress: (value: string) => void;
}

export function PinPad({ onPress }: PinPadProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  return (
    <View style={styles.container}>
      {buttons.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.button}
              onPress={() => onPress(value)}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 300,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: fontSize.xxl,
    color: colors.text,
    fontWeight: '600',
  },
});

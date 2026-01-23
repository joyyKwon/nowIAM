import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontSize, spacing } from '@/constants/theme';

interface CustomHeaderProps {
  title: string;
  showBackButton?: boolean;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function CustomHeader({
  title,
  showBackButton = true,
  headerLeft,
  headerRight,
}: CustomHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.left}>
          {headerLeft ? (
            headerLeft
          ) : showBackButton ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.right}>
          {headerRight ? headerRight : <View style={styles.placeholder} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  left: {
    width: 60,
    alignItems: 'flex-start',
  },
  right: {
    width: 60,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: spacing.xs,
  },
  placeholder: {
    width: 40,
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});

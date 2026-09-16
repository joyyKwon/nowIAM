import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuthStore } from '@/stores/authStore';
import { usePostStore } from '@/stores/postStore';

const ICON_SIZE = 28;

export default function TabsLayout() {
  const router = useRouter();
  const colors = useThemeColors();

  const handleTitlePress = () => {
    router.push('/(tabs)');
    const profile = useAuthStore.getState().profile;
    if (profile) {
      usePostStore.getState().fetchPosts(profile.id);
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingTop: 12,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
          height: 110,
        },
        headerTitle: () => (
          <TouchableOpacity onPress={handleTitlePress} hitSlop={12}>
            <Text style={{ color: colors.primary, fontSize: 22, fontWeight: 'bold', letterSpacing: 1 }}>
              nowIAM
            </Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="write"
        options={{
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: ICON_SIZE + 6,
                height: ICON_SIZE + 6,
                borderWidth: 2,
                borderColor: color,
                borderRadius: borderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={ICON_SIZE - 4} color={color} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/post/create');
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

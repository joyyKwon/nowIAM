import * as Notifications from 'expo-notifications';
import { Post } from '@/types/models';

const REMINDER_ID = 'daily-diary-reminder';
const REMINDER_HOUR = 15;
const REMINDER_MINUTE = 0;

const REMINDER_MESSAGES = [
  '오늘 하루, 기분은 어땠나요?',
  '지금 마음 상태를 한 줄로 표현한다면?',
  '오늘 나를 웃게 한 순간이 있었나요?',
  '오늘 하루 중 가장 기억에 남는 순간은?',
  '오늘 나에게 있었던 작은 행운은?',
  '오늘 감사했던 일 한 가지만 적어볼까요?',
  '오늘 찍은 사진 중 가장 마음에 드는 건?',
  '오늘의 하루를 사진 한 장으로 남겨보세요',
  '하루를 마무리하며 오늘을 기록해보세요',
  '잠들기 전, 오늘의 나에게 몇 자 남겨주세요',
  '오늘도 수고했어요. 하루를 기록할 시간이에요',
  '오늘 가장 많이 한 생각은 무엇인가요?',
  '내일의 나에게 하고 싶은 말이 있다면?',
  '오늘 누군가에게 고마웠던 순간이 있었나요?',
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

function hasPostToday(posts: Post[]): boolean {
  const today = new Date().toISOString().split('T')[0];
  return posts.some((post) => new Date(post.createdAt).toISOString().split('T')[0] === today);
}

function getNextTriggerDate(hasPostedToday: boolean): Date {
  const now = new Date();
  const target = new Date();
  target.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);

  if (hasPostedToday || target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

export async function cancelReminder() {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
}

export async function refreshReminderSchedule(enabled: boolean, posts: Post[]) {
  await cancelReminder();

  if (!enabled) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const date = getNextTriggerDate(hasPostToday(posts));
  const message = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: 'nowIAM',
      body: message,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

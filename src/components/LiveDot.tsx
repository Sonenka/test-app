import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export function LiveDot() {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active) setReduceMotion(value);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    opacity.setValue(1);
    if (reduceMotion) return;
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.25, duration: 700, useNativeDriver: Platform.OS !== 'web', isInteraction: false }),
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web', isInteraction: false }),
    ]));
    pulse.start();
    return () => { pulse.stop(); };
  }, [opacity, reduceMotion]);

  return <Animated.View testID="live-dot" accessible={false} style={[styles.dot, { backgroundColor: colors.live, opacity }]} />;
}

const styles = StyleSheet.create({
  dot: { width: 7, height: 7, borderRadius: 4 },
});

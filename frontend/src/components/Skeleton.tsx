import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- opacity is a ref (.current), always refers to same Animated.Value
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#E2E8F0', opacity },
        style,
      ]}
    />
  );
}

export function SkeletonLine({ lines = 1, style }: SkeletonProps & { lines?: number }) {
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 ? '70%' : '100%'} style={style} />
      ))}
    </View>
  );
}

export function SkeletonCard({ style }: SkeletonProps) {
  return (
    <View style={{ gap: 10 }}>
      <Skeleton height={80} borderRadius={16} />
      <SkeletonLine lines={2} />
    </View>
  );
}

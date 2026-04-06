import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
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
      <Skeleton height={80} borderRadius={16} style={style} />
      <SkeletonLine lines={2} />
    </View>
  );
}

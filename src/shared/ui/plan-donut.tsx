import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { BUCKETS, type Bucket } from '@/shared/buckets';
import { BUCKET_COLORS } from '@/shared/theme/theme';

const SIZE = 232;
const THICKNESS = 30;
const RADIUS = (SIZE - THICKNESS) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Length left empty between two parts, along the ring. */
const GAP = 4;

type Arc = { bucket: Bucket; length: number; offset: number };

function arcs(targets: Record<Bucket, number>): Arc[] {
  const parts = BUCKETS.filter((bucket) => targets[bucket] > 0);
  const total = parts.reduce((sum, bucket) => sum + targets[bucket], 0);
  if (total <= 0) return [];

  const gap = parts.length > 1 ? GAP : 0;
  let start = 0;
  return parts.map((bucket) => {
    const full = (targets[bucket] / total) * CIRCUMFERENCE;
    const arc = { bucket, length: Math.max(full - gap, 1), offset: -start };
    start += full;
    return arc;
  });
}

/** The plan as a ring, one color per part, with `children` in the middle. */
export function PlanDonut({ targets, children }: { targets: Record<Bucket, number>; children: ReactNode }) {
  const center = SIZE / 2;
  return (
    <View style={styles.donut}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
        <Svg width={SIZE} height={SIZE} style={styles.startAtTop}>
          {arcs(targets).map((arc) => (
            <Circle
              key={arc.bucket}
              cx={center}
              cy={center}
              r={RADIUS}
              fill="none"
              stroke={BUCKET_COLORS[arc.bucket]}
              strokeWidth={THICKNESS}
              strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
              strokeDashoffset={arc.offset}
            />
          ))}
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  donut: {
    alignItems: 'center',
    height: SIZE,
    justifyContent: 'center',
    width: SIZE,
  },
  startAtTop: {
    transform: [{ rotate: '-90deg' }],
  },
});

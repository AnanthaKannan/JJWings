import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export interface ReactionSummary {
  count: number;
  types: Array<'like' | 'love'>;
}

export interface PostActionsBarProps {
  likeCount: number;
  commentCount: number;
  reactions?: ReactionSummary;
  liked?: boolean;
  /** Resolve/reject (or return void) once the like/unlike call settles. Return `false` to roll back the optimistic change. */
  onLikePress?: () => Promise<boolean | void> | boolean | void;
  onCommentPress?: () => void;
}

interface Particle {
  id: number;
  translateY: Animated.Value;
  translateX: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
}

const PARTICLE_COUNT = 6;
const SLOW_REQUEST_THRESHOLD_MS = 250; // only show spinner if it takes longer than this

const PostActionsBar: React.FC<PostActionsBarProps> = ({
  likeCount,
  commentCount,
  liked = false,
  onLikePress,
  onCommentPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

  // optimistic local state, so tap feedback is instant regardless of network speed
  const [optimisticLiked, setOptimisticLiked] = useState(liked);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const spinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // keep local state in sync if the prop changes from outside (e.g. list refresh)
  useEffect(() => {
    setOptimisticLiked(liked);
  }, [liked]);

  const runIconPop = () => {
    scaleAnim.setValue(0.7);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 140,
      useNativeDriver: true,
    }).start();
  };

  const launchParticles = () => {
    const newParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }).map(
      () => ({
        id: particleIdRef.current++,
        translateY: new Animated.Value(0),
        translateX: new Animated.Value(0),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(0.6),
      }),
    );

    setParticles(prev => [...prev, ...newParticles]);

    newParticles.forEach(particle => {
      const angle = (Math.random() - 0.5) * 100;
      const distance = 40 + Math.random() * 24;

      Animated.parallel([
        Animated.timing(particle.translateY, {
          toValue: -distance,
          duration: 700 + Math.random() * 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(particle.translateX, {
          toValue: angle,
          duration: 700 + Math.random() * 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0.8,
            duration: 550,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 700,
          delay: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setParticles(prev => prev.filter(p => p.id !== particle.id));
      });
    });
  };

  const handleLikePress = async () => {
    if (isSyncing) return; // avoid double-taps mid-request

    const nextLiked = !optimisticLiked;

    // 1. instant feedback — flip icon/color/pop right away
    setOptimisticLiked(nextLiked);
    runIconPop();
    if (nextLiked) {
      launchParticles();
    }

    // 2. only surface a spinner if the request is actually slow
    setIsSyncing(true);
    spinnerTimerRef.current = setTimeout(() => {
      setShowSpinner(true);
    }, SLOW_REQUEST_THRESHOLD_MS);

    try {
      const result = await onLikePress?.();
      if (result === false) {
        // server rejected it — roll back
        setOptimisticLiked(!nextLiked);
      }
    } catch {
      // network/error — roll back so UI reflects reality
      setOptimisticLiked(!nextLiked);
    } finally {
      if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
      setIsSyncing(false);
      setShowSpinner(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.actionsRow}>
        <View style={styles.likeButtonWrapper}>
          {particles.map(particle => (
            <Animated.View
              key={particle.id}
              pointerEvents="none"
              style={[
                styles.particle,
                {
                  opacity: particle.opacity,
                  transform: [
                    { translateY: particle.translateY },
                    { translateX: particle.translateX },
                    { scale: particle.scale },
                  ],
                },
              ]}
            >
              <MaterialIcons name="thumb-up" size={14} color="#1877F2" />
            </Animated.View>
          ))}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLikePress}
            hitSlop={8}
            disabled={isSyncing && showSpinner}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              {showSpinner ? (
                <ActivityIndicator size="small" color="#1877F2" />
              ) : (
                <MaterialIcons
                  name={optimisticLiked ? 'thumb-up' : 'thumb-up-off-alt'}
                  size={20}
                  color={optimisticLiked ? '#1877F2' : '#65676b'}
                />
              )}
            </Animated.View>
            <Text
              style={[
                styles.actionText,
                optimisticLiked && styles.actionTextActive,
              ]}
            >
              {likeCount}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onCommentPress}
          hitSlop={8}
        >
          <MaterialIcons name="chat-bubble-outline" size={20} color="#65676b" />
          <Text style={styles.actionText}>{commentCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    borderTopColor: '#f0f2f5',
    borderTopWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  likeButtonWrapper: {
    position: 'relative',
  },
  particle: {
    position: 'absolute',
    left: 18,
    top: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 60, // keeps layout stable when spinner swaps in for the icon
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#65676b',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#1877F2',
  },
});

export default PostActionsBar;

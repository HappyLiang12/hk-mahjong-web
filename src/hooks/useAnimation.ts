import { useRef, useCallback, useState } from 'react';

export type AnimationType =
  | 'deal'
  | 'discard'
  | 'draw'
  | 'pong'
  | 'chow'
  | 'kong'
  | 'win'
  | 'flower_reveal'
  | 'camera_pan'
  | 'celebration';

export interface AnimationItem {
  id: string;
  type: AnimationType;
  duration: number; // ms
  data?: Record<string, unknown>;
  priority?: number; // higher = runs first
}

let animCounter = 0;

/**
 * useAnimation — animation queue management.
 *
 * Manages a queue of animations to be played sequentially.
 * Each animation has a type, duration, and optional data.
 * The queue is processed in FIFO order, with priority support.
 */
export function useAnimation() {
  const [currentAnimation, setCurrentAnimation] = useState<AnimationItem | null>(null);
  const [queueLength, setQueueLength] = useState(0);

  const queueRef = useRef<AnimationItem[]>([]);
  const isPlayingRef = useRef(false);

  const enqueue = useCallback(
    (type: AnimationType, duration: number, data?: Record<string, unknown>, priority?: number) => {
      const item: AnimationItem = {
        id: `anim-${++animCounter}`,
        type,
        duration,
        data,
        priority: priority ?? 0,
      };

      // Insert with priority: higher priority items go earlier
      const queue = queueRef.current;
      let insertIdx = queue.length;
      if (priority && priority > 0) {
        for (let i = 0; i < queue.length; i++) {
          if ((queue[i].priority ?? 0) < priority) {
            insertIdx = i;
            break;
          }
        }
      }
      queue.splice(insertIdx, 0, item);
      setQueueLength(queue.length);
      processQueue();
    },
    []
  );

  const processQueue = useCallback(() => {
    if (isPlayingRef.current) return;
    const queue = queueRef.current;
    if (queue.length === 0) return;

    isPlayingRef.current = true;
    const item = queue.shift()!;
    setCurrentAnimation(item);
    setQueueLength(queue.length);

    // Auto-advance after duration
    setTimeout(() => {
      isPlayingRef.current = false;
      setCurrentAnimation(null);
      processQueue();
    }, item.duration);
  }, []);

  const skip = useCallback(() => {
    isPlayingRef.current = false;
    setCurrentAnimation(null);
    // Process next
    setTimeout(() => processQueue(), 0);
  }, [processQueue]);

  const clear = useCallback(() => {
    queueRef.current = [];
    isPlayingRef.current = false;
    setCurrentAnimation(null);
    setQueueLength(0);
  }, []);

  return {
    currentAnimation,
    queueLength,
    enqueue,
    skip,
    clear,
    isPlaying: currentAnimation !== null,
  };
}

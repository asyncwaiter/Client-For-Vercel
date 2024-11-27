import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
} from 'react';
import { RabbitActionName } from '../models/AnimatedRabbit';
import { Position } from '../types/player';
import { useAtom } from 'jotai';
import { playAudioAtom } from '../atoms/GameAtoms';

type AnimationConfig = {
  isBeingStolen: boolean;
  isCurrentlyStolen: MutableRefObject<boolean>;
  stolenAnimationTimer: MutableRefObject<NodeJS.Timeout | null>;
  isPunching: MutableRefObject<boolean>;
  punchAnimationTimer: MutableRefObject<NodeJS.Timeout | null>;
  steal: boolean;
  giftCnt: number;
  setAnimation: Dispatch<SetStateAction<RabbitActionName>>;
};

const useCharacterAnimation = ({
  isBeingStolen,
  isCurrentlyStolen,
  stolenAnimationTimer,
  isPunching,
  punchAnimationTimer,
  steal,
  giftCnt,
  setAnimation,
}: AnimationConfig) => {
  const [, playAudio] = useAtom(playAudioAtom);

  const playJumpAnimation = useCallback(() => {
    playAudio('jump');
    setAnimation('CharacterArmature|Jump');
  }, []);

  const playPunchAnimation = useCallback(() => {
    playAudio('punch');
    isPunching.current = true;
    setAnimation('CharacterArmature|Punch');
    punchAnimationTimer.current = setTimeout(
      () => (isPunching.current = false),
      500,
    );
  }, []);

  const updateAnimation = useCallback(
    (vel: Position) => {
      if (isBeingStolen && !isCurrentlyStolen.current) {
        isCurrentlyStolen.current = true;
        setAnimation('CharacterArmature|Duck');
        playAudio('stolen');
        if (stolenAnimationTimer.current) {
          clearTimeout(stolenAnimationTimer.current);
        }
        stolenAnimationTimer.current = setTimeout(() => {
          isCurrentlyStolen.current = false;
        }, 500);
        return;
      }

      if (isCurrentlyStolen.current) return;

      if (steal) {
        setAnimation('CharacterArmature|Punch');
        return;
      }

      const velocityMagnitude = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      const isMoving = velocityMagnitude > 0.5;
      const hasGift = giftCnt > 0;

      setAnimation(
        isMoving
          ? hasGift
            ? 'CharacterArmature|Run_Gun'
            : 'CharacterArmature|Run'
          : hasGift
            ? 'CharacterArmature|Idle_Gun'
            : 'CharacterArmature|Idle',
      );
    },
    [isBeingStolen, steal, giftCnt],
  );

  useEffect(() => {
    return () => {
      if (stolenAnimationTimer.current) {
        clearTimeout(stolenAnimationTimer.current);
      }
      if (punchAnimationTimer.current) {
        clearTimeout(punchAnimationTimer.current);
      }
    };
  }, []);

  return { updateAnimation, playJumpAnimation, playPunchAnimation };
};
export default useCharacterAnimation;

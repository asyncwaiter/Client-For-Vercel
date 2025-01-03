import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  Group,
  MathUtils,
  NormalBlending,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  Vector3,
} from 'three';
import gsap from 'gsap';
import {
  EffectConfig,
  CreateSpriteProps,
  AnimateSpriteProps,
} from '../../types/gift';
import { useAtom } from 'jotai';
import { playAudioAtom } from '../../atoms/GameAtoms';

const EFFECTS: { LIGHTS: EffectConfig } = {
  LIGHTS: {
    COUNT: 30,
    RADIUS: 2,
    HEIGHT: 4,
    COLOR: '#ffeb3b',
    SCALE: { START: 0.2, END: 0.05 },
    DURATION: { MIN: 1, MAX: 1.5 },
    LOOPS: 3,
  },
};

const createCircleTexture = () => {
  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, 'rgba(255, 235, 59, 1)');
  gradient.addColorStop(0.5, 'rgba(255, 235, 59, 0.5)');
  gradient.addColorStop(1, 'rgba(255, 235, 59, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const GiftEffect: React.FC = () => {
  const [, playAudio] = useAtom(playAudioAtom);
  const effectGroup = useRef<Group>(null);
  const sprites = useRef<Sprite[]>([]);
  const loader = useMemo(() => new TextureLoader(), []);
  const hasPlayedSound = useRef(false);
  const soundTimeoutRef = useRef<NodeJS.Timeout>();

  const createSprite = useCallback(
    ({
      texture,
      color = '#ffffff',
      opacity = 1,
      blending = NormalBlending,
    }: CreateSpriteProps): Sprite => {
      const material = new SpriteMaterial({
        map: texture,
        color: new Color(color),
        opacity,
        blending,
        transparent: true,
      });
      return new Sprite(material);
    },
    [],
  );

  const animateSprite = useCallback(
    ({
      sprite,
      startPosition,
      endPosition,
      startScale,
      endScale,
      duration,
      delay = 0,
    }: AnimateSpriteProps) => {
      sprite.position.copy(startPosition);
      sprite.scale.setScalar(0);

      gsap
        .timeline()
        .to(sprite.scale, {
          x: startScale,
          y: startScale,
          z: startScale,
          duration: 0.3,
          delay,
        })
        .to(
          sprite.position,
          {
            x: endPosition.x,
            y: endPosition.y,
            z: endPosition.z,
            duration,
            ease: 'power1.out',
          },
          '<',
        )
        .to(
          sprite.scale,
          {
            x: endScale,
            y: endScale,
            z: endScale,
            duration,
            ease: 'power1.out',
            onComplete: () => {
              if (sprite.parent) sprite.parent.remove(sprite);
            },
          },
          '<',
        );
    },
    [],
  );

  const createEffect = useCallback(() => {
    if (!hasPlayedSound.current) {
      playAudio('woosh');
      hasPlayedSound.current = true;

      soundTimeoutRef.current = setTimeout(() => {
        playAudio('wooshss', true);
      }, 1000);
    }

    const circleTexture = createCircleTexture();
    if (!circleTexture) return;

    const totalRotation = EFFECTS.LIGHTS.LOOPS * Math.PI * 2;

    for (let i = 0; i < EFFECTS.LIGHTS.COUNT; i++) {
      const heightRatio = i / EFFECTS.LIGHTS.COUNT;
      const height = heightRatio * EFFECTS.LIGHTS.HEIGHT;
      const radius = EFFECTS.LIGHTS.RADIUS * (1 - heightRatio);
      const angle = heightRatio * totalRotation;

      const sprite = createSprite({
        texture: circleTexture,
        color: EFFECTS.LIGHTS.COLOR,
        opacity: 0.8,
        blending: AdditiveBlending,
      });

      const startPos = new Vector3(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius,
      );

      const wiggleRadius = 0.01;
      const endPos = startPos
        .clone()
        .add(
          new Vector3(
            (Math.random() - 0.5) * wiggleRadius,
            0,
            (Math.random() - 0.5) * wiggleRadius,
          ),
        );

      animateSprite({
        sprite,
        startPosition: startPos,
        endPosition: endPos,
        startScale: EFFECTS.LIGHTS.SCALE.START,
        endScale: EFFECTS.LIGHTS.SCALE.END,
        duration: MathUtils.randFloat(
          EFFECTS.LIGHTS.DURATION.MIN,
          EFFECTS.LIGHTS.DURATION.MAX,
        ),
        delay: heightRatio * 1.5,
      });

      effectGroup.current?.add(sprite);
      sprites.current.push(sprite);

      gsap.to(sprite.scale, {
        x: EFFECTS.LIGHTS.SCALE.START * 1.5,
        y: EFFECTS.LIGHTS.SCALE.START * 1.5,
        z: EFFECTS.LIGHTS.SCALE.START * 1.5,
        duration: 0.5 + Math.random() * 0.5,
        repeat: -1,
        yoyo: true,
        delay: Math.random(),
      });
    }
  }, [loader, createSprite, animateSprite, playAudio]);

  useEffect(() => {
    if (!effectGroup.current) return;

    const cleanup = () => {
      sprites.current.forEach((sprite) => {
        if (sprite.parent) sprite.parent.remove(sprite);
      });
      sprites.current = [];
      hasPlayedSound.current = false;
    };

    cleanup();
    createEffect();

    return cleanup;
  }, [createEffect]);

  return <group ref={effectGroup} position={[0, 0, 0]} />;
};

export default React.memo(GiftEffect);

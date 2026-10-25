"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Movie } from "@/lib/movies";
import type { SpinMode } from "@/lib/settings";
import { Poster, PosterArt } from "./Poster";
import { playRatchet, playWinSound } from "@/lib/sound";

/* ------------------------------- геометрия ------------------------------- */

const GEO: Record<SpinMode, { itemW: number; itemH: number; gap: number }> = {
  horizontal: { itemW: 132, itemH: 198, gap: 14 },
  vertical: { itemW: 216, itemH: 324, gap: 14 },
  slot: { itemW: 140, itemH: 210, gap: 10 },
  wheel: { itemW: 360, itemH: 360, gap: 0 },
};

const MAIN_DURATION = 3600;
const SLOT_DURATIONS = [2000, 2650, 3350];
const HEAD_INDEX = 8; // Буфер элементов до центра для плавного ручного скролла

/* -------------------- Easing: кубический Безье (0.16, 0.84, 0.24, 1) -------------------- */

function createCubicBezier(x1: number, y1: number, x2: number, y2: number) {
  return function bezier(t: number): number {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i += 1) {
      const f =
        3 * (1 - u) * (1 - u) * u * x1 +
        3 * (1 - u) * u * u * x2 +
        u * u * u -
        t;
      const df =
        3 * (1 - u) * (1 - u) * x1 +
        6 * (1 - u) * u * (x2 - x1) +
        3 * u * u * (1 - x2);
      if (Math.abs(f) < 1e-6) break;
      if (Math.abs(df) < 1e-6) break;
      u -= f / df;
      u = Math.max(0, Math.min(1, u));
    }
    return (
      3 * (1 - u) * (1 - u) * u * y1 +
      3 * (1 - u) * u * u * y2 +
      u * u * u
    );
  };
}

const easeRoulette = createCubicBezier(0.16, 0.84, 0.24, 1);

/* ---------------------- Хелперы генерации зацикленной ленты ---------------------- */

function sampleMovies(pool: Movie[], count: number, fallback: Movie, seed = 1): Movie[] {
  const result: Movie[] = [];
  const src = pool.length > 0 ? pool : [fallback];
  let s = seed >>> 0;
  while (result.length < count) {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    const idx = s % src.length;
    result.push(src[idx] ?? fallback);
  }
  return result.slice(0, count);
}

function buildInitialWindow(pool: Movie[], centerMovie: Movie): Movie[] {
  const src = pool.length > 0 ? pool : [centerMovie];
  const centerIdx = Math.max(0, src.findIndex((m) => m.id === centerMovie.id));
  const before: Movie[] = [];
  const after: Movie[] = [];

  for (let i = HEAD_INDEX; i >= 1; i -= 1) {
    const idx = (centerIdx - i + src.length * 1000) % src.length;
    before.push(src[idx] ?? centerMovie);
  }
  for (let i = 1; i <= HEAD_INDEX; i += 1) {
    const idx = (centerIdx + i) % src.length;
    after.push(src[idx] ?? centerMovie);
  }

  return [...before, centerMovie, ...after];
}

/* ------------------------------ Измерение бокса ------------------------------ */

function useBoxSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

/* --------------------------------- Одна лента --------------------------------- */

function Lane({
  axis,
  pool,
  winner,
  itemW,
  itemH,
  gap,
  duration,
  spinSteps,
  nonce,
  soundEnabled = true,
  playWinOnSettle = true,
  onSettled,
  onSelectMovie,
}: {
  axis: "x" | "y";
  pool: Movie[];
  winner: Movie;
  itemW: number;
  itemH: number;
  gap: number;
  duration: number;
  spinSteps: number;
  nonce: number;
  soundEnabled?: boolean;
  playWinOnSettle?: boolean;
  onSettled: () => void;
  onSelectMovie?: (movie: Movie) => void;
}) {
  const viewport = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const size = useBoxSize(viewport);
  const settledCallback = useRef(onSettled);
  const lastTickStepRef = useRef(-1);

  useEffect(() => {
    settledCallback.current = onSettled;
  }, [onSettled]);

  const step = (axis === "x" ? itemW : itemH) + gap;
  const viewportLen = axis === "x" ? size.w : size.h;
  const itemLen = axis === "x" ? itemW : itemH;

  // Видимое окно ленты
  const prevWindowRef = useRef<Movie[]>(buildInitialWindow(pool, winner));
  const [items, setItems] = useState<Movie[]>(() => prevWindowRef.current);
  const [settledWinnerId, setSettledWinnerId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const currentStopIndexRef = useRef<number>(HEAD_INDEX);
  const currentOffsetRef = useRef<number>(0);
  const startedNonceRef = useRef(0);
  const isSpinningRef = useRef(false);
  const animFrameRef = useRef(0);
  const settleTimeoutRef = useRef(0);

  // Drag-состояние
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const pressedMovieIdRef = useRef<string | null>(null);

  // Центровка заданного индекса в контейнере
  const getOffsetForIndex = useCallback(
    (index: number) => {
      if (viewportLen <= 0) return 0;
      const centerOffset = (viewportLen - itemLen) / 2;
      return centerOffset - index * step;
    },
    [viewportLen, itemLen, step],
  );

  // Динамический расчет 3D-масштаба и перспективы для каждого постера
  const apply3DTransforms = useCallback(
    (trackOffset: number, isFinal: boolean, activeStopIndex: number) => {
      const track = trackRef.current;
      if (!track || viewportLen <= 0) return;

      track.style.transform =
        axis === "x"
          ? `translate3d(${trackOffset}px,0,0)`
          : `translate3d(0,${trackOffset}px,0)`;

      const viewportCenter = viewportLen / 2;
      const maxDist = viewportLen * 0.52;
      const children = track.children;

      for (let i = 0; i < children.length; i += 1) {
        const child = children[i] as HTMLElement;
        if (!child) continue;

        const childCenter = trackOffset + i * step + itemLen / 2;
        const dist = childCenter - viewportCenter;
        const t = Math.min(1, Math.abs(dist) / maxDist);

        // Масштаб: плавно уменьшаем к краям
        let scale = 1.0 - 0.22 * Math.pow(t, 1.25);

        // Выбранный фильм при остановке увеличиваем и подсвечиваем
        const isWinnerCard = isFinal && i === activeStopIndex;
        if (isWinnerCard) {
          scale *= 1.09;
          child.classList.add("win-glow");
          child.style.borderColor = "rgb(var(--glow) / 0.95)";
        } else {
          child.classList.remove("win-glow");
          child.style.borderColor = "";
        }

        // 3D-разворот постеров внутрь (цилиндрическая рулетка)
        const rotY = axis === "x" ? -(dist / maxDist) * 16 : 0;
        const rotX = axis === "y" ? (dist / maxDist) * 16 : 0;
        const tz = -Math.pow(t, 1.3) * 45;
        const opacity = Math.max(0.45, 1.0 - 0.38 * Math.pow(t, 1.8));

        child.style.transform = `translateZ(${tz}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale})`;
        child.style.opacity = `${opacity}`;
        child.style.zIndex = `${isWinnerCard ? 30 : Math.max(1, Math.round((1 - t) * 20))}`;
      }
    },
    [axis, itemLen, step, viewportLen],
  );

  // Доводка (snap) до ближайшей карточки после ручного драга
  const snapToNearest = useCallback(() => {
    if (viewportLen <= 0) return;
    const centerOffset = (viewportLen - itemLen) / 2;
    const nearest = Math.round((centerOffset - currentOffsetRef.current) / step);
    const clamped = Math.max(0, Math.min(items.length - 1, nearest));
    const targetOffset = centerOffset - clamped * step;
    const startOffset = currentOffsetRef.current;
    const startTime = performance.now();
    const snapDuration = 240;

    const tickSnap = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / snapDuration);
      const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const pos = startOffset + (targetOffset - startOffset) * ease;
      currentOffsetRef.current = pos;
      apply3DTransforms(pos, p >= 1, clamped);

      if (p < 1) {
        animFrameRef.current = requestAnimationFrame(tickSnap);
      } else {
        currentOffsetRef.current = targetOffset;
        const centered = items[clamped];
        if (centered) {
          const nextWindow = buildInitialWindow(pool, centered);
          prevWindowRef.current = nextWindow;
          setItems(nextWindow);
          currentStopIndexRef.current = HEAD_INDEX;
          const reOffset = getOffsetForIndex(HEAD_INDEX);
          currentOffsetRef.current = reOffset;
          requestAnimationFrame(() => {
            apply3DTransforms(reOffset, false, HEAD_INDEX);
          });
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(tickSnap);
  }, [viewportLen, itemLen, step, items, pool, getOffsetForIndex, apply3DTransforms]);

  // Обработчики ручного перетаскивания мышью
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSpinningRef.current || e.button !== 0) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    setIsDragging(true);
    dragStartPosRef.current = axis === "x" ? e.clientX : e.clientY;
    dragStartOffsetRef.current = currentOffsetRef.current;

    // Запоминаем ID нажатой карточки
    const target = e.target as HTMLElement;
    const card = target.closest("[data-movie-id]");
    pressedMovieIdRef.current = card ? card.getAttribute("data-movie-id") : null;

    window.clearTimeout(settleTimeoutRef.current);
    cancelAnimationFrame(animFrameRef.current);
    setSettledWinnerId(null);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const currentPos = axis === "x" ? e.clientX : e.clientY;
    const delta = currentPos - dragStartPosRef.current;
    if (Math.abs(delta) > 5) hasDraggedRef.current = true;

    const newOffset = dragStartOffsetRef.current + delta;
    currentOffsetRef.current = newOffset;
    apply3DTransforms(newOffset, false, -1);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (hasDraggedRef.current) {
      snapToNearest();
    } else if (pressedMovieIdRef.current) {
      // Пользователь просто кликнул по постеру без перетаскивания
      const clicked =
        items.find((m) => m.id === pressedMovieIdRef.current) ||
        pool.find((m) => m.id === pressedMovieIdRef.current);
      if (clicked) {
        onSelectMovie?.(clicked);
      }
    }
    pressedMovieIdRef.current = null;
  };

  // Запуск вращения при изменении nonce
  useEffect(() => {
    if (viewportLen <= 0) return;

    if (nonce === 0) {
      const initialOffset = getOffsetForIndex(HEAD_INDEX);
      currentOffsetRef.current = initialOffset;
      apply3DTransforms(initialOffset, false, HEAD_INDEX);
      return;
    }

    if (startedNonceRef.current === nonce) return;
    startedNonceRef.current = nonce;
    isSpinningRef.current = true;

    window.clearTimeout(settleTimeoutRef.current);
    cancelAnimationFrame(animFrameRef.current);
    setSettledWinnerId(null);

    // Строим новую ленту: начало совпадает с текущим видимым окном
    const head = prevWindowRef.current.slice(0, HEAD_INDEX + 1);
    const middleCount = Math.max(8, spinSteps - 1);
    const middle = sampleMovies(pool, middleCount, winner, nonce * 7919 + 31);
    const stopIndex = head.length - 1 + middle.length + 1;
    const tail = sampleMovies(pool, 8, winner, nonce * 104729 + 17);

    const newStrip = [...head, ...middle, winner, ...tail];
    currentStopIndexRef.current = stopIndex;
    setItems(newStrip);

    const startPos = getOffsetForIndex(HEAD_INDEX);
    const targetPos = getOffsetForIndex(stopIndex);
    currentOffsetRef.current = startPos;
    lastTickStepRef.current = -1;

    let startTime = 0;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeRoulette(progress);
      const currentPos = startPos + (targetPos - startPos) * eased;
      currentOffsetRef.current = currentPos;

      const stepIdx = Math.floor(Math.abs(currentPos - startPos) / step);
      if (stepIdx !== lastTickStepRef.current && progress < 1) {
        lastTickStepRef.current = stepIdx;
        playRatchet(Boolean(soundEnabled));
      }

      apply3DTransforms(currentPos, progress >= 1, stopIndex);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        isSpinningRef.current = false;

        const windowStart = Math.max(0, stopIndex - HEAD_INDEX);
        const nextWindow = newStrip.slice(windowStart, windowStart + HEAD_INDEX * 2 + 1);
        if (nextWindow.length >= HEAD_INDEX + 1) {
          prevWindowRef.current = nextWindow;
        }

        setSettledWinnerId(winner.id);

        if (playWinOnSettle) {
          playWinSound(Boolean(soundEnabled));
        }

        settleTimeoutRef.current = window.setTimeout(() => {
          settledCallback.current();
        }, 650);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.clearTimeout(settleTimeoutRef.current);
    };
  }, [
    nonce,
    pool,
    winner,
    duration,
    spinSteps,
    viewportLen,
    getOffsetForIndex,
    apply3DTransforms,
  ]);

  // Обновление положения при ресайзе экрана (в покое)
  useEffect(() => {
    if (viewportLen <= 0 || startedNonceRef.current !== 0) return;
    const offset = getOffsetForIndex(HEAD_INDEX);
    currentOffsetRef.current = offset;
    apply3DTransforms(offset, false, HEAD_INDEX);
  }, [viewportLen, getOffsetForIndex, apply3DTransforms]);

  return (
    <div
      ref={viewport}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative h-full w-full select-none"
      style={{
        perspective: 1200,
        perspectiveOrigin: "50% 50%",
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
    >
      <div
        ref={trackRef}
        className="reel-track flex h-full w-full items-center"
        style={{
          flexDirection: axis === "x" ? "row" : "column",
          gap: `${gap}px`,
          transformStyle: "preserve-3d",
        }}
      >
        {items.map((movie, index) => {
          const isWinner = movie.id === settledWinnerId && index === currentStopIndexRef.current;
          return (
            <div
              key={`${movie.id}-${index}`}
              data-movie-id={movie.id}
              onClick={(e) => {
                if (hasDraggedRef.current || isSpinningRef.current) return;
                e.stopPropagation();
                onSelectMovie?.(movie);
              }}
              title={`Открыть «${movie.title}»`}
              className={`strip-item-shadow relative flex-none cursor-pointer rounded-xl border border-line/60 bg-surface-2 transition-[box-shadow,border-color,transform] duration-300 hover:border-accent/90 hover:scale-[1.03] ${
                isWinner ? "border-accent/90" : ""
              }`}
              style={{
                width: itemW,
                height: itemH,
                transformOrigin: "center center",
                willChange: "transform, opacity",
              }}
            >
              <div className="pointer-events-none h-full w-full overflow-hidden rounded-xl">
                {movie.posterPath ? (
                  <Poster movie={movie} className="h-full w-full" />
                ) : (
                  <div className="absolute inset-0">
                    <PosterArt movie={movie} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------- Казино рулетка ----------------------------- */

function CasinoWheel({
  pool,
  winner,
  nonce,
  soundEnabled = true,
  onSettled,
  onSelectMovie,
}: {
  pool: Movie[];
  winner: Movie;
  nonce: number;
  soundEnabled?: boolean;
  onSettled: () => void;
  onSelectMovie?: (movie: Movie) => void;
}) {
  const wheelRef = useRef<SVGSVGElement | null>(null);
  const currentAngleRef = useRef(0);
  const startedNonceRef = useRef(0);
  const isSpinningRef = useRef(false);
  const animFrameRef = useRef(0);
  const settleTimeoutRef = useRef(0);
  const cycleIntervalRef = useRef(0);
  const lastSectorRef = useRef(-1);
  const [settled, setSettled] = useState(false);
  const [hubMovie, setHubMovie] = useState<Movie>(winner);

  // Синхронизируем hubMovie с winner при смене пропса (до первого спина)
  useEffect(() => {
    if (!isSpinningRef.current) setHubMovie(winner);
  }, [winner]);

  // 12 секторов колеса
  const SECTOR_COUNT = 12;
  const SECTOR_ANGLE = 360 / SECTOR_COUNT; // 30 градусов

  const slices = useMemo(() => {
    const list = sampleMovies(pool, SECTOR_COUNT - 1, winner, 777);
    return [winner, ...list];
  }, [pool, winner]);

  const radius = 175;
  const center = 190;

  useEffect(() => {
    if (nonce === 0) {
      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${currentAngleRef.current}deg)`;
      }
      return;
    }

    if (startedNonceRef.current === nonce) return;
    startedNonceRef.current = nonce;
    isSpinningRef.current = true;
    setSettled(false);
    setHubMovie(pool.length > 0 ? pool[0] : winner);

    window.clearTimeout(settleTimeoutRef.current);
    cancelAnimationFrame(animFrameRef.current);
    window.clearInterval(cycleIntervalRef.current);

    // Быстрая смена постеров в центре хаба во время вращения
    const cyclePool = pool.length > 0 ? pool : [winner];
    let cycleIdx = 0;
    cycleIntervalRef.current = window.setInterval(() => {
      cycleIdx = (cycleIdx + 1) % cyclePool.length;
      setHubMovie(cyclePool[cycleIdx]);
    }, 90);

    // Сектор победителя — сектор 0.
    // Указатель сверху (12 часов). Сектор 0 отцентрирован на 0 градусов при угле mod 360 = 0.
    const startAngle = currentAngleRef.current;
    const spins = 6;
    const targetAngle = startAngle + spins * 360 + (360 - (startAngle % 360));
    const duration = 4000;
    let startTime = 0;
    lastSectorRef.current = -1;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeRoulette(progress);
      const angle = startAngle + (targetAngle - startAngle) * eased;
      currentAngleRef.current = angle;

      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${angle}deg)`;
      }

      const sectorIdx = Math.floor(angle / SECTOR_ANGLE);
      if (sectorIdx !== lastSectorRef.current && progress < 1) {
        lastSectorRef.current = sectorIdx;
        playRatchet(Boolean(soundEnabled));
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        isSpinningRef.current = false;
        window.clearInterval(cycleIntervalRef.current);
        setHubMovie(winner);
        setSettled(true);
        playWinSound(Boolean(soundEnabled));
        settleTimeoutRef.current = window.setTimeout(() => {
          onSettled();
        }, 650);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.clearTimeout(settleTimeoutRef.current);
      window.clearInterval(cycleIntervalRef.current);
    };
  }, [nonce, winner, onSettled]);

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col items-center justify-center p-2">
      {/* Стрелка казино сверху */}
      <div className="pointer-events-none absolute top-1 z-30 flex flex-col items-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]">
        <div className="h-4 w-4 rounded-full border-2 border-amber-300 bg-amber-500 shadow-md ring-2 ring-amber-600/70" />
        <div className="-mt-1 h-0 w-0 border-x-[11px] border-x-transparent border-t-[22px] border-t-amber-400" />
      </div>

      {/* Внешний обод колеса с тематической рамкой */}
      <div className="theme-track-frame relative flex h-[340px] w-[340px] sm:h-[390px] sm:w-[390px] items-center justify-center rounded-full border-4 border-amber-600/80 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
        {/* Вращающийся диск рулетки */}
        <svg
          ref={wheelRef}
          viewBox="0 0 380 380"
          className="h-full w-full select-none"
          style={{ willChange: "transform" }}
        >
          {/* Базовый круг */}
          <circle cx={center} cy={center} r={radius} fill="#0d0a07" stroke="#b45309" strokeWidth="4" />

          {/* Секторы */}
          {slices.map((movie, i) => {
            const startAngleDeg = i * SECTOR_ANGLE - 90 - SECTOR_ANGLE / 2;
            const endAngleDeg = startAngleDeg + SECTOR_ANGLE;
            const startRad = (startAngleDeg * Math.PI) / 180;
            const endRad = (endAngleDeg * Math.PI) / 180;
            const midRad = (((startAngleDeg + endAngleDeg) / 2) * Math.PI) / 180;

            const x1 = center + radius * Math.cos(startRad);
            const y1 = center + radius * Math.sin(startRad);
            const x2 = center + radius * Math.cos(endRad);
            const y2 = center + radius * Math.sin(endRad);

            const textRadius = radius * 0.72;
            const tx = center + textRadius * Math.cos(midRad);
            const ty = center + textRadius * Math.sin(midRad);
            const textRot = (startAngleDeg + endAngleDeg) / 2 + 90;

            const isZero = i === 0;
            const fillColor = isZero ? "#059669" : i % 2 === 1 ? "#991b1b" : "#18181b";

            return (
              <g key={`${movie.id}-${i}`}>
                <path
                  d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                  fill={fillColor}
                  stroke="#d97706"
                  strokeWidth="1.5"
                />
                <text
                  x={tx}
                  y={ty}
                  transform={`rotate(${textRot}, ${tx}, ${ty})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fef3c7"
                  fontSize="11"
                  fontWeight="bold"
                  className="pointer-events-none tracking-wider select-none"
                >
                  {isZero ? "★ 0" : `${i}`}
                </text>
              </g>
            );
          })}

          {/* Внутренний латунный круг */}
          <circle cx={center} cy={center} r={radius * 0.44} fill="#181109" stroke="#f59e0b" strokeWidth="3" />
        </svg>

        {/* Центральный хаб с постером победителя / фильма */}
        <div
          onClick={() => onSelectMovie?.(hubMovie)}
          title={`Нажми, чтобы открыть карточку: «${hubMovie.title}»`}
          className={`group absolute left-1/2 top-1/2 z-20 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-3 border-amber-400 bg-surface shadow-[0_0_25px_rgba(0,0,0,0.9)] transition-all duration-300 hover:scale-105 sm:h-32 sm:w-32 ${
            settled ? "win-glow ring-4 ring-accent" : ""
          }`}
        >
          {hubMovie.posterPath ? (
            <Poster movie={hubMovie} className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0">
              <PosterArt movie={hubMovie} />
            </div>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-1.5 opacity-90 transition-opacity group-hover:opacity-100">
            <span className="font-display truncate text-[0.625rem] font-bold text-amber-200">
              {hubMovie.title}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Основной блок ------------------------------- */

export function SpinTrack({
  mode,
  pool,
  winner,
  nonce,
  soundEnabled = true,
  onSettled,
  onSelectMovie,
}: {
  mode: SpinMode;
  pool: Movie[];
  winner: Movie;
  nonce: number;
  soundEnabled?: boolean;
  onSettled: () => void;
  onSelectMovie?: (movie: Movie) => void;
}) {
  const geo = GEO[mode];
  const laneSettled = useCallback(() => onSettled(), [onSettled]);
  const noop = useCallback(() => undefined, []);

  // Казино рулетка
  if (mode === "wheel") {
    return (
      <CasinoWheel
        pool={pool}
        winner={winner}
        nonce={nonce}
        soundEnabled={soundEnabled}
        onSettled={laneSettled}
        onSelectMovie={onSelectMovie}
      />
    );
  }

  if (mode === "horizontal") {
    return (
      <div className="relative mx-auto w-full max-w-3xl">
        <div
          className="theme-track-frame relative overflow-hidden rounded-2xl border border-line bg-surface/70"
          style={{ height: geo.itemH + 68, padding: "34px 12px" }}
        >
          <Lane
            axis="x"
            pool={pool}
            winner={winner}
            itemW={geo.itemW}
            itemH={geo.itemH}
            gap={geo.gap}
            duration={MAIN_DURATION}
            spinSteps={22}
            nonce={nonce}
            soundEnabled={soundEnabled}
            playWinOnSettle={true}
            onSettled={laneSettled}
            onSelectMovie={onSelectMovie}
          />
          <div className="fade-left pointer-events-none absolute inset-y-0 left-0 w-16" />
          <div className="fade-right pointer-events-none absolute inset-y-0 right-0 w-16" />
        </div>
      </div>
    );
  }

  if (mode === "vertical") {
    return (
      <div className="relative mx-auto" style={{ width: geo.itemW + 64 }}>
        <div
          className="theme-track-frame relative overflow-hidden rounded-2xl border border-line bg-surface/70"
          style={{ height: geo.itemH + 64, width: geo.itemW + 64, padding: "32px 32px" }}
        >
          <Lane
            axis="y"
            pool={pool}
            winner={winner}
            itemW={geo.itemW}
            itemH={geo.itemH}
            gap={geo.gap}
            duration={MAIN_DURATION}
            spinSteps={20}
            nonce={nonce}
            soundEnabled={soundEnabled}
            playWinOnSettle={true}
            onSettled={laneSettled}
            onSelectMovie={onSelectMovie}
          />
          <div className="fade-top pointer-events-none absolute inset-x-0 top-0 h-14" />
          <div className="fade-bottom pointer-events-none absolute inset-x-0 bottom-0 h-14" />
        </div>
      </div>
    );
  }

  // Режим слот-машины (3 барабана)
  return (
    <div className="relative mx-auto w-fit">
      <div className="theme-track-frame glow-ring flex items-stretch gap-3 rounded-2xl border border-line bg-surface/80 p-3">
        {[16, 20, 24].map((steps, laneIndex) => (
          <div
            key={laneIndex}
            className="relative overflow-hidden rounded-xl bg-bg-soft"
            style={{ width: geo.itemW + 36, height: geo.itemH + 56, padding: "28px 18px" }}
          >
            <Lane
              axis="y"
              pool={pool}
              winner={winner}
              itemW={geo.itemW}
              itemH={geo.itemH}
              gap={geo.gap}
              duration={SLOT_DURATIONS[laneIndex]}
              spinSteps={steps}
              nonce={nonce}
              soundEnabled={soundEnabled}
              playWinOnSettle={laneIndex === SLOT_DURATIONS.length - 1}
              onSettled={laneIndex === SLOT_DURATIONS.length - 1 ? laneSettled : noop}
              onSelectMovie={onSelectMovie}
            />
            <div className="fade-top pointer-events-none absolute inset-x-0 top-0 h-12" />
            <div className="fade-bottom pointer-events-none absolute inset-x-0 bottom-0 h-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

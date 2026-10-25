"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney, formatRating, formatRuntime, formatYear } from "@/lib/format";
import type { Movie } from "@/lib/movies";
import { Poster } from "./Poster";
import { Field, Unknown } from "./Unknown";

function Trailer({ trailerKey, title }: { trailerKey: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black">
      {playing ? (
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
          title={`Трейлер «${title}»`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group relative flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-fg transition-colors hover:bg-black/50"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-xl transition-transform duration-200 group-hover:scale-110">
            <span className="ml-1 text-2xl font-bold">▶</span>
          </div>
          <span className="font-display text-sm font-bold tracking-wide">
            Смотреть трейлер
          </span>
        </button>
      )}
    </div>
  );
}

export function MovieModal({
  movie,
  onClose,
}: {
  movie: Movie | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocus = useRef<Element | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [movie?.id]);

  const handleShare = async () => {
    if (!movie || typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("movie", movie.id);
      const shareUrl = url.toString();

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!movie) return;

    restoreFocus.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      const node = restoreFocus.current;
      if (node instanceof HTMLElement) node.focus();
    };
  }, [movie, onClose]);

  if (!movie) return null;

  const money = {
    budget: formatMoney(movie.budget),
    revenue: formatMoney(movie.revenue),
  };
  const runtime = formatRuntime(movie.runtime);
  const rating = formatRating(movie.rating);
  const year = formatYear(movie.year);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Фильм «${movie.title}»`}
        tabIndex={-1}
        className="pop panel relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl outline-none sm:max-h-[88dvh] sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="btn btn-ghost absolute top-3 right-3 z-10 h-9 w-9 text-lg leading-none"
        >
          ✕
        </button>

        <div className="overflow-y-auto overscroll-contain">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
            <Poster
              movie={movie}
              className="aspect-[2/3] w-32 shrink-0 rounded-2xl sm:w-44"
            />

            <div className="min-w-0 flex-1">
              <h2 className="font-display pr-10 text-xl leading-tight font-extrabold sm:text-2xl">
                {movie.title}
              </h2>
              {movie.originalTitle && movie.originalTitle !== movie.title ? (
                <p className="mt-1 text-sm text-muted">{movie.originalTitle}</p>
              ) : null}

              {movie.tagline ? (
                <p className="mt-2 text-sm text-accent italic">«{movie.tagline}»</p>
              ) : null}

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                <Field label="Год" value={year} />
                <Field label="Режиссёр" value={movie.director} />
                <Field label="Длительность" value={runtime} />
                <Field label="Рейтинг" value={rating} />
                <Field label="Бюджет" value={money.budget} />
                <Field label="Сборы" value={money.revenue} />
              </dl>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {movie.genres.length > 0 ? (
                  movie.genres.map((genre) => (
                    <span key={genre} className="chip" data-active="false">
                      {genre}
                    </span>
                  ))
                ) : (
                  <Unknown>жанры не указаны</Unknown>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5 px-5 pb-6 sm:px-6">
            <section>
              <h3 className="font-display text-xs tracking-[0.16em] text-muted uppercase">
                О чём
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed">
                {movie.overview ? movie.overview : <Unknown>описания нет</Unknown>}
              </p>
            </section>

            <section>
              <h3 className="font-display text-xs tracking-[0.16em] text-muted uppercase">
                Сюжет
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed">
                {movie.plot ? movie.plot : <Unknown>сюжет нам не рассказали</Unknown>}
              </p>
            </section>

            <section>
              <h3 className="font-display text-xs tracking-[0.16em] text-muted uppercase">
                Трейлер
              </h3>
              {movie.trailerKey ? (
                <Trailer key={movie.id} trailerKey={movie.trailerKey} title={movie.title} />
              ) : (
                <p className="mt-2 text-[0.9375rem]">
                  <Unknown>трейлера нет</Unknown>
                </p>
              )}
            </section>
          </div>
        </div>

        {/* Нижняя панель действий со ссылкой «Поделиться» */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line/70 bg-surface-2/80 px-5 py-3.5 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={handleShare}
            className={`btn h-11 px-5 text-sm font-semibold transition-all ${
              copied
                ? "border-accent bg-accent text-accent-fg shadow-[0_0_20px_rgba(var(--glow)/0.4)]"
                : "btn-primary"
            }`}
          >
            <span aria-hidden>{copied ? "✓" : "🔗"}</span>
            <span>{copied ? "Ссылка скопирована!" : "Поделиться фильмом"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost h-11 px-4 text-sm text-muted hover:text-fg"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

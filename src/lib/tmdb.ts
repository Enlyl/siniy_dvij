import type { Movie, MovieDetails } from "./movies";

const API = "https://api.themoviedb.org/3";

export function tmdbKey(): string | null {
  const key =
    process.env.TMDB_API_KEY ||
    process.env.TMDB_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_TMDB_API_KEY ||
    "";
  return key.trim() ? key.trim() : null;
}

export function isTmdbConfigured(): boolean {
  return tmdbKey() !== null;
}

type TmdbJson = Record<string, unknown>;

async function tmdbFetch(path: string, params: Record<string, string> = {}): Promise<TmdbJson | null> {
  const key = tmdbKey();
  if (!key) return null;

  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const headers: Record<string, string> = { accept: "application/json" };
  if (key.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${key}`;
  } else {
    url.searchParams.set("api_key", key);
  }

  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as TmdbJson;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): TmdbJson | null {
  return value && typeof value === "object" ? (value as TmdbJson) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-zа-я0-9]/gi, "");
}

async function findTmdbId(movie: Pick<Movie, "title" | "originalTitle" | "year">): Promise<number | null> {
  const queries = [movie.originalTitle, movie.title].filter(
    (q): q is string => Boolean(q && q.trim()),
  );

  const targetTitles = [movie.title, movie.originalTitle]
    .filter((t): t is string => Boolean(t))
    .map(normTitle);

  for (const query of queries) {
    let data = await tmdbFetch("/search/movie", {
      query,
      year: String(movie.year),
      language: "ru-RU",
      include_adult: "false",
    });
    let results = asArray(data?.results).map(asRecord).filter(Boolean) as TmdbJson[];

    if (results.length === 0) {
      data = await tmdbFetch("/search/movie", {
        query,
        language: "ru-RU",
        include_adult: "false",
      });
      results = asArray(data?.results).map(asRecord).filter(Boolean) as TmdbJson[];
    }

    if (results.length === 0) continue;

    // Сначала ищем точное совпадение по названию и году
    const exactTitleAndYear = results.find((item) => {
      const orig = asString(item.original_title);
      const tit = asString(item.title);
      const rel = asString(item.release_date);
      const titleMatches =
        (orig && targetTitles.includes(normTitle(orig))) ||
        (tit && targetTitles.includes(normTitle(tit)));
      const yearMatches = rel ? rel.startsWith(String(movie.year)) : false;
      return titleMatches && yearMatches;
    });

    if (exactTitleAndYear) {
      const id = asNumber(exactTitleAndYear.id);
      if (id) return id;
    }

    // Если год отличается на 1 (мировая премьера vs релиз), берем точное совпадение названия
    const exactTitle = results.find((item) => {
      const orig = asString(item.original_title);
      const tit = asString(item.title);
      return (
        (orig && targetTitles.includes(normTitle(orig))) ||
        (tit && targetTitles.includes(normTitle(tit)))
      );
    });

    if (exactTitle) {
      const id = asNumber(exactTitle.id);
      if (id) return id;
    }

    const hit = results[0];
    const id = asNumber(hit?.id);
    if (id) return id;
  }
  return null;
}

/**
 * Тянет карточку из TMDB: сначала ru-RU, затем, если русский текст пустой,
 * добирает en-US и подставляет его как «перевод-заглушку».
 */
export async function enrichMovie(
  movie: Pick<Movie, "title" | "originalTitle" | "year">,
): Promise<MovieDetails | null> {
  if (!isTmdbConfigured()) return null;

  const id = await findTmdbId(movie);
  if (!id) return null;

  const append = "credits,videos";
  const ru = await tmdbFetch(`/movie/${id}`, { language: "ru-RU", append_to_response: append });
  if (!ru) return null;

  const needsFallback = !asString(ru.overview) || !asString(ru.tagline);
  const en = needsFallback
    ? await tmdbFetch(`/movie/${id}`, { language: "en-US", append_to_response: append })
    : null;

  const overview = asString(ru.overview) ?? asString(en?.overview);
  const tagline = asString(ru.tagline) ?? asString(en?.tagline);

  const crew = asArray(asRecord(ru.credits)?.crew).map(asRecord).filter(Boolean) as TmdbJson[];
  const director = crew
    .filter((person) => asString(person.job) === "Director")
    .map((person) => asString(person.name))
    .filter((name): name is string => Boolean(name))
    .join(", ");

  const genres = asArray(ru.genres)
    .map(asRecord)
    .filter(Boolean)
    .map((genre) => asString((genre as TmdbJson).name))
    .filter((name): name is string => Boolean(name));

  const videos = asArray(asRecord(ru.videos)?.results).map(asRecord).filter(Boolean) as TmdbJson[];
  const trailer =
    videos.find(
      (video) =>
        asString(video.site) === "YouTube" &&
        asString(video.type) === "Trailer" &&
        asString(video.iso_639_1) === "ru",
    ) ??
    videos.find(
      (video) => asString(video.site) === "YouTube" && asString(video.type) === "Trailer",
    );
  const trailerKey = asString(trailer?.key);

  const releaseDate = asString(ru.release_date) ?? asString(en?.release_date);
  const runtime = asNumber(ru.runtime) ?? asNumber(en?.runtime);

  const details: MovieDetails = {
    title: asString(ru.title) ?? asString(ru.original_title) ?? movie.title,
    originalTitle: asString(ru.original_title) ?? movie.originalTitle,
    year: releaseDate ? Number(releaseDate.slice(0, 4)) || movie.year : movie.year,
    director: director || undefined,
    genres: genres.length ? genres : undefined,
    overview,
    tagline,
    runtime,
    rating: asNumber(ru.vote_average) ?? asNumber(en?.vote_average),
    budget: asNumber(ru.budget) ?? asNumber(en?.budget),
    revenue: asNumber(ru.revenue) ?? asNumber(en?.revenue),
    trailerKey,
    posterPath: asString(ru.poster_path) ?? asString(en?.poster_path) ?? null,
  };

  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  ) as MovieDetails;
}

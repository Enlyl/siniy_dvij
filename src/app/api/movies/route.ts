import { getMovieById } from "@/lib/movies";
import { enrichMovie, isTmdbConfigured } from "@/lib/tmdb";

type EnrichRequest = {
  ids?: unknown;
};

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  });

  await Promise.all(runners);
  return results;
}

const CACHE = new Map<string, unknown>();

export async function POST(request: Request) {
  if (!isTmdbConfigured()) {
    return Response.json({ configured: false, details: {} });
  }

  let body: EnrichRequest;
  try {
    body = (await request.json()) as EnrichRequest;
  } catch {
    return Response.json({ configured: true, details: {} }, { status: 400 });
  }

  const ids = Array.from(
    new Set(
      (Array.isArray(body.ids) ? body.ids : [])
        .filter((id): id is string => typeof id === "string")
        .slice(0, 150),
    ),
  );

  const movies = ids.map(getMovieById).filter((movie) => movie !== undefined);

  const enriched = await mapWithConcurrency(movies, 8, async (movie) => {
    if (CACHE.has(movie.id)) {
      return [movie.id, CACHE.get(movie.id)] as const;
    }
    const details = await enrichMovie(movie);
    if (details) CACHE.set(movie.id, details);
    return [movie.id, details] as const;
  });

  const details: Record<string, unknown> = {};
  for (const [id, value] of enriched) {
    if (value) details[id] = value;
  }

  return Response.json({ configured: true, details });
}

import type { Movie } from "./movies";

export const EASTER_EGG_ID = "easter-egg-mirror";
export const EASTER_EGG_SPIN_THRESHOLD = 15; // После 15 круток подряд (на 16-ю)

export const EASTER_EGG_MOVIE: Movie = {
  id: EASTER_EGG_ID,
  title: "Не знаешь что посмотреть? Посмотри во что ты превратился",
  originalTitle: "Look What You've Become",
  year: new Date().getFullYear(),
  director: "Твоя нерешительность",
  genres: ["Трагикомедия", "Бытовой хоррор", "Зеркало"],
  overview:
    "Ты крутишь эту рулетку уже больше 15 раз подряд. Пиво греется, чипсы кончаются, вечер неумолимо тает. Посмотри в зеркало — кино уже идёт, и ты в нём главный герой.",
  plot:
    "Увлекательная драма об отчаянных попытках найти «тот самый идеальный фильм». Главный герой свайпает и крутит барабан в 16-й раз, надеясь на чудо, пока вечер тихо переходит в ночь. В ролях: ты, диван и нетронутая бутылка.",
  tagline: "16 круток спустя...",
  runtime: 0,
  rating: 0.1,
  budget: 0,
  revenue: 0,
  posterPath: null,
};

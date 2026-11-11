import type { Movie } from "./movies";

export const EASTER_EGG_ID = "easter-egg-mirror";
export const EASTER_EGG_SPIN_THRESHOLD = 16; // После 16 круток подряд (на 17-ю)

export const EASTER_EGG_MOVIE: Movie = {
  id: EASTER_EGG_ID,
  title: "Не знаешь что посмотреть? Посмотри во что ты превратился",
  originalTitle: "Look What You've Become",
  year: new Date().getFullYear(),
  director: "Твоя нерешительность",
  actors: ["Ты (в главной роли)", "Диван", "Холодильник", "Твоя совесть", "Пиво"],
  genres: ["Трагикомедия", "Бытовой хоррор", "Зеркало"],
  overview:
    "Ты крутишь эту рулетку уже больше 16 раз подряд. Пиво греется, чипсы кончаются, вечер неумолимо тает. Посмотри в зеркало — кино уже идёт, и ты в нём главный герой.",
  plot:
    "Увлекательная драма об отчаянных попытках найти «тот самый идеальный фильм». Главный герой свайпает и крутит барабан в 17-й раз, надеясь на чудо, пока вечер тихо переходит в ночь. В ролях: ты, диван и нетронутая бутылка.",
  tagline: "17 круток спустя...",
  runtime: 0,
  rating: 0.1,
  budget: 0,
  revenue: 0,
  posterPath: null,
};

export const BROKEBACK_MOUNTAIN_ID = "brokeback-mountain";
export const BROKEBACK_UNLOCK_THRESHOLD = 3; // После 3 круток начинает участвовать в рулетке

export const BROKEBACK_MOUNTAIN_MOVIE: Movie = {
  id: BROKEBACK_MOUNTAIN_ID,
  title: "Горбатая гора",
  originalTitle: "Brokeback Mountain",
  year: 2005,
  director: "Энг Ли",
  actors: ["Ты", "Ты"],
  genres: ["Драма", "Мелодрама"],
  overview: "Ахаха хахахахах ахах ха ха ха",
  plot: "Ахаха хахахахах ахах ха ха ха",
  tagline: "Ахаха хахахахах ахах ха ха ха",
  runtime: 134,
  rating: 7.7,
  budget: 14000000,
  revenue: 178043761,
  posterPath: "/nunI538UpO4xnNmpRAWmMQP93Y3.jpg",
  trailerKey: "Wm7WfkjDdBs",
};

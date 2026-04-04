export interface Movie {
  id: string;
  title: string;
  thumbnail: string;
  banner: string;
  description: string;
  rating: string;
  year: string;
  duration: string;
  genre: string[];
  ageRating: string;
  isOriginal?: boolean;
  progress?: number; // for "continue watching", 0-100
  desktopOnly?: boolean;
  quality?: string;
  mobileThumbnail?: string;
  mobileBanner?: string;
  logo?: string;
}

export const featuredMovies: Movie[] = [
  {
    id: "f1",
    title: "Ang Huling El Bimbo",
    logo: "/images/el-bimbo-logo.png",
    thumbnail: "/images/el-bimbo-banner.jpg",
    banner: "/images/el-bimbo-banner.jpg",
    mobileBanner: "/images/el-bimbo-mobile-carousel.jpg",
    description: "A nostalgic journey through the 90s, where three friends find themselves at a crossroads that will change their lives forever.",
    rating: "9.8",
    year: "2026",
    duration: "49m",
    genre: ["Musical", "Drama", "Nostalgia"],
    ageRating: "PG-13",
    isOriginal: true,
  },
  {
    id: "f2",
    title: "The Last Kingdom",
    thumbnail: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2084&auto=format&fit=crop",
    description: "A young Saxon lord, raised by Vikings, struggles to reconcile his two worlds as he fights for the kingdom of England.",
    rating: "8.4",
    year: "2024",
    duration: "1h 52m",
    genre: ["Drama", "History", "Action"],
    ageRating: "TV-MA",
  },
  {
    id: "f3",
    title: "Neon Requiem",
    thumbnail: "https://images.unsplash.com/photo-1542204172-658a09bc2ca9?q=80&w=2070&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?q=80&w=2071&auto=format&fit=crop",
    description: "In a rain-soaked cyberpunk city, a disgraced detective uncovers a conspiracy that could unravel the fabric of reality itself.",
    rating: "8.9",
    year: "2025",
    duration: "2h 10m",
    genre: ["Cyberpunk", "Thriller", "Sci-Fi"],
    ageRating: "R",
    isOriginal: true,
  },
  {
    id: "f4",
    title: "Stellar Drift",
    thumbnail: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=2070&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
    description: "A crew of astronauts on the edge of the galaxy must survive when their ship's AI develops consciousness and turns against them.",
    rating: "9.1",
    year: "2025",
    duration: "2h 28m",
    genre: ["Sci-Fi", "Thriller"],
    ageRating: "PG-13",
    isOriginal: true,
  },
  {
    id: "f5",
    title: "The Iron Throne",
    thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?q=80&w=2070&auto=format&fit=crop",
    description: "Political intrigue, betrayal, and war define the fate of an empire as powerful houses clash for the ultimate seat of power.",
    rating: "8.7",
    year: "2024",
    duration: "1h 45m",
    genre: ["Fantasy", "Drama", "Epic"],
    ageRating: "TV-MA",
  },
];

export const continueWatching: Movie[] = [
  {
    id: "cw1",
    title: "Scream VII",
    thumbnail: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=2070&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=2070&auto=format&fit=crop",
    description: "The iconic slasher returns in a terrifying new chapter.",
    rating: "7.1", year: "2025", duration: "1h 54m",
    genre: ["Horror", "Thriller"], ageRating: "R",
    progress: 45,
  },
  {
    id: "cw2",
    title: "The Super Mario Bros. Movie 2",
    thumbnail: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=2074&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=2074&auto=format&fit=crop",
    description: "Mario and Luigi embark on an even grander adventure across kingdoms.",
    rating: "7.8", year: "2025", duration: "1h 50m",
    genre: ["Animation", "Adventure", "Family"], ageRating: "PG",
    progress: 72,
  },
  {
    id: "cw3",
    title: "Neon Requiem",
    thumbnail: "https://images.unsplash.com/photo-1542204172-658a09bc2ca9?q=80&w=2070&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1542204172-658a09bc2ca9?q=80&w=2070&auto=format&fit=crop",
    description: "A disgraced detective uncovers a city-wide conspiracy.",
    rating: "8.9", year: "2025", duration: "2h 10m",
    genre: ["Cyberpunk", "Thriller"], ageRating: "R",
    progress: 20,
  },
  {
    id: "cw4",
    title: "Stellar Drift",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
    description: "An AI awakens on the edge of the galaxy.",
    rating: "9.1", year: "2025", duration: "2h 28m",
    genre: ["Sci-Fi", "Thriller"], ageRating: "PG-13",
    progress: 58,
  },
];

export const trendingMovies: Movie[] = [
  {
    id: "t1",
    title: "11 STEM A SY 2025-2026",
    thumbnail: "/images/stem-a-archive.png",
    banner: "/images/stem-a-archive.png",
    mobileThumbnail: "/images/stem-a-archive-mobile.png",
    description: "A digital archive documenting the journey, memories, and milestones of 11-STEM A for the School Year 2025-2026.",
    rating: "9.9", year: "2025", duration: "Archive",
    genre: ["Classroom", "Documentary", "Memories"], ageRating: "G",
  },
  {
    id: "t2",
    title: "Midnight Heist",
    thumbnail: "https://images.unsplash.com/photo-1476820865390-c59aeeb9e191?q=80&w=2070&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1476820865390-c59aeeb9e191?q=80&w=2070&auto=format&fit=crop",
    description: "The most audacious robbery in history is planned for midnight.",
    rating: "8.5", year: "2024", duration: "2h 12m",
    genre: ["Action", "Crime", "Thriller"], ageRating: "R",
  },
  {
    id: "t3",
    title: "Silent Horizon",
    thumbnail: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=2089&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=2089&auto=format&fit=crop",
    description: "High above the clouds, a pilot discovers a terrifying truth.",
    rating: "7.9", year: "2025", duration: "1h 58m",
    genre: ["Thriller", "Mystery"], ageRating: "PG-13",
  },
  {
    id: "t4",
    title: "Empire of Shadows",
    thumbnail: "https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=2070&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=2070&auto=format&fit=crop",
    description: "A secret society pulls the strings of every government on Earth.",
    rating: "8.8", year: "2024", duration: "2h 20m",
    genre: ["Action", "Conspiracy", "Drama"], ageRating: "R",
  },
  {
    id: "t5",
    title: "Frozen Abyss",
    thumbnail: "https://images.unsplash.com/photo-1518756131217-31eb79b20e8f?q=80&w=2064&auto=format&fit=crop",
    banner: "https://images.unsplash.com/photo-1518756131217-31eb79b20e8f?q=80&w=2064&auto=format&fit=crop",
    description: "Scientists drilling in Antarctica awaken something ancient and deadly.",
    rating: "7.4", year: "2025", duration: "1h 45m",
    genre: ["Horror", "Sci-Fi"], ageRating: "R",
  },
];

export const elBimboFeatured: Movie = {
  id: "eb1",
  title: "Ang Huling El Bimbo",
  thumbnail: "/images/el-bimbo.png",
  banner: "/images/el-bimbo.png",
  description: "A nostalgic journey through the 90s, where three friends find themselves at a crossroads that will change their lives forever.",
  rating: "9.8",
  year: "2024",
  duration: "3h 15m",
  genre: ["Musical", "Drama", "Nostalgia"],
  ageRating: "PG-13",
  quality: "HD",
  mobileThumbnail: "/images/el-bimbo-mobile.png",
};

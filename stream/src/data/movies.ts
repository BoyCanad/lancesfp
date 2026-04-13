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
  contentWarnings?: string[];
  isOriginal?: boolean;
  progress?: number; // for "continue watching", 0-100
  desktopOnly?: boolean;
  quality?: string;
  mobileThumbnail?: string;
  mobileBanner?: string;
  cardBanner?: string;
  mobileCardBanner?: string;
  logo?: string;
  videoUrl?: string;
  subtitles?: {
    label: string;
    srclang: string;
    url: string;
  }[];
  trailerUrl?: string;
  trailerVttUrl?: string;
  spriteUrl?: string;
  spriteConfig?: {
    rows: number;
    cols: number;
    interval: number;
    thumbWidth: number;
    thumbHeight: number;
  };
  downloadUrl?: string;
}

export const featuredMovies: Movie[] = [
  {
    id: "f1",
    title: "Ang Huling El Bimbo Play",
    logo: "/images/el-bimbo-logo.webp",
    thumbnail: "/images/el-bimbo.webp",
    banner: "/images/el-bimbo-banner.jpg",
    cardBanner: "/images/el-bimbo-detail.webp",
    mobileCardBanner: "/images/el-bimbo.webp",
    mobileBanner: "/images/el-bimbo-mobile-carousel.jpg",
    description: "A nostalgic journey through the 90s, where three friends find themselves at a crossroads that will change their lives forever.",
    rating: "9.8",
    year: "2026",
    duration: "49m 51s",
    genre: ["Musical", "Drama", "Nostalgia"],
    ageRating: "PG-13",
    contentWarnings: ["mature themes", "language", "violence", "alcohol use"],
    isOriginal: true,
    videoUrl: "https://boycanad.github.io/stream-storage-1/new_index.m3u8",
    downloadUrl: "https://video-proxy.booran-special.workers.dev/",
    trailerUrl: "https://boycanad.github.io/stream-storage-1/trailer.mp4",
    subtitles: [
      {
        label: "Filipino",
        srclang: "fil",
        url: "https://boycanad.github.io/stream-storage-1/AngHulingElBimboPlay.vtt"
      },
      {
        label: "English",
        srclang: "en",
        url: "https://boycanad.github.io/stream-storage-1/AngHulingElBimboPlayEnglish.vtt"
      }
    ],
    spriteUrl: "/images/storyboards/sprite_5s_hq_synced.jpg",
    spriteConfig: {
      rows: 30,
      cols: 20,
      interval: 5,
      thumbWidth: 320,
      thumbHeight: 180
    }
  },
  {
    id: "f2",
    title: "Minsan",
    logo: "/images/minsan-logo.webp",
    thumbnail: "/images/minsan.webp",
    banner: "/images/minsan-banner.webp",
    mobileBanner: "/images/minsan-mobile-carousel.webp",
    cardBanner: "/images/minsan.webp",
    description: "“Minsan” is a heartfelt reflection on friendship, nostalgia, and the bittersweet passage of time. It tells the story of people who once shared deep connections and carefree moments, only to drift apart as life moves forward.",
    rating: "9.5",
    year: "2026",
    duration: "5m",
    genre: ["Musical", "Drama", "Nostalgia"],
    ageRating: "PG-13",
    videoUrl: "https://ebrdhrulyjxleytptrpf.supabase.co/storage/v1/object/public/titles/Minsan/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/MINSAN_TRAILER_MOBILE.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/TRAILER.vtt",
  },
  {
    id: "f3",
    title: "11 STEM A SY 2025-2026",
    logo: "/images/stem-a-logo.webp",
    thumbnail: "/images/stem-a-archive-banner.webp",
    banner: "/images/stem-a-archive-banner.webp",
    mobileBanner: "/images/stem-a-mobile-carousel.webp",
    description: "A digital archive documenting the journey, memories, and milestones of 11-STEM A for the School Year 2025-2026.",
    rating: "9.9",
    year: "2026",
    duration: "Archive",
    genre: ["Classroom", "Documentary", "Memories"],
    ageRating: "G",
    isOriginal: true,
  },
  {
    id: "f4",
    title: "Tindahan ni Aling Nena",
    logo: "/images/tindahan-logo.webp",
    thumbnail: "/images/tindahan.webp",
    banner: "/images/tindahan.webp",
    description: "A lively and colorful performance of “Tindahan ni Aling Nena” from Ang Huling El Bimbo, this scene brings energy and humor while subtly reflecting the group’s youthful bond and everyday life.",
    rating: "9.7",
    year: "2026",
    duration: "6m",
    genre: ["Musical", "Drama", "Nostalgia"],
    ageRating: "PG-13",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/Tindahan_TRAILER_MOBILE.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/Tindahan_TRAILER_MOBILE.vtt",
  },
  {
    id: "f5",
    title: "Alapaap/Overdrive",
    logo: "/images/alapaap-logo.webp",
    thumbnail: "/images/alapaap.webp",
    banner: "/images/alapaap.webp",
    description: "An electrifying performance of “Alapaap / Overdrive” from Ang Huling El Bimbo, this scene captures the characters’ youthful rebellion and desire for freedom. Fueled by high energy and raw emotion, it reflects their escape from reality and the thrill of living in the moment—while hinting at the impulsive choices and inner conflicts that will shape their journey as the story unfolds.",
    rating: "9.8",
    year: "2026",
    duration: "20m",
    genre: ["Musical", "Drama", "Nostalgia"],
    ageRating: "PG-13",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/Alapaap_TRAILER_MOBILE.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/Alapaap_TRAILER_MOBILE.vtt",
  },
  {
    id: "f6",
    title: "Spoliarium/Graduation",
    logo: "/images/spoliarium-logo.webp",
    thumbnail: "/images/spoliarium.webp",
    banner: "/images/spoliarium.webp",
    description: "The Spoliarium/Graduation sequence is a haunting shift from trauma to irony. It begins with the visceral \u201cSpoliarium\u201d tableau, symbolizing Joy\u2019s violation and the death of her innocence, before cutting to the bittersweet Graduation ceremony. Amidst the celebration, Marko finally confesses his love to Joy, a heartbreaking declaration of a future already shattered by the darkness that preceded it.",
    rating: "9.9",
    year: "2026",
    duration: "25m",
    genre: ["Musical", "Drama", "Nostalgia"],
    ageRating: "PG-13",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/Spoliarium_TRAILER_MOBILE.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/Spoliarium_TRAILER_MOBILE.vtt",
  },
  {
    id: "f7",
    title: "Pare Ko",
    logo: "/images/pare-ko-logo.webp",
    thumbnail: "/images/pare-ko.webp",
    banner: "/images/pare-ko-detail.webp",
    mobileBanner: "/images/pare-ko-detail-mobile.webp",
    cardBanner: "/images/pare-ko.webp",
    description: "The \"Pare Ko\" performance is a high-energy, fan-favorite sequence that captures the chaotic brotherhood of ROTC training. Set to the Eraserheads' iconic anthem of heartbreak and camaraderie, the scene features the boys—Marco, Edrian, Xian—navigating the rigors of military drills while lamenting a \"friendzone\" romance. The choreography is sharp and rhythmic, using wooden rifles and marching formations to turn military discipline into a vibrant musical spectacle. It perfectly balances comedic relief with the raw, relatable angst of young love, solidifying the deep bond between the three lead characters.",
    rating: "9.6",

    year: "2026",
    duration: "18m",
    genre: ["Musical", "Drama", "Nostalgia"],
    ageRating: "PG-13",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/PareKo_TRAILER_MOBILE.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/PareKo_TRAILER_MOBILE.vtt",
  },
  {
    id: "f8",
    title: "Tama Ka/Ligaya",
    logo: "/images/tama-ka-logo.webp",
    thumbnail: "/images/tama-ka.webp",
    mobileThumbnail: "/images/tama-ka-mobile.webp",
    banner: "/images/tama-ka-detail.webp",
    mobileBanner: "/images/tama-ka-detail-mobile.webp",
    cardBanner: "/images/tama-ka.webp",
    mobileCardBanner: "/images/tama-ka-mobile.webp",
    description: "The \"Tama Ka / Ligaya\" mashup masterfully contrasts the cold finality of a breakup with the haunting warmth of happier memories. By weaving the somber acceptance of \"Tama Ka\" into the upbeat nostalgia of \"Ligaya,\" the performance captures the bittersweet irony of finding oneself at the end of a relationship while still clinging to the \"happiness\" that used to be.",
    rating: "9.8",
    year: "2026",
    duration: "22m",
    genre: ["Musical", "Drama", "Nostalgia"],
    ageRating: "PG-13",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/TamaKa_TRAILER_MOBILE.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/TamaKa_TRAILER_MOBILE.vtt",
  },
  {
    id: "f9",
    title: "Ang Huling El Bimbo",
    logo: "/images/huling-el-bimbo-logo.webp",
    thumbnail: "/images/huling-el-bimbo.webp",
    mobileThumbnail: "/images/huling-el-bimbo-mobile.webp",
    banner: "/images/huling-el-bimbo-detail.webp",
    mobileBanner: "/images/huling-el-bimbo-detail-mobile.webp",
    cardBanner: "/images/huling-el-bimbo.webp",
    mobileCardBanner: "/images/huling-el-bimbo-mobile.webp",
    description: "The \"Ang Huling El Bimbo\" performance is a heart-wrenching finale that mirrors the grace of a lost past against the tragedy of the present. It serves as a nostalgic tribute to Joy, the \"Paraluman\" of their youth, capturing the painful regret of a friendship and a dance that ended too soon. This iconic sequence brings the story full circle, leaving the audience with the haunting beauty of a dream that can never be reclaimed.",
    rating: "9.9",
    year: "2026",
    duration: "30m",
    genre: ["Musical", "Drama", "Nostalgia"],
    ageRating: "PG-13",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/ElBimbo_TRAILER_MOBILE.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/ElBimbo_TRAILER_MOBILE.vtt",
  },
  {
    id: "f10",
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
    id: "f11",
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
    thumbnail: "/images/stem-a-archive.webp",
    banner: "/images/stem-a-archive.webp",
    mobileThumbnail: "/images/stem-a-archive-mobile.webp",
    description: "A digital archive documenting the journey, memories, and milestones of 11-STEM A for the School Year 2025-2026.",
    rating: "9.9", year: "2026", duration: "Archive",
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
  title: "Ang Huling El Bimbo Play",
  logo: "/images/el-bimbo-logo.webp",
  thumbnail: "/images/el-bimbo.webp",
  banner: "/images/el-bimbo.webp",
  description: "A nostalgic journey through the 90s, where three friends find themselves at a crossroads that will change their lives forever.",
  rating: "9.8",
  year: "2026",
  duration: "49m 51s",
  genre: ["Musical", "Drama", "Nostalgia"],
  ageRating: "PG-13",
  contentWarnings: ["mature themes", "language", "violence", "alcohol use"],
  quality: "HD",
  mobileThumbnail: "/images/el-bimbo-mobile.webp",
  videoUrl: "https://boycanad.github.io/stream-storage-1/new_index.m3u8",
  trailerUrl: "https://boycanad.github.io/stream-storage-1/trailer.mp4",
};


export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
}

export interface Season {
  id: string;
  seasonNumber: number;
  title: string;
  episodes: Episode[];
}

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
  streamStatus?: 'live' | 'scheduled' | 'offline';
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
  seasons?: Season[];
  squareThumbnail?: string;
  tallTrailerUrl?: string;
}

export const makingOfLegacy: Movie = {
  id: "beyond-the-last-dance",
  title: "Beyond The Last Dance",
  logo: "/images/BTLD-logo.webp",
  thumbnail: "/images/BTLD.webp",
  mobileThumbnail: "/images/BTLD-mobile.webp",
  cardBanner: "/images/BTLD.webp",
  mobileCardBanner: "/images/BTLD-mobile.webp",
  banner: "/images/BTLD-banner.webp",
  mobileBanner: "/images/BTLD-mobile-banner.webp",
  description: "A behind-the-scenes look at the creative journey, the challenges, and the heart that went into crafting the multi-awarded musical masterpiece, Ang Huling El Bimbo.",
  rating: "10.0",
  year: "2026",
  duration: "1h 15m",
  genre: ["Documentary", "Behind the Scenes", "Ang Huling El Bimbo"],
  ageRating: "G",
  isOriginal: true,
  videoUrl: "", // Need video URL
  trailerUrl: "", // Need trailer URL
};

export const afterHours: Movie = {
  id: "after-hours",
  title: "After Hours",
  logo: "/images/AFTER%20HOURS-logo.png",
  thumbnail: "/images/after-hours.webp",
  mobileThumbnail: "/images/after-hours-mobile.webp",
  banner: "/images/AFTER%20HOURS-banner.gif",
  mobileBanner: "/images/AFTER%20HOURS-banner.gif",
  description: "Join us for After Hours, the official 11-STEM A live stream series! Experience real-life moments, candid conversations, and exclusive behind-the-scenes vibes as we document our final journey together.",
  rating: "10.0",
  year: "2026",
  duration: "LIVE",
  genre: ["Live", "Documentary", "Classroom"],
  ageRating: "PG-13",
  isOriginal: true,
  streamStatus: 'live',
  videoUrl: "https://livepeercdn.studio/hls/f8a31biu1b7w4hzw/index.m3u8",
  seasons: [
    {
      id: "s-april-2026",
      seasonNumber: 1,
      title: "Past Stream (April)",
      episodes: []
    }
  ]
};

export const featuredMovies: Movie[] = [
  {
    id: "ang-huling-el-bimbo-play",
    title: "Ang Huling El Bimbo Play",
    logo: "/images/el-bimbo-logo.webp",
    thumbnail: "/images/el-bimbo.webp",
    banner: "/images/el-bimbo-banner.jpg",
    cardBanner: "/images/el-bimbo.webp",
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
    mobileThumbnail: "/images/el-bimbo-mobile.webp",
    videoUrl: "https://boycanad.github.io/stream-storage-1/new_index.m3u8",
    downloadUrl: "https://video-proxy.booran-special.workers.dev/",
    trailerUrl: "https://boycanad.github.io/stream-storage-1/trailer.mp4",
    tallTrailerUrl: "https://github.com/BoyCanad/clips-storage-1/raw/main/HulingElBimboPlay-tall.mp4",
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
    },
    squareThumbnail: "/images/clips/square/AngHulingElBimboPlay.webp",
  },
  {
    id: "minsan",
    title: "Minsan",
    logo: "/images/minsan-logo.webp",
    thumbnail: "/images/minsan.webp",
    banner: "/images/minsan-banner.webp",
    mobileBanner: "/images/minsan-mobile-carousel.webp",
    cardBanner: "/images/minsan.webp",
    description: "“Minsan” is a heartfelt reflection on friendship, nostalgia, and the bittersweet passage of time. It tells the story of people who once shared deep connections and carefree moments, only to drift apart as life moves forward.",
    rating: "9.5",
    year: "2026",
    duration: "5m 0s",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/MINSAN_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://github.com/BoyCanad/clips-storage-1/raw/main/Minsan-tall.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/TRAILER.vtt",
    squareThumbnail: "/images/clips/square/Minsan.webp",
  },

  {
    id: "tindahan-ni-aling-nena",
    title: "Tindahan ni Aling Nena",
    logo: "/images/tindahan-logo.webp",
    thumbnail: "/images/tindahan.webp",
    banner: "/images/tindahan-detail.webp",
    mobileBanner: "/images/tindahan-detail-mobile.webp",
    cardBanner: "/images/tindahan.webp",
    description: "A lively and colorful performance of “Tindahan ni Aling Nena” from Ang Huling El Bimbo, this scene brings energy and humor while subtly reflecting the group’s youthful bond and everyday life.",
    rating: "9.7",
    year: "2026",
    duration: "5m 59s",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/Tindahan/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/Tindahan_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://github.com/BoyCanad/clips-storage-1/raw/main/Tindahan-tall.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/Tindahan_TRAILER_MOBILE.vtt",
    squareThumbnail: "/images/clips/square/Tindahan.webp",
  },
  {
    id: "alapaap-overdrive",
    title: "Alapaap/Overdrive",
    logo: "/images/alapaap-logo.webp",
    thumbnail: "/images/alapaap.webp",
    banner: "/images/alapaap-detail.webp",
    mobileBanner: "/images/alapaap-detail-mobile.webp",
    cardBanner: "/images/alapaap.webp",
    description: "This high-octane performance of “Alapaap / Overdrive” captures the raw rebellion and fleeting freedom of youth. It’s an emotional escape fueled by the reckless energy that ultimately shapes the characters' journey.",
    rating: "9.8",
    year: "2026",
    duration: "6m 2s",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/Alapaap/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/Alapaap_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://github.com/BoyCanad/clips-storage-1/raw/main/Alapaap-tall.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/Alapaap_TRAILER_MOBILE.vtt",
    squareThumbnail: "/images/clips/square/Alapaap.webp",
  },
  {
    id: "spoliarium-graduation",
    title: "Spoliarium/Graduation",
    logo: "/images/spoliarium-logo.webp",
    thumbnail: "/images/spoliarium.webp",
    banner: "/images/spoliarium-detail.webp",
    mobileBanner: "/images/spoliarium-detail-mobile.webp",
    cardBanner: "/images/spoliarium.webp",
    description: "The “Spoliarium/Graduation” sequence moves from the visceral trauma of Joy’s stolen innocence to the bitter irony of celebration. Marko’s ill-timed confession of love serves as a heartbreaking reminder of a future already shattered by the darkness preceding it.",
    rating: "9.9",
    year: "2026",
    duration: "5m 32s",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/Spoliarium/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/Spoliarium_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://github.com/BoyCanad/clips-storage-1/raw/main/Spoliarium-tall.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/Spoliarium_TRAILER_MOBILE.vtt",
    squareThumbnail: "/images/clips/square/Spoliairum.webp",
  },
  {
    id: "pare-ko",
    title: "Pare Ko",
    logo: "/images/pare-ko-logo.webp",
    thumbnail: "/images/pare-ko.webp",
    banner: "/images/pare-ko-detail.webp",
    mobileBanner: "/images/pare-ko-detail-mobile.webp",
    cardBanner: "/images/pare-ko.webp",
    description: "This high-energy ROTC sequence transforms military drills into a vibrant spectacle of brotherhood. Set to the iconic **“Pare Ko,”** it balances sharp choreography with the raw “friendzone” angst that defines the bond between the three leads.",
    rating: "9.6",
    year: "2026",
    duration: "6m 39s",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/PareKo/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/PareKo_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://github.com/BoyCanad/clips-storage-1/raw/main/PareKo-tall.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/PareKo_TRAILER_MOBILE.vtt",
    squareThumbnail: "/images/clips/square/PareKo.webp",
  },
  {
    id: "tama-ka-ligaya",
    title: "Tama Ka/Ligaya",
    logo: "/images/tama-ka-logo.webp",
    thumbnail: "/images/tama-ka.webp",
    mobileThumbnail: "/images/tama-ka-mobile.webp",
    banner: "/images/tama-ka-detail.webp",
    mobileBanner: "/images/tama-ka-detail-mobile.webp",
    cardBanner: "/images/tama-ka.webp",
    mobileCardBanner: "/images/tama-ka-mobile.webp",
    description: "The “Tama Ka / Ligaya” mashup contrasts the finality of a breakup with the warmth of nostalgia. It masterfully captures the bittersweet irony of moving on while still clinging to a lost happiness.",
    rating: "9.8",
    year: "2026",
    duration: "4m 58s",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/TamaKa/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/TamaKa_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://github.com/BoyCanad/clips-storage-1/raw/main/TamaKa-tall.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/TamaKa_TRAILER_MOBILE.vtt",
    squareThumbnail: "/images/clips/square/TamaKa.webp",
  },
  {
    id: "ang-huling-el-bimbo",
    title: "Ang Huling El Bimbo",
    logo: "/images/huling-el-bimbo-logo.webp",
    thumbnail: "/images/huling-el-bimbo.webp",
    mobileThumbnail: "/images/huling-el-bimbo-mobile.webp",
    banner: "/images/huling-el-bimbo-detail.webp",
    mobileBanner: "/images/huling-el-bimbo-detail-mobile.webp",
    cardBanner: "/images/huling-el-bimbo.webp",
    mobileCardBanner: "/images/huling-el-bimbo-mobile.webp",
    description: "The heart-wrenching “Ang Huling El Bimbo” finale mirrors a graceful past against a tragic present. As a tribute to Joy, it captures the regret of a friendship ended too soon, closing the story with the haunting beauty of a dream that can never be reclaimed.",
    rating: "9.9",
    year: "2026",
    duration: "11m 25s",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/ElBimbo/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/ElBimbo_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://github.com/BoyCanad/clips-storage-1/raw/main/ElBimbo-tall.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/ElBimbo_TRAILER_MOBILE.vtt",
    squareThumbnail: "/images/clips/square/AngHulingElBimbo.webp",
  }


];

export const continueWatching: Movie[] = [];

export const trendingMovies: Movie[] = [
  {
    id: "bukang-liwayway-takipsilim",
    title: "Bukang-Liwayway Hanggang Takipsilim",
    thumbnail: "/images/MBLHTS.webp",
    mobileThumbnail: "/images/MBLHTS-mobile.webp",
    banner: "/images/MBLHTS-banner.webp",
    mobileBanner: "/images/MBLHTS-banner.webp",
    description: "A profound documentary exploring the journey of self-discovery and the beauty of transient moments from dawn until dusk.",
    rating: "9.5", year: "2026", duration: "Documentary",
    genre: ["Documentary", "Life", "Philosophy"], ageRating: "G",
  },
  {
    id: "a-day-in-my-life-stem",
    title: "A Day In My Life as a STEM Student",
    thumbnail: "/images/ADIML.webp",
    mobileThumbnail: "/images/ADIML-mobile.webp",
    banner: "/images/ADML-banner.webp",
    mobileBanner: "/images/ADIML-banner-mobile.webp",
    description: "An authentic look into the rigorous yet rewarding daily life of a STEM student, capturing the balance between academic challenges and personal growth.",
    rating: "9.3", year: "2026", duration: "Vlog",
    genre: ["Classroom", "Documentary", "STEM"], ageRating: "G",
  },
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
];

export const elBimboFeatured: Movie = {
  id: "ang-huling-el-bimbo-play",
  title: "Ang Huling El Bimbo Play",
  logo: "/images/el-bimbo-logo.webp",
  thumbnail: "/images/el-bimbo.webp",
  banner: "/images/el-bimbo-banner.jpg",
  cardBanner: "/images/el-bimbo.webp",
  mobileCardBanner: "/images/el-bimbo.webp",
  mobileBanner: "/images/el-bimbo-mobile-carousel.jpg",
  description: "A nostalgic journey through the 90s, where three friends find themselves at a crossroads that will change their lives forever.",
  rating: "9.8",
  year: "2026",
  duration: "49m 51s",
  genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
  ageRating: "PG-13",
  contentWarnings: ["mature themes", "language", "violence", "alcohol use"],
  quality: "HD",
  mobileThumbnail: "/images/el-bimbo-mobile.webp",
  videoUrl: "https://boycanad.github.io/stream-storage-1/new_index.m3u8",
  trailerUrl: "https://boycanad.github.io/stream-storage-1/trailer.mp4",
};
export const elBimboCollections: Movie[] = [
  elBimboFeatured,
  makingOfLegacy,
  featuredMovies[1], // Minsan
  featuredMovies[2], // Tindahan
  featuredMovies[3], // Alapaap
  featuredMovies[4], // Spoliarium
  featuredMovies[5], // Pare Ko
  featuredMovies[6], // Tama Ka
  featuredMovies[7] // Ang Huling El Bimbo
];

export const archiveMovies: Movie[] = [
  trendingMovies[2], // 11 STEM A
  elBimboFeatured,
  makingOfLegacy,
  trendingMovies[0], // Bukang Liwayway
  trendingMovies[1], // A Day In My Life
  ...trendingMovies.slice(3)
];

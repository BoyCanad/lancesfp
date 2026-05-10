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

export interface XRayActor {
  name: string;
  character: string;
  image: string;
  timeRanges?: { start: number; end: number }[];
}

export interface XRaySong {
  title: string;
  artist?: string;
  start?: number;
  end?: number;
}

export interface XRayScene {
  start: number;
  end: number;
  actors?: XRayActor[];
  songs?: XRaySong[];
  trivia?: ({ text: string; start?: number; end?: number } | string)[];
  polls?: { question: string; options: string[]; start?: number; end?: number }[];
}

export interface XRayData {
  scenes: XRayScene[];
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
  detailMobileBanner?: string;
  detailBanner?: string;
  mobileCarouselBanner?: string;
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
  mediaType?: 'movie' | 'show';
  xRay?: XRayData;
  comingSoon?: boolean;
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
  ageRating: "PG-13",
  isOriginal: true,
  videoUrl: "", // Need video URL
  trailerUrl: "https://github.com/BoyCanad/stream-storage-2/raw/refs/heads/main/BTLD-trailer.mp4",
  tallTrailerUrl: "https://res.cloudinary.com/dtzphltjc/video/upload/f_mp4,vc_h264,ac_aac/v1776810741/BTLD-tall_abf3st.mp4",
  squareThumbnail: "/images/clips/square/BTLD.webp",
  trailerVttUrl: "https://boycanad.github.io/stream-storage-2/BTLD-trailer.vtt",
  mediaType: 'show',
  comingSoon: true,
};

export const afterHours: Movie = {
  id: "after-hours",
  title: "After Hours",
  logo: "/images/after-hours-logo.png",
  thumbnail: "/images/after-hours.webp",
  mobileThumbnail: "/images/after-hours-mobile.webp",
  banner: "/images/AFTERHOURS-banner.png",
  mobileBanner: "/images/AFTERHOURS-banner.png",
  description: "Join us for After Hours, the official 11-STEM A live stream series! Experience real-life moments, candid conversations, and exclusive behind-the-scenes vibes as we document our final journey together.",
  rating: "10.0",
  year: "2026",
  duration: "LIVE",
  genre: ["Live", "Documentary", "Classroom"],
  ageRating: "PG-13",
  isOriginal: true,
  streamStatus: 'live',
  mediaType: 'show',
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
    mobileBanner: "/images/el-bimbo-mobile.webp",
    detailMobileBanner: "/images/el-bimbo-detail-mobile.webp",
    detailBanner: "/images/el-bimbo-detail.webp",
    mobileCarouselBanner: "/images/el-bimbo-mobile-carousel.jpg",
    description: "A nostalgic journey through the 90s, where three friends find themselves at a crossroads that will change their lives forever.",
    rating: "9.8",
    year: "2026",
    duration: "49m",
    genre: ["Musical", "Drama", "Nostalgia"],
    ageRating: "PG-13",
    contentWarnings: ["mature themes", "language", "violence", "alcohol use"],
    isOriginal: true,
    mobileThumbnail: "/images/el-bimbo-mobile.webp",
    videoUrl: "https://boycanad.github.io/stream-storage-1/new_index.m3u8",
    downloadUrl: "https://video-proxy.booran-special.workers.dev/",
    trailerUrl: "https://boycanad.github.io/stream-storage-1/trailer.mp4",
    tallTrailerUrl: "https://res.cloudinary.com/dtzphltjc/video/upload/f_mp4,vc_h264,ac_aac/v1776811392/HulingElBimboPlay-tall_v5itkx.mp4",
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
      },
      {
        label: "Karaoke",
        srclang: "fil",
        url: "https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/(KARAOKE)AngHulingElBimboPlay.vtt"
      },
      {
        label: "中文",
        srclang: "zh",
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
    mediaType: 'movie'
  },
  {
    id: "ang-huling-el-bimbo-play-xray",
    title: "Ang Huling El Bimbo Play - Bonus X-Ray Edition",
    logo: "/images/el-bimbo-x-ray-logo.webp",
    thumbnail: "/images/el-bimbo-x-ray.webp",
    banner: "/images/el-bimbo-x-ray.webp",
    cardBanner: "/images/el-bimbo-x-ray.webp",
    mobileCardBanner: "/images/el-bimbo-x-ray.webp",
    mobileBanner: "/images/el-bimbo-x-ray.webp",
    detailMobileBanner: "/images/el-bimbo-detail-mobile.webp",
    detailBanner: "/images/el-bimbo-detail.webp",
    mobileCarouselBanner: "/images/el-bimbo-mobile-carousel.jpg",
    description: "The same nostalgic journey through the 90s, now with the X-Ray bonus experience — explore behind-the-scenes cast info and songs as you watch.",
    rating: "9.8",
    year: "2026",
    duration: "49m",
    genre: ["Musical", "Drama", "Nostalgia", "X-Ray"],
    ageRating: "PG-13",
    contentWarnings: ["mature themes", "language", "violence", "alcohol use"],
    isOriginal: true,
    mobileThumbnail: "/images/el-bimbo-mobile.webp",
    videoUrl: "https://boycanad.github.io/stream-storage-1/new_index.m3u8",
    downloadUrl: "https://video-proxy.booran-special.workers.dev/",
    trailerUrl: "https://boycanad.github.io/stream-storage-1/trailer.mp4",
    tallTrailerUrl: "https://res.cloudinary.com/dtzphltjc/video/upload/f_mp4,vc_h264,ac_aac/v1776811392/HulingElBimboPlay-tall_v5itkx.mp4",
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
      },
      {
        label: "Karaoke",
        srclang: "fil",
        url: "https://figlafktafkwzmgeyslw.supabase.co/storage/v1/object/public/Offline/(KARAOKE)AngHulingElBimboPlay.vtt"
      },
      {
        label: "中文",
        srclang: "zh",
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
    mediaType: 'movie',
    xRay: {
      scenes: [
        {
          start: 11,
          end: 349,
          songs: [
            { title: "Ang Huling El Bimbo Orchestral Arrangement", artist: "Eraserheads", start: 11, end: 52 },
            { title: "Minsan", artist: "Eraserheads", start: 52, end: 349 }
          ],
          actors: [
            { name: "Dancers", character: "Ensemble", image: "/images/xray/dancers.jpg", timeRanges: [{ start: 52, end: 349 }] },
            { name: "Merv Pring", character: "Marco", image: "/images/xray/marco-xray.webp", timeRanges: [{ start: 64, end: 349 }] },
            { name: "Edrian Lee Catalan", character: "Edrian", image: "/images/xray/edrian-xray.webp", timeRanges: [{ start: 79, end: 349 }] },
            { name: "Lance Dominguez", character: "Pok", image: "/images/xray/pok-xray.webp", timeRanges: [{ start: 97, end: 349 }] },
            { name: "Jan Xian Castro", character: "Xian", image: "/images/xray/xian-xray.webp", timeRanges: [{ start: 97, end: 349 }] },
            { name: "Rich Ann Capuli", character: "Joy", image: "/images/xray/joy-xray.webp", timeRanges: [{ start: 165, end: 349 }] }
          ],
          trivia: [
            { text: "Fun Fact: Every sound you hear is a digital playback. The entire theater audio is actually pre-recorded for a flawless, studio-quality performance.", start: 140, end: 160 }
          ]
        },
        {
          start: 358,
          end: 709,
          songs: [
            { title: "Tindahan ni Aling Nena", artist: "Eraserheads", start: 359, end: 553 }
          ],
          actors: [
            { name: "Aisha Dela Cruz", character: "Marco's Mother", image: "/images/xray/aisha-xray.webp", timeRanges: [{ start: 358, end: 557 }] },
            { name: "Merv Pring", character: "Marco", image: "/images/xray/marco-xray.webp", timeRanges: [{ start: 358, end: 709 }] },
            { name: "Dancers", character: "Ensemble", image: "/images/xray/dancers.jpg", timeRanges: [{ start: 358, end: 557 }] },
            { name: "Mark Jerzel Tria", character: "Jazzy", image: "/images/xray/jazzy-xray.webp", timeRanges: [{ start: 358, end: 709 }] },
            { name: "Juliana Faith Cordovez", character: "Aling Nena", image: "/images/xray/nena-xray.webp", timeRanges: [{ start: 369, end: 709 }] },
            { name: "Rich Ann Capuli", character: "Joy", image: "/images/xray/joy-xray.webp", timeRanges: [{ start: 384, end: 709 }] },
            { name: "Edrian Lee Catalan", character: "Edrian", image: "/images/xray/edrian-xray.webp", timeRanges: [{ start: 447, end: 709 }] },
            { name: "Lance Dominguez", character: "Pok", image: "/images/xray/pok-xray.webp", timeRanges: [{ start: 447, end: 709 }] },
            { name: "Jan Xian Castro", character: "Xian", image: "/images/xray/xian-xray.webp", timeRanges: [{ start: 447, end: 709 }] }
          ],
          trivia: [
            { text: "Fun Fact: The moment where the three friends grab and destroy Aling Nena's store was completely unplanned and unscripted.", start: 644, end: 664 }
          ]
        },
        {
          start: 726,
          end: 1072,
          songs: [
            { title: "Overdrive Acapella", artist: "Eraserheads", start: 789, end: 831 },
            { title: "Alapaap/Overdrive", artist: "Eraserheads", start: 836, end: 1041 }
          ],
          actors: [
            { name: "Jan Xian Castro", character: "Xian", image: "/images/xray/xian-xray.webp", timeRanges: [{ start: 726, end: 1072 }] },
            { name: "Lance Dominguez", character: "Pok", image: "/images/xray/pok-xray.webp", timeRanges: [{ start: 726, end: 1072 }] },
            { name: "Edrian Lee Catalan", character: "Edrian", image: "/images/xray/edrian-xray.webp", timeRanges: [{ start: 726, end: 1072 }] },
            { name: "Rich Ann Capuli", character: "Joy", image: "/images/xray/joy-xray.webp", timeRanges: [{ start: 733, end: 1072 }] },
            { name: "Mark Jerzel Tria", character: "Jazzy", image: "/images/xray/jazzy-xray.webp", timeRanges: [{ start: 733, end: 1072 }] },
            { name: "Merv Pring", character: "Marco", image: "/images/xray/marco-xray.webp", timeRanges: [{ start: 759, end: 1072 }] }
          ],
          trivia: [
            { text: "Trivia: Did you know? Some character voices are actually provided by other actors who filled in when the original performers were absent during the recording session.", start: 730, end: 750 },
            { text: "Trivia: Did you know? The music production and recording sessions were completed in just 4 to 5 days.", start: 974, end: 994 }
          ],
          polls: [
            {
              question: "Who in the Barkada is your most favorite?",
              options: ["Marco", "Joy", "Pok", "Xian", "Edrian"],
              start: 920,
              end: 940
            }
          ]
        },
        {
          start: 1079,
          end: 1249,
          songs: [
            { title: "Spoliarium", artist: "Eraserheads", start: 1120, end: 1249 }
          ],
          actors: [
            { name: "Merv Pring", character: "Marco", image: "/images/xray/marco-xray.webp", timeRanges: [{ start: 1079, end: 1099 }] },
            { name: "Rich Ann Capuli", character: "Joy", image: "/images/xray/joy-xray.webp", timeRanges: [{ start: 1079, end: 1228 }] },
            { name: "Lance Dominguez", character: "Pok", image: "/images/xray/pok-xray.webp", timeRanges: [{ start: 1079, end: 1170 }] },
            { name: "Jan Xian Castro", character: "Xian", image: "/images/xray/xian-xray.webp", timeRanges: [{ start: 1079, end: 1099 }] },
            { name: "Edrian Lee Catalan", character: "Edrian", image: "/images/xray/edrian-xray.webp", timeRanges: [{ start: 1079, end: 1099 }] }
          ],
          trivia: [
            { text: "Trivia: Did you know? This entire theater performance was filmed by only three people and edited by just one person.", start: 1169, end: 1189 }
          ]
        },
        {
          start: 1252,
          end: 1407,
          songs: [
            { title: "Minsan Instrumental", artist: "Eraserheads", start: 1252, end: 1314 }
          ],
          actors: [
            { name: "Lance Dominguez", character: "Pok", image: "/images/xray/pok-xray.webp", timeRanges: [{ start: 1252, end: 1321 }] },
            { name: "Mark Jerzel Tria", character: "Jazzy", image: "/images/xray/jazzy-xray.webp", timeRanges: [{ start: 1260, end: 1321 }, { start: 1362, end: 1407 }] },
            { name: "Edrian Lee Catalan", character: "Edrian", image: "/images/xray/edrian-xray.webp", timeRanges: [{ start: 1260, end: 1321 }] },
            { name: "Jan Xian Castro", character: "Xian", image: "/images/xray/xian-xray.webp", timeRanges: [{ start: 1280, end: 1321 }] },
            { name: "Merv Pring", character: "Marco", image: "/images/xray/marco-xray.webp", timeRanges: [{ start: 1284, end: 1360 }] },
            { name: "Rich Ann Capuli", character: "Joy", image: "/images/xray/joy-xray.webp", timeRanges: [{ start: 1284, end: 1407 }] }
          ]
        },
        {
          start: 1413,
          end: 1809,
          songs: [
            { title: "Pare Ko/Yoko", artist: "Eraserheads", start: 1420, end: 1759 }
          ],
          actors: [
            { name: "Dancers", character: "Ensemble", image: "/images/xray/dancers.jpg", timeRanges: [{ start: 1413, end: 1762 }] },
            { name: "Merv Pring", character: "Marco", image: "/images/xray/marco-xray.webp", timeRanges: [{ start: 1489, end: 1809 }] },
            { name: "Jan Xian Castro", character: "Xian", image: "/images/xray/xian-xray.webp", timeRanges: [{ start: 1523, end: 1556 }, { start: 1673, end: 1687 }, { start: 1763, end: 1809 }] },
            { name: "Edrian Lee Catalan", character: "Edrian", image: "/images/xray/edrian-xray.webp", timeRanges: [{ start: 1673, end: 1687 }, { start: 1763, end: 1809 }] }
          ],
          trivia: [
            { text: "Trivia: Did you know? Some of the songs Marco sings were actually recorded by Edrian because Marco was dealing with vocal injuries during the session.", start: 1493, end: 1513 }
          ]
        },
        {
          start: 1815,
          end: 1841,
          songs: [
            { title: "Burnout (Slowed)", artist: "Eraserheads", start: 1821, end: 1841 }
          ],
          actors: [
            { name: "Merv Pring", character: "Marco", image: "/images/xray/marco-xray.webp", timeRanges: [{ start: 1815, end: 1841 }] },
            { name: "Edrian Lee Catalan", character: "Edrian", image: "/images/xray/edrian-xray.webp", timeRanges: [{ start: 1821, end: 1841 }] }
          ]
        },
        {
          start: 1853,
          end: 2043,
          songs: [
            { title: "Tama Ka/Ligaya", artist: "Eraserheads", start: 1853, end: 2043 }
          ],
          actors: [
            { name: "Merv Pring", character: "Marco", image: "/images/xray/marco-xray.webp", timeRanges: [{ start: 1857, end: 2005 }] },
            { name: "Rich Ann Capuli", character: "Joy", image: "/images/xray/joy-xray.webp", timeRanges: [{ start: 1860, end: 2043 }] },
            { name: "Juliana Faith Cordovez", character: "Aling Nena", image: "/images/xray/nena-xray.webp", timeRanges: [{ start: 1868, end: 2005 }] },
            { name: "Dancers", character: "Ensemble", image: "/images/xray/dancers.jpg", timeRanges: [{ start: 2005, end: 2043 }] }
          ],
          trivia: [
            { text: "Fun Fact: Ang Huling El Bimbo Play was the very first production to perform at Teatro Bonifacio.", start: 1941, end: 1961 }
          ]
        },
        {
          start: 2044,
          end: 2244,
          songs: [
            { title: "Ang Huling El Bimbo (Violin & Piano)", artist: "Eraserheads", start: 2184, end: 2214 }
          ],
          actors: [
            { name: "Merv Pring", character: "Marco", image: "/images/xray/marco-xray.webp", timeRanges: [{ start: 2044, end: 2109 }, { start: 2171, end: 2204 }] },
            { name: "Lance Dominguez", character: "Pok", image: "/images/xray/pok-xray.webp", timeRanges: [{ start: 2045, end: 2091 }, { start: 2132, end: 2186 }] },
            { name: "Aisha Dela Cruz", character: "Marco's Mother", image: "/images/xray/aisha-xray.webp", timeRanges: [{ start: 2052, end: 2109 }, { start: 2214, end: 2244 }] },
            { name: "Rich Ann Capuli", character: "Joy", image: "/images/xray/joy-xray.webp", timeRanges: [{ start: 2117, end: 2204 }] },
            { name: "Ahlysson Dela Cruz", character: "Doctor", image: "/images/xray/ahlysson-delacruz.jpg", timeRanges: [{ start: 2214, end: 2233 }] }
          ]
        },
        {
          start: 2245,
          end: 2795,
          songs: [
            { title: "Ang Huling El Bimbo", artist: "Eraserheads", start: 2255, end: 2786 }
          ],
          actors: [
            { name: "Merv Pring", character: "Marco", image: "/images/xray/marco-xray.webp", timeRanges: [{ start: 2245, end: 2795 }] },
            { name: "Dancers", character: "Ensemble", image: "/images/xray/dancers.jpg", timeRanges: [{ start: 2255, end: 2389 }, { start: 2469, end: 2706 }, { start: 2730, end: 2795 }] },
            { name: "Lance Dominguez", character: "Pok", image: "/images/xray/pok-xray.webp", timeRanges: [{ start: 2255, end: 2389 }, { start: 2756, end: 2795 }] },
            { name: "Edrian Lee Catalan", character: "Edrian", image: "/images/xray/edrian-xray.webp", timeRanges: [{ start: 2255, end: 2389 }, { start: 2756, end: 2795 }] },
            { name: "Aisha Dela Cruz", character: "Marco's Mother", image: "/images/xray/aisha-xray.webp", timeRanges: [{ start: 2255, end: 2389 }] },
            { name: "Rich Ann Capuli", character: "Joy", image: "/images/xray/joy-xray.webp", timeRanges: [{ start: 2440, end: 2795 }] },
            { name: "Jan Xian Castro", character: "Xian", image: "/images/xray/xian-xray.webp", timeRanges: [{ start: 2756, end: 2795 }] },
            { name: "Juliana Faith Cordovez", character: "Aling Nena", image: "/images/xray/nena-xray.webp", timeRanges: [{ start: 2756, end: 2795 }] }
          ],
          trivia: [
            { text: "Fun Fact: The entire choreography was finalized just days before the actual performance.", start: 2477, end: 2497 },
            { text: "Fun Fact: The girls with white strings were originally supposed to appear in this scene, but they were left out by mistake and the production ultimately chose not to include them.", start: 2679, end: 2699 },
            { text: "Trivia: Did you know? Merv Pring is the one who choreographed the entire performance.", start: 2735, end: 2755 }
          ],
          polls: [
            {
              question: "Which song is your favorite throughout the entire theater performance?",
              options: ["Minsan", "Tindahan ni Aling Nena", "Alapaap/Overdrive", "Spoliarium", "Pare Ko", "Tama Ka/Ligaya", "Ang Huling El Bimbo"],
              start: 2782,
              end: 2802
            }
          ]
        },
        {
          start: 2799,
          end: 2980,
          songs: [
            { title: "Ang Huling El Bimbo Orchestral Arrangement", artist: "Eraserheads", start: 2799, end: 2980 }
          ],
          actors: [],
          polls: [
            {
              question: "Which song is your favorite throughout the entire theater performance?",
              options: ["Minsan", "Tindahan ni Aling Nena", "Alapaap/Overdrive", "Spoliarium", "Pare Ko", "Tama Ka/Ligaya", "Ang Huling El Bimbo"],
              start: 2782,
              end: 2802
            }
          ]
        }
      ]
    }
  },
  {
    id: "minsan",
    title: "Minsan",
    logo: "/images/minsan-logo.webp",
    thumbnail: "/images/minsan.webp",
    banner: "/images/minsan-banner.webp",
    mobileBanner: "/images/minsan-detail-mobile.webp",
    cardBanner: "/images/minsan.webp",
    mobileCarouselBanner: "/images/minsan-mobile-carousel.webp",
    description: "“Minsan” is a heartfelt reflection on friendship, nostalgia, and the bittersweet passage of time. It tells the story of people who once shared deep connections and carefree moments, only to drift apart as life moves forward.",
    rating: "9.5",
    year: "2026",
    duration: "5m",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/MINSAN_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://res.cloudinary.com/dtzphltjc/video/upload/f_mp4,vc_h264,ac_aac/v1776811369/Minsan-tall_etknbw.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/TRAILER.vtt",
    squareThumbnail: "/images/clips/square/Minsan.webp",
    mediaType: 'movie',
  },

  {
    id: "tindahan-ni-aling-nena",
    title: "Tindahan ni Aling Nena",
    logo: "/images/tindahan-logo.webp",
    thumbnail: "/images/tindahan.webp",
    banner: "/images/tindahan-detail.webp",
    mobileBanner: "/images/tindahan-detail-mobile.webp",
    cardBanner: "/images/tindahan.webp",
    mobileCarouselBanner: "/images/Tindahan-mobile-banner.webp",
    description: "A lively and colorful performance of “Tindahan ni Aling Nena” from Ang Huling El Bimbo, this scene brings energy and humor while subtly reflecting the group’s youthful bond and everyday life.",
    rating: "9.7",
    year: "2026",
    duration: "5m",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/Tindahan/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/Tindahan_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://res.cloudinary.com/dtzphltjc/video/upload/f_mp4,vc_h264,ac_aac/v1776811310/Tindahan-tall_jxtnzf.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/Tindahan_TRAILER_MOBILE.vtt",
    squareThumbnail: "/images/clips/square/Tindahan.webp",
    mediaType: 'movie',
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
    duration: "6m",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/Alapaap/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/Alapaap_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://res.cloudinary.com/dtzphltjc/video/upload/f_mp4,vc_h264,ac_aac/v1776811438/Alapaap-tall_nuyyqm.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/Alapaap_TRAILER_MOBILE.vtt",
    squareThumbnail: "/images/clips/square/Alapaap.webp",
    mediaType: 'movie',
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
    duration: "5m",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/Spoliarium/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/Spoliarium_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://res.cloudinary.com/dtzphltjc/video/upload/f_mp4,vc_h264,ac_aac/v1776811337/Spoliarium-tall_huygnl.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/Spoliarium_TRAILER_MOBILE.vtt",
    squareThumbnail: "/images/clips/square/Spoliairum.webp",
    mediaType: 'movie',
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
    duration: "6m",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/PareKo/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/PareKo_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://res.cloudinary.com/dtzphltjc/video/upload/f_mp4,vc_h264,ac_aac/v1776811352/PareKo-tall_xrdjxa.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/PareKo_TRAILER_MOBILE.vtt",
    squareThumbnail: "/images/clips/square/PareKo.webp",
    mediaType: 'movie',
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
    duration: "4m",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/TamaKa/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/TamaKa_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://res.cloudinary.com/dtzphltjc/video/upload/f_mp4,vc_h264,ac_aac/v1776811324/TamaKa-tall_uficjc.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/TamaKa_TRAILER_MOBILE.vtt",
    squareThumbnail: "/images/clips/square/TamaKa.webp",
    mediaType: 'movie',
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
    duration: "11m",
    genre: ["Musical", "Drama", "Nostalgia", "Ang Huling El Bimbo"],
    ageRating: "PG-13",
    videoUrl: "https://boycanad.github.io/stream-storage-3/ElBimbo/index.m3u8",
    trailerUrl: "https://boycanad.github.io/stream-storage-2/ElBimbo_TRAILER_MOBILE.mp4",
    tallTrailerUrl: "https://res.cloudinary.com/dtzphltjc/video/upload/f_mp4,vc_h264,ac_aac/v1776811427/ElBimbo-tall_aixrsg.mp4",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/ElBimbo_TRAILER_MOBILE.vtt",
    squareThumbnail: "/images/clips/square/AngHulingElBimbo.webp",
    mediaType: 'movie',
  }


];

export const continueWatching: Movie[] = [];

export const trendingMovies: Movie[] = [
  {
    id: "bukang-liwayway-takipsilim",
    title: "Bukang-Liwayway Hanggang Takipsilim",
    logo: "/images/BUKANG-LOGO.webp",
    thumbnail: "/images/MBLHTS.webp",
    mobileThumbnail: "/images/MBLHTS-mobile.webp",
    banner: "/images/MBLHTS-banner.webp",
    mobileBanner: "/images/MBLHTS-banner.webp",
    description: "A profound documentary exploring the journey of self-discovery and the beauty of transient moments from dawn until dusk.",
    rating: "9.5", year: "2026", duration: "Documentary",
    genre: ["Documentary", "STEM"], ageRating: "G",
    trailerUrl: "https://github.com/BoyCanad/stream-storage-2/raw/refs/heads/main/BLHT-trailer.mp4",
    tallTrailerUrl: "https://res.cloudinary.com/dtzphltjc/video/upload/f_mp4,vc_h264,ac_aac/v1776810731/BLHT-tall_uinnb3.mp4",
    squareThumbnail: "/images/clips/square/BLHTS.webp",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/BLHT-trailer.vtt",
    mediaType: 'movie',
  },
  {
    id: "a-day-in-my-life-stem",
    title: "A Day In My Life as a STEM Student",
    logo: "/images/ADIML-LOGO.webp",
    thumbnail: "/images/ADIML.webp",
    mobileThumbnail: "/images/ADIML-mobile.webp",
    banner: "/images/ADML-banner.webp",
    mobileBanner: "/images/ADIML-banner-mobile.webp",
    description: "An authentic look into the rigorous yet rewarding daily life of a STEM student, capturing the balance between academic challenges and personal growth.",
    rating: "9.3", year: "2026", duration: "Vlog",
    genre: ["Classroom", "Documentary", "STEM"], ageRating: "G",
    trailerUrl: "https://github.com/BoyCanad/stream-storage-2/raw/refs/heads/main/ADIML-trailer.mp4",
    tallTrailerUrl: "https://res.cloudinary.com/dtzphltjc/video/upload/f_mp4,vc_h264,ac_aac/v1776810709/ADIML-tall_rtdvt5.mp4",
    squareThumbnail: "/images/clips/square/ADIML.webp",
    trailerVttUrl: "https://boycanad.github.io/stream-storage-2/ADIML-trailer.vtt",
    mediaType: 'movie',
  },
  {
    id: "t1",
    title: "11 STEM A SY 2025-2026",
    logo: "/images/stem-a-logo.webp",
    thumbnail: "/images/stem-a-archive.webp",
    banner: "/images/stem-a-archive.webp",
    mobileThumbnail: "/images/stem-a-archive-mobile.webp",
    mobileBanner: "/images/stem-a-mobile-carousel.webp",
    description: "A digital archive documenting the journey, memories, and milestones of 11-STEM A for the School Year 2025-2026.",
    rating: "9.9", year: "2026", duration: "Archive",
    genre: ["Classroom", "Documentary", "STEM"], ageRating: "G",
    mediaType: 'show',
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
  duration: "49m",
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
  featuredMovies[1], // Ang Huling El Bimbo Play - Bonus X-Ray Edition
  makingOfLegacy,
  featuredMovies[2], // Minsan
  featuredMovies[3], // Tindahan
  featuredMovies[4], // Alapaap
  featuredMovies[5], // Spoliarium
  featuredMovies[6], // Pare Ko
  featuredMovies[7], // Tama Ka
  featuredMovies[8] // Ang Huling El Bimbo
];

export const archiveMovies: Movie[] = [
  trendingMovies[2], // 11 STEM A
  elBimboFeatured,
  featuredMovies[1], // Ang Huling El Bimbo Play - Bonus X-Ray Edition
  makingOfLegacy,
  trendingMovies[0], // Bukang Liwayway
  trendingMovies[1], // A Day In My Life
  ...trendingMovies.slice(3)
];

// All movies combined for global filtering (like Clips, Search, etc.)
export const allMovies: Movie[] = [
  ...featuredMovies,
  ...trendingMovies,
  makingOfLegacy,
  afterHours
].filter((movie, index, self) =>
  index === self.findIndex((m) => m.id === movie.id)
);

export const shows: Movie[] = allMovies.filter(m => m.mediaType === 'show');
export const moviesList: Movie[] = allMovies.filter(m => m.mediaType === 'movie');

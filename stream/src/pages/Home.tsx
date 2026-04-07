import HeroCarousel from '../components/HeroCarousel';
import ContentRow from '../components/ContentRow';
import { featuredMovies, continueWatching, trendingMovies, elBimboFeatured } from '../data/movies';

const archiveMovies = [trendingMovies[0], elBimboFeatured, ...trendingMovies.slice(1)];
const elBimboCollections = [
  elBimboFeatured,
  featuredMovies[1],
  featuredMovies[3],
  featuredMovies[4],
  featuredMovies[5],
  featuredMovies[6],
  featuredMovies[7],
  featuredMovies[8],
  ...[...trendingMovies].reverse().slice(7)
];

export default function Home() {
  return (
    <main className="app__main">
      {/* Hero Carousel */}
      <HeroCarousel movies={featuredMovies.slice(0, 3)} />

      {/* Content Rows */}
      <div className="app__rows">
        <ContentRow
          title="Continue Watching"
          movies={continueWatching}
          showProgress
          variant="wide"
        />
        <ContentRow
          title="G11 Archives"
          movies={archiveMovies}
        />
        <ContentRow
          title="Ang Huling El Bimbo Collections"
          movies={elBimboCollections}
        />
      </div>
    </main>
  );
}

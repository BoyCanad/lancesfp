import HeroCarousel from '../components/HeroCarousel';
import ContentRow from '../components/ContentRow';
import { featuredMovies, continueWatching, trendingMovies, elBimboFeatured } from '../data/movies';

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
          movies={trendingMovies}
        />
        <ContentRow
          title="Ang Huling El Bimbo Collections"
          movies={[elBimboFeatured, ...[...trendingMovies].reverse()]}
        />
      </div>
    </main>
  );
}

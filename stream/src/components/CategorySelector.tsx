import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CategorySelector.css';

interface CategorySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategory?: string;
  mode?: 'shows' | 'movies';
}

const allCategories = [
  'Home',
  'Musical',
  'Drama',
  'Nostalgia',
  'Documentary',
  'Behind the Scenes',
  'Ang Huling El Bimbo',
  'Live',
  'Classroom',
  'STEM'
];

const showCategories = [
  'Shows',
  'Documentary',
  'Live',
  'Classroom',
  'STEM',
];

const movieCategories = [
  'Movies',
  'Musical',
  'Drama',
  'Nostalgia',
  'Documentary',
  'Behind the Scenes',
  'Ang Huling El Bimbo',
];

export default function CategorySelector({ isOpen, onClose, currentCategory, mode }: CategorySelectorProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const categories = mode === 'shows' ? showCategories : mode === 'movies' ? movieCategories : allCategories;

  const handleCategoryClick = (category: string) => {
    onClose();
    if (category === 'Home') {
      navigate('/browse');
    } else if (category === 'Shows') {
      navigate('/genre/shows');
    } else if (category === 'Movies') {
      navigate('/genre/movies');
    } else {
      const typeParam = mode === 'shows' ? '?type=show' : mode === 'movies' ? '?type=movie' : '';
      navigate(`/genre/${category.toLowerCase().replace(/ /g, '-')}${typeParam}`);
    }
  };

  return (
    <div className="category-selector">
      <div className="category-selector__overlay" onClick={onClose} />
      <div className="category-selector__content">
        <div className="category-selector__list">
          {categories.map((category) => {
            const isActive = currentCategory?.toLowerCase() === category.toLowerCase();
            return (
              <button
                key={category}
                className={`category-selector__item ${isActive ? 'is-active' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            );
          })}
        </div>
        <button className="category-selector__close" onClick={onClose}>
          <X size={32} color="black" />
        </button>
      </div>
    </div>
  );
}

import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CategorySelector.css';

interface CategorySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategory?: string;
}

const categories = [
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

export default function CategorySelector({ isOpen, onClose, currentCategory }: CategorySelectorProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCategoryClick = (category: string) => {
    onClose();
    if (category === 'Home') {
      navigate('/browse');
    } else {
      navigate(`/genre/${category.toLowerCase()}`);
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

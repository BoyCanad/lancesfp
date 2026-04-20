
const STORAGE_KEY = 'lsfplus_mylist';

export const getMyList = (): string[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const addToMyList = (movieId: string) => {
  const list = getMyList();
  if (!list.includes(movieId)) {
    list.push(movieId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  window.dispatchEvent(new Event('mylist_updated'));
};

export const removeFromMyList = (movieId: string) => {
  const list = getMyList().filter(id => id !== movieId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('mylist_updated'));
};

export const isInMyList = (movieId: string): boolean => {
  return getMyList().includes(movieId);
};

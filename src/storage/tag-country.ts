const STORAGE_KEY = 'USER_TAG_AREA';

const TagCountryStorage = {
  get() {
    if (typeof window === 'undefined') return 'CN';
    return window.localStorage.getItem(STORAGE_KEY) || 'CN';
  },
  set(value: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, value);
  },
};

export default TagCountryStorage;

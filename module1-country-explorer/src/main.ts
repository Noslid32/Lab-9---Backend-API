import type { Country, UiState } from './types/country';
import { getAllCountries, ApiError } from './services/countryApi';
import { renderCountryList } from './components/CountryCard';
import { openModal } from './components/CountryModal';
import { getRequiredElement, showElement, hideElement, onDOMReady, debounce } from './utils/dom';
import { getFavorites, clearFavorites } from './utils/storage.ts';

let allCountries: Country[] = [];
let selectedRegion = '';
let showOnlyFavorites = false;

let searchInput: HTMLInputElement;
let searchButton: HTMLButtonElement;
let retryButton: HTMLButtonElement;
let regionFilter: HTMLSelectElement;
let favoritesToggle: HTMLButtonElement;
let clearFavoritesBtn: HTMLButtonElement;
let loadingState: HTMLElement;
let errorState: HTMLElement;
let errorMessage: HTMLElement;
let emptyState: HTMLElement;
let noResultsState: HTMLElement;
let countriesList: HTMLElement;

function initializeElements(): void {
  searchInput = getRequiredElement<HTMLInputElement>('#searchInput');
  searchButton = getRequiredElement<HTMLButtonElement>('#searchButton');
  retryButton = getRequiredElement<HTMLButtonElement>('#retryButton');
  regionFilter = getRequiredElement<HTMLSelectElement>('#regionFilter');
  favoritesToggle = getRequiredElement<HTMLButtonElement>('#favoritesToggle');
  clearFavoritesBtn = getRequiredElement<HTMLButtonElement>('#clearFavoritesBtn');
  loadingState = getRequiredElement<HTMLElement>('#loadingState');
  errorState = getRequiredElement<HTMLElement>('#errorState');
  errorMessage = getRequiredElement<HTMLElement>('#errorMessage');
  emptyState = getRequiredElement<HTMLElement>('#emptyState');
  noResultsState = getRequiredElement<HTMLElement>('#noResultsState');
  countriesList = getRequiredElement<HTMLElement>('#countriesList');
}

function hideAllStates(): void {
  hideElement(loadingState);
  hideElement(errorState);
  hideElement(emptyState);
  hideElement(noResultsState);
  hideElement(countriesList);
}

function render(state: UiState): void {
  hideAllStates();

  switch (state.status) {
    case 'idle':
      showElement(emptyState);
      break;
    case 'loading':
      showElement(loadingState);
      break;
    case 'success':
      if (state.data.length === 0) {
        showElement(noResultsState);
      } else {
        showElement(countriesList);
        renderCountryList(state.data, countriesList, handleCountryClick);
      }
      break;
    case 'error':
      showElement(errorState);
      errorMessage.textContent = state.message;
      break;
    case 'empty':
      showElement(noResultsState);
      break;
    default: {
      const _exhaustiveCheck: never = state;
      console.error('Estado no manejado:', _exhaustiveCheck);
    }
  }
}

function applyFilters(): void {
  const query = searchInput.value.trim().toLowerCase();
  const favs = getFavorites();

  const filtered = allCountries.filter((country) => {
    const matchName = !query || country.name.common.toLowerCase().includes(query);
    const matchRegion = !selectedRegion || country.region === selectedRegion;
    const matchFav = !showOnlyFavorites || favs.has(country.cca3);
    return matchName && matchRegion && matchFav;
  });

  if (allCountries.length === 0) return;

  if (filtered.length === 0) {
    render({ status: 'empty' });
  } else {
    render({ status: 'success', data: filtered });
  }
}

async function loadAllCountries(): Promise<void> {
  if (allCountries.length > 0) {
    applyFilters();
    return;
  }

  render({ status: 'loading' });

  try {
    allCountries = await getAllCountries();
    allCountries.sort((a, b) => a.name.common.localeCompare(b.name.common));
    applyFilters();
  } catch (error) {
    let message = 'Error desconocido al cargar países';
    if (error instanceof ApiError) message = error.message;
    else if (error instanceof Error) message = error.message;
    render({ status: 'error', message });
    console.error('Error cargando países:', error);
  }
}

async function handleSearch(): Promise<void> {
  const query = searchInput.value.trim();

  if (query.length === 0 && !selectedRegion && !showOnlyFavorites) {
    render({ status: 'idle' });
    return;
  }

  await loadAllCountries();
  applyFilters();
}

function handleCountryClick(country: Country): void {
  void openModal(country);
}

function handleRetry(): void {
  void handleSearch();
}

function setupEventListeners(): void {
  const debouncedSearch = debounce(() => {
    void handleSearch();
  }, 400);

  searchInput.addEventListener('input', debouncedSearch);

  searchButton.addEventListener('click', () => {
    void handleSearch();
  });

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      void handleSearch();
    }
  });

  retryButton.addEventListener('click', handleRetry);

  regionFilter.addEventListener('change', () => {
    selectedRegion = regionFilter.value;
    void loadAllCountries();
  });

  favoritesToggle.addEventListener('click', () => {
    showOnlyFavorites = !showOnlyFavorites;
    favoritesToggle.setAttribute('aria-pressed', String(showOnlyFavorites));
    if (showOnlyFavorites) {
      favoritesToggle.textContent = '♥ Solo favoritos';  // ← cambia este texto
      favoritesToggle.classList.add('border-pink-500/70', 'text-pink-400', 'bg-pink-500/10');
      favoritesToggle.classList.remove('text-slate-300', 'border-slate-600');
    } else {
      favoritesToggle.textContent = '♡ Mostrar favoritos';  // ← y este
      favoritesToggle.classList.remove('border-pink-500/70', 'text-pink-400', 'bg-pink-500/10');
      favoritesToggle.classList.add('text-slate-300', 'border-slate-600');
    }
    void loadAllCountries();
  });

  clearFavoritesBtn.addEventListener('click', () => {
    clearFavorites();
    document.querySelectorAll<HTMLButtonElement>('.heart-btn').forEach((btn) => {
      const span = btn.querySelector('span');
      if (span) span.textContent = '♡';
      btn.setAttribute('aria-label', 'Agregar a favoritos');
    });
    if (showOnlyFavorites) applyFilters();
  });

  countriesList.addEventListener('favorite-toggled', () => {
    if (showOnlyFavorites) applyFilters();
  });
}

function initializeApp(): void {
  try {
    initializeElements();
    setupEventListeners();
    render({ status: 'idle' });
    searchInput.focus();
    console.log('Country Explorer inicializado correctamente');
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
  }
}

onDOMReady(initializeApp);
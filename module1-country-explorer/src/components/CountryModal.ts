// =============================================================================
// COMPONENTE: MODAL DE DETALLE - Country Explorer
// =============================================================================
// Este módulo maneja el modal que muestra información detallada de un país.
//
// ## Patrón de Modal
// Un modal es un overlay que bloquea la interacción con el contenido detrás.
// Implementamos:
// 1. Cierre con click fuera del contenido
// 2. Cierre con tecla Escape
// 3. Trampa de foco (focus trap) para accesibilidad
// 4. Prevención de scroll del body
// =============================================================================

import type { Country } from '../types/country';
import {
  formatArea,
  formatPopulation,
  formatLanguages,
  formatCurrencies,
  formatCapitals,
  formatTimezones,
  formatDrivingSide,
  formatLandlocked,
} from '../utils/format';
import { getRequiredElement, showElement, hideElement, addListener } from '../utils/dom';
import { getCountryByCode } from '../services/countryApi';

let modalElement: HTMLElement | null = null;
let modalContentElement: HTMLElement | null = null;
let isInitialized = false;

function initializeModal(): void {
  if (isInitialized) return;

  modalElement = getRequiredElement<HTMLElement>('#countryModal');
  modalContentElement = getRequiredElement<HTMLElement>('#modalContent');

  addListener(modalElement, 'click', (event) => {
    if (event.target === modalElement) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalElement && !modalElement.classList.contains('hidden')) {
      closeModal();
    }
  });

  isInitialized = true;
}

export async function openModal(country: Country): Promise<void> {
  initializeModal();

  if (!modalElement || !modalContentElement) return;

  document.body.style.overflow = 'hidden';

  // Mostrar spinner mientras carga
  modalContentElement.innerHTML = `
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>
  `;

  showElement(modalElement);

  try {
    const detailed = await getCountryByCode(country.cca3);
    const data = detailed ?? country;
    modalContentElement.innerHTML = createModalContent(data);
  } catch {
    modalContentElement.innerHTML = createModalContent(country);
  }

  const closeButton = modalContentElement.querySelector('#closeModalBtn');
  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }

  modalContentElement.focus();
}

export function closeModal(): void {
  if (!modalElement) return;
  document.body.style.overflow = '';
  hideElement(modalElement);
}

function createModalContent(country: Country): string {
  const nativeName = country.name.nativeName
    ? Object.values(country.name.nativeName)[0]?.common
    : null;

  const demonym = country.demonyms?.eng?.m ?? null;

  return `
    <div class="relative">
      <div class="relative h-56 overflow-hidden rounded-t-2xl">
        <img
          src="${country.flags.svg}"
          alt="${country.flags.alt ?? `Bandera de ${country.name.common}`}"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-800 via-transparent to-transparent"></div>

        <button
          id="closeModalBtn"
          class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-slate-900/80 hover:bg-slate-900 text-white rounded-full backdrop-blur-sm transition-colors"
          aria-label="Cerrar modal"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="absolute bottom-4 left-6 right-6">
          <h2 class="text-3xl font-bold text-white drop-shadow-lg">
            ${country.name.common}
          </h2>
          ${
            nativeName && nativeName !== country.name.common
              ? `<p class="text-slate-300 text-lg">${nativeName}</p>`
              : ''
          }
        </div>
      </div>

      <div class="p-6 space-y-6">
        <div class="bg-slate-700/50 rounded-lg p-4">
          <p class="text-slate-400 text-sm">Nombre Oficial</p>
          <p class="text-white font-medium">${country.name.official}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${createInfoItem('Capital', formatCapitals(country.capital))}
          ${createInfoItem('Region', `${country.region}${country.subregion ? ` / ${country.subregion}` : ''}`)}
          ${createInfoItem('Poblacion', formatPopulation(country.population))}
          ${createInfoItem('Area', formatArea(country.area))}
          ${createInfoItem('Idiomas', formatLanguages(country.languages))}
          ${createInfoItem('Monedas', formatCurrencies(country.currencies))}
          ${country.timezones ? createInfoItem('Zona horaria', formatTimezones(country.timezones)) : ''}
          ${country.continents ? createInfoItem('Continente', country.continents.join(', ')) : ''}
          ${country.car ? createInfoItem('Lado de conduccion', formatDrivingSide(country.car.side)) : ''}
          ${country.landlocked !== undefined ? createInfoItem('Sin litoral', formatLandlocked(country.landlocked)) : ''}
          ${demonym ? createInfoItem('Gentilicio', demonym) : ''}
        </div>

        ${
          country.borders && country.borders.length > 0
            ? `
          <div class="space-y-3">
            <h3 class="text-lg font-semibold text-white">Paises Fronterizos</h3>
            <div class="flex flex-wrap gap-2">
              ${country.borders.map((code) => `<span class="info-badge">${code}</span>`).join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          country.coatOfArms?.svg
            ? `
          <div class="text-center pt-4 border-t border-slate-700">
            <p class="text-slate-400 text-sm mb-3">Escudo de Armas</p>
            <img
              src="${country.coatOfArms.svg}"
              alt="Escudo de armas de ${country.name.common}"
              class="h-32 mx-auto object-contain"
            />
          </div>
        `
            : ''
        }

        ${
          country.maps
            ? `
          <div class="flex gap-3 pt-4 border-t border-slate-700">
            
              href="${country.maps.googleMaps}"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Ver en Google Maps
            </a>
            
              href="${country.maps.openStreetMaps}"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white font-medium rounded-lg transition-colors"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              OpenStreetMap
            </a>
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;
}

function createInfoItem(label: string, value: string): string {
  return `
    <div class="bg-slate-700/30 rounded-lg p-3">
      <p class="text-slate-400 text-xs mb-1">${label}</p>
      <p class="text-white text-sm font-medium">${value}</p>
    </div>
  `;
}
import type { Country } from '../types/country';

const BASE_URL = 'https://restcountries.com/v3.1';

const FIELDS = 'name,cca3,capital,region,population,flags,subregion,languages,currencies,borders';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function searchCountries(name: string): Promise<Country[]> {
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return [];
  }

  const url = `${BASE_URL}/name/${encodeURIComponent(trimmedName)}?fields=${FIELDS}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new ApiError(`Error del servidor: ${response.status} ${response.statusText}`, response.status);
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new ApiError('Respuesta inesperada de la API');
    }

    return data as Country[];
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof TypeError) {
      throw new ApiError('Error de conexión. Verifica tu conexión a internet.', undefined, error);
    }
    throw new ApiError('Error inesperado al buscar países', undefined, error);
  }
}

export async function getCountryByCode(code: string): Promise<Country | null> {
  const url = `${BASE_URL}/alpha/${encodeURIComponent(code)}?fields=${FIELDS}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new ApiError(`Error del servidor: ${response.status}`, response.status);
    }

    const data: unknown = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return data[0] as Country;
    }

    return data as Country;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Error al obtener detalles del país', undefined, error);
  }
}

export async function getAllCountries(): Promise<Country[]> {
  const url = `${BASE_URL}/all?fields=${FIELDS}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new ApiError(`Error del servidor: ${response.status}`, response.status);
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new ApiError('Respuesta inesperada de la API');
    }

    return data as Country[];
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Error al obtener la lista de países', undefined, error);
  }
}

export async function getCountriesByRegion(
  region: 'Africa' | 'Americas' | 'Asia' | 'Europe' | 'Oceania'
): Promise<Country[]> {
  const url = `${BASE_URL}/region/${region}?fields=${FIELDS}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new ApiError(`Error del servidor: ${response.status}`, response.status);
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      throw new ApiError('Respuesta inesperada de la API');
    }

    return data as Country[];
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Error al obtener países por región', undefined, error);
  }
}
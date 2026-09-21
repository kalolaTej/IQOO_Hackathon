// real photographic image URLs for animal detection snapshots & camera streams
// maps all 11 YOLO target animal classes supported by the AI model in ai/config.py

export const ANIMAL_IMAGES = {
  cow: 'https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=800',
  cattle: 'https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=800',
  goat: 'https://images.pexels.com/photos/1628087/pexels-photo-1628087.jpeg?auto=compress&cs=tinysrgb&w=800',
  pig: 'https://images.pexels.com/photos/110820/pexels-photo-110820.jpeg?auto=compress&cs=tinysrgb&w=800',
  'wild boar': 'https://images.pexels.com/photos/110820/pexels-photo-110820.jpeg?auto=compress&cs=tinysrgb&w=800',
  boar: 'https://images.pexels.com/photos/110820/pexels-photo-110820.jpeg?auto=compress&cs=tinysrgb&w=800',
  sheep: 'https://images.pexels.com/photos/288621/pexels-photo-288621.jpeg?auto=compress&cs=tinysrgb&w=800',
  horse: 'https://images.pexels.com/photos/1996333/pexels-photo-1996333.jpeg?auto=compress&cs=tinysrgb&w=800',
  dog: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
  cat: 'https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=800',
  bear: 'https://images.pexels.com/photos/35435/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800',
  elephant: 'https://images.pexels.com/photos/1054655/pexels-photo-1054655.jpeg?auto=compress&cs=tinysrgb&w=800',
  zebra: 'https://images.pexels.com/photos/2265247/pexels-photo-2265247.jpeg?auto=compress&cs=tinysrgb&w=800',
  giraffe: 'https://images.pexels.com/photos/802112/pexels-photo-802112.jpeg?auto=compress&cs=tinysrgb&w=800',
  fallback: 'https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=800'
}

import { API_BASE_URL } from './api';

export function getAnimalImage(animalName, providedUrl) {
  if (
    providedUrl &&
    typeof providedUrl === 'string' &&
    providedUrl.trim().length > 5 &&
    !providedUrl.includes('placeholder.co')
  ) {
    const trimmed = providedUrl.trim()
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:')
    ) {
      return trimmed
    }
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath
  }
  const key = (animalName || '').toLowerCase().trim().replace(/[\s-]/g, '_')
  return ANIMAL_IMAGES[key] || ANIMAL_IMAGES[animalName?.toLowerCase()] || ANIMAL_IMAGES.cow
}


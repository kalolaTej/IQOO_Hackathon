/**
 * AgriSync Centralized Image URL Resolver
 * Ensures uploaded images (/uploads/...) resolve directly to the backend URL without broken images.
 */

const FALLBACK_CROP_IMAGES = {
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=800',
  'red onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=800',
  soybean: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=800',
  wheat: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800',
  pomegranate: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800',
  grapes: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&q=80&w=800',
};

import { API_BASE_URL } from './api';

export const getImageUrl = (url, cropType = 'general') => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return getCropFallbackImage(cropType);
  }

  const trimmed = url.trim();

  // Already absolute or data/blob URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Prepend backend URL for server-hosted static uploads
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
};

export const resolveCameraStreamUrl = (cam) => {
  if (!cam) return '/uploads/detections/sample_wild_boar.jpg';
  const isOnline = cam.status === 'online' || cam.status === true;

  // 1. Direct browser-renderable HTTP live stream (e.g. Android IP Webcam http://10.10.12.111:8080/video)
  if (isOnline && cam.source_url && cam.source_url.startsWith('http')) {
    let stream = cam.source_url.trim();
    if ((cam.camera_type === 'HTTP_MJPEG' || stream.includes(':8080')) && !stream.includes('/video') && !stream.includes('/shot.jpg') && !stream.includes('.jpg')) {
      stream = stream.replace(/\/+$/, '') + '/video';
    }
    return stream;
  }

  // 2. Real uploaded frames from AI detections or snapshot captures
  if (cam.latest_frame && typeof cam.latest_frame === 'string' && cam.latest_frame.startsWith('/uploads/')) {
    return getImageUrl(cam.latest_frame);
  }

  // 3. Camera custom preview if real stream
  if (cam.preview && typeof cam.preview === 'string' && cam.preview.startsWith('http') && !cam.preview.includes('unsplash.com')) {
    let prev = cam.preview.trim();
    if ((cam.camera_type === 'HTTP_MJPEG' || prev.includes(':8080')) && !prev.includes('/video') && !prev.includes('/shot.jpg') && !prev.includes('.jpg')) {
      prev = prev.replace(/\/+$/, '') + '/video';
    }
    return prev;
  }

  if (cam.latest_frame && !cam.latest_frame.includes('unsplash.com')) {
    return getImageUrl(cam.latest_frame);
  }

  if (cam.preview && !cam.preview.includes('unsplash.com')) {
    return getImageUrl(cam.preview);
  }

  return getImageUrl(cam.latest_frame || cam.preview, 'wheat');
};

export const getCropFallbackImage = (cropType = 'general') => {
  const key = String(cropType || '').toLowerCase().trim();
  for (const [cropKey, imgUrl] of Object.entries(FALLBACK_CROP_IMAGES)) {
    if (key.includes(cropKey)) return imgUrl;
  }
  return FALLBACK_CROP_IMAGES.tomato;
};

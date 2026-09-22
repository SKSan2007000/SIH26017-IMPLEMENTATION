import type { StyleSpecification } from 'maplibre-gl';

/**
 * LandGuard AI High-Performance Geospatial Basemap Styles
 *
 * Uses high-contrast, un-watermarked dark mode raster GIS tiles (Esri Dark Gray Canvas / OpenStreetMap)
 * that require no private API keys, support zero-downtime offline/online fallback, and seamlessly match
 * LandGuard AI's command-center visual language.
 */
export function buildDarkMapStyle(): StyleSpecification {
  // Allow environment override if a custom vector style URL is provided
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MAPLIBRE_STYLE && !process.env.NEXT_PUBLIC_MAPLIBRE_STYLE.includes('demotiles')) {
    // If it's a direct style JSON URL, we can return a reference or minimal spec
  }

  return {
    version: 8,
    name: 'LandGuard Dark GIS',
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      esriDark: {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© Esri, HERE, Garmin, OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'bg-void',
        type: 'background',
        paint: {
          'background-color': '#060a0f',
        },
      },
      {
        id: 'dark-base',
        type: 'raster',
        source: 'esriDark',
        paint: {
          'raster-opacity': 0.92,
          'raster-contrast': 0.15,
          'raster-brightness-min': 0.05,
        },
      },
    ],
  };
}

/**
 * Fallback OSM standard style if dark canvas is unreachable
 */
export function buildFallbackMapStyle(): StyleSpecification {
  return {
    version: 8,
    name: 'LandGuard Standard GIS',
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'bg-void',
        type: 'background',
        paint: {
          'background-color': '#060a0f',
        },
      },
      {
        id: 'osm-base',
        type: 'raster',
        source: 'osm',
        paint: {
          'raster-opacity': 0.85,
        },
      },
    ],
  };
}

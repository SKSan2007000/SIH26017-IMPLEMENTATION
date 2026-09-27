'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { buildDarkMapStyle } from '@/lib/gis/style';
import { circlePolygon, parcelsToPointsGeoJSON, projectsToGeoJSON, riskColor, routesToGeoJSON } from '@/lib/gis/geojson';
import { MOCK_PROJECTS } from '@/lib/mock/projects';
import { MOCK_PARCELS } from '@/lib/mock/parcels';
import { MOCK_RISKS } from '@/lib/mock/risks';
import { MOCK_ROUTES } from '@/lib/mock/routes';
import { LayerPanel } from './LayerPanel';
import { LegendPanel } from './LegendPanel';
import { useAppStore, type MapLayerKey } from '@/lib/store/useAppStore';
import { RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';

const LAYER_IDS: Record<MapLayerKey, string[]> = {
  projects: ['pt-projects', 'pt-projects-label'],
  routes: ['ln-route'],
  parcels: ['pt-parcels'],
  risk: ['pg-risk', 'pg-risk-line'],
  stakeholders: ['pt-stakeholders'],
  infrastructure: [],
  fieldOfficers: [],
  verification: [],
  buildings: [],
  corridorRibbon: [],
  roadNetwork: [],
  connectivityGaps: [],
};

function safeAddSource(map: MLMap, id: string, source: any) {
  if (!map.getSource(id)) {
    try {
      map.addSource(id, source);
    } catch {
      // Ignore
    }
  }
}

function safeAddLayer(map: MLMap, layer: any, beforeId?: string) {
  if (!map.getLayer(layer.id)) {
    try {
      if (beforeId && map.getLayer(beforeId)) {
        map.addLayer(layer, beforeId);
      } else {
        map.addLayer(layer);
      }
    } catch {
      // Ignore
    }
  }
}

export function MapCommand({ onSelectProject }: { onSelectProject: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const layers = useAppStore((s) => s.layers.command);
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  const syncLayerVisibility = useCallback((map: MLMap, currentLayers: Record<MapLayerKey, boolean>) => {
    (Object.keys(currentLayers) as MapLayerKey[]).forEach((key) => {
      LAYER_IDS[key]?.forEach((id) => {
        if (map.getLayer(id)) {
          try {
            map.setLayoutProperty(id, 'visibility', currentLayers[key] ? 'visible' : 'none');
          } catch {
            // Ignore
          }
        }
      });
    });
  }, []);

  const handleResetCamera = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [79.4, 11.6],
      zoom: 6.1,
      speed: 1.2,
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    setMapError(null);
    setMapLoaded(false);

    let map: MLMap;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: buildDarkMapStyle(),
        center: [79.4, 11.6],
        zoom: 6.1,
        attributionControl: false,
      });
    } catch (err: any) {
      console.error('[LandGuard Command Map Init Error]', err);
      setMapError('WebGL failed to initialize on command map.');
      return;
    }

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    const ro = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    map.on('load', () => {
      setMapLoaded(true);
      map.resize();
      setTimeout(() => map.resize(), 100);
      setTimeout(() => map.resize(), 400);

      try {
        const riskZones = MOCK_PROJECTS.filter((p) => (MOCK_RISKS[p.id]?.overallPct ?? 0) >= 55).map((p) => ({
          type: 'Feature' as const,
          geometry: { type: 'Polygon' as const, coordinates: [circlePolygon(p.coords, 0.026)] },
          properties: { color: riskColor(MOCK_RISKS[p.id]?.band ?? 'low') },
        }));
        safeAddSource(map, 'src-risk', { type: 'geojson', data: { type: 'FeatureCollection', features: riskZones } });
        safeAddLayer(map, {
          id: 'pg-risk',
          type: 'fill',
          source: 'src-risk',
          paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.14 },
        });
        safeAddLayer(map, {
          id: 'pg-risk-line',
          type: 'line',
          source: 'src-risk',
          paint: { 'line-color': ['get', 'color'], 'line-width': 1.2, 'line-opacity': 0.6 },
        });

        safeAddSource(map, 'src-routes', { type: 'geojson', data: routesToGeoJSON(MOCK_ROUTES.filter((r) => r.aiRecommended)) });
        safeAddLayer(map, {
          id: 'ln-route',
          type: 'line',
          source: 'src-routes',
          paint: { 'line-color': '#38d3f0', 'line-width': 2.5, 'line-dasharray': [2, 1.4], 'line-opacity': 0.8 },
        });

        safeAddSource(map, 'src-parcels', { type: 'geojson', data: parcelsToPointsGeoJSON(MOCK_PARCELS) });
        safeAddLayer(map, {
          id: 'pt-parcels',
          type: 'circle',
          source: 'src-parcels',
          paint: { 'circle-radius': 3.4, 'circle-color': ['get', 'color'], 'circle-opacity': 0.85 },
        });

        const stakeholderPoints = {
          type: 'FeatureCollection' as const,
          features: MOCK_PARCELS.map((p) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [p.coords[0] + 0.004, p.coords[1] + 0.004] as [number, number] },
            properties: {},
          })),
        };
        safeAddSource(map, 'src-stakeholders', { type: 'geojson', data: stakeholderPoints });
        safeAddLayer(map, {
          id: 'pt-stakeholders',
          type: 'circle',
          source: 'src-stakeholders',
          paint: { 'circle-radius': 2.6, 'circle-color': '#5c6b80', 'circle-opacity': 0.6 },
        });

        safeAddSource(map, 'src-projects', { type: 'geojson', data: projectsToGeoJSON(MOCK_PROJECTS, MOCK_RISKS) });
        safeAddLayer(map, {
          id: 'pt-projects',
          type: 'circle',
          source: 'src-projects',
          paint: {
            'circle-radius': 9,
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.22,
            'circle-stroke-width': 2,
            'circle-stroke-color': ['get', 'color'],
          },
        });
        safeAddLayer(map, {
          id: 'pt-projects-label',
          type: 'symbol',
          source: 'src-projects',
          layout: {
            'text-field': ['concat', ['get', 'name'], '  ', ['to-string', ['get', 'risk']], '%'],
            'text-size': 11,
            'text-font': ['Open Sans Semibold'],
            'text-offset': [0, 1.6],
            'text-anchor': 'top',
          },
          paint: { 'text-color': '#9fb0c3', 'text-halo-color': '#05070a', 'text-halo-width': 1.2 },
        });

        map.on('click', 'pt-projects', (e) => {
          const id = e.features?.[0]?.properties?.id;
          if (id) onSelectProject(id);
        });
        map.on('mouseenter', 'pt-projects', () => {
          if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'pt-projects', () => {
          if (map.getCanvas()) map.getCanvas().style.cursor = '';
        });

        syncLayerVisibility(map, layers);
      } catch (err: any) {
        console.warn('[LandGuard Command Map Data Warning]', err?.message);
      }
    });

    map.on('error', (e) => {
      if (e?.error?.message && !e.error.message.includes('404')) {
        console.warn('[LandGuard Command Map Notice]', e.error.message);
      }
    });

    return () => {
      ro.disconnect();
      try {
        map.remove();
      } catch {
        // Ignore
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    syncLayerVisibility(map, layers);
  }, [layers, mapLoaded, syncLayerVisibility]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.getLayer('pt-projects')) return;
    try {
      map.setFilter('pt-projects', riskFilter === 'all' ? null : ['==', ['get', 'band'], riskFilter]);
      map.setFilter('pt-projects-label', riskFilter === 'all' ? null : ['==', ['get', 'band'], riskFilter]);
    } catch {
      // Ignore
    }
  }, [riskFilter, mapLoaded]);

  return (
    <div className="relative h-full w-full min-h-[420px] overflow-hidden rounded-xl border border-hair bg-[#060a0f]">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* Loading Overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-void/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-cyan" />
            <span className="font-mono text-xs text-txt-tertiary">Loading Regional Corridors…</span>
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {mapError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-void/90 p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-risk-high" />
          <p className="mt-2 font-mono text-xs text-txt-tertiary">{mapError}</p>
        </div>
      )}

      {/* Filter and Reset Controls */}
      <div className="absolute left-3 top-3 z-10 flex max-w-[280px] items-center gap-2">
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
          className="rounded-md border border-mid bg-void/90 px-2.5 py-1.5 font-mono text-[10.5px] text-txt-secondary shadow-lg backdrop-blur-md outline-none"
        >
          <option value="all">All Risk</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>
        <button
          onClick={handleResetCamera}
          title="Reset Regional View"
          className="flex items-center gap-1 rounded-md border border-mid bg-void/90 px-2 py-1.5 font-mono text-[10.5px] text-txt-secondary shadow-lg backdrop-blur-md hover:border-cyanline hover:text-cyan transition-all"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      <LayerPanel view="command" />

      <LegendPanel
        items={[
          { label: 'Critical risk', color: '#ef5b5b' },
          { label: 'High risk', color: '#f0a742' },
          { label: 'Medium risk', color: '#e8d15c' },
          { label: 'Low risk', color: '#4fbf7c' },
        ]}
      />
    </div>
  );
}

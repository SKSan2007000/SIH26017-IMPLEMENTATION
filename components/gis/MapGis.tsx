'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { buildDarkMapStyle, buildFallbackMapStyle } from '@/lib/gis/style';
import {
  circlePolygon,
  parcelsToPolygonsGeoJSON,
  parcelsToPointsGeoJSON,
  routesToGeoJSON,
  corridorToPolygonGeoJSON,
  getDemoBuildings,
  getDemoInfrastructure,
  infrastructureToGeoJSON,
  riskColor,
  getDemoRiverPath,
  getDemoRailwayPath,
} from '@/lib/gis/geojson';
import { getMockParcel, MOCK_PARCELS } from '@/lib/mock/parcels';
import { getMockRoutes, getMockRoute } from '@/lib/mock/routes';
import { getMockProject, MOCK_PROJECTS } from '@/lib/mock/projects';
import { LayerPanel } from './LayerPanel';
import { LegendPanel } from './LegendPanel';
import { ParcelPanel } from './ParcelPanel';
import { useAppStore, type MapLayerKey } from '@/lib/store/useAppStore';
import { DEMO_ROAD_NETWORK_FEATURES, DEMO_CONNECTIVITY_GAPS } from '@/lib/gis/networkData';
import { gisApi, GisFeatureCollection } from '@/lib/api/gis';
import { projectsApi } from '@/lib/api/projects';
import { routesApi } from '@/lib/api/routes';
import { parcelsApi } from '@/lib/api/parcels';
import type { Project, Route, Parcel } from '@/types';
import {
  RotateCcw,
  AlertTriangle,
  Loader2,
  Route as RouteIcon,
  Filter,
  Layers,
  Database,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';

const GIS_LAYER_MAP: Record<MapLayerKey, string[]> = {
  projects: [],
  routes: ['g-ln-route', 'g-ln-route-dashes'],
  parcels: ['g-pg-parcels-fill', 'g-ln-parcels-line', 'g-pt-parcels-label'],
  risk: ['g-pg-risk', 'g-ln-risk'],
  stakeholders: ['g-pt-stakeholders'],
  infrastructure: ['g-pt-infrastructure', 'g-pt-infra-label'],
  fieldOfficers: ['g-pt-field-cases'],
  verification: ['g-pt-field-cases'],
  buildings: ['g-pg-buildings-fill', 'g-ln-buildings-line'],
  corridorRibbon: ['g-pg-corridor-ribbon', 'g-ln-corridor-ribbon'],
  roadNetwork: ['g-ln-road-network', 'g-ln-river', 'g-ln-railway', 'g-ln-railway-bed', 'g-ln-railway-tracks'],
  connectivityGaps: ['g-ln-connectivity-gaps'],
};

function safeAddSource(map: MLMap, id: string, source: any) {
  if (!map.getSource(id)) {
    try {
      map.addSource(id, source);
    } catch {
      // Ignore duplicate
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
      // Ignore duplicate
    }
  }
}

export function MapGis() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [localRiskFilter, setLocalRiskFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  const selectedProjectId = useAppStore((s) => s.selectedProjectId) ?? 'PRJ-1042';
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const selectedRouteId = useAppStore((s) => s.selectedRouteId);
  const setSelectedRoute = useAppStore((s) => s.setSelectedRoute);
  const selectedParcelId = useAppStore((s) => s.selectedParcelId);
  const setSelectedParcel = useAppStore((s) => s.setSelectedParcel);
  const layers = useAppStore((s) => s.layers.gis);

  const [projectData, setProjectData] = useState<Project | null>(null);
  const [projectRoutes, setProjectRoutes] = useState<Route[]>([]);
  const [projectParcels, setProjectParcels] = useState<Parcel[]>([]);
  const [activeParcel, setActiveParcel] = useState<Parcel | null>(null);

  // Load project records & routes
  useEffect(() => {
    let active = true;
    async function fetchProjectMeta() {
      try {
        const p = await projectsApi.getProject(selectedProjectId);
        const r = await routesApi.getRoutes(selectedProjectId);
        const parc = await parcelsApi.getParcels(selectedProjectId);
        if (!active) return;

        if (p) setProjectData(p);
        else setProjectData(getMockProject(selectedProjectId) ?? null);

        if (r && r.length > 0) setProjectRoutes(r);
        else setProjectRoutes(getMockRoutes(selectedProjectId));

        if (parc && parc.length > 0) setProjectParcels(parc);
        else setProjectParcels(MOCK_PARCELS.filter((item) => item.projectId === selectedProjectId));
      } catch (err) {
        if (!active) return;
        setProjectData(getMockProject(selectedProjectId) ?? null);
        setProjectRoutes(getMockRoutes(selectedProjectId));
        setProjectParcels(MOCK_PARCELS.filter((item) => item.projectId === selectedProjectId));
      }
    }
    fetchProjectMeta();
    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  // Sync selected parcel
  useEffect(() => {
    if (!selectedParcelId) {
      setActiveParcel(null);
      return;
    }
    const found = projectParcels.find((p) => p.id === selectedParcelId) ?? getMockParcel(selectedParcelId);
    setActiveParcel(found ?? null);
  }, [selectedParcelId, projectParcels]);

  const activeRoute = selectedRouteId
    ? projectRoutes.find((r) => r.id === selectedRouteId) ?? getMockRoute(selectedRouteId)
    : projectRoutes[0] ?? getMockRoutes(selectedProjectId)[0];

  const currentCoords: [number, number] = projectData?.coords ?? [80.27, 13.08];

  // Apply layer visibility states safely
  const syncLayerVisibility = useCallback((map: MLMap, currentLayers: Record<MapLayerKey, boolean>) => {
    (Object.keys(currentLayers) as MapLayerKey[]).forEach((layerKey) => {
      const layerIds = GIS_LAYER_MAP[layerKey] ?? [];
      const isVisible = currentLayers[layerKey] ? 'visible' : 'none';
      layerIds.forEach((lid) => {
        if (map.getLayer(lid)) {
          try {
            map.setLayoutProperty(lid, 'visibility', isVisible);
          } catch {
            // Ignore
          }
        }
      });
    });
  }, []);

  // Center/reset camera on current project
  const handleResetCamera = useCallback(() => {
    const map = mapRef.current;
    if (!map || !currentCoords) return;
    map.flyTo({
      center: currentCoords,
      zoom: 12.5,
      pitch: 0,
      bearing: 0,
      speed: 1.2,
    });
  }, [currentCoords]);

  // Load LandGuard GIS Data onto Base Map
  const loadGisData = useCallback(
    async (map: MLMap) => {
      if (!currentCoords) return;

      try {
        // Fetch GeoJSON FeatureCollection from backend / fallback
        const gisFc: GisFeatureCollection = await gisApi.getProjectGis(selectedProjectId);
        setIsLiveBackend(!gisFc.metadata?.isDemoDataset);

        // 1. RISK BUFFER ZONE
        const riskFeature = gisFc.features.find((f: any) => f.properties?.entityType === 'RISK_BUFFER');
        const riskData = riskFeature
          ? { type: 'FeatureCollection', features: [riskFeature] }
          : {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: { type: 'Polygon', coordinates: [circlePolygon(currentCoords, 0.026)] },
                  properties: { color: riskColor('critical') },
                },
              ],
            };

        safeAddSource(map, 'g-src-risk', { type: 'geojson', data: riskData });
        safeAddLayer(map, {
          id: 'g-pg-risk',
          type: 'fill',
          source: 'g-src-risk',
          paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.1 },
        });
        safeAddLayer(map, {
          id: 'g-ln-risk',
          type: 'line',
          source: 'g-src-risk',
          paint: { 'line-color': ['get', 'color'], 'line-width': 1.5, 'line-dasharray': [3, 2], 'line-opacity': 0.6 },
        });

        // 2. RIVER WATERBODY CANAL
        safeAddSource(map, 'g-src-river', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: getDemoRiverPath(currentCoords) },
                properties: { name: 'DEMO Kosasthalaiyar Waterway Channel' },
              },
            ],
          },
        });
        safeAddLayer(map, {
          id: 'g-ln-river',
          type: 'line',
          source: 'g-src-river',
          paint: { 'line-color': '#1b547d', 'line-width': 16, 'line-opacity': 0.85 },
        });

        // 3. RAILWAY MAIN LINE CORRIDOR
        safeAddSource(map, 'g-src-railway', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: getDemoRailwayPath(currentCoords) },
                properties: { name: 'DEMO Southern Railway Main Line' },
              },
            ],
          },
        });
        safeAddLayer(map, {
          id: 'g-ln-railway-bed',
          type: 'line',
          source: 'g-src-railway',
          paint: { 'line-color': '#333e4d', 'line-width': 6 },
        });
        safeAddLayer(map, {
          id: 'g-ln-railway-tracks',
          type: 'line',
          source: 'g-src-railway',
          paint: { 'line-color': '#e8d15c', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.85 },
        });

        // 3.5 ROAD NETWORK & GAPS
        const networkFeatures = DEMO_ROAD_NETWORK_FEATURES.filter(
          (f) => f.type === 'HIGHWAY' || f.type === 'MAJOR_ROAD'
        ).map((f) => ({
          type: 'Feature' as const,
          geometry: { type: 'LineString' as const, coordinates: f.coordinates },
          properties: { id: f.id, name: f.name, type: f.type },
        }));
        safeAddSource(map, 'g-src-road-network', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: networkFeatures },
        });
        safeAddLayer(map, {
          id: 'g-ln-road-network',
          type: 'line',
          source: 'g-src-road-network',
          paint: { 'line-color': '#64748b', 'line-width': 3, 'line-opacity': 0.7 },
        });

        const gapFeatures = DEMO_CONNECTIVITY_GAPS.map((g) => ({
          type: 'Feature' as const,
          geometry: { type: 'LineString' as const, coordinates: g.proposedCorridorCoordinates },
          properties: { id: g.id, region: g.region, desc: g.description },
        }));
        safeAddSource(map, 'g-src-connectivity-gaps', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: gapFeatures },
        });
        safeAddLayer(map, {
          id: 'g-ln-connectivity-gaps',
          type: 'line',
          source: 'g-src-connectivity-gaps',
          paint: { 'line-color': '#f59e0b', 'line-width': 2.5, 'line-dasharray': [4, 3], 'line-opacity': 0.85 },
        });

        // 4. HIGHWAY CORRIDOR RIBBON
        const corridorData = activeRoute ? corridorToPolygonGeoJSON(activeRoute, 32) : { type: 'FeatureCollection', features: [] };
        safeAddSource(map, 'g-src-corridor', {
          type: 'geojson',
          data: corridorData || { type: 'FeatureCollection', features: [] },
        });
        safeAddLayer(map, {
          id: 'g-pg-corridor-ribbon',
          type: 'fill',
          source: 'g-src-corridor',
          paint: { 'fill-color': '#18202b', 'fill-opacity': 0.9 },
        });
        safeAddLayer(map, {
          id: 'g-ln-corridor-ribbon',
          type: 'line',
          source: 'g-src-corridor',
          paint: { 'line-color': '#38d3f0', 'line-width': 2, 'line-opacity': 0.8 },
        });

        // 5. CANDIDATE ROUTE ALIGNMENTS
        const routeFeatures = gisFc.features.filter((f: any) => f.properties?.entityType === 'ROUTE');
        const routesData = routeFeatures.length > 0 ? { type: 'FeatureCollection', features: routeFeatures } : routesToGeoJSON(projectRoutes);

        safeAddSource(map, 'g-src-routes', { type: 'geojson', data: routesData });
        safeAddLayer(map, {
          id: 'g-ln-route',
          type: 'line',
          source: 'g-src-routes',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['case', ['get', 'aiRecommended'], 4.5, 2.8],
            'line-opacity': 0.95,
          },
        });
        safeAddLayer(map, {
          id: 'g-ln-route-dashes',
          type: 'line',
          source: 'g-src-routes',
          paint: {
            'line-color': '#ffffff',
            'line-width': 1.5,
            'line-dasharray': [4, 4],
            'line-opacity': 0.8,
          },
        });

        // 6. BUILDING FOOTPRINTS
        const buildingsData = getDemoBuildings(currentCoords);
        safeAddSource(map, 'g-src-buildings', { type: 'geojson', data: buildingsData });
        safeAddLayer(map, {
          id: 'g-pg-buildings-fill',
          type: 'fill',
          source: 'g-src-buildings',
          paint: { 'fill-color': ['get', 'colorHex'], 'fill-opacity': 0.75 },
        });
        safeAddLayer(map, {
          id: 'g-ln-buildings-line',
          type: 'line',
          source: 'g-src-buildings',
          paint: { 'line-color': '#5c6b80', 'line-width': 1 },
        });

        // 7. PARCEL POLYGONS & LABELS
        const parcelFeatures = gisFc.features.filter((f: any) => f.properties?.entityType === 'PARCEL');
        const parcelsData = parcelFeatures.length > 0 ? { type: 'FeatureCollection', features: parcelFeatures } : parcelsToPolygonsGeoJSON(projectParcels);

        safeAddSource(map, 'g-src-parcels-poly', { type: 'geojson', data: parcelsData });
        safeAddLayer(map, {
          id: 'g-pg-parcels-fill',
          type: 'fill',
          source: 'g-src-parcels-poly',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.6,
          },
        });
        safeAddLayer(map, {
          id: 'g-ln-parcels-line',
          type: 'line',
          source: 'g-src-parcels-poly',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 1.8,
            'line-opacity': 0.95,
          },
        });

        safeAddSource(map, 'g-src-parcels-pts', { type: 'geojson', data: parcelsToPointsGeoJSON(projectParcels) });
        safeAddLayer(map, {
          id: 'g-pt-parcels-label',
          type: 'symbol',
          source: 'g-src-parcels-pts',
          layout: {
            'text-field': ['get', 'id'],
            'text-size': 10,
            'text-font': ['Open Sans Semibold'],
            'text-anchor': 'center',
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#e7edf5',
            'text-halo-color': '#05070a',
            'text-halo-width': 1.2,
          },
        });

        // 8. INFRASTRUCTURE LANDMARKS
        const infraFeatures = gisFc.features.filter((f: any) => f.properties?.entityType === 'INFRASTRUCTURE');
        const infraData = infraFeatures.length > 0 ? { type: 'FeatureCollection', features: infraFeatures } : infrastructureToGeoJSON(getDemoInfrastructure(currentCoords));

        safeAddSource(map, 'g-src-infra', { type: 'geojson', data: infraData });
        safeAddLayer(map, {
          id: 'g-pt-infrastructure',
          type: 'circle',
          source: 'g-src-infra',
          paint: {
            'circle-radius': 7,
            'circle-color': '#38d3f0',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#05070a',
          },
        });
        safeAddLayer(map, {
          id: 'g-pt-infra-label',
          type: 'symbol',
          source: 'g-src-infra',
          layout: {
            'text-field': ['concat', ['get', 'icon'], ' ', ['get', 'name']],
            'text-size': 10.5,
            'text-font': ['Open Sans Semibold'],
            'text-offset': [0, 1.3],
            'text-anchor': 'top',
          },
          paint: {
            'text-color': '#9fb0c3',
            'text-halo-color': '#05070a',
            'text-halo-width': 1.5,
          },
        });

        // CLICK & HOVER INTERACTIONS
        map.on('click', 'g-pg-parcels-fill', (e) => {
          const props = e.features?.[0]?.properties;
          if (props && props.id) {
            setSelectedParcel(props.id);
          }
        });
        map.on('mouseenter', 'g-pg-parcels-fill', () => {
          if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'g-pg-parcels-fill', () => {
          if (map.getCanvas()) map.getCanvas().style.cursor = '';
        });

        // Route selection click interaction
        map.on('click', 'g-ln-route', (e) => {
          const props = e.features?.[0]?.properties;
          if (props && props.id) {
            setSelectedRoute(props.id);
          }
        });
        map.on('mouseenter', 'g-ln-route', () => {
          if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'g-ln-route', () => {
          if (map.getCanvas()) map.getCanvas().style.cursor = '';
        });

        // Apply initial layer toggles
        syncLayerVisibility(map, layers);
      } catch (err: any) {
        console.warn('[LandGuard GIS Data Load Warning]', err?.message);
      }
    },
    [currentCoords, selectedProjectId, activeRoute, projectRoutes, projectParcels, setSelectedParcel, setSelectedRoute, syncLayerVisibility, layers]
  );

  // Map Initialization Lifecycle
  useEffect(() => {
    if (!containerRef.current) return;

    setMapError(null);
    setMapLoaded(false);

    let map: MLMap;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: buildDarkMapStyle(),
        center: currentCoords,
        zoom: 12.5,
        attributionControl: false,
      });
    } catch (err: any) {
      console.error('[LandGuard MapLibre Init Error]', err);
      setMapError('WebGL is not supported or failed to initialize.');
      return;
    }

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

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

      // Load all application data
      loadGisData(map);
    });

    map.on('error', (e) => {
      if (e?.error?.message && !e.error.message.includes('404')) {
        console.warn('[LandGuard Map Notice]', e.error.message);
      }
    });

    return () => {
      ro.disconnect();
      try {
        map.remove();
      } catch {
        // Ignore removal during transitions
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  // Route selection & corridor ribbon update
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.getSource('g-src-routes')) return;

    try {
      if (map.getLayer('g-ln-route')) {
        map.setPaintProperty('g-ln-route', 'line-width', [
          'case',
          ['==', ['get', 'id'], selectedRouteId || ''],
          5.5,
          ['get', 'aiRecommended'],
          4,
          2.5,
        ]);
      }

      const curRoute = selectedRouteId
        ? projectRoutes.find((r) => r.id === selectedRouteId) ?? getMockRoute(selectedRouteId)
        : projectRoutes[0];

      if (curRoute && map.getSource('g-src-corridor')) {
        const ribbon = corridorToPolygonGeoJSON(curRoute, 32);
        if (ribbon) {
          (map.getSource('g-src-corridor') as maplibregl.GeoJSONSource).setData(ribbon);
        }
      }

      if (map.getSource('g-src-parcels-poly') && map.getSource('g-src-parcels-pts')) {
        let filtered = projectParcels.filter(
          (p) => !selectedRouteId || p.routeIds.includes(selectedRouteId)
        );

        if (localRiskFilter !== 'all') {
          filtered = filtered.filter((p) => {
            const rBand = p.riskContribution?.toLowerCase();
            return (
              rBand === localRiskFilter ||
              (localRiskFilter === 'critical' && p.disputed) ||
              (localRiskFilter === 'high' && p.impact === 'high')
            );
          });
        }

        (map.getSource('g-src-parcels-poly') as maplibregl.GeoJSONSource).setData(parcelsToPolygonsGeoJSON(filtered));
        (map.getSource('g-src-parcels-pts') as maplibregl.GeoJSONSource).setData(parcelsToPointsGeoJSON(filtered));
      }
    } catch {
      // Safe fallback
    }
  }, [selectedRouteId, selectedProjectId, projectRoutes, projectParcels, localRiskFilter, mapLoaded]);

  // Parcel selection camera fly-to
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedParcelId) return;

    const parcel = projectParcels.find((p) => p.id === selectedParcelId) ?? getMockParcel(selectedParcelId);
    if (parcel && parcel.coords) {
      try {
        map.flyTo({
          center: parcel.coords,
          zoom: 14.5,
          speed: 1.2,
        });
      } catch {
        // Ignore
      }
    }
  }, [selectedParcelId, projectParcels, mapLoaded]);

  // Layer visibility toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    syncLayerVisibility(map, layers);
  }, [layers, mapLoaded, syncLayerVisibility]);

  return (
    <div className="relative h-[calc(100vh-150px)] min-h-[520px] w-full overflow-hidden rounded-xl border border-hair bg-[#060a0f]">
      {/* MapLibre DOM Container */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* Loading Overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-void/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-cyan/20 duration-1000" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyanline bg-panel shadow-[0_0_15px_rgba(56,211,240,0.3)]">
                <Loader2 className="h-5 w-5 animate-spin text-cyan" />
              </div>
            </div>
            <div className="text-center">
              <div className="font-display text-[13px] font-bold tracking-wide text-txt-primary">Loading LandGuard GIS…</div>
              <div className="font-mono text-[10.5px] text-txt-tertiary">Rendering Cadastral Parcels & Highway Corridor</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Fallback Banner */}
      {mapError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-void/90 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-risk-high" />
          <h4 className="mt-3 font-display text-sm font-bold text-txt-primary">GIS Map Unavailable</h4>
          <p className="mt-1 max-w-sm font-mono text-xs text-txt-tertiary">
            {mapError}. Cadastral records and route intelligence remain accessible.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg border border-cyanline bg-cyan/20 px-3 py-1.5 font-mono text-xs text-cyan hover:bg-cyan/30"
          >
            Retry Map Engine
          </button>
        </div>
      )}

      {/* Top Left Project & Filter Bar */}
      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
        {/* Project Selector */}
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="rounded-md border border-mid bg-void/90 px-2.5 py-1.5 font-mono text-[11px] text-txt-secondary shadow-lg backdrop-blur-md outline-none focus:border-cyanline"
        >
          {MOCK_PROJECTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id} — {p.name}
            </option>
          ))}
        </select>

        {/* Route Selector */}
        <div className="flex items-center gap-1 rounded-md border border-mid bg-void/90 p-0.5 shadow-lg backdrop-blur-md">
          {projectRoutes.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoute(r.id)}
              className={clsx(
                'rounded px-2 py-1 font-mono text-[10.5px] transition-colors',
                selectedRouteId === r.id || (!selectedRouteId && r.aiRecommended)
                  ? 'bg-cyan text-void font-bold shadow-sm'
                  : 'text-txt-secondary hover:text-txt-primary'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Risk Filter Dropdown */}
        <div className="flex items-center gap-1.5 rounded-md border border-mid bg-void/90 px-2 py-1 font-mono text-[11px] text-txt-secondary shadow-lg backdrop-blur-md">
          <Filter className="h-3 w-3 text-cyan" />
          <select
            value={localRiskFilter}
            onChange={(e) => setLocalRiskFilter(e.target.value as any)}
            className="bg-transparent text-[11px] text-txt-secondary outline-none"
          >
            <option value="all">Risk: All</option>
            <option value="critical">Risk: Critical</option>
            <option value="high">Risk: High</option>
            <option value="medium">Risk: Medium</option>
            <option value="low">Risk: Low</option>
          </select>
        </div>

        {/* Reset Camera */}
        <button
          onClick={handleResetCamera}
          title="Reset Camera to Project Center"
          className="flex items-center gap-1.5 rounded-md border border-mid bg-void/90 px-2.5 py-1.5 font-mono text-[11px] text-txt-secondary shadow-lg backdrop-blur-md hover:border-cyanline hover:text-cyan transition-all"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>

        {/* Live / Demo Dataset Badge */}
        <div className="flex items-center gap-1.5 rounded-md border border-hair bg-void/85 px-2.5 py-1.5 font-mono text-[10px] text-txt-tertiary backdrop-blur-md">
          <Database className="h-3 w-3 text-cyan" />
          <span>{isLiveBackend ? 'Live Backend GIS' : 'Demo GIS Dataset (India Corridor)'}</span>
        </div>
      </div>

      <LayerPanel view="gis" />

      <LegendPanel
        items={[
          { label: 'Critical Delay / Disputed Parcel', color: '#ef5b5b' },
          { label: 'High Impact / Acquisition Pending', color: '#f0a742' },
          { label: 'Medium Impact / Negotiation', color: '#e8d15c' },
          { label: 'Low Impact / Verified', color: '#4fbf7c' },
        ]}
      />

      {activeParcel && (
        <ParcelPanel
          parcel={activeParcel}
          onClose={() => setSelectedParcel(null)}
          onUpdate={() => {
            // Trigger parcel refetch
            parcelsApi.getParcels(selectedProjectId).then((parc) => {
              if (parc) setProjectParcels(parc);
            });
          }}
        />
      )}
    </div>
  );
}

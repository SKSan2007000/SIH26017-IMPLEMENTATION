'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Compass,
  AlertTriangle,
  Loader2,
  Box,
  Layers,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { MOCK_PARCELS, getMockParcel } from '@/lib/mock/parcels';
import { getMockProject, MOCK_PROJECTS } from '@/lib/mock/projects';
import { getMockRoutes, getMockRoute } from '@/lib/mock/routes';
import {
  getDemoBuildings,
  getDemoInfrastructure,
  getParcelColor,
  getViaductPierPositions,
  getDemoRiverPath,
  getDemoRailwayPath,
} from '@/lib/gis/geojson';
import { useAppStore } from '@/lib/store/useAppStore';
import { TwinToolbar } from './TwinToolbar';
import { DemoFlag } from '@/components/ui/Primitives';
import { ParcelPanel } from '../gis/ParcelPanel';
import { projectsApi } from '@/lib/api/projects';
import { routesApi } from '@/lib/api/routes';
import { parcelsApi } from '@/lib/api/parcels';
import { gisApi, GisFeatureCollection } from '@/lib/api/gis';
import type { Project, Route, Parcel } from '@/types';
import clsx from 'clsx';

type CesiumModule = typeof import('cesium');

export function CesiumTwin() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<import('cesium').Viewer | null>(null);
  const cesiumRef = useRef<CesiumModule | null>(null);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId) ?? 'PRJ-1042';
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const selectedRouteId = useAppStore((s) => s.selectedRouteId);
  const setSelectedRoute = useAppStore((s) => s.setSelectedRoute);
  const selectedParcelId = useAppStore((s) => s.selectedParcelId);
  const setSelectedParcel = useAppStore((s) => s.setSelectedParcel);

  const [projectData, setProjectData] = useState<Project | null>(null);
  const [projectRoutes, setProjectRoutes] = useState<Route[]>([]);
  const [projectParcels, setProjectParcels] = useState<Parcel[]>([]);
  const [activeParcel, setActiveParcel] = useState<Parcel | null>(null);

  // Load project meta
  useEffect(() => {
    let active = true;
    async function loadMeta() {
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
      } catch {
        if (!active) return;
        setProjectData(getMockProject(selectedProjectId) ?? null);
        setProjectRoutes(getMockRoutes(selectedProjectId));
        setProjectParcels(MOCK_PARCELS.filter((item) => item.projectId === selectedProjectId));
      }
    }
    loadMeta();
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

  const activeProject = projectData ?? getMockProject(selectedProjectId) ?? {
    id: selectedProjectId,
    name: 'Chennai Northern Port Corridor',
    state: 'Tamil Nadu',
    district: 'Chennai',
    coords: [80.27, 13.08] as [number, number],
    status: 'Land Acquisition',
    overallProgress: 30,
  };

  const projectCoords = activeProject.coords || [80.27, 13.08];

  // Fly to Corridor Overview
  const flyHome = useCallback(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || viewer.isDestroyed() || !Cesium || !projectCoords) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        projectCoords[0] - 0.018,
        projectCoords[1] - 0.024,
        1250
      ),
      orientation: {
        heading: Cesium.Math.toRadians(38),
        pitch: Cesium.Math.toRadians(-25),
        roll: 0,
      },
      duration: 1.8,
    });
  }, [projectCoords]);

  // Top-down 2D Orthographic view
  const flyTopView = useCallback(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || viewer.isDestroyed() || !Cesium || !projectCoords) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(projectCoords[0], projectCoords[1], 4500),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 1.5,
    });
  }, [projectCoords]);

  // Main Cesium Scene Boot Lifecycle
  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    async function boot() {
      if (!containerRef.current || !activeProject) return;

      setInitError(null);
      setReady(false);

      try {
        (window as unknown as { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL = '/cesium';

        const Cesium = await import('cesium');
        if (cancelled || !containerRef.current) return;
        cesiumRef.current = Cesium;

        // Guaranteed to run WITHOUT token
        Cesium.Ion.defaultAccessToken = '';

        // Base raster imagery provider (Dark Carto / OSM with fallback)
        let baseLayerProvider: any;
        try {
          baseLayerProvider = new Cesium.UrlTemplateImageryProvider({
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            credit: '© OpenStreetMap contributors',
          });
        } catch {
          baseLayerProvider = new Cesium.TileCoordinatesImageryProvider();
        }

        const viewer = new Cesium.Viewer(containerRef.current, {
          baseLayer: baseLayerProvider ? new Cesium.ImageryLayer(baseLayerProvider) : false,
          terrainProvider: new Cesium.EllipsoidTerrainProvider(),
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false,
        });
        viewerRef.current = viewer;

        viewer.resolutionScale = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
        viewer.resize();

        ro = new ResizeObserver(() => {
          if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            viewerRef.current.resize();
          }
        });
        if (containerRef.current) {
          ro.observe(containerRef.current);
        }

        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#070b12');
        if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
        if (viewer.scene.sun) viewer.scene.sun.show = false;
        if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#04060a');

        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.00018;

        const routes = projectRoutes.length > 0 ? projectRoutes : getMockRoutes(activeProject.id);
        const activeRoute =
          routes.find((r) => r.id === selectedRouteId) ??
          routes.find((r) => r.aiRecommended) ??
          routes[0];

        // =========================================================================
        // 1. ELEVATED HIGHWAY VIADUCT & CONCRETE SUPPORT PIERS (Hero Feature)
        // =========================================================================
        routes.forEach((route) => {
          const positions = Cesium.Cartesian3.fromDegreesArray(route.path.flat());
          const isSelected = route.id === activeRoute.id;

          if (isSelected) {
            // A. ELEVATED VIADUCT BOX GIRDER DECK
            viewer.entities.add({
              id: `twin-viaduct-deck-${route.id}`,
              name: `${route.label} Elevated Viaduct Structure`,
              corridor: {
                positions,
                width: 26,
                height: 20,
                extrudedHeight: 22.8,
                material: Cesium.Color.fromCssColorString('#6e7c8e'),
                cornerType: Cesium.CornerType.ROUNDED,
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString('#4a5563'),
              },
            });

            // B. ASPHALT ROADWAY SURFACE (Dual Carriageway)
            viewer.entities.add({
              id: `twin-viaduct-road-${route.id}`,
              name: `${route.label} Asphalt Surface`,
              corridor: {
                positions,
                width: 24.6,
                height: 22.9,
                material: Cesium.Color.fromCssColorString('#181f28'),
                cornerType: Cesium.CornerType.ROUNDED,
              },
            });

            // C. CONCRETE CENTER MEDIAN DIVIDER
            viewer.entities.add({
              id: `twin-viaduct-median-${route.id}`,
              name: `${route.label} Median Divider`,
              polyline: {
                positions: Cesium.Cartesian3.fromDegreesArrayHeights(
                  route.path.flatMap(([lon, lat]) => [lon, lat, 23.4])
                ),
                width: 3,
                material: Cesium.Color.fromCssColorString('#8a98a8'),
              },
            });

            // D. GLOWING CENTERLINE & DASHED LANE MARKINGS
            viewer.entities.add({
              id: `twin-route-${route.id}`,
              name: `${route.label} Active Centerline`,
              polyline: {
                positions: Cesium.Cartesian3.fromDegreesArrayHeights(
                  route.path.flatMap(([lon, lat]) => [lon, lat, 23.5])
                ),
                width: 4.5,
                material: Cesium.Color.fromCssColorString('#38d3f0').withAlpha(0.95),
              },
            });

            // E. CONCRETE SUPPORT PIER COLUMNS (Pillars with flared caps)
            const pierPositions = getViaductPierPositions(route.path, 0.45);
            pierPositions.forEach((pier, pIdx) => {
              viewer.entities.add({
                id: `twin-pier-col-${route.id}-${pIdx}`,
                name: `Viaduct Pier Column #${pIdx + 1}`,
                position: Cesium.Cartesian3.fromDegrees(pier.lon, pier.lat, 10),
                cylinder: {
                  length: 20,
                  topRadius: 3.2,
                  bottomRadius: 4.0,
                  material: Cesium.Color.fromCssColorString('#8492a4'),
                  outline: true,
                  outlineColor: Cesium.Color.fromCssColorString('#505c6d'),
                },
              });

              viewer.entities.add({
                id: `twin-pier-cap-${route.id}-${pIdx}`,
                name: `Viaduct Pier Cap #${pIdx + 1}`,
                position: Cesium.Cartesian3.fromDegrees(pier.lon, pier.lat, 20.5),
                cylinder: {
                  length: 2.2,
                  topRadius: 7.5,
                  bottomRadius: 3.8,
                  material: Cesium.Color.fromCssColorString('#95a3b5'),
                  outline: true,
                  outlineColor: Cesium.Color.fromCssColorString('#505c6d'),
                },
              });
            });

            // F. GROUND LEVEL SERVICE CORRIDOR
            viewer.entities.add({
              id: `twin-corridor-${route.id}`,
              name: `${route.label} Under-Viaduct Service Corridor`,
              corridor: {
                positions,
                width: 38,
                material: Cesium.Color.fromCssColorString('#121820').withAlpha(0.75),
                cornerType: Cesium.CornerType.ROUNDED,
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString('#3a4758').withAlpha(0.4),
                outlineWidth: 1,
              },
            });
          } else {
            // Alternative Routes
            const altColor =
              route.label === 'Route A'
                ? '#38d3f0'
                : route.label === 'Route B'
                ? '#e8d15c'
                : route.label === 'Route C'
                ? '#4fbf7c'
                : '#f0a742';

            viewer.entities.add({
              id: `twin-corridor-${route.id}`,
              name: `${route.label} Corridor (${route.strategy})`,
              corridor: {
                positions,
                width: 22,
                material: Cesium.Color.fromCssColorString('#151b24').withAlpha(0.6),
                cornerType: Cesium.CornerType.ROUNDED,
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString(altColor).withAlpha(0.5),
                outlineWidth: 1,
              },
            });

            viewer.entities.add({
              id: `twin-route-${route.id}`,
              name: `${route.label} Alternative Path`,
              polyline: {
                positions,
                width: 2.5,
                material: Cesium.Color.fromCssColorString(altColor).withAlpha(0.7),
                clampToGround: true,
              },
            });
          }
        });

        // =========================================================================
        // 2. 3D LAND PARCELS (Extruded Cadastral Blocks Color-Coded by Live Risk)
        // =========================================================================
        const parcels = projectParcels.length > 0 ? projectParcels : MOCK_PARCELS.filter((p) => p.projectId === activeProject.id);
        parcels.forEach((p) => {
          const hex = getParcelColor(p);
          const height =
            p.disputed || p.impact === 'high' || p.riskContribution === 'critical'
              ? 50
              : p.impact === 'affected' || p.riskContribution === 'high'
              ? 34
              : p.impact === 'potential'
              ? 22
              : 12;

          viewer.entities.add({
            id: `twin-parcel-${p.id}`,
            name: `Parcel ${p.id} (${p.ownerRef})`,
            position: Cesium.Cartesian3.fromDegrees(p.coords[0], p.coords[1], height / 2),
            box: {
              dimensions: new Cesium.Cartesian3(120, 110, height),
              material: Cesium.Color.fromCssColorString(hex).withAlpha(0.8),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#04060a'),
            },
            label: {
              text: p.id,
              font: '10px IBM Plex Mono',
              pixelOffset: new Cesium.Cartesian2(0, -30),
              fillColor: Cesium.Color.fromCssColorString('#e7edf5'),
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('#05070a').withAlpha(0.85),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 6500),
            },
            properties: {
              parcelId: p.id,
              routeIds: p.routeIds,
              ownerRef: p.ownerRef,
              impact: p.impact,
              verification: p.verification,
              risk: p.riskContribution,
            },
          });
        });

        // =========================================================================
        // 3. DENSE 3D BUILDINGS & STRUCTURES ON CORRIDOR
        // =========================================================================
        const buildings = getDemoBuildings(projectCoords);
        buildings.features.forEach((b) => {
          const props = b.properties;
          const center = props.center;

          viewer.entities.add({
            id: `twin-building-${props.id}`,
            name: props.name,
            position: Cesium.Cartesian3.fromDegrees(center[0], center[1], props.heightMeters / 2),
            box: {
              dimensions: new Cesium.Cartesian3(props.widthM, props.lengthM, props.heightMeters),
              material: Cesium.Color.fromCssColorString(props.colorHex).withAlpha(0.92),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#1e2836').withAlpha(0.8),
            },
            label: {
              text: props.type,
              font: '9px IBM Plex Mono',
              pixelOffset: new Cesium.Cartesian2(0, -20),
              fillColor: Cesium.Color.fromCssColorString('#9fb0c3'),
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('#04060a').withAlpha(0.75),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 4500),
            },
          });

          if (props.hasRooftopStructure) {
            const roofHeight = props.heightMeters + 5;
            viewer.entities.add({
              id: `twin-roof-${props.id}`,
              name: `${props.name} Rooftop Structure`,
              position: Cesium.Cartesian3.fromDegrees(center[0], center[1], roofHeight),
              box: {
                dimensions: new Cesium.Cartesian3(props.widthM * 0.45, props.lengthM * 0.45, 10),
                material: Cesium.Color.fromCssColorString(props.roofColorHex).withAlpha(0.95),
                outline: true,
                outlineColor: Cesium.Color.BLACK,
              },
            });
          }
        });

        // =========================================================================
        // 4. 3D INFRASTRUCTURE LANDMARKS, WATERWAYS & RAILWAYS
        // =========================================================================
        const infra = getDemoInfrastructure(projectCoords);
        infra.forEach((item) => {
          viewer.entities.add({
            id: `twin-infra-struct-${item.id}`,
            name: item.name,
            position: Cesium.Cartesian3.fromDegrees(item.coords[0], item.coords[1], 20),
            cylinder: {
              length: 40,
              topRadius: 20,
              bottomRadius: 26,
              material:
                item.type === 'School'
                  ? Cesium.Color.fromCssColorString('#38d3f0').withAlpha(0.7)
                  : item.type === 'Hospital'
                  ? Cesium.Color.fromCssColorString('#ef5b5b').withAlpha(0.7)
                  : Cesium.Color.fromCssColorString('#9fb0c3').withAlpha(0.6),
              outline: true,
              outlineColor: Cesium.Color.BLACK,
            },
          });

          viewer.entities.add({
            id: `twin-infra-${item.id}`,
            name: item.name,
            position: Cesium.Cartesian3.fromDegrees(item.coords[0], item.coords[1], 44),
            point: {
              pixelSize: 10,
              color: Cesium.Color.fromCssColorString('#38d3f0'),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
            },
            label: {
              text: `${item.icon} ${item.name}`,
              font: '11px IBM Plex Mono',
              pixelOffset: new Cesium.Cartesian2(0, -28),
              fillColor: Cesium.Color.fromCssColorString('#e7edf5'),
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('#05070a').withAlpha(0.85),
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            },
          });
        });

        // Railway & River Canal
        const railPath = getDemoRailwayPath(projectCoords);
        viewer.entities.add({
          id: 'twin-railway-line',
          name: 'DEMO Southern Railway Main Line',
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(railPath.flat()),
            width: 5,
            material: Cesium.Color.fromCssColorString('#e8d15c').withAlpha(0.8),
            clampToGround: true,
          },
        });

        const riverPath = getDemoRiverPath(projectCoords);
        viewer.entities.add({
          id: 'twin-river-channel',
          name: 'DEMO Kosasthalaiyar Waterway Channel',
          corridor: {
            positions: Cesium.Cartesian3.fromDegreesArray(riverPath.flat()),
            width: 55,
            material: Cesium.Color.fromCssColorString('#1b547d').withAlpha(0.85),
            cornerType: Cesium.CornerType.ROUNDED,
          },
        });

        // =========================================================================
        // 5. 3D STAKEHOLDER PINS & FIELD OPS
        // =========================================================================
        parcels.forEach((p) => {
          viewer.entities.add({
            id: `twin-stake-${p.id}`,
            name: `Stakeholder: ${p.ownerRef}`,
            position: Cesium.Cartesian3.fromDegrees(p.coords[0] + 0.0012, p.coords[1] + 0.0012, 35),
            point: {
              pixelSize: 6,
              color: Cesium.Color.fromCssColorString('#9fb0c3'),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
            },
            label: {
              text: p.ownerRef,
              font: '9px IBM Plex Mono',
              pixelOffset: new Cesium.Cartesian2(0, -14),
              fillColor: Cesium.Color.fromCssColorString('#9fb0c3'),
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('#05070a').withAlpha(0.8),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 3500),
            },
          });
        });

        // 3D Risk Envelope
        viewer.entities.add({
          id: 'twin-riskzone',
          name: 'Project Critical Delay Risk Zone',
          position: Cesium.Cartesian3.fromDegrees(projectCoords[0], projectCoords[1]),
          ellipse: {
            semiMinorAxis: 3200,
            semiMajorAxis: 3200,
            material: Cesium.Color.fromCssColorString('#ef5b5b').withAlpha(0.08),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#ef5b5b').withAlpha(0.4),
          },
        });

        // =========================================================================
        // 6. INTERACTIVE 3D SELECTION HANDLER
        // =========================================================================
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((click: { position: import('cesium').Cartesian2 }) => {
          const picked = viewer.scene.pick(click.position);
          if (Cesium.defined(picked) && picked.id) {
            const id = String(picked.id.id || '');
            if (id.startsWith('twin-parcel-')) {
              const pId = id.replace('twin-parcel-', '');
              setSelectedParcel(pId);
            } else if (id.startsWith('twin-stake-')) {
              const pId = id.replace('twin-stake-', '');
              setSelectedParcel(pId);
            } else if (id.startsWith('twin-route-') || id.startsWith('twin-viaduct-')) {
              const rId = id.replace('twin-route-', '').replace('twin-viaduct-deck-', '').replace('twin-viaduct-road-', '');
              setSelectedRoute(rId);
            }
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        flyHome();
        setReady(true);
      } catch (err: any) {
        console.error('[LandGuard Cesium Boot Error]', err);
        setInitError(err?.message || 'CesiumJS failed to initialize WebGL context.');
      }
    }

    boot();
    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [activeProject.id, selectedRouteId, flyHome, setSelectedParcel, setSelectedRoute]);

  // Parcel selection camera fly-to
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || viewer.isDestroyed() || !Cesium || !selectedParcelId) return;

    const parcel = projectParcels.find((p) => p.id === selectedParcelId) ?? getMockParcel(selectedParcelId);
    if (parcel && parcel.coords) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(parcel.coords[0], parcel.coords[1] - 0.0035, 360),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-38),
          roll: 0,
        },
        duration: 1.2,
      });
    }
  }, [selectedParcelId, projectParcels]);

  return (
    <div className="relative h-[calc(100vh-150px)] min-h-[520px] w-full overflow-hidden rounded-xl border border-hair bg-[#04060a]">
      {/* Cesium Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full [&_.cesium-viewer-bottom]:hidden" />

      {/* Loading Overlay */}
      {!ready && !initError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-void/90 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-cyan/20 duration-1000" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyanline bg-panel shadow-[0_0_15px_rgba(56,211,240,0.3)]">
                <Loader2 className="h-5 w-5 animate-spin text-cyan" />
              </div>
            </div>
            <div className="text-center">
              <div className="font-display text-[13px] font-bold tracking-wide text-txt-primary">
                Initializing 3D Digital Twin…
              </div>
              <div className="font-mono text-[10.5px] text-txt-tertiary">
                Rendering Viaduct Infrastructure Corridor & 3D Cadastral Parcels
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Fallback Banner */}
      {initError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-void/95 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-risk-high" />
          <h4 className="mt-3 font-display text-sm font-bold text-txt-primary">3D Digital Twin Failed to Initialize</h4>
          <p className="mt-1 max-w-md font-mono text-xs text-txt-tertiary">
            {initError}. Please confirm your browser supports WebGL 2.0 with hardware acceleration.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg border border-cyanline bg-cyan/20 px-3.5 py-1.5 font-mono text-xs text-cyan hover:bg-cyan/30"
          >
            Retry 3D Twin
          </button>
        </div>
      )}

      {/* Twin Layer & Mode Toolbar */}
      <TwinToolbar viewerRef={viewerRef} cesiumRef={cesiumRef} projectId={selectedProjectId} />

      {/* Acquisition Process Lifecycle Stages Indicator */}
      <div className="absolute top-16 left-3 z-10 pointer-events-none hidden lg:flex items-center gap-1.5 rounded-lg border border-hair bg-void/80 px-2.5 py-1.5 backdrop-blur-md text-[10.5px] font-mono">
        <span className="text-txt-tertiary uppercase text-[9px]">Lifecycle:</span>
        <span className="text-cyan font-bold">1. Notice</span> →
        <span className="text-txt-secondary">2. Negotiation</span> →
        <span className="text-txt-secondary">3. Verification</span> →
        <span className="text-txt-secondary">4. Compensation</span> →
        <span className="text-txt-secondary">5. Acquisition</span>
      </div>

      {/* Camera Control Cluster */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5">
        <button
          onClick={flyHome}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-void/85 text-txt-secondary hover:border-mid hover:text-txt-primary transition-all"
          title="Corridor 3D Overview"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={flyTopView}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-void/85 text-txt-secondary hover:border-mid hover:text-txt-primary transition-all"
          title="Top-Down 2D View"
        >
          <Box className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            const viewer = viewerRef.current;
            if (viewer) viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.35);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-void/85 text-txt-secondary hover:border-mid hover:text-txt-primary transition-all"
          title="Zoom In"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            const viewer = viewerRef.current;
            if (viewer) viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.35);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-void/85 text-txt-secondary hover:border-mid hover:text-txt-primary transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Navigation Helper Hint */}
      <div className="absolute bottom-11 left-3 z-10 pointer-events-none flex items-center gap-2 rounded-md border border-hair bg-void/80 px-2.5 py-1.5 text-[10.5px] text-txt-tertiary backdrop-blur-sm">
        <Compass className="h-3 w-3 text-cyan" />
        Left-drag to rotate · Right-drag to tilt/orbit · Scroll to zoom · Click parcel/route to inspect
      </div>

      <div className="absolute bottom-3 right-3 z-20">
        <DemoFlag />
      </div>

      {activeParcel && (
        <ParcelPanel
          parcel={activeParcel}
          onClose={() => setSelectedParcel(null)}
          onUpdate={() => {
            parcelsApi.getParcels(selectedProjectId).then((parc) => {
              if (parc) setProjectParcels(parc);
            });
          }}
        />
      )}
    </div>
  );
}

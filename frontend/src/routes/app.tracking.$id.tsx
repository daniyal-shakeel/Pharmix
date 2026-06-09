import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/store";
import { PageHeader, SectionPanel, StatusBadge } from "@/components/ui-kit";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Navigation,
  Clock,
  Radio,
  Building2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/api/base";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/app/tracking/$id")({
  component: TrackingDetail,
});

const SOCKET_URL = "http://localhost:5000";

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const isInPakistan = (lat: number, lng: number) => {
  return lat >= 23.0 && lat <= 38.0 && lng >= 60.0 && lng <= 80.0;
};

function TrackingDetail() {
  const { id } = Route.useParams();
  const user = useAuth((s) => s.user);
  const role = user?.role || "admin";
  const isRider = role === "delivery";

  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(null);
  const [pathHistory, setPathHistory] = useState<[number, number][]>([]);
  const [tracking, setTracking] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastValidPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/shipments/${id}`);
        setShipment(res.data);
        
        if (res.data.path?.length > 0) {
          const history: [number, number][] = res.data.path.map((p: any) => [p.lat, p.lng]);
          setPathHistory(history);
          const lastPoint = history[history.length - 1];
          setRiderPos({ lat: lastPoint[0], lng: lastPoint[1] });
        } else if (res.data.riderLocation?.lat && isInPakistan(res.data.riderLocation.lat, res.data.riderLocation.lng)) {
          const initialPos = { lat: res.data.riderLocation.lat, lng: res.data.riderLocation.lng };
          setRiderPos(initialPos);
          setPathHistory([[initialPos.lat, initialPos.lng]]);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to load shipment");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.emit("join-shipment", id);

    socket.on("location-update", (data) => {
      if (data.shipmentId === id) {
        setRiderPos({ lat: data.lat, lng: data.lng });
      }
    });

    return () => {
      socket.emit("leave-shipment", id);
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center = riderPos || { lat: 24.8607, lng: 67.0011 };
    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    if (riderPos) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:32px;height:40px;display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.3));transition:all 0.5s ease-out">
                <div style="background:oklch(0.58 0.16 277);width:32px;height:32px;border-radius:50%;display:grid;place-items:center;border:2px solid white;z-index:1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:12px solid oklch(0.58 0.16 277);margin-top:-8px"></div>
              </div>`,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      });
      markerRef.current = L.marker([riderPos.lat, riderPos.lng], { icon }).addTo(map);
    }

    const polyline = L.polyline(pathHistory, {
      color: "oklch(0.58 0.16 277)",
      dashArray: "8, 12",
      weight: 3,
      opacity: 0.7,
      lineJoin: "round"
    }).addTo(map);
    polylineRef.current = polyline;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [loading]);

  useEffect(() => {
    if (!riderPos || !mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([riderPos.lat, riderPos.lng]);
    } else {
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:32px;height:40px;display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.3));transition:all 0.5s ease-out">
                <div style="background:oklch(0.58 0.16 277);width:32px;height:32px;border-radius:50%;display:grid;place-items:center;border:2px solid white;z-index:1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:12px solid oklch(0.58 0.16 277);margin-top:-8px"></div>
              </div>`,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      });
      markerRef.current = L.marker([riderPos.lat, riderPos.lng], { icon }).addTo(mapInstanceRef.current);
    }

    setPathHistory(prev => {
      const last = prev[prev.length - 1];
      if (last && last[0] === riderPos.lat && last[1] === riderPos.lng) return prev;
      const newPath = [...prev, [riderPos.lat, riderPos.lng] as [number, number]];
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(newPath);
      }
      return newPath;
    });

    mapInstanceRef.current.panTo([riderPos.lat, riderPos.lng]);
  }, [riderPos]);

  const startTracking = async (isAuto = false) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    lastValidPosRef.current = null;
    setTracking(true);
    localStorage.setItem(`phx_tracking_${id}`, "true");
    if (!isAuto) {
      try {
        await api.post(`/shipments/${id}/events`, { type: "start" });
        toast.success("Location sharing started");
      } catch (e) {
        console.error("Failed to log start event", e);
      }
    }

    const handleFilteredUpdate = (lat: number, lng: number, emit: boolean, accuracy?: number) => {
      const MAX_JUMP_KM = 5; 
      const MAX_ACCURACY_METERS = 200;

      if (accuracy !== undefined && accuracy > MAX_ACCURACY_METERS) {
        console.warn(`Accuracy Gate: Ignored low-confidence update (${accuracy.toFixed(0)}m accuracy)`);
        return;
      }

      if (!isInPakistan(lat, lng)) {
        console.warn(`Geofence Gate: Ignored update outside Pakistan (${lat}, ${lng})`);
        return;
      }

      if (lastValidPosRef.current) {
        const dist = calculateDistance(
          lastValidPosRef.current.lat,
          lastValidPosRef.current.lng,
          lat,
          lng
        );
        if (dist > MAX_JUMP_KM) {
          console.warn(`Jump Filter: Ignored ${dist.toFixed(2)}km jump to ${lat}, ${lng}`);
          return;
        }
      }

      const newPos = { lat, lng };
      lastValidPosRef.current = newPos;
      setRiderPos(newPos);

      if (emit) {
        socketRef.current?.emit("rider-location", {
          shipmentId: id,
          lat,
          lng,
        });
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        handleFilteredUpdate(
          position.coords.latitude, 
          position.coords.longitude, 
          true, 
          position.coords.accuracy
        );
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Failed to get location. Please enable GPS.");
        setTracking(false);
        localStorage.removeItem(`phx_tracking_${id}`);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  const stopTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    lastValidPosRef.current = null;
    setTracking(false);
    localStorage.removeItem(`phx_tracking_${id}`);
    
    try {
      await api.post(`/shipments/${id}/events`, { type: "stop" });
      toast.success("Location sharing stopped");
    } catch (e) {
      console.error("Failed to log stop event", e);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const res = await api.patch(`/shipments/${id}/status`, { status: newStatus });
      setShipment(res.data.shipment);
      if (newStatus === "delivered") {
        stopTracking();
        toast.success("Delivery request sent for approval");
      } else {
        toast.success(`Status updated to ${newStatus}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update status");
    }
  };

  const handleApproveDelivery = async () => {
    try {
      const res = await api.post(`/shipments/${id}/approve`);
      setShipment(res.data.shipment);
      toast.success("Delivery approved successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to approve delivery");
    }
  };

  useEffect(() => {
    if (loading || !shipment || !isRider || tracking) return;
    const stored = localStorage.getItem(`phx_tracking_${id}`);
    if (stored === "true" && shipment.status === "in_transit") {
      startTracking(true);
    }
  }, [loading, id]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <Link to="/app/tracking" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to Live Tracking
        </Link>
        <div className="text-center py-20">
          <Truck className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">Shipment not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Link to="/app/tracking" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back to Live Tracking
      </Link>

      <PageHeader
        title={`Tracking ${shipment.id}`}
        description={`${shipment.origin} → ${shipment.destination} · ${shipment.riderName}`}
      >
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${shipment.status === 'delivered' ? 'bg-primary' : (riderPos ? "bg-success pulse-dot" : "bg-muted-foreground")}`} />
          <span className={`text-xs font-medium ${shipment.status === 'delivered' ? 'text-primary' : (riderPos ? "text-success" : "text-muted-foreground")}`}>
            {shipment.status === 'delivered' ? 'Completed' : (riderPos ? "Live" : "Offline")}
          </span>
        </div>
        <StatusBadge status={role === "pharmacy" && shipment.status === "delivered_pending" ? "in_transit" : shipment.status} />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <SectionPanel className="lg:col-span-2 !p-0 overflow-hidden" title={`${shipment.origin} → ${shipment.destination}`} description={`Vehicle ${shipment.id}`}>
          <div ref={mapRef} className="h-[450px] w-full" style={{ zIndex: 1 }} />
          {isRider && shipment.status === "in_transit" && (
            <div className="p-3 border-t border-border flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {tracking ? "Sharing your location in real-time" : "Start sharing your location"}
              </div>
              {tracking ? (
                <Button size="sm" variant="outline" className="h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/5" onClick={() => stopTracking()}>
                  <Radio className="h-3.5 w-3.5 mr-1.5" /> Stop Sharing
                </Button>
              ) : (
                <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90" onClick={() => startTracking()}>
                  <Navigation className="h-3.5 w-3.5 mr-1.5" /> Share Location
                </Button>
              )}
              {shipment.status === "in_transit" && (
                <Button size="sm" variant="success" className="h-8 text-xs" onClick={() => handleUpdateStatus("delivered")}>
                  <Package className="h-3.5 w-3.5 mr-1.5" /> Mark Delivered
                </Button>
              )}
            </div>
          )}
          {isRider && shipment.status === "delivered_pending" && (
            <div className="p-3 border-t border-border bg-warning/5 flex items-center justify-between">
              <div className="text-xs text-warning font-medium flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Awaiting Manufacturer Approval
              </div>
              <div className="text-[10px] text-muted-foreground italic">Pharmacy cannot see delivered status yet</div>
            </div>
          )}
          {(role === "manufacturer" || role === "admin") && shipment.status === "delivered_pending" && (
            <div className="p-3 border-t border-border bg-primary/5 flex items-center justify-between">
              <div className="text-xs font-medium">Rider has reached destination. Verify and approve delivery?</div>
              <Button size="sm" className="h-8 text-xs" onClick={handleApproveDelivery}>
                <Package className="h-3.5 w-3.5 mr-1.5" /> Approve Delivery
              </Button>
            </div>
          )}
        </SectionPanel>

        <SectionPanel title="Delivery Partner" description={shipment.riderName}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-2">
              <div className="h-11 w-11 rounded-full bg-primary/15 border border-primary/30 grid place-items-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">{shipment.riderName}</div>
                <div className="text-[11px] text-muted-foreground">
                  {shipment.riderVehicle || "N/A"} · {shipment.riderZone || "N/A"}
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "ID", value: shipment.riderId, mono: true },
                { label: "Email", value: shipment.riderEmail || "N/A" },
                { label: "Phone", value: shipment.riderPhone || "N/A" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="text-[10px] text-muted-foreground">{row.label}</span>
                  <span className={`text-[11px] font-medium ${row.mono ? "font-mono" : ""}`}>{row.value}</span>
                </div>
              ))}
            </div>
            {riderPos && (
              <div className="p-2 rounded-md bg-surface-2 border border-border text-[10px] font-mono text-muted-foreground">
                {riderPos.lat.toFixed(6)}, {riderPos.lng.toFixed(6)}
              </div>
            )}
            {role === "admin" && (
              <Link to="/app/users/delivery/$id" params={{ id: shipment.riderId }} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                <Truck className="h-3 w-3" /> View full profile
              </Link>
            )}
          </div>
        </SectionPanel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <SectionPanel title="Sent By" description={shipment.manufacturerName}>
          <div className="space-y-3">
            {[
              { label: "Name", value: shipment.manufacturerName },
              { label: "ID", value: shipment.manufacturerId, mono: true },
              { label: "Email", value: shipment.manufacturerEmail || "N/A" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <span className="text-[10px] text-muted-foreground">{row.label}</span>
                <span className={`text-[11px] font-medium ${row.mono ? "font-mono" : ""}`}>{row.value}</span>
              </div>
            ))}
            {role === "admin" && (
              <Link to="/app/users/manufacturer/$id" params={{ id: shipment.manufacturerId }} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1">
                <Building2 className="h-3 w-3" /> View profile
              </Link>
            )}
          </div>
        </SectionPanel>

        <SectionPanel title="Going To" description={shipment.pharmacyName}>
          <div className="space-y-3">
            {[
              { label: "Name", value: shipment.pharmacyName },
              { label: "ID", value: shipment.pharmacyId, mono: true },
              { label: "Email", value: shipment.pharmacyEmail || "N/A" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <span className="text-[10px] text-muted-foreground">{row.label}</span>
                <span className={`text-[11px] font-medium ${row.mono ? "font-mono" : ""}`}>{row.value}</span>
              </div>
            ))}
            {role === "admin" && (
              <Link to="/app/users/pharmacy/$id" params={{ id: shipment.pharmacyId }} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1">
                <Building2 className="h-3 w-3" /> View profile
              </Link>
            )}
          </div>
        </SectionPanel>

        <SectionPanel title="Order" description={shipment.orderId}>
          <div className="space-y-3">
            {[
              { label: "Order ID", value: shipment.orderId, mono: true },
              { label: "Total", value: shipment.orderTotal ? `Rs ${shipment.orderTotal.toLocaleString()}` : "—" },
              { label: "Status", value: shipment.orderStatus || "—" },
              { label: "Items", value: shipment.orderItems?.toString() || "—" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <span className="text-[10px] text-muted-foreground">{row.label}</span>
                <span className={`text-[11px] font-medium ${row.mono ? "font-mono" : ""}`}>{row.value}</span>
              </div>
            ))}
            <Link to="/app/orders/$id" params={{ id: shipment.orderId }} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1">
              <Package className="h-3 w-3" /> View order
            </Link>
          </div>
        </SectionPanel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        <div className="surface rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Navigation className="h-3.5 w-3.5" /> Status
          </div>
          <div className="text-2xl font-semibold tabular-nums capitalize">{shipment.status.replace("_", " ")}</div>
        </div>
        <div className="surface rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Clock className="h-3.5 w-3.5" /> Created
          </div>
          <div className="text-2xl font-semibold tabular-nums">{new Date(shipment.createdAt).toLocaleDateString()}</div>
        </div>
        <div className="surface rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Radio className="h-3.5 w-3.5" /> Signal
          </div>
          <div className="text-2xl font-semibold tabular-nums">
            {shipment.status === 'delivered' ? 'Ended' : (riderPos ? "Active" : "Offline")}
          </div>
        </div>
      </div>

      {(role === "manufacturer" || role === "admin") && shipment?.trackingEvents?.length > 0 && (
        <SectionPanel title="Location Sharing History" description="Rider activity log" className="mt-3">
          <div className="space-y-2">
            {[...shipment.trackingEvents].reverse().map((event: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${event.type === 'start' ? 'bg-success' : 'bg-destructive'}`} />
                  <span className="text-xs font-medium capitalize">{event.type === 'start' ? 'Started' : 'Stopped'} sharing</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </SectionPanel>
      )}
    </div>
  );
}

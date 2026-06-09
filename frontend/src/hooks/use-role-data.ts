import { useMemo } from "react";
import { useAuth } from "@/store";
import {
  MEDICINES,
  ORDERS,
  SHIPMENTS,
  MANUFACTURERS,
  PHARMACIES,
  DELIVERY_PARTNERS,
  SUPPLIES,
} from "@/mock-api/data";

export function useRoleData() {
  const user = useAuth((s) => s.user);
  const role = user?.role || "admin";
  const entityId = user?.entityId;

  return useMemo(() => {
    if (role === "admin") {
      return {
        medicines: MEDICINES,
        orders: ORDERS,
        shipments: SHIPMENTS,
        manufacturers: MANUFACTURERS,
        pharmacies: PHARMACIES,
        deliveryPartners: DELIVERY_PARTNERS,
        supplies: SUPPLIES,
      };
    }

    if (role === "manufacturer") {
      const currentManufacturer = MANUFACTURERS.find((m) => m.id === entityId);
      const deliveryIds = new Set(currentManufacturer?.linkedDeliveryPartners || []);
      const pharmacies = PHARMACIES.filter((p) => p.linkedManufacturers.includes(entityId!));
      const pharmacyIds = new Set(pharmacies.map((p) => p.id));

      const medicines = MEDICINES.filter((m) => m.manufacturerId === entityId);
      const supplies = SUPPLIES.filter((s) => s.manufacturerId === entityId);
      const orders = ORDERS.filter((o) => pharmacyIds.has(o.pharmacyId));
      const shipments = SHIPMENTS.filter((s) => s.manufacturerId === entityId);

      return {
        medicines,
        orders,
        shipments,
        manufacturers: MANUFACTURERS.filter((m) => m.id === entityId),
        pharmacies,
        deliveryPartners: DELIVERY_PARTNERS.filter((d) => deliveryIds.has(d.id)),
        supplies,
      };
    }

    if (role === "pharmacy" || role === "customer") {
      const currentPharmacy = PHARMACIES.find((p) => p.id === entityId);
      const manufacturerIds = new Set(currentPharmacy?.linkedManufacturers || []);
      const manufacturers = MANUFACTURERS.filter((m) => manufacturerIds.has(m.id));

      const orders = ORDERS.filter((o) => o.pharmacyId === entityId);
      const supplies = SUPPLIES.filter((s) => s.pharmacyId === entityId);
      const shipments = SHIPMENTS.filter((s) => s.pharmacyId === entityId);

      const medicines = MEDICINES.filter((m) => manufacturerIds.has(m.manufacturerId));

      const deliveryIds = new Set(shipments.map((s) => s.riderId));

      return {
        medicines,
        orders,
        shipments,
        manufacturers,
        pharmacies: PHARMACIES.filter((p) => p.id === entityId),
        deliveryPartners: DELIVERY_PARTNERS.filter((d) => deliveryIds.has(d.id)),
        supplies,
      };
    }

    if (role === "delivery") {
      const currentDelivery = DELIVERY_PARTNERS.find((d) => d.id === entityId);
      const manufacturerIds = new Set(currentDelivery?.linkedManufacturers || []);

      const shipments = SHIPMENTS.filter(
        (s) => s.riderId === entityId && manufacturerIds.has(s.manufacturerId),
      );

      const orderIds = new Set(shipments.map((s) => s.orderId));
      const pharmacyIds = new Set(shipments.map((s) => s.pharmacyId));

      return {
        medicines: [],
        orders: ORDERS.filter((o) => orderIds.has(o.id)),
        shipments,
        manufacturers: MANUFACTURERS.filter((m) => manufacturerIds.has(m.id)),
        pharmacies: PHARMACIES.filter((p) => pharmacyIds.has(p.id)),
        deliveryPartners: DELIVERY_PARTNERS.filter((d) => d.id === entityId),
        supplies: [],
      };
    }

    return {
      medicines: [],
      orders: [],
      shipments: [],
      manufacturers: [],
      pharmacies: [],
      deliveryPartners: [],
      supplies: [],
    };
  }, [role, entityId]);
}

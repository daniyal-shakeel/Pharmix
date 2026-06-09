const ROLE_PERMISSIONS = {
  admin: {
    canAccessAll: true,
  },
  manufacturer: {
    canAccessAll: false,
    allowedRoutes: [
      '/api/medicines',
      '/api/medicines/categories',
      '/api/medicines/:id',
      '/api/medicines/inventory-stats',
      '/api/shipments/own',
      '/api/shipments',
      '/api/shipments/:id',
      '/api/shipments/:id/approve',
      '/api/shipments/riders/:manufacturerId',
      '/api/users/linked-pharmacies',
      '/api/users/linked-delivery',
      '/api/orders',
       '/api/orders/:id',
       '/api/orders/:id/status',
       '/api/payments',
       '/api/payments/:id',
       '/api/stock-history',
      '/api/analytics/manufacturer',
       '/api/analytics/sidebar-summary',
       '/api/notifications',
       '/api/notifications/:id/open',
       '/api/notifications/open-all'
     ],
  },
  pharmacy: {
    canAccessAll: false,
    allowedRoutes: [
      '/api/medicines',
      '/api/medicines/categories',
      '/api/medicines/:id',
      '/api/medicines/inventory-stats',
      '/api/medicines/pharmacy-inventory',
      '/api/orders/own',
      '/api/users/linked-manufacturers',
      '/api/shipments',
      '/api/shipments/:id',
      '/api/shipments/own',
      '/api/cart',
      '/api/cart/add',
      '/api/cart/update',
      '/api/cart/clear',
      '/api/orders',
      '/api/orders/:id',
       '/api/orders/payment-intent',
       '/api/orders/confirm',
       '/api/payments',
       '/api/payments/:id',
       '/api/analytics/pharmacy',
       '/api/analytics/sidebar-summary',
       '/api/notifications',
       '/api/notifications/:id/open',
       '/api/notifications/open-all'
     ],
  },
  customer: {
    canAccessAll: false,
    allowedRoutes: [
      '/api/medicines',
      '/api/medicines/categories',
      '/api/medicines/:id',
      '/api/medicines/inventory-stats',
      '/api/orders/own',
      '/api/users/linked-manufacturers',
      '/api/shipments/own',
        '/api/analytics/sidebar-summary',
        '/api/notifications',
        '/api/notifications/:id/open',
        '/api/notifications/open-all'
      ],
  },
  delivery: {
    canAccessAll: false,
    allowedRoutes: [
      '/api/shipments/assigned',
      '/api/shipments',
      '/api/shipments/:id',
      '/api/shipments/:id/status',
      '/api/shipments/:id/events',
      '/api/users/linked-manufacturers',
        '/api/analytics/sidebar-summary',
        '/api/notifications',
        '/api/notifications/:id/open',
        '/api/notifications/open-all'
      ],
  }
};

const hasPermission = (role, route) => {
  if (ROLE_PERMISSIONS[role]?.canAccessAll) return true;
  return ROLE_PERMISSIONS[role]?.allowedRoutes.includes(route) || false;
};

module.exports = { ROLE_PERMISSIONS, hasPermission };

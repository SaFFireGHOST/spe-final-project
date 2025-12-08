import { DriverRoute } from '@/lib/types';

let routes: DriverRoute[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function upsertRoute(route: Omit<DriverRoute, 'createdAt' | 'updatedAt'>): Promise<DriverRoute> {
  await delay(300 + Math.random() * 300);
  
  const existingIndex = routes.findIndex((r) => r.driverId === route.driverId);
  
  const now = new Date();
  const fullRoute: DriverRoute = {
    ...route,
    createdAt: existingIndex !== -1 ? routes[existingIndex].createdAt : now,
    updatedAt: now,
  };
  
  if (existingIndex !== -1) {
    routes[existingIndex] = fullRoute;
  } else {
    routes.push(fullRoute);
  }
  
  return fullRoute;
}

export async function getRoute(driverId: string): Promise<DriverRoute | null> {
  await delay(300 + Math.random() * 300);
  return routes.find((r) => r.driverId === driverId) || null;
}

export async function deleteRoute(driverId: string): Promise<void> {
  await delay(300 + Math.random() * 300);
  routes = routes.filter((r) => r.driverId !== driverId);
}

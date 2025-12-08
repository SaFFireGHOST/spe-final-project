import { RiderRequest } from '@/lib/types';

let requests: RiderRequest[] = [];
let idCounter = 1;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createRequest(
  riderId: string,
  stationId: string,
  destination: string,
  etaMinutes: number
): Promise<RiderRequest> {
  await delay(50 + Math.random() * 50);

  const now = new Date();
  const etaAbsolute = new Date(now.getTime() + etaMinutes * 60000);

  const request: RiderRequest = {
    id: `REQ-${String(idCounter++).padStart(4, '0')}`,
    riderId,
    stationId,
    destination,
    etaMinutes,
    etaAbsolute,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  requests.push(request);
  return request;
}

export async function getRequestsByRider(riderId: string): Promise<RiderRequest[]> {
  await delay(50 + Math.random() * 50);
  return requests.filter((r) => r.riderId === riderId).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function getAllRequests(): Promise<RiderRequest[]> {
  await delay(50 + Math.random() * 50);
  return [...requests].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function simulateAssignments(): void {
  // Simulate random assignments for pending requests
  requests = requests.map((req) => {
    if (req.status === 'PENDING' && Math.random() > 0.7) {
      return {
        ...req,
        status: 'ASSIGNED' as const,
        updatedAt: new Date(),
      };
    }
    return req;
  });
}

export function updateRequestStatus(id: string, status: RiderRequest['status']): void {
  const index = requests.findIndex((r) => r.id === id);
  if (index !== -1) {
    requests[index] = {
      ...requests[index],
      status,
      updatedAt: new Date(),
    };
  }
}

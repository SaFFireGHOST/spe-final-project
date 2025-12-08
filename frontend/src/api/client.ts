import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  signup: (data: any) => client.post('/signup', data),
  login: (data: any) => client.post('/login', data),
  getStations: () => client.get('/stations'),
  createRiderRequest: (data: any) => client.post('/rider/request', data),
  registerDriverRoute: (data: any) => axios.post(`${API_URL}/driver/route`, data),
  updateDriverLocation: (data: any) => axios.post(`${API_URL}/driver/location`, data),
  getActiveRoute: (driverId: string) => axios.get(`${API_URL}/driver/active-route?driver_id=${driverId}`),
  getActiveTrip: (driverId: string) => axios.get(`${API_URL}/driver/active-trip?driver_id=${driverId}`),
  completeTrip: (tripId: string) => axios.post(`${API_URL}/trip/complete`, { trip_id: tripId }),
  getNotifications: (userId: string) => client.get(`/notifications?user_id=${userId}`),
  markNotificationRead: (notifId: string) => client.put(`/notifications/${notifId}/read`),
  markAllNotificationsRead: (userId: string) => client.put('/notifications/read-all', { user_id: userId }),
  clearNotifications: (userId: string) => client.delete(`/notifications/clear?user_id=${userId}`),
  getRiderRequests: (riderId: string) => client.get(`/rider/my-requests?rider_id=${riderId}`),
  deleteRoute: (routeId: string) => client.delete(`/driver/route/${routeId}`),
};

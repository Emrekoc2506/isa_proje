import { request } from './apiClient';

export function getHomeBootstrap() {
  return request('/home/bootstrap');
}

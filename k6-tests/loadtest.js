import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 2 },
    { duration: '20s', target: 5 },
    { duration: '40s', target: 5 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],     // keep strict since we’ll hit public routes
    checks: ['rate>0.95'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:4567';
// Use a public path by default; override in CI with env if needed
const CATEGORY_PATH = __ENV.CATEGORY_PATH || '/categories';

export default function () {
  // Home
  const res1 = http.get(`${BASE_URL}/`, { tags: { name: 'home' } });
  // Optional: console.log('home:', res1.status);
  check(res1, {
    'home page status is 200': (r) => r.status === 200,
    'homepage loads fast': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Category (public)
  const cat = http.get(`${BASE_URL}${CATEGORY_PATH}`, { tags: { name: 'category' } });
  // Optional: console.log('category:', cat.status);
  check(cat, {
    'category reachable (200..399)': (r) => r.status >= 200 && r.status < 400,
    'category loads fast': (r) => r.timings.duration < 700,
  });
}

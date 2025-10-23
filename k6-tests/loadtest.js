import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,          // increase virtual users
  duration: '30s',  // run for 30 seconds
};

export default function () {
  http.get('http://localhost:4567/');
  sleep(1);
}


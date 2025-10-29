import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10, // virtual users
  duration: '20s', //seconds
};

export default function () {
  http.get('http://localhost:4567/');
  sleep(1);
}

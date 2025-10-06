import fetch from 'node-fetch';

const servers = [
  { name: 'backend', url: 'http://127.0.0.1:4000/api/folders' },
  { name: 'frontend', url: 'http://127.0.0.1:5173/' },
];

(async () => {
  for (const s of servers) {
    try {
      const res = await fetch(s.url, { method: 'GET' });
      console.log(s.name, '->', res.status);
    } catch (err) {
      console.log(s.name, '-> ERROR', err.message);
    }
  }
})();

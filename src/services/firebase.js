import { FB_URL } from '../utils/constants';

export async function dbSet(p, v) {
  await fetch(`${FB_URL}/${p}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(v)
  });
}

export async function dbGet(p) {
  const r = await fetch(`${FB_URL}/${p}.json`);
  return r.json();
}

export async function dbUpdate(p, v) {
  await fetch(`${FB_URL}/${p}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(v)
  });
}

export async function dbDelete(p) {
  await fetch(`${FB_URL}/${p}.json`, { method: 'DELETE' });
}

const _polls = {};

export function dbListen(path, cb) {
  dbStopListen(path);
  let last;
  const run = async () => {
    try {
      const v = await dbGet(path);
      const s = JSON.stringify(v);
      if (s !== last) { last = s; cb(v); }
    } catch (e) {}
  };
  run();
  _polls[path] = setInterval(run, 1200);
}

export function dbStopListen(p) {
  clearInterval(_polls[p]);
  delete _polls[p];
}

export function dbStopAll() {
  Object.keys(_polls).forEach(p => dbStopListen(p));
}

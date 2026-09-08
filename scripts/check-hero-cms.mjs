import assert from 'node:assert/strict';
process.loadEnvFile();
const base = process.env.APP_URL;
assert.match(base, /^http:\/\/localhost:/, 'Only run this check against local development.');
let cookie = '', id;
async function request(path, method='GET', body) {
  const response = await fetch(base + path, {method, headers:{Origin:base, Cookie:cookie, ...(body?{'Content-Type':'application/json'}:{})}, body:body?JSON.stringify(body):undefined});
  return response;
}
try {
  const login = await request('/api/auth/login','POST',{email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD});
  assert.equal(login.status,200,'Admin login');
  cookie=login.headers.get('set-cookie').split(';')[0];
  const created=await request('/api/admin/content','POST',{type:'HERO',slug:`cms-check-${Date.now()}`,title:'CMS media check',image:'/images/hero-road.webp',videoUrl:'https://example.com/background.mp4',published:false,sortOrder:9999});
  assert.equal(created.status,201,await created.clone().text());
  const data=await created.json(); id=data.item.id;
  assert.equal(data.item.videoUrl,'https://example.com/background.mp4');
  const changed=await request(`/api/admin/content/${id}`,'PATCH',{videoUrl:null});
  assert.equal(changed.status,200);
  assert.equal((await changed.json()).item.videoUrl,null);
  const invalid=await request(`/api/admin/content/${id}`,'PATCH',{videoUrl:'https://example.com/file.exe'});
  assert.equal(invalid.status,400);
  console.log('PASS: admin login, hero poster/video persistence, image-only switch, invalid video rejection.');
} finally {
  if(id)assert.equal((await request(`/api/admin/content/${id}`,'DELETE')).status,200,'Remove temporary draft');
}

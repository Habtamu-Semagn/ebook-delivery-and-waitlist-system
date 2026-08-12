const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';

// Generate anon key (public role)
const anonToken = jwt.sign(
  {
    role: 'anon',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 years
  },
  JWT_SECRET
);

// Generate service_role key (admin role)
const serviceRoleToken = jwt.sign(
  {
    role: 'service_role',
    iss: 'supabase',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 years
  },
  JWT_SECRET
);

console.log('SUPABASE_ANON_KEY=' + anonToken);
console.log('');
console.log('SUPABASE_SERVICE_ROLE_KEY=' + serviceRoleToken);

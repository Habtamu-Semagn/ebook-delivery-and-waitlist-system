import jwt
import time

JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long'

# Generate anon key (public role)
anon_token = jwt.encode(
    {
        'role': 'anon',
        'iss': 'supabase',
        'iat': int(time.time()),
        'exp': int(time.time()) + (10 * 365 * 24 * 60 * 60)  # 10 years
    },
    JWT_SECRET,
    algorithm='HS256'
)

# Generate service_role key (admin role)
service_role_token = jwt.encode(
    {
        'role': 'service_role',
        'iss': 'supabase',
        'iat': int(time.time()),
        'exp': int(time.time()) + (10 * 365 * 24 * 60 * 60)  # 10 years
    },
    JWT_SECRET,
    algorithm='HS256'
)

print('SUPABASE_ANON_KEY=' + anon_token)
print('')
print('SUPABASE_SERVICE_ROLE_KEY=' + service_role_token)

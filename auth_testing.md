# BizzDeck Auth Testing Playbook

## Test Credentials
- Admin: `admin@bizzdeck.com` / `Bizzdeck@2026`
- Demo:  `demo@bizzdeck.com` / `Demo@2026`

## Auth Endpoints
All under `/api/auth`:
- POST `/api/auth/register` — {email, password, name}
- POST `/api/auth/login` — {email, password}
- POST `/api/auth/logout`
- GET  `/api/auth/me`
- POST `/api/auth/refresh`

## Premium Endpoints (require authentication)
- GET/POST/DELETE `/api/premium/recipes`
- POST `/api/premium/soa/decode` — multipart file
- POST `/api/premium/appointments` — {date, topic, notes}
- GET  `/api/premium/growth-tips`
- POST `/api/premium/reports/generate` — generates a business report

## Quick Test
```
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -c /tmp/c.txt -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@bizzdeck.com","password":"Bizzdeck@2026"}'
curl -b /tmp/c.txt "$API_URL/api/auth/me"
```

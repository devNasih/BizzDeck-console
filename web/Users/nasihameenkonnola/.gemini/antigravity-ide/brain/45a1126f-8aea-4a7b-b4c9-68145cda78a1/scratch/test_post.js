const https = require('https');

const payload = JSON.stringify({
  userId: 9,
  name: "test",
  location: "Pullippadam",
  phoneNumber: "+917594996675",
  address: "Konnola House Pongalloor Mampad, Pullippadam, Kottakkal, State: Kerala, Pincode: 676542",
  pincode: "676542",
  zoneId: 85,
  localityId: 1430,
  averageMarginPercentage: 0,
  priceHikePercentageSwiggy: 0,
  priceHikePercentageZomato: 0,
  adsPercentageSwiggy: 0,
  adsPercentageZomato: 0,
  discountPercentageSwiggy: 0,
  discountPercentageZomato: 0,
  expectedCommissionPercentageSwiggy: 0,
  expectedCommissionPercentageZomato: 0,
  planExpiry: ""
});

const options = {
  hostname: 'api.bizzdeck.com',
  port: 443,
  path: '/v1/restaurants',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  console.log("Status:", res.statusCode);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      console.log("Response Body:", JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      console.log("Response Body (Raw):", body);
    }
  });
});

req.on('error', (e) => {
  console.error("Error:", e);
});

req.write(payload);
req.end();

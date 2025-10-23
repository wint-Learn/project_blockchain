/**
 * Test validation middleware
 */

const body = {
  cccdData: {
    cccd_number: "123", // Invalid - should be 12 digits
    name: "Test User",
    dob: "1990-01-01",
    address: "Test Address",
    issued_date: "2020-01-01"
  },
  privateKey: "0x1234567890123456789012345678901234567890123456789012345678901234"
};

console.log('Testing validation with body:', JSON.stringify(body, null, 2));

fetch('http://localhost:3000/api/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
})
  .then(res => res.json())
  .then(data => {
    console.log('\n✅ Response:', JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.log('\n❌ Error:', err.message);
  });

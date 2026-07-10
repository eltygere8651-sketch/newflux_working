const http = require('http');

http.get('http://localhost:3000/api/lyrics/search?q=bohemian+rhapsody', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Data:', data.substring(0, 100)));
});

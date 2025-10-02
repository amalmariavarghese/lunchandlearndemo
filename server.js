const http = require('http');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World from Node.js running in Docker- Lunch and learn!\n');
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

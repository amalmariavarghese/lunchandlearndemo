const http = require('http');             // <— missing import fixed
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Jenkins demo on Azure!\n');
});

server.listen(port, () => console.log(`Server listening on ${port}`));

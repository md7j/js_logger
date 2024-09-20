const tls = require('tls');
const fs = require('fs');
const path = require('path');

// Load your certificates
const certificatesDir = path.join(__dirname, "./certificates/data/");
const key = fs.readFileSync(path.join(certificatesDir, "client.key"));
const cert = fs.readFileSync(path.join(certificatesDir, "client.crt"));
const ca = fs.readFileSync(path.join(certificatesDir, "ca.crt"));

// TLS connection options
const options = {
  key: key,
  cert: cert,
  ca: ca,
  secureProtocol: 'TLSv1_2_method', // Explicitly specify TLS 1.2
  // ciphers: 'AES128-GCM-SHA256', // Specify cipher suite
  // honorCipherOrder: true // Respect server's cipher order
  rejectUnauthorized: false
};

// Create a TLS client connection
const client = tls.connect(12201, '45.133.178.124', options, () => {
  console.log('Connected to server');
  // You can now use `client.write()` and `client.on('data', ...)` to communicate
});

// Handle data from the server
client.on('data', (data) => {
  console.log('Received:', data.toString());
});

// Handle connection end
client.on('end', () => {
  console.log('Connection ended');
});

// Handle errors
client.on('error', (error) => {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
});

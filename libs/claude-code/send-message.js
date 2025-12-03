import net from 'net';

const socketPath = '/tmp/claude-bridge.sock';
const message = `A: Tell B to debate with you about the best way to build a dance studio management system`;

const client = net.connect(socketPath, () => {
  client.end(message);
});

client.on('error', (err) => {
  console.error('Error connecting to socket:', err.message);
});

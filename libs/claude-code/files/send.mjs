import net from 'net';
const [socket, msg] = process.argv.slice(2);
net.connect(socket).end(msg);

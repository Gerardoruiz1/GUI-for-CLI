const WebSocket = require('ws');
const stripAnsi = require('strip-ansi');
const { spawn } = require('child_process');
const path = require('path');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log("WebSocket client connected");

  const scriptPath = path.join(__dirname, 'login.expect');
  const child = spawn('expect', [scriptPath]);

child.stdout.on('data', (data) => {
  const cleanText = stripAnsi(data.toString());

  // Look for menu
  const match = cleanText.match(/MENU PRINCIPAL:(.*?Opcion deseada:)/s);
  if (match) {
    const menuBlock = match[1];

    // Split into lines
    const options = menuBlock
      .split('\n')
      .filter(line => /^\s*\d\./.test(line)) // lines that start with numbers
      .map(line => line.trim());

    ws.send(JSON.stringify({ type: 'menu', options }));
  } else {
    // fallback, send raw
    ws.send(JSON.stringify({ type: 'text', content: cleanText }));
  }
});

  child.stderr.on('data', (data) => {
    console.error("Error:", data.toString());
  });

  child.on('exit', (code) => {
    console.log(`Expect script exited with code ${code}`);
    ws.close();
  });


  ws.on('message', (msg) => {
    // You could forward input to the expect process here
    child.stdin.write(msg);
  });
});

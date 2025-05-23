const WebSocket = require('ws');
const { Client } = require('ssh2');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create HTTP server
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active SSH sessions
const sessions = new Map();

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    // Create new SSH client
    const ssh = new Client();
    let inactivityTimeout;

    // Function to reset inactivity timer
    const resetInactivityTimer = () => {
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(() => {
            console.log('Session timeout - closing connection');
            ssh.end();
            ws.close();
        }, 15 * 60 * 1000); // 15 minutes
    };

    // Connect to SSH
    ssh.connect({
        host: 'rumad.uprm.edu',
        username: 'estudiante',
        readyTimeout: 20000
    });

    ssh.on('ready', () => {
        console.log('SSH connection established');
        sessions.set(ws, ssh);
        
        // Start shell session
        ssh.shell((err, stream) => {
            if (err) {
                console.error('Error creating shell:', err);
                return;
            }

            // Send initial newline to skip password prompt
            stream.write('\n');

            // Handle SSH output
            stream.on('data', (data) => {
                const output = data.toString();
                console.log('SSH output:', output);
                
                // Parse the current screen and send to frontend
                const screenState = parseScreen(output);
                ws.send(JSON.stringify(screenState));
                
                resetInactivityTimer();
            });

            // Handle WebSocket messages from frontend
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'input') {
                        stream.write(data.value);
                        resetInactivityTimer();
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            });

            // Handle WebSocket close
            ws.on('close', () => {
                console.log('Client disconnected');
                if (ssh) {
                    ssh.end();
                }
                sessions.delete(ws);
            });
        });
    });

    ssh.on('error', (err) => {
        console.error('SSH error:', err);
        ws.send(JSON.stringify({
            screen: 'error',
            message: 'Connection error. Please try again.'
        }));
    });
});

// Function to parse the current screen and return structured data
function parseScreen(output) {
    // Basic screen detection - expand this based on actual UPRM system output
    if (output.includes('MAIN MENU')) {
        return {
            screen: 'mainMenu',
            options: ['1', '2', '3', '4', '5', '6', '0']
        };
    } else if (output.includes('Enter your choice')) {
        return {
            screen: 'prompt',
            message: 'Please select an option'
        };
    } else if (output.includes('Enter course number')) {
        return {
            screen: 'courseInput',
            message: 'Enter the course number'
        };
    }
    
    // Default case
    return {
        screen: 'unknown',
        rawOutput: output
    };
}

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
}); 
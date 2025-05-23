const output = document.getElementById('terminal-output');
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
const data = JSON.parse(event.data);

if (data.type === 'menu') {
    output.innerHTML = ''; // Clear previous content

    data.options.forEach(option => {
    const div = document.createElement('div');
    div.className = 'menu-option';
    div.textContent = option;
    div.onclick = () => {
        ws.send(option[0] + '\n'); // sends "1", "2", etc.
    };
    output.appendChild(div);
    });
} else {
    // Fallback: show as preformatted block
    const cleanLines = data.content
    .split(/(?=\d+\.)/) // break on "1.", "2.", etc.
    .map(line => line.trim())
    .filter(line => line.length > 0);

    output.innerHTML = ''; // Clear previous content

    cleanLines.forEach((line, index) => {
    const div = document.createElement('div');
    div.className = 'menu-option';
    div.textContent = line;
    div.onclick = () => {
        const match = line.match(/^(\d+)/);
        if (match) {
        ws.send(match[1] + '\n'); // send number
        }
    };
    output.appendChild(div);
    });
}
};

ws.onerror = () => {
output.textContent = "Failed to connect to backend.";
};

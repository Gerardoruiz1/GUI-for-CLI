class EnrollmentApp {
    constructor() {
        this.ws = null;
        this.statusElement = document.getElementById('status');
        this.contentElement = document.getElementById('content');
        this.connect();
    }

    connect() {
        this.ws = new WebSocket('ws://localhost:8080');
        
        this.ws.onopen = () => {
            this.updateStatus('Connected');
        };

        this.ws.onclose = () => {
            this.updateStatus('Disconnected - Please refresh the page');
        };

        this.ws.onerror = (error) => {
            this.updateStatus('Connection error - Please refresh the page');
            console.error('WebSocket error:', error);
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };
    }

    updateStatus(message) {
        this.statusElement.textContent = message;
    }

    handleMessage(data) {
        switch (data.screen) {
            case 'mainMenu':
                this.renderMainMenu(data.options);
                break;
            case 'prompt':
                this.renderPrompt(data.message);
                break;
            case 'courseInput':
                this.renderCourseInput(data.message);
                break;
            case 'error':
                this.renderError(data.message);
                break;
            default:
                console.log('Unknown screen type:', data);
        }
    }

    renderMainMenu(options) {
        const html = `
            <h2>Main Menu</h2>
            <div class="button-grid">
                ${options.map(option => `
                    <button onclick="app.sendInput('${option}')">
                        Option ${option}
                    </button>
                `).join('')}
            </div>
        `;
        this.contentElement.innerHTML = html;
    }

    renderPrompt(message) {
        const html = `
            <h2>${message}</h2>
            <div class="button-grid">
                <button onclick="app.sendInput('1')">1</button>
                <button onclick="app.sendInput('2')">2</button>
                <button onclick="app.sendInput('3')">3</button>
            </div>
        `;
        this.contentElement.innerHTML = html;
    }

    renderCourseInput(message) {
        const html = `
            <h2>${message}</h2>
            <div class="input-group">
                <input type="text" id="courseInput" placeholder="Enter course number">
                <button onclick="app.submitCourseInput()">Submit</button>
            </div>
        `;
        this.contentElement.innerHTML = html;
    }

    renderError(message) {
        const html = `
            <div class="error">
                ${message}
            </div>
        `;
        this.contentElement.innerHTML = html;
    }

    sendInput(value) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'input',
                value: value + '\n'
            }));
        }
    }

    submitCourseInput() {
        const input = document.getElementById('courseInput');
        if (input && input.value) {
            this.sendInput(input.value);
            input.value = '';
        }
    }
}

// Initialize the app
const app = new EnrollmentApp(); 
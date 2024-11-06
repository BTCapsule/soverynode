
// Add styles programmatically
const styles = document.createElement('style');
styles.textContent = `
  .new-user-message {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background-color: black;
    color: white;
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 3000;
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
  }
  
  .new-user-message.show {
    opacity: 1;
  }
  
  .new-user-message.hide {
    opacity: 0;
  }
  
  .new-user-message button {
    background-color: transparent;
    border: none;
    color: white;
    cursor: pointer;
  }
`;
document.head.appendChild(styles);


function getCookies() {
    const cookies = {};
    document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = value;
    });
    return cookies;
}


function checkSessionAuth() {
	
	    if (window.location.pathname.includes('pin')) {
        return;
    }
    const cookies = getCookies();
    const sessionAuth = cookies['session_auth'];
    const userNumber = parseInt(cookies['user_number'] || '0');
        // Keep existing session auth check
    if (!sessionAuth || sessionAuth !== 'true') {
       window.location.replace('/pin');
		return;
    }
	
	
	
    // Get current secret files count from cookie
    const currentFileCount = parseInt(cookies['secret_count'] || '0');
    
    // Check for new users (one at a time)
    if (currentFileCount > userNumber) {
        const nextUserNumber = userNumber + 1;
        showNewUserMessage(`user${nextUserNumber}`);
    }


}

function showNewUserMessage(userNumber) {
    const message = document.createElement('div');
    message.className = 'new-user-message';
    message.setAttribute('data-user-number', userNumber.replace('user', ''));
    message.innerHTML = `
        <span>New user ${userNumber} added</span>
        <button onclick="dismissMessage(this.parentElement)">Dismiss</button>
    `;
    message.addEventListener('click', (event) => {
        if (event.target.tagName !== 'BUTTON') {
            promptRemoveUser(userNumber, message);
        }
    });
    document.body.appendChild(message);
    // Trigger reflow to ensure transition works
    message.offsetHeight;
    message.classList.add('show');
}

function dismissMessage(element) {
    const userNum = element.getAttribute('data-user-number');
    document.cookie = `user_number=${userNum}`;
    element.classList.remove('show');
    element.classList.add('hide');
    // Remove element after fade completes
    setTimeout(() => {
        element.remove();
    }, 500); // Match this to your CSS transition duration
}

function promptRemoveUser(userNumber, messageElement) {
    const remove = confirm(`Remove ${userNumber}?`);
    if (remove) {
        fetch('/remove-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Send the actual user number to remove
            body: JSON.stringify({ 
                userNumber: parseInt(userNumber.replace('user', '')) 
            }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                messageElement.remove();
                // Update cookies to reflect new state
                document.cookie = `secret_count=${data.newCount}`;
                // Force a session check to update notifications
                checkSessionAuth();
            }
        });
    }
}

// Function for index.html
function checkAccess() {
    const cookies = getCookies();
    const secretCookie = cookies['secret'];
    const encryptCookie = cookies['encrypt'];
    if (secretCookie && encryptCookie) {
        window.location.href = '/';
    } else {
        setTimeout(checkAccess, 5000);
    }
}

let ws;

function connectWebSocket() {
    ws = new WebSocket('wss://' + window.location.host);
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'newDevicePrompt') {
			
			console.log('Handling new device prompt for IP:', message.ip);
            handleNewDevicePrompt(message.ip);
        } else if (message.type === 'deviceResponseUpdate') {
			console.log('Handling device response update:', message.ip, message.allow);
            handleDeviceResponseUpdate(message.ip, message.allow);
			
        } else if (message.type === 'newUserCreated') {
            showNewUserMessage(`user${message.userNumber}`);
        }
    };
    ws.onclose = () => {
        setTimeout(connectWebSocket, 1000);
    };
}

function handleNewDevicePrompt(ip) {
    const promptElement = document.createElement('div');
    promptElement.className = 'new-user-message';
    promptElement.setAttribute('data-ip', ip);
    promptElement.innerHTML = `
        <span>Allow user with IP ${ip} to access?</span>
        <button onclick="handleDeviceResponse('${ip}', true)">Allow</button>
        <button onclick="handleDeviceResponse('${ip}', false)">Deny</button>
    `;
    document.body.appendChild(promptElement);
    // Trigger reflow to ensure transition works
    promptElement.offsetHeight;
    promptElement.classList.add('show');
}

function handleDeviceResponse(ip, allow) {
    ws.send(JSON.stringify({ type: 'deviceResponse', ip, allow }));
}

function handleDeviceResponseUpdate(ip, allow) {
    const existingPrompt = document.querySelector(`.new-user-message[data-ip="${ip}"]`);
    if (existingPrompt) {
        existingPrompt.remove();
    }

    const message = document.createElement('div');
    message.className = 'new-user-message';
    message.setAttribute('data-ip', ip);
    
    if (allow) {
        message.innerHTML = `
            <span>User [${ip}] was accepted</span>
            <button onclick="dismissMessage(this.parentElement)">Dismiss</button>
        `;
        document.body.appendChild(message);
        setTimeout(() => {
            message.remove();
        }, 3000);
    } else if (!allow) {
        message.innerHTML = `
            <span>User [${ip}] was denied</span>
            <button onclick="dismissMessage(this.parentElement)">Dismiss</button>
        `;
        document.body.appendChild(message);
    }
}

 connectWebSocket();

document.addEventListener('DOMContentLoaded', function() {
   
    if (window.location.pathname.includes('main.html')) {
        checkAccess();
    } else {
        checkSessionAuth();
        setInterval(checkSessionAuth, 5000); // Changed to check every 5 seconds
    }
}, false);

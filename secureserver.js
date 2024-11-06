const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const forge = require('node-forge');
const cookieParser = require('cookie-parser');
const readline = require('readline');
const WebSocket = require('ws');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});


const app = express();
app.use(express.json());
app.use(limiter);
app.use(cookieParser());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));




// Add near the top with other requires
const BLOCKED_IPS_FILE = 'blocked_ips.json';
let blockedIPs = new Set();

// Load blocked IPs from file
try {
  if (fs.existsSync(BLOCKED_IPS_FILE)) {
    blockedIPs = new Set(JSON.parse(fs.readFileSync(BLOCKED_IPS_FILE, 'utf8')));
  }
} catch (error) {
  console.error('Error loading blocked IPs:', error);
}










// SSL Certificate Generation
function generateSelfSignedCertificate() {
  const pki = forge.pki;
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'US' },
    { shortName: 'ST', value: 'Virginia' },
    { name: 'localityName', value: 'Blacksburg' },
    { name: 'organizationName', value: 'Test' },
    { shortName: 'OU', value: 'Test' }
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey);

  return {
    cert: pki.certificateToPem(cert),
    privateKey: pki.privateKeyToPem(keys.privateKey)
  };
}



// Utility Functions
function getPublicIP() {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});



function generateHash() {
  return crypto.createHash('sha256').update(crypto.randomBytes(64)).digest('hex');
}

function encryptData(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decryptData(data, key) {
  const [ivHex, encryptedHex] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function getSecretFiles() {
  return fs.readdirSync(__dirname).filter(file => file.endsWith('.secret'));
}

function createNewSecretFile(secretHash, encryptHash, pin = '') {
  const files = getSecretFiles();
  const newUserNumber = files.length > 0 ? Math.max(...files.map(f => parseInt(f.match(/\d+/)[0]))) + 1 : 1;
  const fileName = `user${newUserNumber}.secret`;
  const content = `${secretHash}\n${pin}`;
  const encryptedContent = encryptData(content, encryptHash);
  fs.writeFileSync(fileName, encryptedContent);
  return newUserNumber; // Return the user number
}





function updateSecretFile(oldSecretHash, oldEncryptHash, newSecretHash, newEncryptHash) {
  const files = getSecretFiles();
  for (const file of files) {
    try {
      const encryptedContent = fs.readFileSync(file, 'utf8');
      const decryptedContent = decryptData(encryptedContent, oldEncryptHash);
      const [storedHash, storedPin] = decryptedContent.split('\n');
      
      if (storedHash === oldSecretHash) {
        // Create new content with new hash but keep the same PIN
        const newContent = `${newSecretHash}\n${storedPin}`;
        const newEncryptedContent = encryptData(newContent, newEncryptHash);
        fs.writeFileSync(file, newEncryptedContent);
        return true;
      }
    } catch (error) {
      // Silently continue to the next file
    }
  }
  return false;
}


async function checkHashAndPin(secretHash, encryptHash) {
  const files = getSecretFiles();
  for (const file of files) {
    try {
      const encryptedContent = fs.readFileSync(file, 'utf8');
      const decryptedContent = decryptData(encryptedContent, encryptHash);
      const [storedHash, pin] = decryptedContent.split('\n');
      if (storedHash === secretHash) {
        return pin ? 'pin' : '/';
      }
    } catch (error) {
      // Silently continue to the next file
    }
  }
  return false;
}



async function checkSessionAuth(req, res, next) {
    const clientSecretHash = req.cookies.secret;
    const clientEncryptHash = req.cookies.encrypt;
    
    const files = getSecretFiles();
    const currentFileCount = files.length;
    
    res.cookie('secret_count', currentFileCount.toString(), { 
        secure: true, 
        sameSite: 'lax', 
        maxAge: 3600000 
    });

    if (files.length === 0) {
        return next();
    }

    if (clientSecretHash && clientEncryptHash) {
        let fileFound = false;
        for (const file of files) {
            try {
                const encryptedContent = fs.readFileSync(file, 'utf8');
                const decryptedContent = decryptData(encryptedContent, clientEncryptHash);
                const [storedHash, pin] = decryptedContent.split('\n');
                
                if (storedHash === clientSecretHash) {
                    fileFound = true;
                    if (pin && !req.cookies.pin_verified) {
                        return res.redirect('/pin');
                    }
                    return next(); // Add this line to proceed when authenticated
                }
            } catch (error) {
                // Continue to next file if decryption fails
            }
        }

        if (!fileFound) {
            for (const cookieName in req.cookies) {
                res.clearCookie(cookieName);
            }
            return res.status(403).send('Access Denied');
        }
    }

    return res.redirect('/main');
}


let wss;

let clients = new Set();


function setupWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('message', (message) => {
      const data = JSON.parse(message);
      switch(data.type) {
        case 'deviceResponse':
          handleDeviceResponse(data);
          break;

      }
    });
  });
}




function broadcastNewDevicePrompt(ip) {
  console.log('Broadcasting to clients:', clients.size);
  const message = JSON.stringify({ type: 'newDevicePrompt', ip });
  clients.forEach(client => {
    try {
      client.send(message);
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });
}





  let pendingPrompts = new Map();

// Modify handleDeviceResponse function
function handleDeviceResponse(data) {
  const { ip, allow } = data;
  const resolver = pendingPrompts.get(ip);
  if (resolver) {
    if (!allow) {
      // Block IP when denied
      blockedIPs.add(ip);
      fs.writeFileSync(BLOCKED_IPS_FILE, JSON.stringify([...blockedIPs]));
    }
    resolver(allow);
    pendingPrompts.delete(ip);
    
    const responseMessage = JSON.stringify({ 
      type: 'deviceResponseUpdate', 
      ip, 
      allow 
    });
    clients.forEach(client => client.send(responseMessage));
    
    console.log(`New user with IP ${ip} was ${allow ? 'accepted' : 'denied and blocked'}`);
  }
}







function promptForAccess(ip) {
  return new Promise((resolve) => {
    const existingFiles = getSecretFiles();
    const isFirstUser = existingFiles.length === 0;


    
    let isResolved = false;

    const resolveOnce = (allow) => {
      if (!isResolved) {
        isResolved = true;
        pendingPrompts.delete(ip);
        
        // Always broadcast response to all clients
        const responseMessage = JSON.stringify({ 
          type: 'deviceResponseUpdate', 
          ip, 
          allow,
          timestamp: Date.now() 
        });
        clients.forEach(client => client.send(responseMessage));
        
        console.log(`New user with IP ${ip} was ${allow ? 'accepted' : 'denied'}`);
        resolve(allow);
      }
    };

    pendingPrompts.set(ip, resolveOnce);
    if (!isFirstUser) {
	
      broadcastNewDevicePrompt(ip);
	
    }
    // Server prompt
    rl.question(`Allow user with IP ${ip}? (y/n): `, (answer) => {
      const serverAllow = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
      resolveOnce(serverAllow);
    });
  });
}



// Add middleware before other routes
app.use((req, res, next) => {
  if (blockedIPs.has(req.ip)) {
    return res.status(403).send('Access Denied: IP is blocked');
  }
  next();
});



app.get('/cookies.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'cookies.js'));
});



app.get('/createpin', (req, res) => {
  res.sendFile(path.join(__dirname, 'createpin.html'));
});

app.get('/pin', (req, res) => {
  res.sendFile(path.join(__dirname, 'pin.html'));
});

app.post('/create-pin', express.json(), (req, res) => {
    const { pin } = req.body;
    const newSecretHash = generateHash();
    const newEncryptHash = generateHash();
    
    // Get the user number when creating the secret file
    const userNumber = createNewSecretFile(newSecretHash, newEncryptHash, pin);

    // Set cookies including the user's number
    res.cookie('secret', newSecretHash, { secure: true, sameSite: 'lax', maxAge: 36000000000 });
    res.cookie('encrypt', newEncryptHash, { secure: true, sameSite: 'lax', maxAge: 36000000000 });
    res.cookie('user_number', userNumber.toString(), { secure: true, sameSite: 'lax', maxAge: 36000000000 });
    res.cookie('secret_count', userNumber.toString(), { secure: true, sameSite: 'lax', maxAge: 36000000000 });

    // Broadcast new user added
    const message = JSON.stringify({
        type: 'newUserCreated',
		userNumber: userNumber,
        ip: req.ip
    });
    clients.forEach(client => client.send(message));

    res.json({ success: true, redirectUrl: '/pin' });
});



app.post('/verify-pin', express.json(), (req, res) => {
  const { pin } = req.body;
  const clientSecretHash = req.cookies.secret;
  const clientEncryptHash = req.cookies.encrypt;

  const files = getSecretFiles();
  let decryptionError = false;

  for (const file of files) {
    try {
      const encryptedContent = fs.readFileSync(file, 'utf8');
      const decryptedContent = decryptData(encryptedContent, clientEncryptHash);
      const [storedHash, storedPin] = decryptedContent.split('\n');
      
      if (storedHash === clientSecretHash && storedPin === pin) {
        // Generate new hashes for rotation
        const newSecretHash = generateHash();
        const newEncryptHash = generateHash();
        
        // Update the secret file with new hashes
        if (updateSecretFile(clientSecretHash, clientEncryptHash, newSecretHash, newEncryptHash)) {
          // Set new cookies with rotated hashes
          res.cookie('secret', newSecretHash, { secure: true, sameSite: 'lax', maxAge: 36000000000 });
          res.cookie('encrypt', newEncryptHash, { secure: true, sameSite: 'lax', maxAge: 36000000000 });
          
          // Set session cookies
          res.cookie('pin_verified', 'true', { secure: true, sameSite: 'lax', maxAge: 3600001 });
          res.cookie('session_auth', 'true', { secure: true, sameSite: 'lax', maxAge: 3600000 });
          
          return res.json({ success: true, redirectUrl: '/' });
        }
      }
    } catch (error) {
      decryptionError = true;
      continue; // Continue to next file
    }
  }

  // Only send one type of error response
  res.status(401).json({ 
    success: false,
    message: 'Invalid PIN',
    clearPin: true  // Add this flag to tell frontend to clear the PIN
  });
});




app.get('/api/secret-files-count', checkSessionAuth, (req, res) => {
    const files = getSecretFiles();
    const maxUserNumber = Math.max(...files.map(f => parseInt(f.match(/\d+/)[0])));
    res.json({ maxUserNumber });
});

app.post('/remove-user', checkSessionAuth, (req, res) => {
    const { userNumber } = req.body;
    const files = getSecretFiles();
    
    try {
        // Remove the specified user file
        fs.unlinkSync(`user${userNumber}.secret`);
        
        // Get list of files again after deletion
        const remainingFiles = getSecretFiles();
        
        // Sort files by number to ensure correct renaming
        const fileNumbers = remainingFiles
            .map(f => parseInt(f.match(/\d+/)[0]))
            .sort((a, b) => a - b);
            
        // Rename files sequentially
        fileNumbers.forEach((num, index) => {
            if (num > userNumber) {
                const oldName = `user${num}.secret`;
                const newName = `user${num-1}.secret`;
                fs.renameSync(oldName, newName);
            }
        });
        
        // Return new count after reorganization
        const newCount = getSecretFiles().length;
        
        res.json({ 
            success: true,
            newCount: newCount
        });
    } catch (error) {
        console.error('Error during user removal:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to remove user'
        });
    }
});




app.post('/remove-device', checkSessionAuth, (req, res) => {
  const files = getSecretFiles();
  const newFiles = [];

  files.forEach(file => {
    const match = file.match(/user(\d+)\.secret/);
    if (match) {
      const userNumber = parseInt(match[1]);
      newFiles.push({ fileName: file, userNumber });
    }
  });

  if (newFiles.length === 0) {
    return res.status(404).json({ success: false, message: 'No new users to remove' });
  }

  // Sort files by user number to get the latest one
  newFiles.sort((a, b) => b.userNumber - a.userNumber);
  const latestFile = newFiles[0];

  fs.unlink(latestFile.fileName, (err) => {
    if (err) {
      console.error(`Error removing file: ${err}`);
      res.status(500).json({ success: false, message: 'Failed to remove user' });
    } else {
      // Check if the removed file matches the current user's cookies
      const clientSecretHash = req.cookies.secret;
      const clientEncryptHash = req.cookies.encrypt;
      
      let shouldLogout = false;

      try {
        const encryptedContent = fs.readFileSync(latestFile.fileName, 'utf8');
        const decryptedContent = decryptData(encryptedContent, clientEncryptHash);
        const [storedHash, _] = decryptedContent.split('\n');
        
        if (storedHash === clientSecretHash) {
          shouldLogout = true;
        }
      } catch (error) {
        // If there's an error reading the file, it's likely already deleted
        // so we don't need to do anything here
      }

      res.json({ 
        success: true, 
        message: 'User removed successfully', 
        removedUser: latestFile.userNumber,
        remainingUsers: newFiles.length - 1,
        action: shouldLogout ? 'logout' : 'none'
      });
    }
  });
});


app.get('/', checkSessionAuth, (req, res) => {
  const clientSecretHash = req.cookies.secret;
  const clientEncryptHash = req.cookies.encrypt;
  const pinVerified = req.cookies.pin_verified;

  if (clientSecretHash && clientEncryptHash) {
    const files = getSecretFiles();
    for (const file of files) {
      try {
        const encryptedContent = fs.readFileSync(file, 'utf8');
        const decryptedContent = decryptData(encryptedContent, clientEncryptHash);
        const [storedHash, storedPin] = decryptedContent.split('\n');
        if (storedHash === clientSecretHash) {
          if (storedPin && !pinVerified) {
            return res.redirect('/pin');
          } else {
            // User is fully authenticated, set a session cookie
          //  res.cookie('session_auth', 'true', { secure: true, sameSite: 'lax', maxAge: 36000000 });
            return res.sendFile(path.join(__dirname, 'index.html'));
          }
        }
      } catch (error) {
       // Silently continue to the next file
      }
    }
  }

  res.redirect('/main');
});





app.use(async (req, res, next) => {
  const clientIP = req.ip;
  const clientSecretHash = req.cookies.secret;
  const clientEncryptHash = req.cookies.encrypt;
  const pinVerified = req.cookies.pin_verified;

  if (clientSecretHash && clientEncryptHash) {
    const authResult = await checkHashAndPin(clientSecretHash, clientEncryptHash);
    if (authResult === '/' || (authResult === 'pin' && pinVerified)) {
      return next();
    } else if (authResult === 'pin' && !pinVerified) {
      return res.sendFile(path.join(__dirname, 'pin.html'));
    }
  }

  if (req.path !== '/main') {
    return res.redirect('/main');
  }

  console.log(`User visited from IP: ${clientIP}`);
  const allow = await promptForAccess(clientIP);

  if (allow) {
    return res.sendFile(path.join(__dirname, 'createpin.html'));
  } else {
    return res.status(403).send('Access Denied');
  }
});




// Routes
app.get('/main', (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html'));
});















function start() {


  const sslCert = generateSelfSignedCertificate();
  fs.writeFileSync('server.crt', sslCert.cert);
  fs.writeFileSync('server.key', sslCert.privateKey);

  const httpsOptions = {
    key: sslCert.privateKey,
    cert: sslCert.cert
  };

  getPublicIP()
    .then((ip) => {
      const port = 443;
      const server = https.createServer(httpsOptions, app);
      
	  setupWebSocket(server);
	  
      server.listen(port, () => {
        console.log(`HTTPS Server running at https://${ip}:${port}/`);
        console.log(`Access this URL on your phone's browser`);
      });
    })
    .catch((err) => {
      console.error('Error getting public IP:', err);
    });
}


module.exports = {
  start,
  app,
  checkHashAndPin,
  generateHash,
  encryptData,
  decryptData,
  getSecretFiles,
  updateSecretFile,
  checkSessionAuth
};

const QRCode = require('qrcode');
const opn = require('opn');
const fs = require('fs');
let express = require('express');
let cors = require('cors');
let app = express();
let bitcoin_rpc = require('node-bitcoin-rpc');
const path = require('path');
const tunnelmole = require('tunnelmole/cjs');
const bip39 = require('bip39');
const ecc = require('tiny-secp256k1');
const { BIP32Factory } = require('bip32');
const bitcoin = require('bitcoinjs-lib');
const crypto = require('crypto');


const bip32 = BIP32Factory(ecc);





const startTunnelmole = async () => {
  const url = await tunnelmole({
      port: 3001
  });
  console.log(url);
  const qrCode = await QRCode.toDataURL(url);

 // Save the QR code as an HTML file
 const html = `<!DOCTYPE html><html><body><img src="${qrCode}"><br><br>Your url is: ${url}</body></html>`;
 fs.writeFileSync('qrcode.html', html);

 // Open the HTML file in the browser
 opn('qrcode.html');

}

startTunnelmole();



let host = 'localhost'
let user = 'user'
let pass = 'pass'
let network;
let port;

if (process.argv.includes('-testnet')) {
 network = bitcoin.networks.testnet;
 port = 18332;
} else {
 network = bitcoin.networks.bitcoin;
 port = 8332;
}

bitcoin_rpc.init(host, port, user, pass)
bitcoin_rpc.setTimeout(30000) // 30 seconds


app.use(cors());

console.log(network)


 // Get the list of wallets
 bitcoin_rpc.call('listwallets', [], function (err, wallets) {
  if (err) {
    console.error("Error listing wallets:", err);
    return;
  }

  // Get the most recently loaded wallet
  const mostRecentWalletName = wallets.result[wallets.result.length - 1];

  // Unload each wallet except for the most recently loaded one
  wallets.result.forEach(function(walletName) {
    if (walletName !== mostRecentWalletName) {
      bitcoin_rpc.call('unloadwallet', [walletName], function (err, result) {
        if (err) {
          console.error("Error unloading wallet:", err);
        } else {
          console.log("Unloaded wallet:", walletName);
        }
      });
    }
  });
 });






app.get('/runrpc/:rpcMethod', function (req, res) {
 const rpcMethod = req.params.rpcMethod;
 bitcoin_rpc.call(rpcMethod, [], function (err, rpcRes) {
  if (err) {
    res.status(500).send({ error: "I have an error :\n" + err });
  } else if (typeof rpcRes.result !== ' undefined') {
    if (rpcMethod == 'getblockchaininfo') {
      console.log(rpcRes.result)
    }
    if (rpcMethod == 'getwalletinfo'){
      console.log(rpcRes.result)
     }




if (rpcMethod === 'listwallets') {
 const allWallets = rpcRes.result;

 // Check if the 'wallets.txt' file exists
 if (fs.existsSync('wallets.txt')) {
 // If the file exists, read its contents
 const existingWallets = fs.readFileSync('wallets.txt', 'utf8').split('\n');

 // Check if the new wallet names are already in the file
 const newWallets = allWallets.filter(wallet => !existingWallets.includes(wallet));

 // If there are new wallet names, write them to the file
 if (newWallets.length > 0) {
  const combinedWallets = [...existingWallets, ...newWallets];
  fs.writeFileSync('wallets.txt', combinedWallets.join('\n'));
  console.log('New wallet names saved to wallets.txt');
 }
 } else {
 // If the file does not exist, write the new wallet names to the file
 fs.writeFileSync('wallets.txt', allWallets.join('\n'));
 console.log('Wallet names saved to wallets.txt');
 }
}



      res.send(JSON.stringify(rpcRes.result))
  } else {
    res.status(500).send("No error and no result ?");
  }
 });
});







app.get('/sendtoaddress/:address/:amount', function (req, res) {
 const address = req.params.address;
 const amount = req.params.amount;
 const params = [address, amount, '', '', false, true, 6,'economical'];

 bitcoin_rpc.call('sendtoaddress', params, function (err, rpcRes) {
 if (err) {
  res.status(500).send({ error: "I have an error :\n" + err });
 } else if (typeof rpcRes.result !== ' undefined') {
  res.send(JSON.stringify(rpcRes.result))
  console.log(rpcRes.result)

  console.log('success');
 } else {
  res.status(500).send("No error and no result ?");
 }
 });
});








app.get('/loadwallet/:wallet', function (req, res) {
 const wallet = req.params.wallet;
 const params = [wallet];


const data = fs.readFileSync('wallets.txt', 'utf8');
 const allWallets = data.split('\n');

 const index = allWallets.indexOf(wallet);
   if (index !== -1) {
     allWallets.splice(index, 1);
   }

   // Unload each wallet in the remaining list
   allWallets.forEach(function(unloadWallet) {
     bitcoin_rpc.call('unloadwallet', [unloadWallet], function (err, rpcRes) {
       if (err) {
         console.log("Error unloading wallet: " + err);
       } else {
         console.log('Unloaded wallet: ' + unloadWallet);
       }
     });
   });

   // Load the new wallet
   bitcoin_rpc.call('loadwallet', params, function (err, rpcRes) {
     if (err) {
       res.status(500).send({ error: "I have an error :\n" + err });
     } else if (typeof rpcRes.result !== 'undefined') {
       res.send(JSON.stringify(rpcRes.result));
       console.log(wallet + " loaded");
     } else {
       res.status(500).send("No error and no result ?");
     }
   });
});





app.get('/estimatesmartfee', function (req, res) {
 const blocks = 6;
 const params = [blocks];
 bitcoin_rpc.call('estimatesmartfee', params, function (err, rpcRes) {
   if (err) {
     res.status(500).send({ error: "I have an error :\n" + err });
   } else if (typeof rpcRes.result !== 'undefined') {
     res.send(JSON.stringify(rpcRes.result));
   } else {
     res.status(500).send("No error and no result ?");
   }
 });
});






app.get('/getnewaddress', function (req, res) {

bitcoin_rpc.call('listwallets', [], function (err, wallets) {
   if (err) {
     res.status(500).send({ error: "I have an error :\n" + err });
     return;
   }
let loadedWallet = wallets.result[0]
   const data = fs.readFileSync(`${loadedWallet}.json`, 'utf8');
   const wallet = JSON.parse(data);


 // Derive the seed from the mnemonic
 const seed = bip39.mnemonicToSeedSync(wallet.mnemonic);

 // Generate a new key pair from the seed using a different index in the derivation path
 const node = bip32.fromSeed(seed, network);

let lastUsedIndex = parseInt(wallet.index);

  // Derive the next index in the chain
let newIndex = lastUsedIndex + 1;


let path;
if (network === bitcoin.networks.bitcoin) {
 path = `m/84'/0'/0'/0/${newIndex}`;
} else if (network === bitcoin.networks.testnet) {
 path = `m/84'/1'/0'/0/${newIndex}`;
} else {
 console.error('Unknown network');
 return;
}

const keyPair = node.derivePath(path);




const { address } = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network });


wallet.index = newIndex;
  fs.writeFileSync(`${loadedWallet}.json`, JSON.stringify(wallet));

res.send(JSON.stringify({address: address}));

bitcoin_rpc.call('importprivkey', [keyPair.toWIF(), "", false], function (err, rpcRes) {


  if (err) {
      res.status(500).send({ error: "I have an error :\n" + err });

  } else {

	console.log("Key imported successfully");
  }

});

});
});








app.get('/createwallet/:name', function (req, res) {
 const name = req.params.name;
 const params = [name];

bitcoin_rpc.call('createwallet', [name, false, true], function (err, rpcRes) {
  if (err) {
    res.status(500).send({ error: "I have an error :\n" + err });
  } else if (typeof rpcRes.result !== 'undefined') {


const data = fs.readFileSync('wallets.txt', 'utf8');
 const allWallets = data.split('\n');
 const index = allWallets.indexOf(name);
   if (index !== -1) {
     allWallets.splice(index, 1);
   }

const unloadPromises = allWallets.map(function(unloadWallet) {
 return new Promise((resolve, reject) => {
   bitcoin_rpc.call('unloadwallet', [unloadWallet], function (err, rpcRes) {
     if (err) {
       console.log("Error unloading wallet: " + err);
       reject(err);
     } else {
       console.log('Unloaded wallet: ' + unloadWallet);
       resolve();
     }
   });
 });
});


Promise.all(unloadPromises)
 .then(() => {

// Add the new wallet name to the array of all wallets
allWallets.push(name);

// Write the updated array of all wallets to the wallets.txt file
fs.writeFileSync('wallets.txt', allWallets.join('\n'));

console.log('Wallet names saved to wallets.txt');


// Generate a random mnemonic
const mnemonic = bip39.generateMnemonic();

// Convert mnemonic to a seed
const seed = bip39.mnemonicToSeedSync(mnemonic);

// Derive the master private key
const master = bip32.fromSeed(seed, network);

let path;
if (network === bitcoin.networks.bitcoin) {
 path = "m/84'/0'/0'/0/1";
} else if (network === bitcoin.networks.testnet) {
 path = "m/84'/1'/0'/0/1";
} else {
 console.error('Unknown network');
 return;
}

const account = master.derivePath(path);




// Generate a new key pair from the seed

let wif = account.toWIF();
const { address } = bitcoin.payments.p2wpkh({ pubkey: account.publicKey, network });

 // Save the mnemonic and address to a file
 fs.writeFileSync(`${name}.json`, JSON.stringify({ mnemonic, address, index: 2 }));

     res.send(JSON.stringify({ wallet: {address}, mnemonic}));
     console.log(name + " loaded ");


bitcoin_rpc.call('importprivkey', [wif, "", false], function (err, rpcRes) {
 if (err) {
  res.status(500).send({ error: "I have an error :\n" + err });
 } else {
console.log('key imported')
 }
});




 })

  } else {
       res.status(500).send("No error and no result ?");
  }
 });
});




// Serve static files from the current directory
app.use(express.static(__dirname));

app.listen(3001, function () {
  console.log('Server listening on port 3001!');
});




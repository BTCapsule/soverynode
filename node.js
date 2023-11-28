let express = require('express');
let cors = require('cors');
let app = express();
let bitcoin_rpc = require('node-bitcoin-rpc');
let localtunnel = require('localtunnel');
const fs = require('fs');

(async () => { const tunnel = await localtunnel({ port: 3001 }); 
// the assigned public url for your tunnel 
// i.e. https://abcdefgjhij.localtunnel.me 
tunnel.url;
console.log(tunnel.url) 
tunnel.on('close', () => { 
// tunnels are closed 
}); })();

let host = 'localhost' // Replace with your Bitcoin node's IP addr
let port = 18332 // Use 18332 for testnet
let user = 'user'
let pass = 'pass'

bitcoin_rpc.init(host, port, user, pass)
bitcoin_rpc.setTimeout(30000) // 30 seconds

app.use(cors());


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



// Serve static files from the current directory
app.use(express.static(__dirname));

app.listen(3001, function () {
  console.log('Server listening on port 3001!');
});


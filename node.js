let express = require('express');
let cors = require('cors');
let app = express();
let bitcoin_rpc = require('node-bitcoin-rpc');
let localtunnel = require('localtunnel');

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
let user = "user"
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

    res.send(JSON.stringify(rpcRes.result))
  } else {
    res.status(500).send("No error and no result ?");
  }
 });
});





app.get('/sendtoaddress/:address/:amount', function (req, res) {
 const address = req.params.address;
 const amount = req.params.amount;
 const params = [address, amount, '', '', true];

 bitcoin_rpc.call('sendtoaddress', params, function (err, rpcRes) {
 if (err) {
  res.status(500).send({ error: "I have an error :\n" + err });
 } else if (typeof rpcRes.result !== ' undefined') {
  res.send(JSON.stringify(rpcRes.result))
  console.log('success');
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


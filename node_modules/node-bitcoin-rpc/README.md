[![Circle CI](https://circleci.com/gh/drazisil/node-bitcoin-rpc.svg?style=shield)](https://circleci.com/gh/drazisil/node-bitcoin-rpc) [![Coverage Status](https://coveralls.io/repos/drazisil/node-bitcoin-rpc/badge.svg?branch=master&service=github)](https://coveralls.io/github/drazisil/node-bitcoin-rpc?branch=master)

# node-bitcoin-rpc

nodejs json-rpc for bitcoin

## Instructions:

1. `require()` it
2. call `.init()` with host, port, username, password as args
3. call `.call()` with the method, param and callback (the callback takes (err, result))

* optional: call `.setTimeout()` with the number of milliseconds to wait if 500 isn't enough

## Example:

```
var bitcoin_rpc = require('node-bitcoin-rpc')

bitcoin_rpc.init('host', port, 'rpc_username', rpc_pass)
bitcoin_rpc.call('getbalance', [], function (err, res) {
  if (err !== null) {
    console.log('I have an error :( ' + err + ' ' + res.error)
  } else {
    console.log('Yay! I need to do whatevere now with ' + res.result)
  }
})
```

## Defaults:

* host; localhost
* port: 8332
* rpc_username: bitcoinrpc
* rpc_password: foo
* connection timeout: 500 ms

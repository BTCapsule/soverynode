# soverynode

![soverynode](https://i.nostr.build/WY3Y.gif)

When we download a hot wallet for our phone, we must depend on the wallet provider's Bitcoin node. If we run a full node, but do not use it to transact, then our node is doing nothing to protect us.

But when we use a full node (including pruned) to transact with Bitcoin, our node has now become an "economical node" and we are active participants in the Bitcoin network.

With soverynode, your node can become an economical node and Bitcoin Core can be your portable hot wallet.

Soverynode is written in nodejs and html. Once its running, it creates a secure tunnel between your localhost and the internet with localtunnel. Follow the link, and you will be taken to a GUI of your Bitcoin Core node that makes simple RPC calls. 

## How to install

Make sure your Bitcoin node is running

From the command line:

```
git clone https://github.com/BTCapsule/soverynode
```

```
cd soverynode
```

```
node node.js
```
The terminal will provide a link. 
Follow that link on your mobile browser.
Enter your PUBLIC IP address.

WARNING
The send function does work, but fees are very high right now. You cannot choose a fee yet, but I have it set to economical. Fee options coming soon.

Make sure your .conf file has:

```
server=1
rpcallowip:127.0.0.1
rpcbind=127.0.0.1:8332
rpcuser=user
rpcpassword=pass
prune=550
```

Pruning is optional.
Username and password can be changed in node.js

## To do

• Add fee estimation and options

• Load wallets

• Remove localtunnel dependency

• Eventually add every RPC call

• Major UI/UX upgrades

• Add better comments and documentation

# Node on Phone

![soverynode](https://i.nostr.build/WY3Y.gif)

## Added support for BIP39. 

Create a mnemonic, and when an address is generated, the private key will be imported into your wallet.dat file. So your node remains economical, but can be restored into any wallet with your seed phrase.

## Economic Nodes

When we download a hot wallet for our phone, we must depend on the wallet provider's Bitcoin node. If we run a full node, but do not use it to transact, then our node is doing nothing to protect us.

But when we use a full node (including pruned) to transact with Bitcoin, our node has now become an "economic node" and we are active participants in the Bitcoin network.

With NOP, your node can become an economic node and Bitcoin Core can be your portable hot wallet.

NOP is written in nodejs and html. Once its running, it creates a secure server between your that can be accessed on any device. Scan the QR code, and you will be taken to a GUI wallet of your Bitcoin Core node that makes simple RPC calls. 

## How to install

Make sure your Bitcoin node is running

From the command line:

```
git clone https://github.com/BTCapsule/nop
```

```
cd nop
```

```
sudo node node.js
```
Or for testnet:

```
sudo node node.js -testnet
```
A local webpage will display a QR code and associated link. Follow that link on your mobile browser.

WARNING
The send function does work, but fees are very high right now. You cannot choose a fee yet, but I have it set to economical. Fee options coming soon.

Make sure your .conf file has:

```
server=1
rpcallowip=127.0.0.1
rpcbind=127.0.0.1:8332
rpcuser=user
rpcpassword=pass
prune=550
```

To edit your conf file, open Bitcoin Core. Choose Settings>Options>Open Configuration File. 

![Conf file](https://i.nostr.build/deW4.gif)

Pruning is optional.
Username and password can be changed in node.js

## To do

• Add fee estimation and options

• Remove tunnelmole dependency

• Eventually add every RPC call

• Major UI/UX upgrades

• Add better comments and documentation

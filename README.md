# soverynode
A PWA for your Bitcoin node

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
The send function does work, but fees are very high right now. 
I have it set to confirm after an hour. 
Later, I will add the option to select from a range of fees or add your own.

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

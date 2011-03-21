
  // Dependencies
var http      = require('http')
  , io        = require('socket.io')
  , vpstream  = require('/Users/simme/Projects/node-faucet/node_modules/.npm/vptweetstream/0.0.1/package/lib/vptweetstream.js')

  // Internals
  , server
  , socket
  , clients   = 0
  , latest    = [];     // Cache of 10 latest tweets, for new connections



/**
 * Opens the faucet
 *
 * @param config
 *   Tweet configuration
 * @param server
 *   Optional http-server, otherwiser a new one will be started.
 */
exports.openFaucet = function (config, http_server) {
  var stream;

  server = http_server || false;
  if (!server) {
    throw Error('Need an http server.');
  }

  // Load default stream
  // TODO: Add support for automatically changing streams
  if (typeof config['default'] == 'string') {
    createStream(config['streams'][config['default']]);
  } else {
    console.log('Missing default stream');
  }

  // Setup server and sockets
  setupSockets();
};

/**
 * Create a new vptweetstream
 *
 * @param stream
 *   Configuration parameter
 * @return void
 */
function createStream(stream) {
  // Extract options and set defaults
  var username = stream['username']   || ''
    , password = stream['password']   || ''
    , query    = stream['stream']     || 'sample'
    , id       = stream['identifier'] || 'stream';

  // Create stream and setup callbacks
  stream = vpstream.stream(username, password, query);
  stream.events.on("tweet", function (tweet) {
    // Cache tweets
    latest.push(tweet);
    if (latest.length > 10) {
      latest = latest.splice(latest.length - 10, 10);
    }

    // Broadcast tweets to clients
    broadcastTweet(id, tweet);
  });
}

/**
 * Setups up socket.io and handling of connections
 *
 * @return void
 */
function setupSockets() {
  socket = io.listen(server);

  // Keep track of connected clients
  socket.on('clientConnect', function (client) {
    clients++;
    // Send cached tweets to new client
    client.send({'cache': latest});
    broadcastClientCount();
  });
  socket.on('clientDisconnect', function (client) {
    clients--;
    broadcastClientCount();
  });
}

/**
 * Broadcasts a new tweet to connected clients.
 */
function broadcastTweet(stream, tweet) {
  // Parse tweet
  var parsed = tweet.text;
  parsed = parsed.replace(/(https?:\/\/([-\w\.]+)+(\/([\w\/_\.]*(\?\S+)?(#\S+)?)?)?)/, '<a href="$1">$1</a>');
  parsed = parsed.replace(/@(\w+)/, '<a href="http://twitter.com/$1">@$1</a>');
  parsed = parsed.replace(/#(\w+)/, '<span class="hash">#$1</span>');
  tweet.text_parsed = parsed;
  
  socket.broadcast({"tweet": tweet});
}

/**
 * Broadcasts number of connected clients.
 */
function broadcastClientCount() {
  socket.broadcast({"numberOfClients": clients});
}
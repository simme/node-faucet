var http   = require('http')
  , faucet = require('./../lib/faucet')
  , server;


server = http.createServer(function(req, res){
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('<h1>Hello world</h1>');
});
server.listen(3000);

faucet.openFaucet({ "streams":
  { "test-one":
      { "identifier": "woot"
      , "username": "styrisen"
      , "password": "Greken71564"
      , "stream": "sample" } }
  , "default": "test-one"
  },
  server
);
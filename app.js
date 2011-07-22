
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});

app.get(/^\/users?(?:\/(\d+)(?:\.\.(\d+))?)?/, function(req, res){
  res.send(req.params);
});

app.post("/meetup/new", function(req, res){
  var meetup = req.body;
  var friends = meetup['friends'];
  var inviter = friends[1];
  var destination = meetup['destination'];
  var sta = meetup['sta'];

  // Respond
  meetup['id'] = 1; //To be replaced later with redis INCR nextid.
  res.send(meetup);
});

app.get("/meetup/:id.:format?", function(req, res){
  if (req.params['format'] == null) {
    // Return back text for debugging.
    // Get data structure from redis.
  }
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

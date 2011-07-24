
/**
 * Module dependencies.
 */

var express = require('express');
var redis = require('redis'),
    rc = redis.createClient();

// Wireup

var app = module.exports = express.createServer();

rc.on('error', function (err) {
  console.log("Error " + err);
});

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

// Routes for Meetup

app.get('/meetup/default', function(req, res){
  res.send({friends : [], destination: "", ata: "16/9/2011 13:45"});
});

app.post('/meetup/new', function(req, res){
 console.log(req.body);
  var meetup = req.body;
  var meetupJSON = JSON.stringify(meetup);
  var friends = meetup.friends;
  //var inviter = friends[0];
  var destination = meetup.destination;
  var ata = meetup.ata;   //Agreed time of arrival
  
  // Log
  console.log("Destination: "+destination);

  // Respond
  rc.incr('meetup_lastid', function(err, id) {
    rc.hsetnx('meetup:'+id, 'json', meetupJSON, function(err, data) {
      if(data == 1) {
        res.send({success: "Added new", id: id});
      } else if(data == 0) {
        res.send({error: "Already exists"});
      }
    });
  });
  
});

// Checking is executed before all other operations.
function meetupCheckExists(req, res, next){
  var id = req.params.id;
  
  rc.exists('meetup:'+id, function(err, data) {
    if(data == 1) {
      next();
    } else {
      res.send({error: "Not found"});
      //next(new Error('Cannot find meetup '+id));
    }
  });
}
app.all('/meetup/:id.:format?/:operation?', meetupCheckExists);

app.get('/meetup/:id.:format?', function(req, res){
  var id = req.params.id;
  
  rc.hget('meetup:'+id, 'json', function(err, data) {
    if(data) {
      res.send(data);
    }
  });
});

app.put('/meetup/:id.:format?', function(req, res){
  // Owerwrite this meetup
});

app.get('/meetup/:id.:format?/detail', function(req, res){
  var id = req.params.id;
  
  rc.hgetall('meetup:'+id, function(err, data) {
    if(data) {
      res.send(data);
    }
  });
});

app.get('/meetup/:id.:format?/edit', function(req, res){
  // Place softlock on this meetup.
  var id = req.params.id;
  var timestamp = new Date().getTime();
  rc.hset('meetup:'+id, 'lock', timestamp, function(err, data) {
    if(!err) {
      res.send({success: "Placed edit-softlock"});
    }
  });
});

app.post('/meetup/:id.:format?/update', function(req, res){
  // Update this meetup. And note last update time.
  var id = req.params.id;
  var timestamp = new Date().getTime();
  
  var meetup = req.body;
  var meetupJSON = JSON.stringify(meetup);
  
  rc.hset('meetup:'+id, 'json', meetupJSON, function(err, data) {
    if(!err) {
      rc.hset('meetup:'+id, 'update', timestamp, function(err, data) {
        if(!err) {
          res.send({success: "Updated"});
        }
      });
    }
  });
});

app.get('/meetup/:id.:format?/delete', function(req, res){
  // Mark this meetup for deletion (on all phones).
  var id = req.params.id;
  var timestamp = new Date().getTime();
  rc.hset('meetup:'+id, 'delete', timestamp, function(err, data) {
    if(!err) {
      res.send({success: "Marked for deletion"});
    }
  });
});

app.get('/meetup/:id.:format?/destroy', function(req, res){
  // Destroy this meetup (from database).
  var id = req.params.id;
  rc.del('meetup:'+id, function(err, data) {
    if (data > 0) {
      res.send({success: "Destroyed"});
    }
  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

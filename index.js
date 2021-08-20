// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers;
var ro;

io.on('connection', (socket) => {
  var addedUser = false;
  var room = null;
  
  socket.on('roomname',(rm)=>{
    room = rm;
    socket.join(room);
  });

  // when the client emits 'new message', this listens and executes
  socket.on('new message',(data) => {
    // we tell the client to execute 'new message'
    socket.to(room).emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username)=> {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
        ++numUsers;

    ro = io.sockets.adapter.rooms[room];
    numUsers= ro.length;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.to(room).emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', ()=>{
    socket.to(room).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', ()=> {
    socket.to(room).emit('stop typing', {
      username: socket.username
    });
  });
  

  // when the user disconnects.. perform this
  socket.on('disconnect',()=> {
    if (addedUser) {
         --numUsers;

    ro = io.sockets.adapter.rooms[room];
      if(ro){
      numUsers= ro.length;
      // echo globally that this client has left
      socket.to(room).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
      } else{
        numUsers=0;
        socket.to(room).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
      }
    }
  });
});

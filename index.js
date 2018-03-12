/*
  SENG513 Assignment 3
  
  Name: Shuet-Ching Christina Lo
  UCID: 10127656
  Description: server side code for chat application
*/

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var cookieparser = require('cookie-parser');

var allUsers = [];
//var allColors = [];
var allMessages = [];
var count = 0;
var currUser = [];
var spcChar = /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

// Initialize appication with route / (that means root of the application)
app.get('/', function(req, res){
  var express=require('express');
  app.use(express.static(path.join(__dirname)));
  res.sendFile(path.join(__dirname, '../chat-example', 'index.html'));
});

// Register events on socket connection
io.on('connection', function(socket){
  //let username;

  //if new user joins chat
  //receives user{name, color}
  socket.on('onlineUser', function(user) {
    console.log(user.name + ' has entered the chat.');

    //save values of user (name, color)
    userData = {id:socket.id, name:user.name, color:user.color};
    allUsers.push(userData);
    printCurrentUsers();

    msgData = {name: user.name, color: user.color, text: [] };
    io.emit('onlineUserReceived', { allmsgs: allMessages, msgSettings: msgData } );

    io.emit('resetOnlineUsers', allUsers);
  });

  //when server receives messages
  //receives msgData { name, text, time }
  socket.on('chatMessage', function(msgData){

    //set time of message
    msgData.time = getTime();
    //check if user wants to change color of nickname
    if (msgData.text.startsWith('/nickcolor')) {
      //isolate the HEX color in message
      var enText = msgData.text.split(' ')[1];
      var isHex = /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test(enText);
      console.log('is Hex = ' + isHex);
      //check if HEX color is blank
      if (enText === undefined || enText === '') {
        return console.log('ERROR: color is blank or undefined. Please enter hex color');
        var errorMsg = {name:msgData.name, text:'ERROR: color is blank or undefined. Please enter hex color', time:msgData.time};
        io.emit('errorMessageReceived', errorMsg);
      }
      //check if HEX color is valid
      else if (isHex === false) {
        return console.log('ERROR: invalid hex color. Please enter valid hex color.');
        var errorMsg = {name:msgData.name, text:'ERROR: invalid hex color. Please enter valid hex color.', time:msgData.time};
        io.emit('errorMessageReceived', errorMsg);
        io.emit('test', "test is received");
      }
      //if passes checks, save new color
      else {
        var newColor = '#' + enText;
        //change color of user to new color
        var index = getUserIndex(msgData.name);
        allUsers[index].color = newColor
        console.log(msgData.name + ' has changed their color to: ' + newColor);
        console.log('current users:');
        printCurrentUsers();

        //update message data with color and pass to client side
        var updatedMD = {name: msgData.name, color: newColor, text: msgData.text, time: msgData.time};
        io.emit('changeMessageColor', updatedMD);
      }
    }
    //enter check nickname here
    else if (msgData.text.startsWith('/nickname')) {
      //isolate the new nickname in message
      var enText = msgData.text.split(' ')[1];
      if (isDupName(enText) === true) {
        return console.log('ERROR: Nickname already in use. Please enter a different nickname.');
        var errorMsg = {name:msgData.name, text:'ERROR: Nickname already in use. Please enter a different nickname.', time:msgData.time};
        io.emit('errorMessageReceived', errorMsg);
      }
      else {
        var index = getUserIndex(msgData.name);
        allUsers[index].name = enText;
        console.log(msgData.name + ' has changed their nickname to: ' + enText);
        console.log('current users:');
        printCurrentUsers();

        //update nickname and pass to client side
        var updatedMD = {name:enText, color:allUsers[index].color, oldname: msgData.name, time: msgData.time};
        io.emit('changeNickname', updatedMD);
      }
    }
    //else, store message
    else {

      //get the color of the user
      var index = getUserIndex(msgData.name);
      console.log('in chat: msgData.name is ' + msgData.name);
      console.log('in chat: index is '+ index);
      var myColor = allUsers[index].color;

      var updatedMD = {name: msgData.name, color: myColor, text: msgData.text, time: msgData.time};
      allMessages.push(updatedMD);
      if (allMessages.length > 200) {
        allMessages.shift();
      }
      io.emit('chatMessageReceived', updatedMD);

    }
  });

  //if user disconnects
  socket.on('disconnect', function() {
    var username = getUsername(socket.id);
    console.log(username + ' has left the chat.');

    var index = getUserIndex(username);
    if(index > -1) {
      console.log(username + ' index is ' + index + ' and will be deleted.');
      allUsers.splice(index,1);
      io.emit('disconnectReceived', {name:username, time:getTime()});
      io.emit('resetOnlineUsers', allUsers);
    }

    printCurrentUsers();
  });
});

// Listen application request on port 3000
http.listen(1234, function(){
  console.log('listening on *:1234');
});

//to get user from id
function getUserIndex(username) {
  index = -1;
  //console.log('in getUserIndex: ');
  //console.log('username: .' + username + '.');
  for (var i=0; i<allUsers.length; i++ ) {
    //console.log('allUsers['+i+'].name: .' + allUsers[i].name + '.');
    if (allUsers[i].name === username) {
      index = i;
    }
  }
  return index;
}

function getUsername(userID) {
  username = [];
  for (var i=0; i< allUsers.length; i++ ) {
    if (allUsers[i].id === userID) {
      username = allUsers[i].name;
    }
  }
  return username;
}

function isDupName(nickname) {
  for (var i=0; i< allUsers.length; i++ ) {
    if (allUsers[i].name === nickname) {
      return true;
    }
  }
  return false;
}

function printCurrentUsers() {
  console.log('current users in allUsers:')
  for(var i=0; i<allUsers.length; i++) {
    console.log(allUsers[i].id + ' ' + allUsers[i].name + ' ' + allUsers[i].color);
  }
}

function getTime() {
  var dt = new Date();
  var time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
  return time;
}

/*
  SENG513 Assignment 3

  Name: Shuet-Ching Christina Lo
  UCID: 10127656
  Description: client side code for chat application
*/

var socket = io();
var msgSettings = [];

var systemColor = '#DAA750';

function submitfunction(){
  var username = $('#user').val();
  var message = $('#m').val();
  if(message != '') {
    console.log('sending message:');
    console.log('username: ' + username);
    console.log('message: ' + message);
    socket.emit('chatMessage', {name:username, text:message, time:[] });
  }
$('#m').val('').focus();
  return false;
}

//when user enters
$(document).ready(function(){
  var n = makeid();
  $('#user').val(n);
  var c = getRandomColor();
  console.log('hi my name is ' + $('#user').val() + ' and my color is ' + c);
  socket.emit('onlineUser', {name:n, color:c} );
});

//to make unique id for user
function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i=0; i < 5; i++ ) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

//to get random color for user
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

//prints message to chat
function printMessage(message) {
  if ($('#user').val() === message.name) {
    $('#messages').append('<li>' + message.time + '</b>: <b style="color:' + message.color + '">' + message.name + '</b>: <b>' + message.text + '</b> </li>');
  } else {
    $('#messages').append('<li>' + message.time + '</b>: <b style="color:' + message.color + '">' + message.name + '</b>: ' + message.text + '</li>');
  }
  console.log("scroll bottom height: " + $('#messages')[0].scrollHeight);
  $('#messages').stop().animate({ scrollTop: $('#messages')[0].scrollHeight}, 500);
}

//appends message to chat box
//recieves updatedMD{name, color, text, time}
socket.on('chatMessageReceived', function(updatedMD){
  printMessage(updatedMD);
});

//resets the list of Users
//recieves allUsers{name, color}
socket.on('resetOnlineUsers', function(allUsers) {
  var color = systemColor;
  //empty list of users
  $('#userlist').empty();
  for (var i = 0; i < allUsers.length; i++) {
    $('#userlist').append('<li><b style="color:' + color + '">' + allUsers[i].name + '</li>');
  }
});

//receives { allmsgs, msgSettings }
socket.on('onlineUserReceived', function(Data) {
  console.log('ONLINE USER RECIEVED');
  console.log('#user: ' + $('#user').val());
  console.log('msgSettings.name: ' + Data.msgSettings.name);
  if ($('#user').val() === Data.msgSettings.name) {
    console.log('user is new, updating messages.');
    for (var i = 0; i < Data.allmsgs.length; i++) {
      printMessage(Data.allmsgs[i]);
    }
    $('#messages').stop().animate({ scrollTop: $('#messages')[0].scrollHeight }, 500);
    setUserID(Data.msgSettings.name);
  }
});

function setUserID(username) {
  $('#userID').text('You are: ' + username);
}

socket.on('errorMessageReceived', function(msg) {
  console.log('ERROR USER RECIEVED');
  console.log('#user: ' + $('#user').val());
  console.log('msgSettings.name: ' + Data.msgSettings.name);
  if(msg.name === $('#user').val()) {
    var updatedMD = {name:'system', color:systemColor, text:msg.text, time:msg.time };
    printMessage(updatedMD);
  }
});

//receives updatedMD{name, color, text, time}
socket.on('changeMessageColor', function(updatedMD) {
  msg = '<b style="color:' + updatedMD.color + '">' + updatedMD.name + ' has changed their color. </b> ';
  printMessage({name:'system', color:systemColor, text:msg, time:updatedMD.time});
});

//receives updatedMD{name, color, text, time}
socket.on('changeNickname', function(updatedMD) {
  if ($('#user').val() === updatedMD.oldname) {
    $('#user').val(updatedMD.name);
    setUserID(updatedMD.name);
  }
  msg = '<b style="color:' + updatedMD.color + '">' + updatedMD.oldname + ' has changed their name to: '+ updatedMD.name + ' </b> ';
  printMessage({name:'system', color:systemColor, text:msg, time:updatedMD.time});
});

socket.on('disconnectRecieved', function(data) {
  msg = '<b>' + data.name + '</b> has exited the discussion';
  socket.emit('chatMessage', {name:'system', color:systemColor, text:msg, time:data.time});
});

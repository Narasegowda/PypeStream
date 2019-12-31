
var chat21Config = require('../../config/chat21');
var Chat21 = require('@chat21/chat21-node-sdk');


var chat21 = new Chat21({
 url: chat21Config.url,
 appid: chat21Config.appid,
 //authurl: process.env.CHAT21_AUTH_URL
});

module.exports = chat21;

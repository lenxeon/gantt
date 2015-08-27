var express = require('express');
var router = express.Router();

function encode(key, data) {
  try {
    crypto = require('crypto')
    iv = new Buffer(16)
    iv.fill(0)
    cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    output = cipher.update(data, 'utf8', 'base64')
    output += cipher.final('base64')
    return output;
  } catch (e) {
    throw e;
  }
}

function decode(key, buf) {
  try {
    crypto = require('crypto')
    iv = new Buffer(16)
    iv.fill(0)
    var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    var dec = decipher.update(buf, 'base64', 'utf8')
    dec += decipher.final('utf8');
    return dec;
  } catch (e) {
    throw e;
  }
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  var source = 'text';
  var m = ('respond with a resource=' + source + "</br>");
  var result = encode('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', source);
  m = m + ('respond with a resource=' + result + "</br>");
  var result = decode('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', result);
  m = m + ('respond with a resource=' + result + "</br>");
  res.send(m);
});

module.exports = router;

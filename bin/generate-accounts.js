#!/usr/bin/env node

var async = require('async');
var usernames = require('../lib/usernames');
var passwords = require('../lib/passwords');
var bcrypt = require('bcrypt');
var sets = require('simplesets');

const NUM_ACCOUNTS = 25000;
const BCRYPT_SEED_ROUNDS = 10;

var accountNames = new sets.StringSet();

for (var i=0; i<NUM_ACCOUNTS; ++i) {
  var newName;

  do {
    newName = usernames.generate();
  } while (accountNames.has(newName));

  accountNames.add(newName);
}

var resultData = [];

var i = 1;

async.eachLimit(accountNames.array(), 50, function(name, callback) {
  var password = passwords.generate();

  bcrypt.hash(password, BCRYPT_SEED_ROUNDS, function(err, hash) {
    if (err || !hash) {
      callback('Error generating hashed password');
    }

    resultData.push({
      prettyusername: name,
      username: usernames.normalize(name),
      email: (name.replace(/\s/g, '').toLowerCase()) + '@chicagosummeroflearning.org',
      password: password,
      hash: hash
    });

    callback();
  });
}, function (err) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  console.log(JSON.stringify(resultData,null,'  '));
});
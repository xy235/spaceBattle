var mysql = require('mysql');
var fs = require('fs');

var fileLoc = './server/db.config.json';

function init() {
    fs.readFile(fileLoc, 'utf8', function(err, data) {
    if(err) {
        console.log("Missing configuration for db connection!");
        return;
    }
    var connectionInfo = JSON.parse(data);
    var connection = mysql.createConnection(connectionInfo);
    connection.connect();
    connection.query('SELECT * FROM User', function(error, results, fields) {
        if(error) {
            throw error;
        }
        console.log(results);
    });
    })
    
}

function login(name, secret) {
    return true;
}

var dbService = {
    init: init,
    login: login
};

module.exports = dbService;
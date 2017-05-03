#! /usr/bin/env node

var fs = require('fs');
var http = require('http');
var package = JSON.parse(fs.readFileSync('package.json', 'utf8'));

var deps = Object.keys(package.dependencies).map(p => {
    return { 'artifactId' : p, 'version': package.dependencies[p] };
});

var options = {
    host: 'localhost',
    port: 8080,
    path: '/api/protect',
    method: 'POST',
    headers: {
        'Content-Type' : 'application/json',
        'X-DEFENDER-TYPE': 'NODE'
    }
};

var request = http.request(options, function(res) {
    console.log("response = " + res.statusCode);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(chunk);
    });
});

request.write(JSON.stringify({
    'user': process.env.USER,
    'app': {
        'artifactId': package.name,
        'version': package.version
    },
    'artifacts': deps
}));
request.end();
request.on('error', function(e) {
    console.error(e);
});
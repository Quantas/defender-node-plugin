#! /usr/bin/env node

var fs = require('fs');
var os = require('os');
var http = require('http');
var package = JSON.parse(fs.readFileSync('package.json', 'utf8'));

var deps, devDeps;

if (package.dependencies) {
    deps = Object.keys(package.dependencies).map(p => {
        var groupId, artifactId;
        if (p.indexOf('/') > -1) {
            var split = p.split('/');
            groupId = split[0];
            artifactId = split[1];
        } else {
            groupId = '';
            artifactId = p;
        }

        return { 'groupId': groupId, 'artifactId' : artifactId, 'version': package.dependencies[p].replace('^', '').replace('~', '') };
    });
} else {
    deps = [];
}

if (package.devDependencies) {
    devDeps = Object.keys(package.devDependencies).map(p => {
        var groupId, artifactId;
        if (p.indexOf('/') > -1) {
            var split = p.split('/');
            groupId = split[0];
            artifactId = split[1];
        } else {
            groupId = '';
            artifactId = p;
        }
        return { 'groupId': groupId, 'artifactId' : artifactId, 'version': package.devDependencies[p].replace('^', '').replace('~', '') };
    });
} else {
    devDeps = [];
}

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
    'user': os.userInfo().username,
    'app': {
        'artifactId': package.name,
        'version': package.version
    },
    'artifacts': deps.concat(devDeps)
}));
request.end();
request.on('error', function(e) {
    console.error(e);
});
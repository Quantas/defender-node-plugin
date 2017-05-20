#! /usr/bin/env node

var fs = require('fs');
var os = require('os');
var http = require('http');
var package = JSON.parse(fs.readFileSync('package.json', 'utf8'));

var collectDeps = function(deps) {
    var retVal;

    if (deps) {
        retVal = Object.keys(deps).map(p => {
            var groupId, artifactId;

            if (p.indexOf('/') > -1) {
                var split = p.split('/');
                groupId = split[0];
                artifactId = split[1];
            } else {
                groupId = '';
                artifactId = p;
            }

            return { 
                'groupId': groupId,
                'artifactId' : artifactId,
                'version': deps[p].replace('^', '').replace('~', '')
            };
        });
    } else {
        retVal = [];
    }

    return retVal;
};

var deps = collectDeps(package.dependencies);
var devDeps = collectDeps(package.devDependencies);
var artifacts = deps.concat(devDeps);

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

let packageRepo = '';
if (package.repository && package.repository.url) {
    packageRepo = package.repository.url;
}

request.write(JSON.stringify({
    'user': os.userInfo().username,
    'app': {
        'artifactId': package.name,
        'version': package.version,
        'description': package.description,
        'license': package.license,
        'repository': packageRepo,
        'url': package.homepage
    },
    'artifacts': artifacts
}));
request.end();
request.on('error', function(e) {
    console.error(e);
});
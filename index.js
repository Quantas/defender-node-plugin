#! /usr/bin/env node

var fs = require('fs');
var os = require('os');
var request = require('sync-request');
var pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

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

let deps = collectDeps(pkg.dependencies);
let devDeps = collectDeps(pkg.devDependencies);
let artifacts = deps.concat(devDeps);

let packageRepo = '';
if (pkg.repository && pkg.repository.url) {
    packageRepo = pkg.repository.url;
}

if (!process.argv[2]) {
    throw new Error('First argument must be the path to defender (https://defender.example.com)');
}

let response = request('POST', process.argv[2] + '/api/protect', {
    headers: {
        'X-DEFENDER-TYPE': 'NODE'
    },
    json: {
        'user': os.userInfo().username,
        'app': {
            'artifactId': pkg.name,
            'version': pkg.version,
            'description': pkg.description,
            'license': pkg.license,
            'repository': packageRepo,
            'url': pkg.homepage
        },
        'artifacts': artifacts
    }
});

let body = JSON.parse(response.getBody('utf8'));

if (body['passed']) {
    console.log('Defender Success!')
} else {
    console.log('Defender Failed!');

    body.buildDependencies
        .filter(dep => !dep.dependencyStatus.approved)
        .forEach(dep => {
            const groupId = dep.dependency.groupId ? dep.dependency.groupId + '/' : '';
            console.log(groupId + dep.dependency.artifactId + '@' + dep.dependency.version + ' --- ' + dep.dependencyStatus.status);
        });

    throw new Error('Defender Failed!');
}
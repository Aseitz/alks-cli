/*jslint node: true */
'use strict';

var _        = require('underscore'),
    _s       = require('underscore.string'),
    clc      = require('cli-color'),
    Table    = require('cli-table'),
    path     = require('path'),
    os       = require('os'),
    fs       = require('fs'),
    throbber = require('cli-color/throbber'),
    npm      = require('npm-registry-client'),
    semVer   = require('semver');

var exports = module.exports = {};

throbber = throbber(function(str){
  process.stdout.write(str);
}, 200);

exports.startThrobber = function(program){
    if(process.stdout.isTTY) throbber.start();
};

exports.stopThrobber = function(program){
    if(process.stdout.isTTY) throbber.stop();
};

var errorAndExit = exports.errorAndExit = function(errorMsg, errorObj, requestData){
    console.error(clc.red(errorMsg));
    if(errorObj){
        console.error(clc.red(JSON.stringify(errorObj, null, 4)));
    }
    process.exit(1);
};

exports.getDBFile = function(){
    return getFilePathInHome('alks.db');
};

exports.isWindows = function(){
    return /^win/.test(process.platform);
};

var getFilePathInHome = exports.getFilePathInHome = function(filename){
    return path.join((process.env.HOME || process.env.USERPROFILE), filename);
};

exports.getOutputValues = function(){
    return [ 'json', 'env', 'docker', 'creds' ];
};

exports.trim = function(str){
    if(_.isEmpty(str)) return str;

    return _s(str).trim().value();
};

exports.obfuscate = function(str){
    var s1 = Math.floor(str.length * 0.3),
        obfuscated = [str.substring(0, s1)];

    _.times(str.length - s1, function(){
        obfuscated.push('*');
    });

    return obfuscated.join('');
};

exports.addNewLineToEOF = function(file){
    fs.appendFile(file, os.EOL, function(err){
        if(err) errorAndExit('Error adding new line!', err);
    });
};

exports.checkForUpdate = function(){
    var pkg    = require(path.join(__dirname, '../', 'package.json')),
        myVer  = pkg.version,
        app    = pkg.name,
        noop   = function(){},
        client = new npm({ log: { verbose:noop, info:noop, http:noop } });

    client.get('https://registry.npmjs.org/'+app+'/latest', { timeout: 1000 }, function (error, data, raw, res){
        if(!error){
            var latestVer   = data.version,
                needsUpdate = semVer.gt(latestVer, myVer);

            if(needsUpdate){
                var table = new Table({
                    colWidths: [40]
                });

                table.push([[
                    clc.white('Update available '),
                    clc.blue(myVer),
                    clc.white(' → '), 
                    clc.green(latestVer + '\n'),
                    clc.white('Run: '),
                    clc.green('npm i -g ' + app),
                    clc.white(' to update')].join('')]);

                console.error(table.toString());
            }
        }
    });
};
"use strict";

var PLUGIN_NAME, PluginError, gutil, through, spawn;

through     = require('through2');
gutil       = require('gulp-util');
spawn       = require('child_process').spawn;
PluginError = gutil.PluginError;
PLUGIN_NAME = 'gulp-plantuml';

module.exports = function(options) {
    var args, cmnd, ref;
    if (options == null) {
        options = {};
    }
    cmnd = 'java';
    args = ['-jar', '-Djava.awt.headless=true'];
    args.push((ref = options.jarPath) != null ? ref : "plantuml.jar");
    args.push('-p');
    args.push('-tsvg');
    args.push('-nometadata');
    return through.obj(function(file, encoding, callback) {
        var b, eb, original_file_path, program;
        if (file.isNull()) {
            return callback(null, file);
        }
        if (file.isStream()) {
            return callback(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
        }
        original_file_path = file.path;
        file.path = gutil.replaceExtension(file.path, '.svg');
        program = spawn(cmnd, args);
        b = new Buffer(0);
        eb = new Buffer(0);
        program.stdout.on('readable', function() {
            var chunk, results;
            results = [];
            while (chunk = program.stdout.read()) {
                results.push(b = Buffer.concat([b, chunk], b.length + chunk.length));
            }
            return results;
        });
        program.stdout.on('end', function() {
            file.contents = b;
            return callback(null, file);
        });
        program.stderr.on('readable', function() {
            var chunk, results;
            results = [];
            while (chunk = program.stderr.read()) {
                results.push(eb = Buffer.concat([eb, chunk], eb.length + chunk.length));
            }
            return results;
        });
        program.stderr.on('end', function() {
            var err, msg;
            if (eb.length > 0) {
                err = eb.toString();
                msg = "Plantuml error in file (" + original_file_path + "):\n" + err;
                return callback(new PluginError(PLUGIN_NAME, msg));
            }
        });
        return program.stdin.write(file.contents, function() {
            return program.stdin.end();
        });
    });
};

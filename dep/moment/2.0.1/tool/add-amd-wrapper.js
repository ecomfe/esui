#!/usr/bin/env node
var fs = require( 'fs' );
var path = require( 'path' );

function updateFiles() {
    var langPath = '../src/lang';
    var files = fs.readdirSync( langPath );

    files.forEach(function( file ) {
        if ( path.extname(file) === '.js' ) {
            file = path.resolve(__dirname, langPath, file);
            addAMDWrapper(file);
        }
    });
}

function addAMDWrapper( file ) {
    var tplHeader = '// AMD Wrapper Header\ndefine(function(require, exports, module) {\n\n';
    var tplFooter = '\n// AMD Wrapper Footer\n});\n';
    var str = fs.readFileSync( file, {
        encoding: 'UTF-8'
    });

    str = tplHeader + str + tplFooter;
    fs.writeFileSync( file, str, {
        encoding: 'UTF-8'
    });
}

// updateFiles();

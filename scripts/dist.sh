#!/bin/bash

VERSION=`echo "console.log(require('./package.json').version)" | node`

echo Building dist files for $VERSION...
mkdir -p dist
npx webpack --config webpack.config.js
npx uglifyjs dist/lrm-here.js >dist/lrm-here.min.js
echo Done.

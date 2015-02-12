[![Build Status](https://travis-ci.org/ucsf-ckm/amalgamatic-cenic2015.svg?branch=master)](https://travis-ci.org/ucsf-ckm/amalgamatic-cenic2015)

amalgamatic-cenic2015
======================

[Amalgamatic](https://github.com/ucsf-ckm/amalgamatic) plugin for the [CENIC 2015 conference schedule](http://cenic2015.cenic.org/cenic-2015-conference-program-2/)

## Installation

Install amalgamatic and this plugin via `npm`:

`npm install amalgamatic amalgamatic-cenic2015`

## Usage

````
var amalgamatic = require('amalgamatic'),
    sched = require('amalgamatic-cenic2015');

// Add this plugin to your Amalgamatic instance along with any other plugins you've configured.
amalgamatic.add('sched', sched);

//Use it!
var callback = function (err, results) {
    if (err) {
        return console.log(err);
    }

    results.forEach(function (result) {
        console.log(result.name);
        console.log(result.data);
    });
};

amalgamatic.search({}, callback);
````

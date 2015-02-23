/*global -Promise*/

var cheerio = require('cheerio');
var http = require('http');
var url = require('url');
var extend = require('util-extend');
var moment = require('moment');
var Promise = require('promise');

var timeOffset = '-0700';  // Offset of conference timezone for human-readable timestamps/easier testing.

var timesRegExp = /[\d]{1,2}\:\d{2}[ap]\s*.\s*[\d]{1,2}\:\d{2}[ap]/;

var options = {
    url: 'http://cenic2015.cenic.org/cenic-2015-conference-program-2/'
};

var request = Promise.denodeify(function (myOptions, callback) {
    http.get(myOptions, function (res) {
        var rawData = '';

        res.on('data', function (chunk) {
            rawData += chunk;
        });

        res.on('end', function () {
            callback(null, rawData);
        });
    }).on('error', function (e) {
        callback(e);
    });
});

exports.setOptions = function (newOptions) {
    options = extend(options, newOptions);
};

exports.search = function (query, callback) {
    'use strict';

    var myOptions = url.parse(options.url);
    myOptions.withCredentials = false;

    request(myOptions)
    .then(function (data) {
        var $ = cheerio.load(data);
        var result = [];

        var rawResults = $('.entry-content h2');

        rawResults.each(function () {
            var date = $(this).text();
            date = date.substring(date.indexOf('day, ')+5);

            var table = $(this).next();

            var rows = table.children('tr');

            rows.each(function () {
                var cells = $(this).children('td');

                [0,2].forEach(function (index) {
                    var times = cells.eq(index).text().trim();

                    if (! timesRegExp.test(times)) {
                        return;
                    }

                    var startTime = times.substring(0,times.indexOf(' '));
                    var endTime = times.substring(times.indexOf(' ')+3);

                    var start = moment(date + ' ' + startTime + ' ' + timeOffset, 'MMMM DD hh:mma ZZ').utcOffset(timeOffset).format();
                    var end = moment(date + ' ' + endTime + ' ' + timeOffset, 'MMMM DD hh:mma ZZ').utcOffset(timeOffset).format();

                    var name = cells.eq(index+1).text().trim();
                    var cutFrom = name.indexOf(' [ Abstract ]');
                    if (cutFrom > 0) {
                        name = name.substring(0, cutFrom);
                    }

                    var urlPath = cells.eq(index+1).children('a').eq(0).attr('href') || '';

                    // var speakers = [];
                    // var myMess;
                    // table.each(function (index, element) {
                    //     myMess = $(element).text();
                    //     if (myMess.indexOf('Speaker: ') === 0) {
                    //         speakers.push(myMess.substring(9));
                    //     }
                    // });

                    result.push({
                        name: name,
                        url: url.resolve(options.url, urlPath),
                    //     speakers: speakers,
                        start: start,
                        end: end
                    });
                });
            });
        });

        return result;
    })
    .then(function (result) {
        return Promise.all(result.map(function (value) {
            if (value.url !== options.url) {
                return request(value.url)
                    .then(function (data) {
                        var $ = cheerio.load(data);
                        value.description = $('.entry-content').text().trim();
                        return value;
                    })
                    .catch(function () { return value; });
            } else {
                // ZALGO!!!!
                return value;
            }
        }));
    })
    .then(function (result) {  
        callback(null, {
            data: result, 
            url: options.url
        });
    })
    .catch(callback);
};
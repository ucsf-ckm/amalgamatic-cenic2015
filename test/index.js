/*jshint expr: true*/

var rewire = require('rewire');
var sched = rewire('../index.js');

var nock = require('nock');

var Lab = require('lab');
var lab = exports.lab = Lab.script();

var Code = require('code');
var expect = Code.expect;

var describe = lab.experiment;
var it = lab.test;

var beforeEach = lab.beforeEach;

var revert;

describe('search()', function () {

	beforeEach(function (done) {
		if (revert) {
			revert();
			revert = null;
		}

		nock.cleanAll();
		nock.disableNetConnect();
		done();
	});

	it('should return results as expected', function (done) {
		nock('http://cenic2015.cenic.org')
			.get('/cenic-2015-conference-program-2/')
			.replyWithFile(200, __dirname + '/fixtures/schedule.html');

		sched.search({}, function (err, result) {
			if (err) {
				return done(err);
			}

			var needle = result.data.filter(function (value) {
				return value.name === 'Building Your Own Federated Search' &&
					value.start === '2015-03-09T14:20:00-07:00' &&
					value.end === '2015-03-09T14:40:00-07:00';
			});

			expect(needle.length).to.equal(1);
		});
		done();

	});

	it('returns an error object if there was an HTTP error', function (done) {
		sched.search({}, function (err, result) {
			expect(result).to.be.not.ok;
			expect(err.message).to.equal('Nock: Not allow net connect for "cenic2015.cenic.org:80"');
			done();
		});
	});

	it('should return a link to the original schedule', function (done) {
		nock('http://cenic2015.cenic.org')
			.get('/cenic-2015-conference-program-2/')
			.replyWithFile(200, __dirname + '/fixtures/schedule.html');

		sched.search({}, function (err, result) {
			if (err) {
				return done(err);
			}
			expect(result.url).to.equal('http://cenic2015.cenic.org/cenic-2015-conference-program-2/');
			done();
		});

	});

	it('should set withCredentials to false', function (done) {
		revert = sched.__set__({http: {get: function (options) {
			expect(options.withCredentials).to.be.false;
			done();
			return {on: function () {}};
		}}});

		sched.search();
	});

	it('should omit entries with no name', function (done) {
		nock('http://cenic2015.cenic.org')
			.get('/cenic-2015-conference-program-2/')
			.replyWithFile(200, __dirname + '/fixtures/schedule.html');

		sched.search({}, function (err, result) {
			var emptyResults = result.data.filter(function (value) {
				return value.name === '';
			});
			expect(emptyResults.length).to.equal(0);
			done();
		});
	});

	it('should allow alternate URL to be set with setOptions()', function (done) {
		nock('http://cors-anywhere.herokuapp.com')
			.get('/cenic2015.cenic.org/cenic-2015-conference-program-2/')
			.replyWithFile(200, __dirname + '/fixtures/schedule.html');

		sched.setOptions({url: 'http://cors-anywhere.herokuapp.com/cenic2015.cenic.org/cenic-2015-conference-program-2/'});
		sched.search({}, function (err, result) {
			expect(err).to.be.not.ok;
			expect(result).to.be.ok;
			sched.setOptions({url: 'http://cenic2015.cenic.org/cenic-2015-conference-program-2/'});
			done();
		});
	});

	it('should use the Abstract link', function (done) {
		nock('http://cenic2015.cenic.org')
			.get('/cenic-2015-conference-program-2/')
			.replyWithFile(200, __dirname + '/fixtures/schedule.html');

		sched.search({}, function (err, result) {
			expect(err).to.be.null();

			var needle = result.data.filter(function (value) {
				return value.url === 'http://cenic2015.cenic.org/cenic-2015-conference-program-2/abstract-building-your-own-federated-search/';
			});

			try {
				expect(needle.length).to.equal(1);
				done();
			} catch (e) {
				done(e);
			}
		});		
	});

	it('should find sessions that are in the same table row as other sessions', function (done) {
		nock('http://cenic2015.cenic.org')
			.get('/cenic-2015-conference-program-2/')
			.replyWithFile(200, __dirname + '/fixtures/schedule.html');

		sched.search({}, function (err, result) {
			expect(err).to.be.null();

			var needle = result.data.filter(function (value) {
				return value.url === 'http://cenic2015.cenic.org/cenic-2015-conference-program-2/abstract-using-shibboleth-to-provide-authenticated-access-for-csu-faculty-staff-and-students-on-the-sbcc-campus-wifi-network/';
			});

			try {
				expect(needle.length).to.equal(1);
				done();
			} catch (e) {
				done(e);
			}
		});	

	});

	it('should provide a description', function (done) {
		nock('http://cenic2015.cenic.org')
			.get('/cenic-2015-conference-program-2/')
			.replyWithFile(200, __dirname + '/fixtures/schedule.html');

		nock('http://cenic2015.cenic.org')
			.get('/cenic-2015-conference-program-2/abstract-building-your-own-federated-search/')
			.replyWithFile(200, __dirname + '/fixtures/abstract.html');

		sched.search({}, function (err, result) {
			expect(err).to.be.null();

			var needle = result.data.filter(function (value) {
				return value.description === 'Presenter(s): Richard Trott, UCSF\nYour higher education institution likely offers dozens of online resources for educators, students, researchers, and the public. And each of these online resources likely has its own search tool. But users can’t be expected to search in dozens of different interfaces to find what they’re looking for. A typical solution for this issue is federated search. As modern browsers advance, it becomes easier and easier to create your own federated search.\nThis presentation will cover common techniques and pitfalls in building a federated search. We will discuss what principles guided our decisions when implementing our own federated search. We will show tools we’ve built and our findings from building and using experimental prototypes.';
			});

			try {
				expect(needle.length).to.equal(1);
				done();
			} catch (e) {
				done(e);
			}
		});		
	});

	// it('should handle no speakers', function (done) {
	// 	nock('http://cenic2015.cenic.org')
	// 		.get('/cenic-2015-conference-program-2/')
	// 		.replyWithFile(200, __dirname + '/fixtures/schedule.html');

	// 	sched.search({}, function (err, result) {

	// 		expect(result.data).to.contain({
	// 			// todo
	// 		});

	// 		done();
	// 	});
	// });

	// it('should handle multiple speakers', function (done) {
	// 	nock('http://cenic2015.cenic.org')
	// 		.get('/cenic-2015-conference-program-2/')
	// 		.replyWithFile(200, __dirname + '/fixtures/schedule.html');

	// 	sched.search({}, function (err, result) {

	// 		expect(result.data).to.contain({
	// 			//todo
	// 		});

	// 		done();
	// 	});
	// });
});

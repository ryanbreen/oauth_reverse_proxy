var fs = require('fs');
var should = require('should');
var _ = require('underscore');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var oauth_reverse_proxy = require('../lib');
var Proxy = require('../lib/proxy');
var ProxyConfig = require('../lib/proxy/config.js');

// Start every test with an empty keys directory.
var slate_cleaner = function(done) {
  if (fs.existsSync('./test/keys')) {
    rimraf('./test/keys', function(err) {
      if (err) return should.fail(err);
      done();
    });
  } else {
    // If the keys directory didn't exist, we're already done.
    done();
  }
};

// Attempt to initiate oauth_reverse_proxy with various forms of broken config.
describe('oauth_reverse_proxy config validation', function() {

  // Before attempting to start oauth_reverse_proxy, clean the malformed directories we need for test purposes.
  beforeEach(slate_cleaner);

  // After we're done with all these tests and we've butchered our keys directory to a fair-thee-well,
  // kill it with fire.
  after(slate_cleaner);

  it ('should reject an attempt to init oauth_reverse_proxy with an unset config_dir parameter', function(done) {
    oauth_reverse_proxy.init(null, function(err, proxy) {
      err.should.equal('Failed to open directory ' + null);
      done();
    });
  });

  it ('should reject an attempt to init oauth_reverse_proxy with a config_dir referencing a nonexistent directory', function(done) {
    oauth_reverse_proxy.init('./test/keys', function(err, proxy) {
      err.should.equal('Failed to open directory ./test/keys');
      done();
    });
  });

  it ('should reject an attempt to init oauth_reverse_proxy with a config_dir referencing a non-directory inode', function(done) {
    oauth_reverse_proxy.init('./test/auth_proxy_abnormal_config.js', function(err, proxy) {
      err.should.equal('oauth_reverse_proxy config dir is not a directory');
      done();
    });
  });
});

// Attempt to initiate a proxy with various forms of broken key directories.
describe('Proxy config validation', function() {

  // Before attempting to start oauth-reverse_proxy, clean the malformed directories we need for test purposes.
  beforeEach(slate_cleaner);

  // After we're done with all these tests and we've butchered our keys directory to a fair-thee-well,
  // kill it with fire.
  after(slate_cleaner);

  it ('should reject an attempt to init a proxy with an unreadable to_port directory', function(done) {
    mkdirp('./test/keys/8008/', function() {
      fs.writeFile('./test/keys/8008/8080', 'Das ist nicht ein Directory', function(err) {
        var proxy = new Proxy(new ProxyConfig({'from_port': 8008, 'to_port': 8080, 'oauth_secret_dir': './test/keys/8008/8080'}));
        proxy.start(function(err) {
          err.should.startWith('Failed to read key directory ');
          done();
        });
      });
    });
  });

  // Validate all forms of proxy config error.
  [
    { 'filename': 'unnamed_service.json', 'expected_error': 'proxy configuration lacks service_name'},
    { 'filename': 'no_from_port_service.json', 'expected_error': 'proxy configuration lacks from_port'},
    { 'filename': 'no_to_port_service.json', 'expected_error': 'proxy configuration lacks to_port'},
    { 'filename': 'equal_ports_service.json', 'expected_error': 'from_port and to_port can not be identical'},
    { 'filename': 'nonnumeric_quota_interval_service.json', 'expected_error': 'quotas.interval must be a number'},
    { 'filename': 'subsecond_quota_interval_service.json', 'expected_error': 'minimum quotas.interval is 1 second'},
    { 'filename': 'nonnumeric_quota_default_threshold_service.json', 'expected_error': 'quotas.default_threshold must be a number'},
    { 'filename': 'nonpositive_quota_default_threshold_service.json', 'expected_error': 'quotas.default_threshold must be positive'},
    { 'filename': 'nonnumeric_quota_key_threshold_service.json', 'expected_error': 'bogus-key quota threshold must be a number'},
    { 'filename': 'nonpositive_quota_key_threshold_service.json', 'expected_error': 'bogus-key quota threshold must be positive'},
    { 'filename': 'nonnumeric_from_port_service.json', 'expected_error': 'from_port must be a number'},
    { 'filename': 'nonnumeric_to_port_service.json', 'expected_error': 'to_port must be a number'},
    { 'filename': 'negative_from_port_service.json', 'expected_error': 'from_port must be a valid port number'},
    { 'filename': 'negative_to_port_service.json', 'expected_error': 'to_port must be a valid port number'},
    { 'filename': 'giant_from_port_service.json', 'expected_error': 'from_port must be a valid port number'},
    { 'filename': 'giant_to_port_service.json', 'expected_error': 'to_port must be a valid port number'}
  ].forEach(function(validation) {
    it ('should reject a proxy config with error: ' + validation.expected_error, function() {
      var config_json = JSON.parse(fs.readFileSync('./test/config.d/' + validation.filename, {'encoding':'utf8'}));
      var proxy_config = new ProxyConfig(config_json);
      proxy_config.isInvalid().should.equal(validation.expected_error);
    });

  });
});

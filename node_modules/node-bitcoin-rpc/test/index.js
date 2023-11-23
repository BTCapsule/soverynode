'use strict'

/* global describe it */
var assert = require('assert')
var nock = require('nock')
var bitcoin_rpc = require('../lib/index.js')

var TEST_USER = process.env.TEST_USER || 'bitcoinrpc'
var TEST_PASS = process.env.TEST_PASS || 'moo'

function nock_bitcoind (method) {
  if (method === 'getnetworkinfo') {
    nock('http://localhost:8332')
    .post('/', {'method': 'getnetworkinfo', 'params': [], 'id': '1'})
    .replyWithFile(200, __dirname + '/nocks/getnetworkinfo.json')
  }
  if (method === 'getbalance1') {
    nock('http://localhost:8332')
    .post('/', {'method': 'getbalance', 'params': [], 'id': '1'})
    .replyWithFile(200, __dirname + '/nocks/getbalance1.json')
  }
  if (method === 'getbalance2') {
    nock('http://localhost:8332')
    .post('/', {'method': 'getbalance', 'params': ['p2pool', 6], 'id': '1'})
    .replyWithFile(200, __dirname + '/nocks/getbalance2.json')
  }
  if (method === '401') {
    nock('http://localhost:8332')
    .filteringRequestBody(/.*/, '*')
    .post('/', '*')
    .replyWithFile(401, __dirname + '/nocks/error.json')
  }
  if (method === 'error') {
    nock('http://localhost:8332')
    .filteringRequestBody(/.*/, '*')
    .post('/', '*')
    .replyWithFile(200, __dirname + '/nocks/error.json')
  }
  if (method === 'timeout') {
    nock('http://localhost:8332')
    .filteringRequestBody(function (body) {
      return '*'
    })
    .post('/', '*')
    .socketDelay(2000) // 2 seconds
    .reply(200, '<html></html>')
  }
}

describe('connecting to bitcoind', function () {
  it("can't connect - timeout", function (done) {
    nock_bitcoind('timeout')
    bitcoin_rpc.init('localhost', 8332, TEST_USER, TEST_PASS)
    bitcoin_rpc.call('getnetworkinfo', [], function (err, res) {
      if (err !== null) {
        assert.equal('Timed out', err)
        done()
      } else {
        assert.fail(res, '401', 'Should have failed')
        done()
      }
    })
  })

  it('can\'t connect - 401', function (done) {
    nock_bitcoind('401')
    bitcoin_rpc.init('localhost', 8332, TEST_USER, TEST_PASS)
    bitcoin_rpc.call('getnetworkinfo', [], function (err, res) {
      if (err !== null) {
        assert.equal('401', err)
        done()
      } else {
        assert.fail(res, '401', 'Should have failed')
        done()
      }
    })
  })

  it('invalid method', function (done) {
    nock_bitcoind('error')
    bitcoin_rpc.init('localhost', 8332, TEST_USER, TEST_PASS)
    bitcoin_rpc.call('error', [], function (err, res) {
      if (err) {
        assert.fail(res, '401', 'Should have failed')
        done()
      } else {
        assert.equal(res.error.message, 'Method not found')
        done()
      }
    })
  })

  it('can connect', function (done) {
    nock_bitcoind('getnetworkinfo')
    bitcoin_rpc.init('localhost', 8332, TEST_USER, TEST_PASS)
    bitcoin_rpc.call('getnetworkinfo', [], function (err, res) {
      if (err !== null) {
        assert.fail(err, '200', 'Should have passed')
        done()
      } else {
        assert.equal('110000', res.result.version)
        done()
      }
    })
  })

  it('getbalance as a raw call', function (done) {
    nock_bitcoind('getbalance1')
    bitcoin_rpc.init('localhost', 8332, TEST_USER, TEST_PASS)
    bitcoin_rpc.call('getbalance', [], function (err, res) {
      if (err !== null) {
        assert.fail(err, '200', 'Should have passed')
        done()
      } else {
        assert.equal('0.005', res.result)
        done()
      }
    })
  })

  it('getbalance as a raw call with params', function (done) {
    nock_bitcoind('getbalance2')
    bitcoin_rpc.init('localhost', 8332, TEST_USER, TEST_PASS)
    bitcoin_rpc.call('getbalance', ['p2pool', 6], function (err, res) {
      if (err !== null) {
        assert.fail(err, '200', 'Should have passed')
        done()
      } else {
        assert.equal('0.001', res.result)
        done()
      }
    })
  })
})

describe('changing settings', function () {
  it('can change timeout', function () {
    var oldTimeout = bitcoin_rpc.getTimeout()
    assert.equal(500, oldTimeout)
    bitcoin_rpc.setTimeout(1000)
    var newTimeout = bitcoin_rpc.getTimeout()
    assert.equal(1000, newTimeout)
  })
})

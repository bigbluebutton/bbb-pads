"use strict";

const http = require("http");
const Logger = require('./logger.js');

const logger = new Logger('http-server');

module.exports = class HttpServer {
  constructor(host, port, callback) {
    this.host = host;
    this.port = port;
    this.requestCallback = callback;
  }

  start () {
    this.server = http.createServer(this.requestCallback)
      .on('error', this.handleError.bind(this))
      .on('clientError', this.handleError.bind(this));
  }

  close (callback) {
    return this.server.close(callback);
  }

  handleError (error) {
    if (error.code === 'EADDRINUSE') {
      logger.error('EADDRINUSE', { host: this.host, port: this.port });
      this.server.close();
    } else if (error.code === 'ECONNRESET') {
      Logger.warn('ECONNRESET');
    } else {
      Logger.error('failure', { errorMessage: error.message, errorCode: error.code });
    }
  }

  getServerObject() {
    return this.server;
  }

  listen(callback) {
    this.server.listen(this.port, this.host, callback);
  }
}

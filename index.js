'use strict';

let Stream = require('stream');



/**
 * Aggregate records together into an array of max size or smaller when wait time is reached.
 *
 * @param time  flush when passed this amount of time in milliseconds (and buffer is not empty), defualt 1000
 * @param size  flush when buffered this amount of chunks, default 1000
 * @returns {*}
 * @constructor
 */
function BufferWithTimeOrSize(time, size) {
    let maxTime = time || 1000;
    let maxSize = size || 1000;
    let flushTimeout;
    let arrayBuffer = new Array(maxSize);
    let offset = 0;
    return new Stream.Transform({
        objectMode: true,
        transform: function(o, enc, callback) {
            if(!flushTimeout) {
                flushTimeout = setTimeout(() => {
                    flushTimeout = null;
                    this.push(arrayBuffer.slice(0, offset));
                    arrayBuffer = new Array(maxSize);
                    offset = 0;
                }, maxTime);
            }
            arrayBuffer[offset] = o;
            offset++;
            if(offset === maxSize) {
                if(flushTimeout) {
                    clearTimeout(flushTimeout);
                    flushTimeout = null;
                }
                this.push(arrayBuffer.slice(0, offset));
                arrayBuffer = new Array(maxSize);
                offset = 0;
            }
            callback();
        },
        flush: function(done) {
            if(flushTimeout) {
                clearTimeout(flushTimeout);
                flushTimeout = null;
            }
            this.push(arrayBuffer.slice(0, offset));
            arrayBuffer = new Array(maxSize);
            offset = 0;
            done();
        }
    });
}

module.exports.BufferWithTimeOrSize = BufferWithTimeOrSize;
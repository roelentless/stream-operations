'use strict'

let Stream = require('stream')
let assign = require('lodash.assign')
const readableExtenders = {}


/**
 * Aggregate events together into an array of max size or smaller when wait time is reached.
 *
 * @param time  flush when passed this amount of time in milliseconds (and buffer is not empty), defualt 1000
 * @param size  flush when buffered this amount of chunks, default 1000
 * @returns {*}
 * @constructor
 */
function bufferWithTimeOrSize(time, size, options) {
    let maxTime = time || 1000
    let maxSize = size || 1000
    let flushTimeout
    let arrayBuffer = new Array(maxSize)
    let offset = 0
    let conf = {
        objectMode: true,
        transform: function(o, enc, callback) {
            if(!flushTimeout) {
                flushTimeout = setTimeout(() => {
                    flushTimeout = null
                    this.push(arrayBuffer.slice(0, offset))
                    arrayBuffer = new Array(maxSize)
                    offset = 0
                }, maxTime)
            }
            arrayBuffer[offset] = o
            offset++
            if(offset === maxSize) {
                if(flushTimeout) {
                    clearTimeout(flushTimeout)
                    flushTimeout = null
                }
                this.push(arrayBuffer.slice(0, offset))
                arrayBuffer = new Array(maxSize)
                offset = 0
            }
            callback()
        },
        flush: function(done) {
            if(flushTimeout) {
                clearTimeout(flushTimeout)
                flushTimeout = null
            }
            this.push(arrayBuffer.slice(0, offset))
            arrayBuffer = new Array(maxSize)
            offset = 0
            done()
        }
    }
    if(options) {
        assign(conf, options)
    }
    return new Stream.Transform(conf)
}
module.exports.bufferWithTimeOrSize = bufferWithTimeOrSize
module.exports.BufferWithTimeOrSize = bufferWithTimeOrSize // Would be breaking

readableExtenders.bufferWithTimeOrSize = function(time, size, options) {
    return this.pipe(bufferWithTimeOrSize(time, size, options))
}

/**
 * Filter values for which the handler doesn't return a truthy value
 *
 * @param handler
 * @returns {*}
 */
function filter(handler, options) {
    let conf = {
        objectMode: true,
        transform: function(data, enc, done) {
            if(handler(data)) {
                this.push(data)
            }
            done()
        }
    }
    if(options) {
        assign(conf, options)
    }
    return new Stream.Transform(conf)
}
module.exports.filter = filter

readableExtenders.filter = function(handler, options) {
    return this.pipe(filter(handler, options))
}      

/**
 * Transform each value using the handler
 *
 * @param handler
 * @returns {*}
 */
function map(handler, options) {
    let conf = {
        objectMode: true,
        transform: function(data, enc, done) {
            this.push(handler(data))
            done()
        }
    }
    if(options) {
        assign(conf, options)
    }
    return new Stream.Transform(conf)
}
module.exports.map = map

readableExtenders.map = function(handler, options) {
    return this.pipe(map(handler, options))
}


/**
 * Apply a function to each value
 *
 * @param handler
 * @param options
 * @returns {*}
 */
function each(handler, options) {
    let conf = {
        objectMode: true,
        transform: function(data, enc, done) {
            handler(data)
            this.push(data)
            done()
        }
    }
    if(options) {
        assign(conf, options)
    }
    return new Stream.Transform(conf)
}
module.exports.each = each

readableExtenders.each = function(handler, options) {
    return this.pipe(each(handler, options))
}      

/**
 * Reduces stream to a value which is the accumulated result of running each element in stream thru iteratee, where each successive invocation is supplied the return value of the previous. If accumulator is not given, the first element of stream is used as the initial value. The iteratee is invoked with 2 arguments:
(accumulator, value).
 *
 * @param handler
 * @param initialValue
 * @returns {*}
 */
function reduce(handler, initialValue, options) {
    let nextValue = initialValue;
    let conf = {
        objectMode: true,
        transform: function(data, enc, done) {
            nextValue = handler(data, enc, nextValue)
            done()
        },
        flush: function(done) {
            this.push(nextValue)
            done()
        }
    }
    if(options) {
        assign(conf, options)
    }
    return new Stream.Transform(conf)
}
module.exports.reduce = reduce

readableExtenders.reduce = function(handler, initialValue, options) {
    return this.pipe(reduce(handler, initialValue, options))
}      

/**
 * Async transform each value using a handler with either callback(err, value) or promise that will resolve/reject.
 *
 * @param handler
 * @returns {*}
 */
function flatMap(handler, options) {
    let conf = {
        objectMode: true,
        transform: function(data, enc, done) {
            let promise = handler(data, enc, (err, res) => {
                // Callback handling
                if(err) {
                    this.destroy(err)
                } else {
                    this.push(data)
                }
                done()
            })
            if(promise && promise.then) {
                promise = promise
                .then(result => {
                    this.push(result)
                    done()
                }, err => {
                    this.destroy(err)
                    done()
                })
            }
        }
    }
    if(options) {
        assign(conf, options)
    }
    return new Stream.Transform(conf)
}
module.exports.flatMap = flatMap

readableExtenders.flatMap = function(handler, options) {
    return this.pipe(flatMap(handler, options))
}      

/**
 * Extend node streams with map, filter, flatMap and bufferWithTimeOrSize.
 */
function extendNodeStreams() {
    let keys = Object.keys(readableExtenders)
    for(let i = 0; i < keys.length; i++) {
        let key = keys[i]
        if(Stream.Readable.prototype[key] && Stream.Readable.prototype[key] !== readableExtenders[key]) {
            throw new Error('Cannot extend Stream.Readable with '+key)
        }
        if(!Stream.Readable.prototype[key]) {
            Stream.Readable.prototype[key] = readableExtenders[key]
        }
    }
}
module.exports.extend = extendNodeStreams

'use strict';

let Stream = require('stream');

let sop = require('./index');

let total = 0;
let source = new Stream.Readable({
    objectMode: true,
    read: function(size) {
        if(total > 1000) {
            return;
        }
        for(let i = 1; i <= size; i++) {
            let e = i;
            this.push({ req: e })
            total++;
        }
        if(total > 1000) {
            this.push(null);
        }
    }
});

let received1 = 0;
source
    .pipe(sop.BufferWithTimeOrSize(10))
    .pipe(new Stream.Writable({
        objectMode: true,
        write:function(arr, enc, callback) {
            // console.log(o);
            // console.log('Received '+arr.length);
            if(arr) {
                received1 += arr.filter(d => d).length;
            }
            callback();
        }
    }))
    .on('finish', () => {
        if(total !== received1) throw 'Time buffered not in sync';
    });


let received2 = 0;
source
    .pipe(sop.BufferWithTimeOrSize(10000, 10))
    .pipe(new Stream.Writable({
        objectMode: true,
        write:function(arr, enc, callback) {
            // console.log(o);
            // console.log('Received '+arr.length);
            if(arr) {
                received2 += arr.filter(d => d).length;
            }
            callback();
        }
    }))
    .on('finish', () => {
        if(total !== received2) throw 'Size buffered not in sync';
    });
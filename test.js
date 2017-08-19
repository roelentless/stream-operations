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
    .pipe(sop.bufferWithTimeOrSize(10))
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
    .pipe(sop.bufferWithTimeOrSize(10000, 10))
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


sop.extend()
sop.extend() // Test multiple extends
let mapped = 0;
let flatMapped1 = 0;
let flatMapped2 = 0;
let filtered = 0;
let eached = 0;
let reduced = 0;
let reduceResult = 0;
source
    .pipe(sop.map(d => {
        mapped++;
        return d
    }))
    .pipe(sop.flatMap((d, enc, done)=> {
        setTimeout(() => {
            flatMapped1++
            done(null, d)
        }, 1)
    }))
    .pipe(sop.flatMap(d => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                flatMapped2++
                resolve(d)
            }, 1)
        })
    }))
    .pipe(sop.filter(d => {
        filtered++;
        return d;
    }))
    .pipe(sop.each(d => {
        eached++;
    }))
    .pipe(sop.reduce((d, prev) => {
        reduced++;
        prev++;
    }, 0))
    .pipe(sop.each(d => {
        reduceResult++;
    }))
    .on('finish', () => {
        if(total != filtered || total != eached || total != reduced || total != mapped || total != flatMapped1 || total != flatMapped2 || reduceResult != 1) {
            throw 'Size extended not correct'
        }
    })

sop.extend()
sop.extend() // Test double    
let mapped2 = 0;
let flatMapped21 = 0;
let flatMapped22 = 0;
let filtered2 = 0;
let eached2 = 0;
let reduced2 = 0;
let reduceResult2 = 0;
source
    .map(d => {
        mapped2++;
        return d
    })
    .flatMap((d, enc, done)=> {
        setTimeout(() => {
            flatMapped21++
            done(null, d)
        }, 1)
    })
    .flatMap(d => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                flatMapped22++
                resolve(d)
            }, 1)
        })
    })
    .filter(d => {
        filtered2++;
        return d;
    })
    .each(d => {
        eached2++;
    })
    .reduce((d, prev) => {
        reduced2++;
        prev++;
    }, 0)
    .each(d => {
        reduceResult2++;
    })
    .on('finish', () => {
        if(total != filtered2 || total != eached2 || total != reduced2 || total != mapped2 || total != flatMapped21 || total != flatMapped22 || reduceResult != 1) {
            throw 'Size extended not correct'
        }
    })


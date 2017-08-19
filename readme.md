stream-operations
=================

Collection of stream operations


Install
-------
```
npm install stream-operations --save
```

Usage
-----
```
var sop = require('stream-operations');
```

Operations
----------

### bufferWithTimeOrSize(time, size, options)
Buffer elements in an array and flush when either time or size limit is reached.   
Default flush after 1000ms or size 1000.

```
aReadable
.pipe(sop.bufferWithTimeOrSize(100, 100))  // Flush buffer after 100 milliseconds or when 100 objects are collected
...
```

### map(mapFunction, options)
Transform an object by calling the handler for every object

```
aReadable
.pipe(sop.map(d => d.id)) 
...
```

### filter(filterFunction, options)
Transform an object by calling the handler for every object

```
aReadable
.pipe(sop.filter(d => true)) 
...
```

### flatMap(mapFunction, options)
Transform an object by calling the handler for every object, which can be asynchronically. Either use the callback, or return a promise.

```
aReadable
.pipe(sop.flatMap((data, enc, done) => {
  done(null, data)
})) 
.pipe(sop.flatMap(data => {
  return new Promise((resolve, reject) => {
    resolve(data) // or reject
  })
}))
... 
```

### reduce(reduceFunction, initialValue, options)
Reduce a stream to a single value, which is sent through the stream when the previous link finishes.

```
aReadable
.pipe(sop.reduce((data, enc, previousValue) => previousValue++), 0) 
...
```

### each(eachFunction, options)
Do something for every object

```
aReadable
.pipe(sop.each(d => console.log(d))) 
...
```

Options
-------
Options can be anything provided by the Stream.Transform interface, by default: 
```
{ 
  objectMode: true
}
```

Extending
---------
When calling `sop.extend()` once in your code, node streams are extended with most of the stream operations.

**Use this with caution!**

While this is handy for speeding up your development and creates code with less clutter, don't use this in modules, since you are modifying the prototypes of streams.

```
readable
  .map(d => d)
  .filter(d => d)
  .pipe(Stream.Transform)
  .flatMap((d, enc, done) => { ... })
  .reduce(...)
  .each(...)
  .on('error', err => { ... })
```
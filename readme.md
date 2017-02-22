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
var StreamOperations = require('stream-operations');
```

Operations
----------

### BufferWithTimeOrSize(time, size)

Buffer elements in an array and flush when either time or size limit is reached.   
Default flush after 1000ms or size 1000.

```
aReadable
.pipe(StreamOperations.BufferWithTimeOrSize(100, 100))  // Flush buffer after 100 milliseconds or when 100 objects are collected
.pipe(aWritable)
```
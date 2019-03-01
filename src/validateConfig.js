const revalidator = require('revalidator');

module.exports = (Config) => {
    return revalidator.validate(Config, {
        properties: {
            accessKey: {
                type: 'string',
                required: true
            },
            secretKey: {
                type: 'string',
                required: true
            },
            bucket: {
                type: 'string',
                required: true,
                minLength: 4,
                maxLength: 63
            },
            bucketDomain: {
                type: 'string',
                required: true,
                message: 'is not a valid url',
                conform (v) {
                  let urlReg = /[-a-zA-Z0-9@:%_\+.~#?&//=]{1,256}\.[a-z]{1,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
                  if (urlReg.test(v)) {
                    return true;
                  }
                  return false;
                }
            },
            root: {
                type: 'string'
            },
            exclude: {
                type: 'any',
                message: 'is not a function',
                conform (v) {
                    return typeof v === "function"
                }
            },
            batch: {
                type: 'integer'
            },
            mutilThread: {
                type: 'integer'
            },
            notFoundPage: {
                type: 'string'
            },
            refresh: {
                type: 'boolean'
            },
            refreshIndexThrottle: {
                type: 'integer'
            },
            prefetch: {
                type: 'boolean'
            },
            prefetchSortMax: {
                type: 'boolean'
            }
        }
    });
}
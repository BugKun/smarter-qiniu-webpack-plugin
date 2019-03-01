module.exports = {
    accessKey: '',
    secretKey: '',
    bucket: '',
    bucketDomain: '',
    root: './example/static/',
    exclude(path) {
        return /logo.*png/.test(path);
    },
    batch: 20,
    notFoundPage: 'index.html',
    refresh: false,
    refreshIndexThrottle: 100,
    prefetch: false,
    prefetchSortMax: false
}
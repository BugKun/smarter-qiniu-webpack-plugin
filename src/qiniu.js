const qiniu = require("qiniu"),
    _ = require('lodash/array'),
    promiseMap = require('promise.map');


module.exports = class QiNiu {
    constructor(options) {
        this.options = options;

        const {
            accessKey,
            secretKey,
            bucket
        } = options;

        qiniu.conf.ACCESS_KEY = accessKey;
        qiniu.conf.SECRET_KEY = secretKey;

        this.MAC = new qiniu.auth.digest.Mac(accessKey, secretKey);
        this.config = new qiniu.conf.Config();
        this.bucketManager = new qiniu.rs.BucketManager(this.MAC, this.config);
        this.cdnManager = new qiniu.cdn.CdnManager(this.MAC);
        this.formUploader = new qiniu.form_up.FormUploader(this.config);
        this.putPolicy = new qiniu.rs.PutPolicy({
            scope: bucket
        });
        this.uploadToken = this.putPolicy.uploadToken(this.MAC);
    }

    getFileList() {
        const {
            bucket
        } = this.options;
        return new Promise((resolve, reject) => 
            this.bucketManager.listPrefix(bucket, null, (err, respBody, respInfo) => {
                if (err) reject(err);

                if (respInfo && respInfo.statusCode == 200) {
                    resolve(respBody.items);
                } else {
                    reject({
                        info: respInfo,
                        body: respBody
                    });
                }
            })
        )
    }

    refresh(urlsToRefresh) {
        return Promise.all(
            _.chunk(urlsToRefresh, 100)
            .map(urlChunk => 
                    new Promise((resolve, reject) => 
                        this.cdnManager.refreshUrls(urlChunk, (err, respBody, respInfo) => {
                            if (err) reject(err);
                            if (respInfo && respInfo.statusCode == 200) {
                                const jsonBody = JSON.parse(respBody);
                                resolve(jsonBody);
                            } else {
                                reject({
                                    info: respInfo,
                                    body: respBody
                                });
                            }
                        })
                )
            )
        )
    }

    refreshIndex(dirsToRefresh) {
        return Promise.all(
            _.chunk(dirsToRefresh, 10)
            .map(dirsChunk => 
                    new Promise((resolve, reject) => 
                        this.cdnManager.refreshDirs(dirsChunk, (err, respBody, respInfo) => {
                            if (err) reject(err);
                            if (respInfo && respInfo.statusCode == 200) {
                                const jsonBody = JSON.parse(respBody);
                                resolve(jsonBody);
                            } else {
                                reject({
                                    info: respInfo,
                                    body: respBody
                                });
                            }
                        })
                )
            )
        )
    }

    prefetch(urlsToPrefetch) {
        return Promise.all(
            _.chunk(urlsToPrefetch, 100)
            .map(urlChunk => 
                    new Promise((resolve, reject) => 
                        this.cdnManager.prefetchUrls(urlChunk, (err, respBody, respInfo) => {
                            if (err) reject(err);
                            if (respInfo && respInfo.statusCode == 200) {
                                const jsonBody = JSON.parse(respBody);
                                resolve(jsonBody);
                            } else {
                                reject({
                                    info: respInfo,
                                    body: respBody
                                });
                            }
                        })
                )
            )
        )
    }

    upload(filePaths) {
        const {batch} = this.options;
        return promiseMap(
            filePaths,
            ({key, path}) =>
                new Promise((resolve, reject) => {
                    const putExtra = new qiniu.form_up.PutExtra();
                    this.formUploader.putFile(this.uploadToken, key, path, putExtra, (respErr, respBody, respInfo) => {
                        if (respErr) {
                            reject(respErr);
                        }

                        if (respInfo && respInfo.statusCode == 200) {
                            resolve(respBody);
                        } else {
                            const result = {
                                info: respInfo,
                                body: respBody,
                                source: {key, path}
                            };
                            
                            if(respInfo && respInfo.statusCode == 614) {
                                result.code = respInfo.statusCode;
                                resolve(result);
                            }else {
                                reject(result);
                            }
                        }
                    })
                }),
            batch
        )
    }

    remove(filepaths) {
        const {
            bucket
        } = this.options;

        return Promise.all(
            _.chunk(filepaths, 1000)
                .map(chunk => 
                    new Promise((resolve, reject) => 
                        this.bucketManager.batch(
                            chunk.map(item => qiniu.rs.deleteOp(bucket, item)), 
                            (err, respBody, respInfo) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    if (respInfo && respInfo.statusCode == 200) {
                                        resolve(respBody);
                                    } else {
                                        reject({
                                            info: respInfo,
                                            body: respBody
                                        });
                                    }
                                }
                            }
                        )
                    )
                )
        )
    }

}

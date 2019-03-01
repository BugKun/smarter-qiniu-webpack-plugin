# smarter-qiniu-webpack-plugin
Webpack 编译结束后,智能的把文件同步到 七牛云存储

## 功能

- 支持并发上传
- 智能分析，增量上传，不重复上传

## 安装

```Bash
npm install --save-dev smarter-qiniu-webpack-plugin
```


## 使用

**webpack.config.js**

```Javascript
const SmarterQiniuWebpackPlugin = require('smarter-qiniu-webpack-plugin');

module.exports = {
  // ... Webpack 相关配置
  plugins: [
    new SmarterQiniuWebpackPlugin()
  ]
}
```

在项目目录下新建 `qiniu_config.js` 文件，并且在 `.gitignore` 忽略此文件

**.qiniu_config.js**

```Javascript
module.exports = {
  accessKey: 'qiniu access key', // required
  secretKey: 'qiniu secret key', // required
  bucket: 'demo', // required
  bucketDomain: 'https://domain.bkt.clouddn.com', // required
  exclude(path) {
    return /logo.*png/.test(path)
  },
  batch: 10,
  mutilThread: 8,
  root: '/static',
  notFoundPage: 'index.html',
  refresh: true,
  refreshIndexThrottle: 100,
  prefetch: true,
  prefetchSortMax: true
}
```

**Options**

|Name|Type|Default|Required|Description|
|:--:|:--:|:-----:|:-----:|:----------|
|**[`accessKey`](#)**|`{String}`| | true |七牛 Access Key|
|**[`secretKey`](#)**|`{String}`| | true |七牛 Secret Key|
|**[`bucket`](#)**|`{String}`| | true |七牛 空间名|
|**[`bucketDomain`](#)**|`{String}`| | true |七牛 空间域名|
|**[`exclude`](#)**|`{Function}`| | false |排除文件/文件夹|
|**[`batch`](#)**|`{Number}`| 10 | false |同时上传文件数|
|**[`mutilThread`](#)**|`{Number}`| cpus.length - 1 | false |计算文件差异的线程并发数|
|**[`root`](#)**|`{String}`| webpack.output | false |根目录的位置|
|**[`notFoundPage`](#)**|`{String}`| | false |当空间404时使用的文件|
|**[`refresh`](#)**|`{Boolean}`| true | false |是否刷新新替换的文件|
|**[`refreshIndexThrottle`](#)**|`{Number}`| 100 | false |当刷新文件的数量大于这个值时，直接更新目录|
|**[`prefetch`](#)**|`{Boolean}`| false | false |是否预取新的文件|
|**[`prefetchSortMax`](#)**|`{String}`| true | false |是否优先预取大文件|

***

## 注意
由于七牛云储存的问题，可能会出现上传未被修改的文件，原因是七牛云返回的qetag值并非是最新的。
解决办法是确认刷新缓存后,用浏览器或其他工具禁用缓存的情况下访问，若能访问到最新的文件内容，那么其qetag值也就能被更新了。
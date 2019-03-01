const fileList = require('./Utils/filesList'),
    QiNiu = require('./qiniu'),
    qetag = require('node-qetag'),
    path = require('path'),
    fs = require('fs'),
    chalk = require('chalk'),
    ora = require('ora'),
    validateConfig = require('./validateConfig'),
    CONFIG_FILENAME = '.qiniu_config.js',
    NOT_FIND_PAGE_NAME = 'errno-404';

let Config = {
    batch: 10,
    refresh: true,
    refreshIndexThrottle: 100,
    prefetchSortMax: true
};
try {
    Config = Object.assign(
        Config,
        require(
            path.resolve(CONFIG_FILENAME)
        )
    );
} catch(e) {
    console.log(chalk.bold.red('Config not found'), e);
}

const validate = validateConfig(Config);

if (!validate.valid) {
    const { errors } = validate; 
    console.log(chalk.bold.red('[QiniuWebpackPlugin] Config validate failure:'));
    for(let i = 0, len = errors.length; i < len; i++) {
      const error = errors[i];
      console.log('\n    > ', error.property, error.message);
    }
    console.log('\n');
    process.exit();
}


const qiniu = new QiNiu(Config),
    {
        root,
        exclude,
        notFoundPage,
        bucketDomain,
        refresh,
        refreshIndexThrottle,
        prefetch,
        prefetchSortMax,
        mutilThread
    } = Config;


class QiniuDeployPlugin {
    constructor() {
        this.couldFiles = [];
        this.cloudTask = null;
        this.localFiles = [];
    }

    apply(compiler) {
        compiler.hooks.entryOption.tap('QiniuDeployPlugin', () => {
            this.cloudTask = [
                qiniu.getFileList()
            ];
        });

        compiler.hooks.afterPlugins.tap('QiniuDeployPlugin', (compiler) => {
            if(!root) Config.root = compiler.options.output.path;
        });

     
        compiler.hooks.done.tap('QiniuDeployPlugin', async () => {
            let fileListSpinner = ora('正在检索文件目录').start();
            try {
                var [cloudFilesInfo] = await Promise.all(this.cloudTask);
                var localFilesPath = await fileList(root, exclude);
                if(localFilesPath < 1) return;
                var localFilesHash = await qetag(localFilesPath, mutilThread);
            }catch(e) {
                fileListSpinner.fail('检索文件目录过程中出现了错误：');
                fileListSpinner = null;
                console.log(chalk.bold.red(e));
                return;
            }
            if(fileListSpinner) fileListSpinner.succeed('检索文件目录成功！');

            this.cloudTask = null;
            let dictionary = {};
            
            for (let i = 0; i < cloudFilesInfo.length; i++) {
                const item = cloudFilesInfo[i];
                dictionary[item.key] = {
                    cloudIndex: i,
                    cloudHash: item.hash
                };
            }

            let localFilesList = [],
                notFoundPageInfo = null;

            for (let i = 0, len = localFilesPath.length; i < len; i++) {
                const item = path.relative(root, localFilesPath[i]).split(path.sep).join('/');

                if (path.resolve(root, notFoundPage) === path.resolve(root, localFilesPath[i])) {
                    if(dictionary[NOT_FIND_PAGE_NAME]) {
                        dictionary[NOT_FIND_PAGE_NAME].localIndex = len;
                        dictionary[NOT_FIND_PAGE_NAME].localHash = localFilesHash[i];
                    }else {
                        dictionary[NOT_FIND_PAGE_NAME] = {
                            localIndex: len,
                            localHash: localFilesHash[i]
                        };
                    }
                    notFoundPageInfo = {
                        key: NOT_FIND_PAGE_NAME,
                        path: localFilesPath[i],
                        url: `${bucketDomain}/${NOT_FIND_PAGE_NAME}`
                    };
                }
                if (dictionary[item]) {
                    dictionary[item].localIndex = i;
                    dictionary[item].localHash = localFilesHash[i];
                } else {
                    dictionary[item] = {
                        localIndex: i,
                        localHash: localFilesHash[i]
                    };
                }

                localFilesList[i] = {
                    key: item,
                    path: localFilesPath[i],
                    url: `${bucketDomain}/${item}`
                };
            }

            if (notFoundPageInfo) {
                localFilesList.push(notFoundPageInfo);
            }

            let uploadList = [],
                removeList = [],
                refreshList = [],
                prefetchList = [],
                prefetchSource = [],
                hasIndex = false,
                domainIndex = bucketDomain + '/',
                indexFileNames = ['index.html', 'index.htm'],
                indexFileName,
                indexPaths = indexFileNames.map(item => path.resolve(root, item));


            for (let key in dictionary) {
                const {
                    cloudIndex,
                    cloudHash,
                    localIndex,
                    localHash
                } = dictionary[key];
                if (localHash && cloudHash && localHash === cloudHash) continue;

                if (localIndex > -1) {
                    const indexPathsIndex = indexPaths.indexOf(path.resolve(localFilesList[localIndex].path));
                    if(indexPathsIndex > -1) {
                        hasIndex = true;
                        indexFileName = indexFileNames[indexPathsIndex];
                        refreshList.push(domainIndex);
                    }
                    let index = -1;
                    if (localHash !== cloudHash) {
                        index = localIndex;
                        if(cloudHash && localHash) {
                            refreshList.push(localFilesList[index].url);
                        }
                    }
                    if (cloudIndex === undefined) {
                        index = localIndex;
                    }
                    if (index > -1) {
                        uploadList.push({
                            key,
                            path: localFilesList[index].path
                        });
                        prefetchSource.push(localFilesList[index]);
                        prefetchList.push(localFilesList[index].url);
                    }
                }

                if (cloudIndex > -1 && localIndex === undefined) {
                    removeList.push(cloudFilesInfo[cloudIndex].key);
                }
            }

            if(prefetchSortMax) {
                prefetchList = prefetchSource
                    .sort((prev, next) => {
                        const prevStats = fs.statSync(prev.path);
                        const nextStats = fs.statSync(next.path);
                        return nextStats.size - prevStats.size;
                    })
                    .map(item => item.url)
            }

            if(hasIndex) {
                const index = prefetchList.indexOf(`${bucketDomain}/${indexFileName}`);
                if(index > -1) prefetchList.splice(index + 1, 0, domainIndex);
            }
            
            if (removeList.length > 0) {
                const removeFileSpinner = ora('正在移除废弃的文件').start();
                qiniu.remove(removeList)
                    .then(() => {
                        removeFileSpinner.succeed('成功移除废弃的文件！');
                        console.log(chalk.bold.green('已移除以下文件:'));
                        if(removeList.length > 0) console.log(`\n    > ${removeList.join('\n    > ')}\n`);
                    })
                    .catch(err =>{
                        removeFileSpinner.fail('移除废弃的文件过程中出现错误：');
                        console.log(err);
                    });
            }

            if(uploadList.length < 1) {
                console.log('没有文件需要上传');
                return;
            }
            let uploadSpinner = ora('正在上传文件').start(),
                uploadSucceed = [];
            try {
                const uploadResult = await qiniu.upload(uploadList);
                let hasFileExists = [], removeFileExists = [];
                for(let i = 0, len = uploadResult.length; i < len; i++) {
                    const item = uploadResult[i];
                    if(item.code == 614) {
                        const source = item.source;
                        hasFileExists.push(source);
                        removeFileExists.push(source.key);
                    }else {
                        uploadSucceed.push(item.key);
                    }
                }
                if(hasFileExists.length > 0) {
                    await qiniu.remove(removeFileExists);
                    const nextUploadResult = await qiniu.upload(hasFileExists);
                    for(let i = 0, len = nextUploadResult.length; i < len; i++) {
                        uploadSucceed.push(nextUploadResult[i].key);
                    }
                }
            } catch (e) {
                uploadSpinner.fail('文件上传过程中出现错误：');
                uploadSpinner = null;
                console.log(chalk.bold.red(e));
            }
            if(uploadSpinner) uploadSpinner.succeed('文件上传成功！');
            console.log(chalk.bold.green('已上传以下文件:'));
            if(uploadSucceed.length > 0) console.log(`\n    > ${uploadSucceed.join('\n    > ')}\n`);
            let remainedInfo = ['还剩余'], isPrintInfo = false;
            if(refresh && refreshList.length > 0) {
                isPrintInfo = true;
                let refreshSpinner = ora('正在刷新新上传的文件').start();
                try {
                    if(refreshIndexThrottle && refreshList.length > refreshIndexThrottle) {
                        const result = (await qiniu.refreshIndex([bucketDomain + '/'])).pop();
                        remainedInfo.push(`刷新目录次数为${result.dirSurplusDay}次`);
                    } else {
                        const result = (await qiniu.refresh(refreshList)).pop();
                        remainedInfo.push(`刷新文件次数为${result.urlSurplusDay}次`);
                    }
                } catch (e) {
                    refreshSpinner.fail('刷新文件的过程中出现错误：');
                    refreshSpinner = null;
                    console.log(chalk.bold.red(e));
                }
                if(refreshSpinner) refreshSpinner.succeed('刷新文件成功！');
            }

            if(prefetch && prefetchList.length > 0) {
                isPrintInfo = true;
                let prefetchSpinner = ora('正在预取新上传的文件：').start();
                try {
                    const result = (await qiniu.prefetch(prefetchList)).pop();
                    remainedInfo.push(`预取文件的次数为${result.surplusDay}次`);
                } catch (e) {
                    prefetchSpinner.fail('预取文件的过程中出现错误：');
                    prefetchSpinner = null;
                    console.log(chalk.bold.red(e));
                }
                if(prefetchSpinner) prefetchSpinner.succeed('预取文件成功！');
            }

            if(isPrintInfo) console.log(chalk.bold.green(`${remainedInfo.join(',')}。`));
        });
    }
}

module.exports = QiniuDeployPlugin;

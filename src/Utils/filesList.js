const fs = require('fs');
const path = require('path');


function readdirPromisify(dir) {
    return new Promise((resolve, reject) =>
        fs.readdir(dir, (err, list) => {
            if (err) {
                reject(err);
            }
            resolve(list);
        })
    );
}

function statPromisify(dir) {
    return new Promise((resolve, reject) =>
        fs.stat(dir, (err, stats) => {
            if (err) {
                reject(err);
            }
            resolve(stats);
        })
    );
}

function listHandler({list, dir, exclude}) {
    const newList = [];

    for(let i = 0, len = list.length; i < len; i++){
        const item = list[i],
            resolveDir = path.resolve(dir, item);
        let nextDir;

        if(typeof exclude === "function") {
            if(!exclude(resolveDir)) {
                nextDir = resolveDir;
            }
        }else {
            nextDir = resolveDir;
        }

        if(nextDir) {
            newList.push(
                listDir(nextDir, exclude)
            )
        }
    }

    return newList;
}

function listDir(dir, exclude) {
    return statPromisify(dir)
        .then(stats => {
            if (stats.isDirectory()) {
                return readdirPromisify(dir)
                    .then(list =>
                        Promise.all(
                            listHandler({list, dir, exclude})
                        )
                    )
                    .then(subtree =>
                        [].concat(...subtree)
                    );
            } else {
                return [dir];
            }
        });
}

module.exports = function (root, exclude) {
    return listDir(root, exclude);
};

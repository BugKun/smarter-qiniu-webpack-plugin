import {observable, action, computed, runInAction} from 'mobx'
import API from "API"

class ServerStore {
    @observable serverActive = false;

    @action
    getServerState() {
        API.getServer()
            .then(res => {
                if(res.success) {
                    runInAction(() => this.serverActive = res.data.serverActive);
                }else {
                    runInAction(() => this.serverActive = false);
                }
            })
            .catch(err => {
                runInAction(() => this.serverActive = false);
                console.log(err);
            })
    }
}

export default new ServerStore();

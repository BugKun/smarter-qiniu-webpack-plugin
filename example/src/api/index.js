import axios from 'axios'
import server from "./server"
import Cookies from "js-cookie"
import Config from "Config"


// 实例化 ajax请求对象
const ajaxinstance = axios.create({
    baseURL: Config.baseURL,
    timeout: 10000,
    headers: {
        responseType: 'json',
        'Content-Type': 'application/json; charset=utf-8'
    }
})


// 添加拦截器，处理 公用请求参数，和通用请求头部
ajaxinstance
    .interceptors
    .request
    .use((config) => {
        // TODO
        let winduser = Cookies.get('winduser')
        if (winduser) {
            config['headers']['winduser'] = winduser
        }
        return config
    }, (error) => {
        Promise.reject(error)
    })



// 请求响应拦截器
ajaxinstance
    .interceptors
    .response
    .use((response) => {
        // TODO

        let { data } = response;

        if(!data.success){
            if(data.msg.text && data.msg.text !== "") {
                alert(data.msg.text)
            }

            if(data.msg.isLogin === false) {
                Cookies.remove('winduser');
                let curUrl = window.location.pathname + window.location.search;
                window.location.href = `/login?referer=${encodeURIComponent(curUrl)}`
            }
        }
        return data
    }, (error) => {
        return Promise.reject(error)
    })


/**
 * [API api接口封装]
 * @type {Object}
 */
const API = {
    ...server(ajaxinstance),
};

export default API

import React, {Component} from 'react';
import {Router} from 'react-router';
import {Route, Switch, Redirect} from 'react-router-dom';
import loadable from "./loadable";
import history from './history';


export default class App extends Component {
    constructor(props) {
        super(props);
        
        this.state = {

        }
    }

    render() {
        return (
            <Router history={history}>
                <Switch>
                    <Route exact path="/" component={loadable(() => import(/* webpackChunkName: "index" */ "../pages/"))}/>
                    <Route path="/server" component={loadable(() => import(/* webpackChunkName: "server" */ "../pages/server"))}/>
                    <Route component={() => (<h1>404</h1>)}/>
                </Switch>
            </Router>
        )
    }
}


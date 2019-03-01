import React, {Component} from 'react'
import PropTypes from "prop-types";
import {Link} from "react-router-dom";
import {inject, observer} from "mobx-react";
import "./index.scss"

@inject("ServerStore")
@observer
export default class Server extends Component {
    constructor(props){
        super(props);

        this.state = {

        }
    }

    static propTypes = {
        ServerStore: PropTypes.object.isRequired
    };


    render(){
        const {ServerStore} = this.props;

        return (
            <div className="server">
                <h4>router: /server</h4>
                <h4>server state: {(ServerStore.serverActive)? "online" : "offline"}</h4>
                <Link to="/">Go to /</Link>
            </div>
        )
    }
}




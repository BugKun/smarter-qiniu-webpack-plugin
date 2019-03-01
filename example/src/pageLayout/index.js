import React, { Component } from "react"
import PropTypes from "prop-types"
import {inject, observer} from "mobx-react";
import "./index.scss"
import logoIcon from "Assets/images/logo.png"

@inject("ServerStore")
@observer
export default class PageLayout extends Component {
    constructor(props){
        super(props);

        this.state = {

        }
    }

    static propTypes = {
        ServerStore: PropTypes.object.isRequired,
        children: PropTypes.node
    };

    componentDidMount() {
        const {ServerStore} = this.props;
        ServerStore.getServerState();
    }

    render() {

        return (
            <div className="page-layout">
                <img src={logoIcon}/>
                <h1>Hello world</h1>
                {
                    this.props.children
                }
            </div>
        )
    }
}


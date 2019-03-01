import React, {Component} from 'react'
import {Link} from 'react-router-dom';
import "./index.scss"


export default class Index extends Component {
    constructor(props) {
        super(props);

        this.state = {

        }
    }

    render() {

        return (
           <div className="index">
               <h4>router test: </h4>
               <Link to="/server">Go to /server</Link>
           </div>
        )
    }
}
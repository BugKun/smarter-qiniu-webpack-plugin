import "babel-polyfill";
import React from 'react'
import {render} from 'react-dom'
import {configure} from 'mobx'
import {Provider} from 'mobx-react'
import Router from './router'
import stores from './stores'
import PageLayout from "./pageLayout"

import "./global.scss"

configure({
    enforceActions: 'always'
});

render(
    <Provider {...stores}>
        <PageLayout>
            <Router/>
        </PageLayout>
    </Provider>,
    document.getElementById('app'),
    () => {
        window.removeEventListener("error", window.errorHandler);
    }
);

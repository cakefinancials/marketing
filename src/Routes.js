import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Company from './containers/Company';
import Home from './containers/Home';
import NotFound from './containers/NotFound';

const Routes = () => {
    return (
        <Switch>
            <Route path='/:company' exact component={Company} />
            <Route path='/' exact component={Home} />
            <Route component={NotFound} />
        </Switch>
    );
};

export default Routes;
import React from 'react';

import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import { Login } from './pages/Login';
import { Redirect } from './pages/Redirect';
import { Spotifix } from './pages/Spotifix';


function App() {
  return (
      <Router>
        <Switch>
          <Route path="/login">
            <Login />
          </Route>
          <Route path="/redirect">
            <Redirect />
          </Route>
          <Route path="/">
            <Spotifix />
          </Route>
        </Switch>
      </Router>
  );
}

export default App;

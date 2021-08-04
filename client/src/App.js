import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { routes } from './router';
import { ChakraProvider, theme, Grid, GridItem } from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import { SignInNav } from './components/navbars/SIgnInNav';

const App = () => {
  return (
    <Router>
      <ChakraProvider theme={theme}>
        <div>
          <Grid
            h="40px"
            templateRows="repeat(2, 1fr)"
            templateColumns="repeat(6, 1fr)"
            gap={2}
          >
            <GridItem rowSpan={1} colStart={0} colEnd={2}>
              <SignInNav></SignInNav>
            </GridItem>
            <GridItem rowSpan={1} colStart={7} colEnd={7}>
              <ColorModeSwitcher></ColorModeSwitcher>
            </GridItem>
          </Grid>
          <Grid
            h="100%"
            templateRows="1fr"
            templateColumns="1fr"
          ></Grid>
          <GridItem>
            <Switch>
              {routes.map((route, i) => (
                <RouteWithSubRoutes key={i} {...route} />
              ))}
            </Switch>
          </GridItem>
        </div>
      </ChakraProvider>
    </Router>
  );
};

const RouteWithSubRoutes = route => {
  return (
    <Route
      path={route.path}
      render={props => (
        // pass the sub-routes down to keep nesting
        <route.component {...props} routes={route.routes} />
      )}
    />
  );
};

export default App;

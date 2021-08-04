import { Home } from './components/home/Home';
import { Login } from "./components/signin/Login";
import { Register } from "./components/signin/Register";
import { Welcome } from './components/home/Welcome';

  export const routes = [
    {
        path: '/home',
        component: Home
    },
    {
        path: '/login',
        component: Login
    },
    {
        path: '/register',
        component: Register
    },
    {
      path: '/welcome',
      component: Welcome
    },
  ]
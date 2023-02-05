import React, { useCallback, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes as Switch,
  Route,
} from "react-router-dom";

import { LoadingPage } from "pages";
import { Layout, PrivateRoute } from "components";

const NotFoundPage = React.lazy(() => import("pages/NotFound"));
const LoginPage = React.lazy(() => import("pages/Login"));
const SignUpPage = React.lazy(() => import("pages/SignUp"));
const HomePage = React.lazy(() => import("pages/Home"));
const ProfilePage = React.lazy(() => import("pages/Profile"));
const ForgotPasswordPage = React.lazy(() => import("pages/ForgotPassword"));

const AUTHENTICATED_ROUTES = [
  {
    path: "/",
    component: <HomePage />,
  },
  {
    path: "/profile",
    component: <ProfilePage />,
  },
];

const Routes = () => {
  const generateAuthenticatedRoutes = useCallback(() => {
    return AUTHENTICATED_ROUTES.map((route) => (
      <Route key={route.path} path={route.path} element={<PrivateRoute />}>
        <Route path={route.path} element={route.component} />
      </Route>
    ));
  }, []);
  return (
    <Router>
      <Suspense fallback={<LoadingPage />}>
        <Switch>
          <Route path="*" element={<NotFoundPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/" element={<Layout />}>
            {generateAuthenticatedRoutes()}
          </Route>
        </Switch>
      </Suspense>
    </Router>
  );
};

export default Routes;

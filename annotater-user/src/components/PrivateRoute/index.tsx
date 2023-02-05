import React from "react";
import { Outlet, Navigate } from "react-router-dom";

import { isLoggedIn } from "utils/function";

const PrivateRoute = () => {
  const loggedIn = isLoggedIn();

  if (loggedIn) return <Outlet />;

  if (!loggedIn) {
    return <Navigate to="/login" />;
  }
  return <div></div>;
};

export default PrivateRoute;

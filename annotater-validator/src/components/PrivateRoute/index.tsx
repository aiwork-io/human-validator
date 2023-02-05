import React from "react";
import { useQuery } from "react-query";
import { Outlet, Navigate } from "react-router-dom";
import { signOut } from "@firebase/auth";

import { apis } from "utils/config";
import { isLoggedIn, logout } from "utils/function";
import { BUSINESS_ROLE } from "utils/constants";
import { auth } from "utils/firebase";
import { useShowError } from "utils/hooks";
import { getProfile } from "apis";

import { Loading } from "components";

const PrivateRoute = () => {
  const loggedIn = isLoggedIn();
  const showError = useShowError();

  const { data: profile, isLoading } = useQuery(apis.profile.key, getProfile, {
    enabled: loggedIn,
  });

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        logout();
      })
      .catch((error) => {
        const errorMessage = error.message;
        showError("Login Failed", errorMessage);
      });
  };

  if (isLoading) return <Loading />;

  if (!profile?.role || profile.role !== BUSINESS_ROLE) {
    handleLogout();
  }

  if (!loggedIn) {
    return <Navigate to="/login" />;
  }

  if (loggedIn) return <Outlet />;

  return <div></div>;
};

export default PrivateRoute;

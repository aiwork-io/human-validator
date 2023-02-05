import React from "react";
import {
  Box,
  MenuButton,
  Menu,
  MenuList,
  MenuItem,
  IconButton,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { signOut } from "@firebase/auth";

import { auth } from "utils/firebase";
import { logout } from "utils/function";
import { useShowError } from "utils/hooks";

const Header = () => {
  const navigate = useNavigate();
  const showError = useShowError();

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

  return (
    <Box textAlign="right">
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label="home"
          icon={<HamburgerIcon />}
          variant="outline"
          color="primary"
          rounded="full"
          colorScheme="secondary"
        />
        <MenuList>
          <MenuItem onClick={() => navigate("/profile")}>Profile</MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
};

export default Header;

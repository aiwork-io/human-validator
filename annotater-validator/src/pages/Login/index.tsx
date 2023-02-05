import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Box, Flex, Text, Button, HStack } from "@chakra-ui/react";
import { signInWithEmailAndPassword } from "firebase/auth";

import { useShowError, useShowSuccess } from "utils/hooks";
import { auth } from "utils/firebase";
import { isLoggedIn, setAuth } from "utils/function";

import { Input } from "components";

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const showError = useShowError();
  const showSuccess = useShowSuccess();
  const { control, formState, handleSubmit } = useForm<FormData>({
    mode: "onChange",
  });
  const { errors } = formState;

  const loggedIn = isLoggedIn();

  const handleLogin = async (values: FormData) => {
    setLoading(true);
    signInWithEmailAndPassword(auth, values.email, values.password)
      .then(async (userCredential) => {
        const emailVerified = userCredential.user.emailVerified;
        if (!emailVerified) {
          return showError("Login Failed", "your email have not been verify");
        }
        const token = await userCredential.user.getIdToken();
        if (token) {
          setAuth(token);
          showSuccess("Login successfully!");
          navigate("/");
        }
      })
      .catch((error) => {
        const errorMessage = error.message;
        showError("Login Failed", errorMessage);
      })
      .finally(() => setLoading(false));
  };

  if (loggedIn) return <Navigate to="/" />;

  return (
    <Flex
      flexDir="column"
      width={{ base: "100%", md: "70%", lg: "50%" }}
      height="100vh"
      justifyContent="center"
      alignItems="center"
      paddingBottom="5"
      margin="0 auto"
    >
      <Box w="100%" paddingX="2.5rem">
        <Text
          fontWeight={700}
          fontSize="4xl"
          textAlign="center"
          marginBottom="10"
        >
          Image Labeling Validator Tool
        </Text>
        <Box as="form" onSubmit={handleSubmit(handleLogin)}>
          <Controller
            render={({ field }) => (
              <Input
                label="Email address:"
                isDisabled={loading}
                {...field}
                errors={errors}
              />
            )}
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            }}
          />
          <Controller
            render={({ field }) => (
              <Input
                label="Password:"
                type="password"
                isDisabled={loading}
                {...field}
                errors={errors}
              />
            )}
            control={control}
            name="password"
            rules={{
              required: "Password is required",
            }}
          />
          <HStack justifyContent="center">
            <Button isDisabled={loading} variant="primary" type="submit">
              Login
            </Button>
          </HStack>
          <Box textAlign="center" paddingTop="5">
            <Text
              as={Link}
              to="/forgot-password"
              textDecor="underline"
              fontWeight="bold"
            >
              Forget Password
            </Text>
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default Login;

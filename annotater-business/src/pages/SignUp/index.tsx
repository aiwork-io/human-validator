import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { Box, HStack, Flex, Button } from "@chakra-ui/react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { useMutation } from "react-query";

import { isLoggedIn } from "utils/function";
import { auth } from "utils/firebase";
import { useShowError, useShowSuccess } from "utils/hooks";
import { updateRole, updateWalletAddress } from "apis";

import { Input } from "components";

type FormData = {
  email: string;
  password: string;
  confirm_password: string;
  wallet_address: string;
};

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const showError = useShowError();
  const showSuccess = useShowSuccess();
  const { control, formState, handleSubmit, watch } = useForm<FormData>({
    mode: "onChange",
  });
  const { errors } = formState;

  const loggedIn = isLoggedIn();

  const { mutateAsync: handleUpdateWallet } = useMutation(updateWalletAddress);
  const { mutateAsync: handleUpdateRole } = useMutation(updateRole);

  const handleSignUp = async (values: FormData) => {
    setLoading(true);
    createUserWithEmailAndPassword(auth, values.email, values.password)
      .then(async (userCredential) => {
        const token = await userCredential.user.getIdToken();
        const uid = userCredential.user.uid;
        await handleUpdateRole({ token, uid });
        await handleUpdateWallet({ token, wallet: values.wallet_address });
        await sendEmailVerification(userCredential.user);
        showSuccess(
          "Sign Up Successfully, please check email to verify your email address"
        );
        navigate("/login");
      })
      .catch((error) => {
        const errorMessage = error.message;
        showError("Sign Up Failed", errorMessage);
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
      <Box
        w="100%"
        paddingX="2.5rem"
        as="form"
        onSubmit={handleSubmit(handleSignUp)}
      >
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
            minLength: {
              value: 8,
              message: "Password must have at least 8 characters",
            },
          }}
        />
        <Controller
          render={({ field }) => (
            <Input
              label="Confirm Password:"
              type="password"
              isDisabled={loading}
              {...field}
              errors={errors}
            />
          )}
          control={control}
          name="confirm_password"
          rules={{
            required: "Confirm Password is required",
            validate: (val) => {
              if (watch("password") !== val)
                return "Your passwords do no match";
            },
          }}
        />
        <Controller
          render={({ field }) => (
            <Input
              label="Wallet address:"
              isDisabled={loading}
              {...field}
              errors={errors}
            />
          )}
          control={control}
          name="wallet_address"
          rules={{
            required: "Wallet address is required",
          }}
        />
        <HStack justifyContent="center">
          <Button isDisabled={loading} variant="primary" type="submit">
            Register
          </Button>
          <Button
            isDisabled={loading}
            variant="primary"
            onClick={() => navigate("/login")}
          >
            Cancel
          </Button>
        </HStack>
      </Box>
    </Flex>
  );
};

export default SignUp;

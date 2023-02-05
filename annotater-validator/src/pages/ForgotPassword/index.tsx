import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Box, Flex, Text, Button, HStack } from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { auth } from "utils/firebase";
import { useShowError, useShowSuccess } from "utils/hooks";

import { Input } from "components";

type FormData = {
  email: string;
};

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const showSuccess = useShowSuccess();
  const showError = useShowError();

  const { control, formState, handleSubmit } = useForm<FormData>({
    mode: "onChange",
  });
  const { errors } = formState;

  const handleReset = async (values: FormData) => {
    setLoading(true);
    sendPasswordResetEmail(auth, values.email)
      .then(() => {
        showSuccess("Please check your email...");
      })
      .catch((error) => {
        const errorMessage = error.message;
        showError("Reset Password Failed", errorMessage);
      })
      .finally(() => setLoading(false));
  };

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
          Reset Password
        </Text>
        <Box as="form" onSubmit={handleSubmit(handleReset)}>
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

          <HStack>
            <Button isDisabled={loading} variant="primary" type="submit">
              Reset
            </Button>
            <Button onClick={() => navigate(-1)}>Cancel</Button>
          </HStack>
        </Box>
      </Box>
    </Flex>
  );
};

export default ForgotPassword;

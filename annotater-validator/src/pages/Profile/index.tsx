import React, { useState, useEffect } from "react";
import { Box, HStack, Button, Text } from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  onAuthStateChanged,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

import { logout } from "utils/function";
import { useShowError, useShowSuccess } from "utils/hooks";

import { Input } from "components";

type FormData = {
  email: string;
  password: string;
};

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const showSuccess = useShowSuccess();
  const showError = useShowError();

  const auth = getAuth();

  const { control, formState, handleSubmit, setValue } = useForm<FormData>({
    mode: "onChange",
  });
  const { errors } = formState;

  const handleSave = async (values: FormData) => {
    setLoading(true);
    const user = auth.currentUser;
    if (user) {
      const credential = EmailAuthProvider.credential(
        user.email || "",
        values.password
      );
      reauthenticateWithCredential(user, credential)
        .then(() => {
          updateEmail(user, values.email).then(() => {
            showSuccess("Updated email successfully!");
          });
        })
        .catch((error) => {
          const errorMessage = error.message;
          showError("Updated email", errorMessage);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setValue("email", user.email || "");
      } else {
        logout();
      }
    });
  }, [auth, setValue]);

  return (
    <Box w="100%" as="form" onSubmit={handleSubmit(handleSave)}>
      <Controller
        render={({ field }) => (
          <Input
            label="Email address:"
            isDisabled={true}
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
        <Text>Password: </Text>
        <Button
          isDisabled={loading}
          variant="primary"
          onClick={() => navigate("/forgot-password")}
        >
          Reset password
        </Button>
      </HStack>
      <HStack justifyContent="center" marginTop="4">
        <Button isDisabled={loading} variant="primary" type="submit">
          Save
        </Button>
        <Button isDisabled={loading} onClick={() => navigate("/")}>
          Back
        </Button>
      </HStack>
    </Box>
  );
};

export default Profile;

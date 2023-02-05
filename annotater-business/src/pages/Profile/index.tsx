import React, { useEffect } from "react";
import { Box, HStack, Button, Text } from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "react-query";

import { useShowError, useShowSuccess } from "utils/hooks";
import { apis } from "utils/config";
import { getGenericErrors } from "utils/error";
import { getProfile, updateWalletAddress } from "apis";

import { Input, Loading } from "components";

type FormData = {
  email: string;
  wallet_address: string;
};

const Profile = () => {
  const navigate = useNavigate();
  const showSuccess = useShowSuccess();
  const showError = useShowError();

  const { data: profile, isLoading } = useQuery(apis.profile.key, getProfile);

  const { mutate: handleUpdateWallet, isLoading: loading } =
    useMutation(updateWalletAddress);

  const { control, formState, handleSubmit, setValue } = useForm<FormData>({
    mode: "onChange",
  });
  const { errors } = formState;

  const handleSave = async (values: FormData) => {
    handleUpdateWallet(
      { wallet: values.wallet_address },
      {
        onSuccess: () => {
          showSuccess("Updated profile successfully!");
        },
        onError: (error: any) => {
          showError("Updated profile", getGenericErrors(error));
        },
      }
    );
  };

  useEffect(() => {
    if (profile) {
      setValue("email", profile.email);
      setValue("wallet_address", profile.wallet);
    }
  }, [profile, setValue]);

  if (isLoading) return <Loading />;

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

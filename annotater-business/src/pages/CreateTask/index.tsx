import React, { useMemo, useState } from "react";
import { VStack, HStack, Button, Text, Box, Center } from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "react-query";
import { chunk } from "lodash";
import { useNavigate } from "react-router-dom";

import { createTask, uploadImage, uploadImageToStore } from "apis";
import { useShowError, useShowSuccess } from "utils/hooks";
import { getGenericErrors } from "utils/error";

import { Input, InputFile } from "components";
import { delay } from "utils/function";

type FormData = {
  iterationMinimum: number;
  images: FileList;
  tags: FileList;
};

const CHUNK = 5;

const CreateTask = () => {
  const navigate = useNavigate();

  const showError = useShowError();
  const showSuccess = useShowSuccess();

  const [isUploading, setIsUploading] = useState(false);

  const { control, formState, handleSubmit, reset } = useForm<FormData>({
    mode: "onChange",
  });
  const { errors } = formState;

  const { mutate: handleCreateTask, isLoading: isCreatingTask } =
    useMutation(createTask);

  const isLoading = useMemo(
    () => isCreatingTask || isUploading,
    [isCreatingTask, isUploading]
  );

  const convertTxtToArray = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e?.target?.result;
        resolve(text?.toString().split(",") || []);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleSave = async (values: FormData) => {
    setIsUploading(true);
    const tags = await convertTxtToArray(values.tags[0]);
    handleCreateTask(
      {
        interationNumber: +values.iterationMinimum,
        tags: tags.filter((item) => item !== ""),
      },
      {
        onSuccess: async (data) => {
          const taskId = data.id;
          const imagesChunk = chunk(Array.from(values.images), CHUNK);
          Promise.all(
            imagesChunk.map(async (images: File[], index) => {
              await delay(index * 500).then(async () => {
                await Promise.all(
                  Array.from(images).map(async (image) => {
                    try {
                      const res = await uploadImage({
                        taskId,
                        filename: image.name,
                        contentType: image.type,
                      });
                      await uploadImageToStore({ file: image, url: res.url });
                    } catch (error: any) {
                      showError("Create Task", getGenericErrors(error));
                    }
                  })
                );
              });
            })
          ).then(() => {
            setIsUploading(true);
            delay(3000).then(() => {
              setIsUploading(false);
              reset();
              showSuccess("Created successfully!");
              navigate("/");
            });
          });
        },
        onError: (error: any) => {
          showError("Create Task", getGenericErrors(error));
        },
      }
    );
  };

  return (
    <VStack as="form" onSubmit={handleSubmit(handleSave)}>
      <Box w="full">
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <Box>
              <InputFile {...field} multiple errors={errors}>
                <Button variant="primary" w="full" isDisabled={isLoading}>
                  Select 1 or more images
                </Button>
              </InputFile>
              {field?.value?.length && (
                <Center>Images: {field.value.length}</Center>
              )}
            </Box>
          )}
          rules={{
            required: "This field is required",
          }}
        />
      </Box>
      <Box w="full">
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <Box>
              <InputFile accept=".csv" {...field} errors={errors}>
                <Button variant="primary" w="full" isDisabled={isLoading}>
                  Upload tags
                </Button>
              </InputFile>
              {field?.value?.length && (
                <Center>File: {field.value?.[0].name}</Center>
              )}
            </Box>
          )}
          rules={{
            required: "This field is required",
          }}
        />
      </Box>
      <Text fontWeight="bold">Minimum number of iterations</Text>
      <Box w="full">
        <Controller
          render={({ field }) => <Input {...field} errors={errors} />}
          control={control}
          name="iterationMinimum"
          rules={{
            pattern: {
              value: /^[0-9]+$/,
              message: "Please enter a number",
            },
            required: "This field is required",
          }}
        />
      </Box>
      <HStack w="full" justify="center">
        <Button
          type="submit"
          variant="primary"
          isDisabled={isLoading}
          isLoading={isLoading}
        >
          Submit
        </Button>
        <Button
          type="reset"
          variant="primary"
          isDisabled={isLoading}
          onClick={() => navigate("/")}
        >
          Back
        </Button>
      </HStack>
    </VStack>
  );
};

export default CreateTask;

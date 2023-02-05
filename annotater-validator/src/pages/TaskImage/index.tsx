import React, { useCallback, useMemo, useState } from "react";
import {
  Box,
  HStack,
  Grid,
  GridItem,
  Wrap,
  WrapItem,
  Button,
  Image,
  Text,
  VStack,
  Center,
  Link,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "react-query";
import { debounce, isEmpty } from "lodash";

import { apis } from "utils/config";
import {
  getNextTaskImage,
  getPrevTaskImage,
  getTaskImage,
  validateImage,
} from "apis";

import { getGenericErrors } from "utils/error";
import { useShowError, useShowSuccess } from "utils/hooks";

import { Input, Loading } from "components";

const TaskImage = () => {
  const { taskId, imageId } = useParams();
  const navigate = useNavigate();

  const [selectedTag, setSelectedTag] = useState("");
  const [search, setSearch] = useState("");

  const showError = useShowError();
  const showSuccess = useShowSuccess();

  const { data, isLoading } = useQuery(
    [
      apis.taskImage({ taskId: taskId as string, imageId: imageId as string })
        .key,
      taskId,
      imageId,
    ],
    () =>
      getTaskImage({ taskId: taskId as string, imageId: imageId as string }),
    {
      enabled: !!taskId && !!imageId,
    }
  );
  const { mutate: handlePrev, isLoading: isLoadingPrev } = useMutation(
    getPrevTaskImage,
    {
      onSuccess: (data) => {
        handleClear();
        navigate(`/task/${taskId}/image/${data.prev.id}`);
      },
      onError: (error: any) => {
        showSuccess(getGenericErrors(error));
      },
    }
  );
  const { mutate: handleNext, isLoading: isLoadingNext } = useMutation(
    getNextTaskImage,
    {
      onSuccess: (data) => {
        handleClear();
        navigate(`/task/${taskId}/image/${data.next.id}`);
      },
      onError: (error: any) => {
        showSuccess(getGenericErrors(error));
      },
    }
  );

  const { mutate: handleSubmit, isLoading: isValidating } = useMutation(
    validateImage,
    {
      onSuccess: () => {
        handleNext({ taskId: taskId as string, imageId: imageId as string });
      },
      onError: (error: any) => {
        showError("Submit Task Image", getGenericErrors(error));
      },
    }
  );

  const topAnswer = useMemo(
    () =>
      data?.answer_hash
        ? Object.keys(data?.answer_hash)
            .sort(function (a, b) {
              return data?.answer_hash[b] - data?.answer_hash[a];
            })
            .slice(0, 5)
        : [],
    [data?.answer_hash]
  );

  const filteredTags = useMemo(
    () =>
      data?.task.tags.filter((item) =>
        item.toLocaleLowerCase().includes(search)
      ),
    [data?.task.tags, search]
  );

  const handleSearch = useMemo(
    () =>
      debounce((val: React.ChangeEvent<HTMLInputElement>) => {
        const searchKey = val.target.value?.toLocaleLowerCase();
        setSearch(searchKey);
      }, 250),
    []
  );

  const isValidated = useMemo(
    () => !!data?.tag_validated_at,
    [data?.tag_validated_at]
  );

  const handleClear = useCallback(() => {
    setSelectedTag("");
    setSearch("");
  }, []);

  if (isLoading) return <Loading />;

  return (
    <VStack>
      <Link w="full" textAlign="right" href={`/task/${taskId}`}>
        <ChevronLeftIcon />
        Back to list
      </Link>
      <HStack flexDirection={{ base: "column", md: "row" }} pb="10" w="full">
        <Box w={{ base: "full", md: "50%" }}>
          <Image src={data?.image_url} alt={data?.id} minW="300px" />
        </Box>
        <VStack w={{ base: "full", md: "50%" }} p={4} spacing={4}>
          <Box border="1px" p={4} w="full">
            {isValidated ? (
              <Center>{data?.tag}</Center>
            ) : (
              <>
                <Text fontWeight="bold" color="primary" mb="4">
                  Please confirm which is the correct tag
                </Text>
                <Input placeholder="Search tag" onChange={handleSearch} />
                <Box maxH="300px" overflowY="auto" overflowX="hidden">
                  {isEmpty(filteredTags) ? (
                    <Center>No data</Center>
                  ) : (
                    <Wrap>
                      {filteredTags?.map((tag) => (
                        <WrapItem key={tag}>
                          <Button
                            w="full"
                            variant={
                              selectedTag === tag ? "primary" : "outline"
                            }
                            onClick={() => setSelectedTag(tag)}
                          >
                            {tag}
                          </Button>
                        </WrapItem>
                      ))}
                    </Wrap>
                  )}
                </Box>
              </>
            )}
          </Box>
          <Box border="1px" p={4} w="full">
            <Text fontSize="xl" fontWeight="bold" color="primary" mb="4">
              Top 5 user answers
            </Text>
            {isEmpty(topAnswer) ? (
              <Center>No data</Center>
            ) : (
              <Grid templateColumns="repeat(1, 1fr)" gap={5}>
                {topAnswer?.map((tag, index) => (
                  <GridItem key={tag}>
                    <HStack>
                      <Text color="primary" fontWeight="bold">
                        {index + 1}.
                      </Text>
                      <Text>{tag}</Text>
                    </HStack>
                  </GridItem>
                ))}
              </Grid>
            )}
          </Box>
        </VStack>
      </HStack>
      <HStack>
        <Button
          leftIcon={<ChevronLeftIcon />}
          onClick={() =>
            handlePrev({ taskId: taskId as string, imageId: imageId as string })
          }
          isDisabled={isLoadingPrev || isLoadingNext || isValidating}
        >
          Prev
        </Button>
        <Button
          variant="primary"
          onClick={() =>
            handleSubmit({
              taskId: taskId as string,
              imageId: imageId as string,
              data: {
                tag: selectedTag,
              },
            })
          }
          isDisabled={isValidated}
        >
          Submit
        </Button>
        <Button
          rightIcon={<ChevronRightIcon />}
          onClick={() =>
            handleNext({ taskId: taskId as string, imageId: imageId as string })
          }
          isDisabled={isLoadingPrev || isLoadingNext || isValidating}
        >
          Next
        </Button>
      </HStack>
    </VStack>
  );
};

export default TaskImage;

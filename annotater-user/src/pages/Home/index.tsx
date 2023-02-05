import React, { useCallback, useState } from "react";
import {
  VStack,
  HStack,
  Wrap,
  WrapItem,
  Image,
  Button,
  Center,
  Text,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import {
  answerTaskQuestion,
  getTaskQuestion,
  initTask,
  skipTaskQuestion,
} from "apis";
import { apis } from "utils/config";
import { useShowError } from "utils/hooks";
import { getGenericErrors } from "utils/error";
import { TaskBody } from "types/Task";

import { Loading } from "components";
import NoTaskImgage from "assets/no-task.jpg";

const Home = () => {
  const queryClient = useQueryClient();

  const showError = useShowError();

  const [selected, setSelected] = useState("");
  const { isSuccess, isLoading: isIniting } = useQuery(
    apis.initTask.key,
    initTask
  );

  const {
    data: task,
    isLoading,
    isRefetching,
    isError,
  } = useQuery(apis.getTaskQuestion.key, getTaskQuestion, {
    enabled: isSuccess,
    cacheTime: 0,
  });

  const { mutate: handleSkipQuestion, isLoading: isSkipping } =
    useMutation(skipTaskQuestion);
  const { mutate: handleAnswerQuestion, isLoading: isAnswering } =
    useMutation(answerTaskQuestion);

  const handleSelect = useCallback(
    (tag: string) => {
      if (selected === tag) return setSelected("");
      return setSelected(tag);
    },
    [selected]
  );

  const handleSubmit = (data: TaskBody) => {
    handleAnswerQuestion(
      { ...data, tag: selected },
      {
        onSuccess: () => {
          setSelected("");
          queryClient.invalidateQueries(apis.getTaskQuestion.key);
        },
        onError: (error: any) => {
          setSelected("");
          showError("Answer Question", getGenericErrors(error));
        },
      }
    );
  };

  const handleSkip = (data: TaskBody) => {
    handleSkipQuestion(data, {
      onSuccess: () => {
        queryClient.invalidateQueries(apis.getTaskQuestion.key);
      },
      onError: (error: any) => {
        showError("Skip Question", getGenericErrors(error));
      },
    });
  };

  if (isLoading || isIniting || isRefetching) return <Loading />;

  if (isError)
    return (
      <Center>
        <Image maxW="300px" src={NoTaskImgage} />
      </Center>
    );

  return (
    <VStack spacing={5}>
      <Image src={task?.image_url} alt={task?.image_url} width="300px" />
      <Text w="full" mt="10 !important" fontWeight="bold">
        Please select one tag that best describe the image above
      </Text>
      <Wrap w="full">
        {task?.tags?.map((tag) => (
          <WrapItem key={tag}>
            <Button
              w="full"
              onClick={() => handleSelect(tag)}
              variant={selected === tag ? "primary" : "outline"}
            >
              {tag}
            </Button>
          </WrapItem>
        ))}
      </Wrap>
      <HStack>
        <Button
          variant="primary"
          onClick={() =>
            handleSubmit({
              taskId: task?.utask.id,
              taskImageId: task?.task_image_id,
            })
          }
          disabled={selected === "" || isAnswering || isSkipping}
          isLoading={isAnswering}
        >
          Submit
        </Button>
        <Button variant="primary" onClick={() => setSelected("")}>
          Reset
        </Button>
        <Button
          variant="primary"
          onClick={() =>
            handleSkip({
              taskId: task?.utask.id,
              taskImageId: task?.task_image_id,
            })
          }
          disabled={isAnswering || isSkipping}
          isLoading={isSkipping}
        >
          Skip
        </Button>
      </HStack>
    </VStack>
  );
};

export default Home;

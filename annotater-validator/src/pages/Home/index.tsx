import React from "react";
import { VStack, HStack, Text, Box } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { isEmpty } from "lodash";

import { apis } from "utils/config";
import { useInfiniteData } from "utils/hooks";
import { getTasks } from "apis";
import { Task } from "types/Task";

import { Loading } from "components";

const LIMIT = 20;

const Home = () => {
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isEnd,
    ref,
    hideRefElement,
    cursor: cursorHistory,
  } = useInfiniteData([apis.task().key], () =>
    getTasks({
      _limit: LIMIT,
      _cursor: cursorHistory,
    })
  );

  if (isLoading && isEmpty(data)) return <Loading />;

  return (
    <VStack>
      {data?.map?.((task: Task, index: number) => (
        <Box
          key={task.id}
          border="1px"
          px="4"
          py="2"
          w="full"
          _hover={{
            bgColor: "primary",
            color: "white",
            transition: "all 0.3s",
          }}
          onClick={() => navigate(`/task/${task.id}`)}
        >
          <VStack>
            <HStack w="full" justify="space-between">
              <Text>Task {index + 1}</Text>
              <Text>
                {task.validated_count}/
                {Math.round(
                  task.iteration_total / task.iteration_minimum_required
                )}
              </Text>
            </HStack>
            <Text
              w="full"
              textAlign="right"
              fontSize="0.75rem"
              color="gray.400"
            >
              {format(task.unzip_at, "dd/MM/yyyy")}
            </Text>
          </VStack>
        </Box>
      ))}
      {!hideRefElement && !isEnd && !isEmpty(data) && (
        <div ref={ref}>
          <Loading />
        </div>
      )}
    </VStack>
  );
};

export default Home;

import React from "react";
import { VStack, HStack, Button, Text, Grid } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import FileSaver from "file-saver";
import { isEmpty } from "lodash";

import { apis } from "utils/config";
import { useInfiniteData, useShowError, useShowSuccess } from "utils/hooks";
import { getGenericErrors } from "utils/error";
import { Task } from "types/Task";
import { LIMIT } from "utils/constants";
import { downloadReport, getTasks } from "apis";

import { Loading } from "components";

const Home = () => {
  const navigate = useNavigate();
  const showSuccess = useShowSuccess();
  const showError = useShowError();
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

  const { mutate: handleDownloadReport } = useMutation(downloadReport, {
    onSuccess: (result) => {
      FileSaver.saveAs(
        new Blob([result.data], { type: result.headers["content-type"] }),
        "report"
      );
      showSuccess("Download Report Successfully!");
    },
    onError: (error: any) => {
      showError("Download Report", getGenericErrors(error));
    },
  });

  if (isLoading) return <Loading />;

  return (
    <VStack>
      <Grid gap={6}>
        <HStack spacing="10" marginBottom="10">
          <Text>List of labeling tasks:</Text>
          <Button variant="primary" onClick={() => navigate("/create-tasks")}>
            Submit Labeling Task
          </Button>
        </HStack>
        {data?.map?.((task: Task, index: number) => (
          <HStack spacing="10" key={task.id}>
            <Text>Task {index + 1}</Text>
            <Button
              variant="primary"
              onClick={() => handleDownloadReport(task.id)}
              disabled={task.iteration_remain !== 0}
            >
              Download Report
            </Button>
          </HStack>
        ))}
      </Grid>
      {!hideRefElement && !isEnd && !isEmpty(data) && (
        <div ref={ref}>
          <Loading />
        </div>
      )}
    </VStack>
  );
};

export default Home;

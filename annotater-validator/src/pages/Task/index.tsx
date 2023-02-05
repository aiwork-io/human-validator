import React from "react";
import { VStack, GridItem, Image, Link, Grid, Box } from "@chakra-ui/react";
import { ChevronLeftIcon, CheckIcon } from "@chakra-ui/icons";
import { useNavigate, useParams } from "react-router-dom";
import { isEmpty } from "lodash";

import { apis } from "utils/config";
import { useInfiniteData } from "utils/hooks";
import { getListTaskImages } from "apis";

import { Loading } from "components";
import { LIMIT } from "utils/constants";
import { TaskImage } from "types/TaskImage";

const Task = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    data,
    isLoading,
    isEnd,
    ref,
    hideRefElement,
    cursor: cursorHistory,
  } = useInfiniteData([apis.listTaskImage({ taskId: id as string }).key], () =>
    getListTaskImages({
      taskId: id as string,
      query: {
        _limit: LIMIT,
        _cursor: cursorHistory,
      },
    })
  );

  if (isLoading && isEmpty(data)) return <Loading />;

  return (
    <VStack spacing="1rem">
      <Link w="full" textAlign="right" href={`/`}>
        <ChevronLeftIcon />
        Main Menu
      </Link>
      <Grid
        templateColumns={{
          base: "repeat(1, 1fr)",
          md: "repeat(3, 1fr)",
        }}
        gap={5}
      >
        {data?.map((item: TaskImage) => (
          <GridItem
            key={item.id}
            border="1px"
            p="4"
            display="flex"
            justifyContent="center"
            alignItems="center"
            cursor="pointer"
            rounded="md"
            position="relative"
            _hover={{
              boxShadow: "2px 2px 10px #aaaaaa",
            }}
            onClick={() => navigate(`/task/${id}/image/${item.id}`)}
          >
            {item.tag_validated_at > 0 && (
              <Box
                position="absolute"
                top="-1rem"
                right="-1rem"
                bg="primary"
                rounded="full"
                w="32px"
                h="32px"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <CheckIcon color="white" boxSize={4} />
              </Box>
            )}
            <Box>
              <Image src={item.image_url} alt={item.id} />
            </Box>
          </GridItem>
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

export default Task;

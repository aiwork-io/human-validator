import React from "react";
import { Flex } from "@chakra-ui/layout";
import { Spinner } from "@chakra-ui/spinner";

const Loading = () => {
  return (
    <Flex h="100vh" justifyContent="center" alignItems="center">
      <Spinner />
    </Flex>
  );
};

export default Loading;

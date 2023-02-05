import React from 'react';
import { Center, Spinner } from '@chakra-ui/react';

const Loading = () => {
  return (
    <Center>
      <Spinner color="primary" />
    </Center>
  );
};

export default Loading;

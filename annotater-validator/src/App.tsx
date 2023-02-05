import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { CSSReset } from "@chakra-ui/css-reset";
import { QueryClient, QueryClientProvider } from "react-query";

import { setupAxiosInterceptors } from "utils/axiosConfig";

import Routes from "routes";

import { theme } from "./themes";

setupAxiosInterceptors();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <CSSReset />
        <Routes />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default App;

import { useToast } from "@chakra-ui/toast";

export const useShowError = () => {
  const toast = useToast();
  const showError = (title: string, error: string) => {
    toast({
      position: "top-right",
      title,
      description: error,
      status: "error",
      isClosable: true,
    });
  };
  return showError;
};

export const useShowSuccess = () => {
  const toast = useToast();
  const showSuccess = (title: string) => {
    toast({
      position: "top-right",
      title,
      status: "success",
      isClosable: true,
      containerStyle: {
        zIndex: 1000,
      },
    });
  };
  return showSuccess;
};

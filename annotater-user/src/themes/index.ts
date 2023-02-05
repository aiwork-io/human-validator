import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  styles: {
    global: {
      body: {
        fontFamily: `"PT Sans", sans-serif`,
        color: "#233642",
      },
    },
  },
  colors: {
    primary: "#495C83",
    secondary: "#A8A4CE",
    error: "#f04f00",
  },
  components: {
    Button: {
      baseStyle: {
        _focus: {
          boxShadow: "inherit",
        },
        _hover: {
          background: "#7A86B6 !important",
        },
        borderRadius: "0.75rem",
      },
      variants: {
        primary: {
          background: "#495C83",
          color: "#FAFAFA",
          border: "1px solid #495C83",
        },
      },
    },
    Input: {
      variants: {
        fillWhite: {
          field: {
            background: "white",
            border: "none",
            boxShadow: "0 2px 10px rgba(214, 92, 66, 0.25)",
            borderRadius: "20px",
          },
        },
      },
    },
  },
});

export { theme };

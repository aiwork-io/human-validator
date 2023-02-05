import React, { useRef, ReactElement } from "react";
import { Box, Text } from "@chakra-ui/react";

type InputFileProps = {
  children: ReactElement;
  accept?: string;
  type?: string;
  multiple?: boolean;
  name?: string;
  errors?: any;
  onChange: (files: FileList | null) => void;
};

const InputFile = ({
  children,
  type = "file",
  accept = "image/*",
  multiple = false,
  name,
  errors,
  onChange,
}: InputFileProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const error = name && errors?.[name]?.message;

  return (
    <Box>
      <input
        name={name}
        type={type}
        accept={accept}
        ref={inputRef}
        style={{ display: "none" }}
        multiple={multiple}
        onChange={(e) => onChange(e?.target?.files || null)}
      />
      <Box
        cursor="pointer"
        onClick={() => inputRef.current && inputRef.current.click()}
      >
        {children}
      </Box>
      {!!error && (
        <Text
          whiteSpace="pre-wrap"
          mt="0.5rem"
          fontSize="0.75rem"
          fontWeight="400"
          color="error"
        >
          {error}
        </Text>
      )}
    </Box>
  );
};

export default InputFile;

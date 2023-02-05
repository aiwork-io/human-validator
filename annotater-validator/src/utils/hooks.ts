import { useState, useEffect, useRef, MutableRefObject } from "react";
import { QueryFunction, useQuery, UseQueryOptions } from "react-query";
import { useToast } from "@chakra-ui/toast";
import { useInView } from "react-intersection-observer";

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

export const useInfiniteData = (
  queryKey: string[],
  queryFn: QueryFunction<any>,
  options?: UseQueryOptions
) => {
  const [cursor, setCursor] = useState<number>(0);
  const [isEnd, setEnd] = useState(false);
  const [hideRefElement, setHideRefElement] = useState(false);
  const [showDatas, setShowDatas] = useState<any>([]);

  const { data: dataRaw, isLoading } = useQuery<any>(
    [...queryKey, cursor],
    queryFn,
    options
  );

  const nextCursor = useRef<number>();

  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  useEffect(() => {
    setTimeout(() => {
      setHideRefElement(isLoading); // when loading, we will hide the ref element with some delay to make smoothy
    }, 600);
  }, [isLoading]);

  useEffect(() => {
    if (dataRaw?.data) {
      const list = dataRaw.data;
      if (cursor) {
        setShowDatas((old: any) => {
          return [...old, ...list];
        });
      } else {
        setShowDatas(list);
      }

      if (dataRaw?.cursor) {
        nextCursor.current = dataRaw.cursor;
        setEnd(false);
      } else {
        setEnd(true);
      }
    }
  }, [cursor, dataRaw]);

  // use ref to prevent infinite render if maybe
  useEffect(() => {
    if (inView) {
      setCursor(nextCursor.current || 0);
    }
  }, [inView]);

  return {
    data: showDatas,
    isLoading,
    isEnd,
    ref,
    hideRefElement,
    cursor,
    setCursor,
  };
};

export const useIntersectionObserver = ({
  target,
  onIntersect,
  threshold = 1.0,
  enabled = true,
  timeout = 0,
  rootMargin,
}: {
  target: MutableRefObject<HTMLDivElement | null>;
  onIntersect: () => void;
  threshold?: number;
  enabled?: boolean;
  timeout?: number;
  rootMargin?: string;
}) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // eslint-disable-next-line prefer-const
    let timeouts: any = {};
    const observer = new IntersectionObserver(
      (entries, ob) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            timeouts[entry.target.id] = setTimeout(() => {
              onIntersect();
            }, timeout);
          } else {
            clearTimeout(timeouts[entry.target.id]);
          }
        }),
      {
        threshold,
        rootMargin,
      }
    );

    const el = target && target.current;

    if (!el) {
      return;
    }

    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, target.current, threshold, timeout]);
};

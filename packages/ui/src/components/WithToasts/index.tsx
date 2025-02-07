"use client";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  FC,
  PropsWithChildren,
  Reducer,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";

import { CheckCircleIcon } from "../../icons/CheckCircleIcon.js";
import { ErrorIcon } from "../../icons/ErrorIcon.js";

type ToastShape = {
  text: string;
  type: "confirmation" | "error";
  id: string;
};

type State = {
  toasts: ToastShape[];
};

type Action =
  | {
      type: "ADD_TOAST";
      payload: ToastShape;
    }
  | {
      type: "REMOVE_TOAST";
      payload: string;
    };

const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload),
      };
    default:
      return state;
  }
};

const Toast: FC<{ toast: ToastShape }> = ({ toast }) => {
  const dispatch = useContext(Context);

  const remove = () => {
    dispatch({
      type: "REMOVE_TOAST",
      payload: toast.id,
    });
  };

  useEffect(() => {
    if (toast.type === "confirmation") {
      setTimeout(() => {
        remove();
      }, 5000);
    }
  }, [remove]);

  return (
    <motion.div
      layout="position"
      transition={{ duration: 0.15 }}
      className={clsx(
        "flex items-center gap-2",
        "cursor-pointer rounded-sm border border-gray-200 px-8 py-4 text-sm shadow-lg",
        toast.type === "error" && "bg-red-50 text-red-900",
        toast.type === "confirmation" && "bg-white text-slate-700"
      )}
      onClick={remove}
    >
      {toast.type === "error" && (
        <ErrorIcon size={16} className="text-red-400" />
      )}
      {toast.type === "confirmation" && (
        <CheckCircleIcon size={16} className="text-green-600" />
      )}
      <div>{toast.text}</div>
    </motion.div>
  );
};

const Context = createContext<(action: Action) => void>(() => undefined);

export const useToast = () => {
  const dispatch = useContext(Context);

  return useCallback(
    (text: string, type: ToastShape["type"]) => {
      dispatch({
        type: "ADD_TOAST",
        payload: {
          text,
          type,
          id: Math.random().toString(36).slice(2),
        },
      });
    },
    [dispatch]
  );
};

export const WithToasts: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { toasts: [] });
  return (
    <Context.Provider value={dispatch}>
      <div>{children}</div>
      {/* <motion.div layout className="fixed bottom-4 right-4 z-50 space-y-2"> */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {state.toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} />
          ))}
        </AnimatePresence>
      </div>
    </Context.Provider>
  );
};

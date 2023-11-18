import merge from "lodash/merge.js";
import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { SqValue, SqValuePath } from "@quri/squiggle-lang";

import { CalculatorState } from "../../widgets/CalculatorWidget/types.js";
import { CodeEditorHandle } from "../CodeEditor.js";
import {
  PartialPlaygroundSettings,
  PlaygroundSettings,
  defaultPlaygroundSettings,
} from "../PlaygroundSettings.js";
import {
  getChildrenValues,
  pathAsString,
  topLevelBindingsName,
} from "./utils.js";
import { useForceUpdate } from "../../lib/hooks/useForceUpdate.js";

type ItemHandle = {
  element: HTMLDivElement;
  forceUpdate: () => void;
};

type LocalItemState = {
  collapsed: boolean;
  calculator?: CalculatorState;
  settings: Pick<
    PartialPlaygroundSettings,
    "distributionChartSettings" | "functionChartSettings"
  >;
};

type LocalItemStateStore = {
  [k: string]: LocalItemState;
};

export type Action =
  | {
      type: "SET_LOCAL_ITEM_STATE";
      payload: {
        path: SqValuePath;
        value: LocalItemState;
      };
    }
  | {
      type: "FOCUS";
      payload: SqValuePath;
    }
  | {
      type: "UNFOCUS";
    }
  | {
      type: "TOGGLE_COLLAPSED";
      payload: SqValuePath;
    }
  | {
      type: "SET_COLLAPSED";
      payload: {
        path: SqValuePath;
        value: boolean;
      };
    }
  | {
      type: "COLLAPSE_CHILDREN";
      payload: SqValue;
    }
  | {
      type: "SCROLL_TO_PATH";
      payload: {
        path: SqValuePath;
      };
    }
  | {
      type: "FORCE_UPDATE";
      payload: {
        path: SqValuePath;
      };
    }
  | {
      type: "REGISTER_ITEM_HANDLE";
      payload: {
        path: SqValuePath;
        handle: ItemHandle;
      };
    }
  | {
      type: "UNREGISTER_ITEM_HANDLE";
      payload: {
        path: SqValuePath;
      };
    }
  | {
      type: "CALCULATOR_UPDATE";
      payload: {
        path: SqValuePath;
        calculator: CalculatorState;
      };
    };

export type ViewProviderDispatch = (action: Action) => void;

type ViewerContextShape = {
  // Note that we don't store localItemState themselves in the context (that would cause rerenders of the entire tree on each settings update).
  // Instead, we keep localItemState in local state and notify the global context via setLocalItemState to pass them down the component tree again if it got rebuilt from scratch.
  // See ./SquiggleViewer.tsx and ./ValueWithContextViewer.tsx for other implementation details on this.
  globalSettings: PlaygroundSettings;
  getLocalItemState({ path }: { path: SqValuePath }): LocalItemState;
  getCalculator({ path }: { path: SqValuePath }): CalculatorState | undefined;
  focused?: SqValuePath;
  editor?: CodeEditorHandle;
  dispatch(action: Action): void;
};

export const ViewerContext = createContext<ViewerContextShape>({
  globalSettings: defaultPlaygroundSettings,
  getLocalItemState: () => ({ collapsed: false, settings: {} }),
  getCalculator: () => undefined,
  focused: undefined,
  editor: undefined,
  dispatch() {},
});

export function useViewerContext() {
  return useContext(ViewerContext);
}

// `<ValueWithContextViewer>` calls this hook to register its handle in `<ViewerProvider>`.
// This allows us to do two things later:
// 1. Implement `SCROLL_TO_PATH` action.
// 2. Re-render individual item viewers on demand, for example on "Collapse Children" menu action.
export function useRegisterAsItemViewer(path: SqValuePath) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { dispatch } = useViewerContext();

  /**
   * Since `ViewerContext` doesn't store settings, this component won't rerender when `setSettings` is called.
   * So we use `forceUpdate` to force rerendering.
   * (This function is not used directly in this component. Instead, it's passed to `<ViewerProvider>` to be called when necessary, sometimes from other components.)
   */
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    dispatch({
      type: "REGISTER_ITEM_HANDLE",
      payload: { path, handle: { element, forceUpdate } },
    });

    return () => {
      dispatch({
        type: "UNREGISTER_ITEM_HANDLE",
        payload: { path },
      });
    };
  });

  return ref;
}

export function useSetLocalItemState() {
  const { dispatch } = useViewerContext();
  return (path: SqValuePath, value: LocalItemState) => {
    dispatch({
      type: "SET_LOCAL_ITEM_STATE",
      payload: { path, value },
    });
  };
}

export function useToggleCollapsed() {
  const { dispatch } = useViewerContext();
  return (path: SqValuePath) => {
    dispatch({
      type: "TOGGLE_COLLAPSED",
      payload: path,
    });
  };
}

export function useSetCollapsed() {
  const { dispatch } = useViewerContext();
  return (path: SqValuePath, isCollapsed: boolean) => {
    dispatch({
      type: "SET_COLLAPSED",
      payload: { path, value: isCollapsed },
    });
  };
}

export function useResetStateSettings() {
  const { dispatch, getLocalItemState } = useViewerContext();
  return (path: SqValuePath) => {
    const localState = getLocalItemState({ path });
    dispatch({
      type: "SET_LOCAL_ITEM_STATE",
      payload: {
        path,
        value: {
          ...localState,
          settings: {},
        },
      },
    });
  };
}

export function useHasLocalSettings(path: SqValuePath) {
  const { getLocalItemState } = useViewerContext();
  const localState = getLocalItemState({ path });
  return Boolean(
    localState.settings.distributionChartSettings ||
      localState.settings.functionChartSettings
  );
}

export function useFocus() {
  const { dispatch } = useViewerContext();
  return (path: SqValuePath) => {
    dispatch({
      type: "FOCUS",
      payload: path,
    });
  };
}

export function useUnfocus() {
  const { dispatch } = useViewerContext();
  return () => dispatch({ type: "UNFOCUS" });
}

export function useCollapseChildren() {
  const { dispatch } = useViewerContext();
  return useCallback(
    (value: SqValue) => {
      dispatch({
        type: "COLLAPSE_CHILDREN",
        payload: value,
      });
    },
    [dispatch]
  );
}

export function useIsFocused(path: SqValuePath) {
  const { focused } = useViewerContext();
  if (!focused) {
    return false;
  } else {
    return pathAsString(focused) === pathAsString(path);
  }
}

export function useMergedSettings(path: SqValuePath) {
  const { getLocalItemState, globalSettings } = useViewerContext();

  const localItemState = getLocalItemState({ path });

  const result: PlaygroundSettings = useMemo(
    () => merge({}, globalSettings, localItemState.settings),
    [globalSettings, localItemState.settings]
  );
  return result;
}

const defaultLocalItemState: LocalItemState = {
  collapsed: false,
  settings: {},
};

const collapsedVariablesDefault: LocalItemStateStore = {
  [topLevelBindingsName]: { collapsed: true, settings: {} },
};

export const ViewerProvider: FC<
  PropsWithChildren<{
    partialPlaygroundSettings: PartialPlaygroundSettings;
    editor?: CodeEditorHandle;
    beginWithVariablesCollapsed?: boolean;
  }>
> = ({
  partialPlaygroundSettings,
  editor,
  beginWithVariablesCollapsed,
  children,
}) => {
  // can't store settings in the state because we don't want to rerender the entire tree on every change
  const localItemStateStoreRef = useRef<LocalItemStateStore>(
    beginWithVariablesCollapsed ? collapsedVariablesDefault : {}
  );

  // TODO - merge this with localItemStateStoreRef?
  const itemHandlesStoreRef = useRef<{ [k: string]: ItemHandle }>({});

  const [focused, setFocused] = useState<SqValuePath | undefined>();

  const globalSettings = useMemo(() => {
    return merge({}, defaultPlaygroundSettings, partialPlaygroundSettings);
  }, [partialPlaygroundSettings]);

  const setLocalItemState = useCallback(
    (
      path: SqValuePath,
      fn: (localItemState: LocalItemState) => LocalItemState
    ): void => {
      const pathString = pathAsString(path);
      const newSettings = fn(
        localItemStateStoreRef.current[pathString] || defaultLocalItemState
      );
      localItemStateStoreRef.current[pathString] = newSettings;
    },
    []
  );

  const getLocalItemState = useCallback(({ path }: { path: SqValuePath }) => {
    return (
      localItemStateStoreRef.current[pathAsString(path)] ||
      defaultLocalItemState
    );
  }, []);

  const getCalculator = useCallback(({ path }: { path: SqValuePath }) => {
    const response = localItemStateStoreRef.current[pathAsString(path)];
    return response?.calculator;
  }, []);

  const setInitialCollapsed = useCallback(
    (path: SqValuePath, isCollapsed: boolean) => {
      setLocalItemState(path, (state) => ({
        ...state,
        collapsed: state?.collapsed ?? isCollapsed,
      }));
    },
    [setLocalItemState]
  );

  const forceUpdate = useCallback((path: SqValuePath) => {
    itemHandlesStoreRef.current[pathAsString(path)]?.forceUpdate();
  }, []);

  const dispatch = useCallback(
    (action: Action) => {
      switch (action.type) {
        case "SET_LOCAL_ITEM_STATE":
          setLocalItemState(action.payload.path, () => action.payload.value);
          forceUpdate(action.payload.path);
          return;
        case "FOCUS":
          setFocused(action.payload);
          return;
        case "UNFOCUS":
          setFocused(undefined);
          return;
        case "TOGGLE_COLLAPSED": {
          const path = action.payload;
          setLocalItemState(path, (state) => ({
            ...state,
            collapsed: !state?.collapsed,
          }));
          forceUpdate(path);
          return;
        }
        case "SET_COLLAPSED": {
          const { path } = action.payload;
          setLocalItemState(path, (state) => ({
            ...state,
            collapsed: action.payload.value,
          }));
          forceUpdate(path);
          return;
        }
        case "COLLAPSE_CHILDREN": {
          const children = getChildrenValues(action.payload);
          for (const child of children) {
            child.context && setInitialCollapsed(child.context.path, true);
          }
          return;
        }
        case "SCROLL_TO_PATH":
          itemHandlesStoreRef.current[
            pathAsString(action.payload.path)
          ]?.element.scrollIntoView({ behavior: "smooth" });
          return;
        case "FORCE_UPDATE":
          forceUpdate(action.payload.path);
          return;
        case "REGISTER_ITEM_HANDLE":
          itemHandlesStoreRef.current[pathAsString(action.payload.path)] =
            action.payload.handle;
          return;
        case "UNREGISTER_ITEM_HANDLE":
          delete itemHandlesStoreRef.current[pathAsString(action.payload.path)];
          return;
        case "CALCULATOR_UPDATE": {
          const { calculator, path } = action.payload;
          setLocalItemState(path, (state) => ({
            ...state,
            calculator:
              state.calculator?.hashString === calculator.hashString
                ? {
                    // merge with existing value
                    ...state.calculator,
                    ...calculator,
                  }
                : calculator,
          }));
          return;
        }
      }
    },
    [forceUpdate, setInitialCollapsed, setLocalItemState]
  );

  return (
    <ViewerContext.Provider
      value={{
        globalSettings,
        getLocalItemState,
        getCalculator,
        editor,
        focused,
        dispatch,
      }}
    >
      {children}
    </ViewerContext.Provider>
  );
};

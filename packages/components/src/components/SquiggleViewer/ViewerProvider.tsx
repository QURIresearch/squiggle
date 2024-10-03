import merge from "lodash/merge.js";
import {
  createContext,
  forwardRef,
  PropsWithChildren,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";

import { SqLocation, SqValue, SqValuePath } from "@quri/squiggle-lang";

import { useStabilizeObjectIdentity } from "../../lib/hooks/useStabilizeObject.js";
import { SqValueWithContext, valueHasContext } from "../../lib/utility.js";
import { CalculatorState } from "../../widgets/CalculatorWidget/types.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import {
  defaultPlaygroundSettings,
  PartialPlaygroundSettings,
  PlaygroundSettings,
} from "../PlaygroundSettings.js";
import { SqListViewNode } from "./SqViewNode.js";
import {
  getChildrenValues,
  shouldBeginCollapsed,
  traverseCalculatorEdge,
} from "./utils.js";
import { ValueWithContextViewerHandle } from "./ValueViewer/WithContext.js";

export type ViewerType = "normal" | "tooltip";

function findNode(
  root: SqValue | undefined,
  path: SqValuePath,
  itemStore: ItemStore
) {
  if (!root || !path) {
    return;
  }
  return SqListViewNode.make(
    root,
    path,
    traverseCalculatorEdge(itemStore),
    (path) => itemStore.getState(path).collapsed
  );
}

export type SquiggleViewerHandle = {
  focusByPath(path: SqValuePath): void;
};

type LocalItemState = Readonly<{
  collapsed: boolean;
  calculator?: CalculatorState;
  settings: Pick<
    PartialPlaygroundSettings,
    "distributionChartSettings" | "functionChartSettings"
  >;
}>;

const defaultLocalItemState: LocalItemState = {
  collapsed: false,
  settings: {},
};

type ValuePathUID = string;

/**
 * `ItemStore` is used for caching and for passing settings down the tree.
 * It allows us to avoid React tree rerenders on settings changes; instead, we can rerender individual item viewers on demand.
 * It also saves the state when the tree is rebuilt from scratch (for example, when the user changes the code in the editor).
 *
 * Note: this class is currently used as a primary source of truth. Should we use it as cache only, and store the state in React state instead?
 * Then we won't have to rely on `forceUpdate` for rerenders.
 */
export class ItemStore {
  state: Record<ValuePathUID, LocalItemState> = {};
  handles: Record<ValuePathUID, ValueWithContextViewerHandle> = {};

  setState(
    path: SqValuePath,
    fn: (localItemState: LocalItemState) => LocalItemState
  ): void {
    const newSettings = fn(this.state[path.uid()] || defaultLocalItemState);
    this.state[path.uid()] = newSettings;
  }

  getState(path: SqValuePath): LocalItemState {
    return this.state[path.uid()] || defaultLocalItemState;
  }

  getStateOrInitialize(value: SqValueWithContext): LocalItemState {
    const path = value.context.path;
    const pathString = path.uid();
    const existingState = this.state[path.uid()];
    if (existingState) {
      return existingState;
    }

    this.state[pathString] = defaultLocalItemState;

    const childrenValues = getChildrenValues(value);

    const collapseChildren = () => {
      for (const child of childrenValues) {
        if (!child.context) {
          continue; // shouldn't happen
        }
        const childPathString = child.context.path.uid();
        if (this.state[childPathString]) {
          continue; // shouldn't happen, if parent state is not initialized, child state won't be initialized either
        }
        if (child.tags.startOpenState() === "open") {
          continue;
        }
        this.state[childPathString] = {
          ...defaultLocalItemState,
          collapsed: true,
        };
      }
    };

    if (childrenValues.length > 10) {
      collapseChildren();
    }

    if (shouldBeginCollapsed(value, path)) {
      this.state[pathString] = {
        ...this.state[pathString],
        collapsed: true,
      };
    }

    return this.state[pathString];
  }

  getCalculator(path: SqValuePath): CalculatorState | undefined {
    return this.getState(path).calculator;
  }

  forceUpdate(path: SqValuePath) {
    this.handles[path.uid()]?.forceUpdate();
  }

  registerItemHandle(path: SqValuePath, handle: ValueWithContextViewerHandle) {
    this.handles[path.uid()] = handle;
  }

  unregisterItemHandle(path: SqValuePath) {
    delete this.handles[path.uid()];
  }

  updateCalculatorState(path: SqValuePath, calculator: CalculatorState) {
    this.setState(path, (state) => ({
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
  }

  scrollViewerToPath(path: SqValuePath) {
    this.handles[path.uid()]?.scrollIntoView();
  }

  focusByPath(path: SqValuePath) {
    const pathPrefixes = path.allPrefixPaths().withoutRoot().paths;
    pathPrefixes.pop(); // We allow the focusedPath to be collapsed, just not its parents.
    for (const prefix of pathPrefixes) {
      this.setState(prefix, (state) => ({
        ...state,
        collapsed: false,
      }));
      this.forceUpdate(prefix);
    }
    setTimeout(() => {
      this.handles[path.uid()]?.focusOnHeader();
    }, 0);
  }
}

type ViewerContextShape = {
  initialized: boolean;
  viewerType: ViewerType;
  // Note that `ItemStore` is not reactive (making it immutable and reactive would cause rerenders of the entire tree on each settings update).
  // See `ItemStore` and `./SquiggleViewer/index.tsx` and `ValueWithContextViewer.tsx` for more details on this.
  itemStore: ItemStore;
  rootValue?: SqValueWithContext;
  globalSettings: PlaygroundSettings;
  visibleRootPath?: SqValuePath;
  zoomedInPath: SqValuePath | undefined;
  setZoomedInPath: (value: SqValuePath | undefined) => void;
  externalViewerActions: ExternalViewerActions;
  handle: SquiggleViewerHandle;
  findNode: (path: SqValuePath) => SqListViewNode | undefined;
};

export const ViewerContext = createContext<ViewerContextShape>({
  initialized: false,
  viewerType: "normal",
  itemStore: new ItemStore(),
  rootValue: undefined,
  globalSettings: defaultPlaygroundSettings,
  visibleRootPath: undefined,
  zoomedInPath: undefined,
  setZoomedInPath: () => undefined,
  externalViewerActions: {},
  handle: {
    focusByPath: () => {},
  },
  findNode: () => undefined,
});

export function useViewerContext() {
  return useContext(ViewerContext);
}

// `<ValueWithContextViewer>` calls this hook to register its handle in `<ViewerProvider>`.
// This allows us to do two things later:
// 1. Implement `store.scrollViewerToPath`.
// 2. Re-render individual item viewers on demand, for example on "Collapse Children" menu action.
export function useRegisterAsItemViewer(
  path: SqValuePath,
  ref: ValueWithContextViewerHandle
) {
  const { itemStore } = useViewerContext();

  /**
   * Since `ViewerContext` doesn't store settings, this component won't rerender when `setSettings` is called.
   * So we use `forceUpdate` to force rerendering.
   * (This function is not used directly in this component. Instead, it's passed to `<ViewerProvider>` to be called when necessary, sometimes from other components.)
   */

  useEffect(() => {
    itemStore.registerItemHandle(path, ref);
    return () => itemStore.unregisterItemHandle(path);
  });
}

export function useSetLocalItemState() {
  const { itemStore } = useViewerContext();
  return (path: SqValuePath, value: LocalItemState) => {
    itemStore.setState(path, () => value);
    itemStore.forceUpdate(path);
  };
}

export function useRootValueSourceId() {
  const { rootValue } = useViewerContext();
  return rootValue?.context.runContext.module.name;
}

export function toggleCollapsed(itemStore: ItemStore, path: SqValuePath) {
  itemStore.setState(path, (state) => ({
    ...state,
    collapsed: !state?.collapsed,
  }));
  itemStore.forceUpdate(path);
}

export function useToggleCollapsed() {
  const { itemStore } = useViewerContext();
  return (path: SqValuePath) => {
    toggleCollapsed(itemStore, path);
  };
}

export function useSetCollapsed() {
  const { itemStore } = useViewerContext();
  return (
    path: SqValuePath,
    isCollapsed: boolean,
    options?: { skipUpdate: boolean }
  ) => {
    itemStore.setState(path, (state) => ({
      ...state,
      collapsed: isCollapsed,
    }));
    options?.skipUpdate || itemStore.forceUpdate(path);
  };
}

export function useResetStateSettings() {
  const { itemStore } = useViewerContext();
  return (path: SqValuePath) => {
    itemStore.setState(path, (state) => ({
      ...state,
      settings: {},
    }));
    itemStore.forceUpdate(path);
  };
}

export function useHasLocalSettings(path: SqValuePath) {
  const { itemStore } = useViewerContext();
  const localState = itemStore.getState(path);
  return Boolean(
    localState.settings.distributionChartSettings ||
      localState.settings.functionChartSettings
  );
}

export function useZoomIn() {
  const { zoomedInPath: zoomedInPath, setZoomedInPath: setZoomedInPath } =
    useViewerContext();
  return (path: SqValuePath) => {
    if (zoomedInPath?.isEqual(path)) {
      return; // nothing to do
    }
    if (path.isRoot()) {
      setZoomedInPath(undefined); // full screening on root nodes is not allowed
    } else {
      setZoomedInPath(path);
    }
  };
}

export function useZoomOut() {
  const { setZoomedInPath: setZoomedInPath } = useViewerContext();
  return () => setZoomedInPath(undefined);
}

export function useScrollToEditorPath(path: SqValuePath) {
  const { externalViewerActions, findNode } = useViewerContext();
  return () => {
    if (externalViewerActions.show) {
      const value = findNode(path)?.value();
      const taggedLocation = value?.tags.location();
      const location = taggedLocation || value?.context?.findLocation();

      if (location) {
        externalViewerActions.show?.(location, false);
      }
    }
  };
}

export function useIsZoomedIn(path: SqValuePath) {
  const { zoomedInPath: zoomedInPath } = useViewerContext();
  return zoomedInPath?.isEqual(path);
}

export function useMergedSettings(path: SqValuePath) {
  const { itemStore, globalSettings } = useViewerContext();

  const localItemState = itemStore.getState(path);

  const result: PlaygroundSettings = useMemo(
    () => merge({}, globalSettings, localItemState.settings),
    [globalSettings, localItemState.settings]
  );
  return result;
}

export function useViewerType() {
  const { viewerType } = useViewerContext();
  return viewerType;
}

// List of callbacks that should do something outside of the viewer.
// The common case is to scroll the editor to the necessary position in the playground.
export type ExternalViewerActions = Partial<{
  // TODO: this function is not imports-friendly yet.
  // E.g. in stacktraces, the user might want to click on an error location and
  // go to the source that's identified not just by an offset, but also its
  // sourceId.
  show: (location: SqLocation, focus: boolean) => void;
  // When the viewer can focus on the location, will it be able to do that?
  // This affects, for example, whether the links in stacktraces are clickable.
  isFocusable: (location: SqLocation) => boolean;
  // Should the viewer omit the source id because it's trivial?
  // E.g. in playground stacktraces we want to show source id only for imports, but not for the currently edited file.
  isDefaultSourceId: (sourceId: string) => boolean;
}>;

// Configure external actions for the common case of editor actions, e.g. for the playground or `<SquiggleEditor>` component.
export function useExternalViewerActionsForEditor(
  // Intentionally supports null and undefined - conditional hooks are not
  // possible and this hook is often used in components that take an optional
  // `editor` prop, or wire the editor components with a ref.
  editor: CodeEditorHandle | null | undefined
): ExternalViewerActions {
  return useMemo(() => {
    if (!editor) {
      return {};
    }
    const actions: ExternalViewerActions = {
      show: (location, focus) => {
        editor.scrollTo(location, focus);
      },
      isFocusable: (location) => {
        // only the edited source id is focusable
        return editor.getSourceId() === location.source;
      },
      isDefaultSourceId: (sourceId) => {
        // hide the sourceId in stacktraces if it's for the currently edited code
        return editor.getSourceId() === sourceId;
      },
    };
    return actions;
  }, [editor]);
}

type Props = PropsWithChildren<{
  partialPlaygroundSettings: PartialPlaygroundSettings;
  externalViewerActions?: ExternalViewerActions;
  viewerType?: ViewerType;
  rootValue: SqValue | undefined;
  visibleRootPath?: SqValuePath;
}>;

export const InnerViewerProvider = forwardRef<SquiggleViewerHandle, Props>(
  (
    {
      partialPlaygroundSettings: unstablePlaygroundSettings,
      externalViewerActions = {},
      viewerType = "normal",
      rootValue,
      visibleRootPath,
      children,
    },
    ref
  ) => {
    const [itemStore] = useState(() => new ItemStore());

    /**
     * Because we often obtain `partialPlaygroundSettings` with spread syntax, its identity changes on each render, which could
     * cause extra unnecessary re-renders of widgets, in some cases.
     * Related discussion: https://github.com/quantified-uncertainty/squiggle/pull/2525#discussion_r1393398447
     */
    const playgroundSettings = useStabilizeObjectIdentity(
      unstablePlaygroundSettings
    );

    const globalSettings = useMemo(() => {
      return merge({}, defaultPlaygroundSettings, playgroundSettings);
    }, [playgroundSettings]);

    const [zoomedInPath, setZoomedInPath] = useState<SqValuePath | undefined>();

    const handle: SquiggleViewerHandle = {
      focusByPath(path: SqValuePath) {
        setZoomedInPath(undefined);
        setTimeout(() => {
          itemStore.focusByPath(path);
        }, 0);
      },
    };

    useImperativeHandle(ref, () => handle);

    const _rootValue =
      rootValue && valueHasContext(rootValue) ? rootValue : undefined;

    return (
      <ViewerContext.Provider
        value={{
          initialized: true,
          viewerType,
          itemStore,
          rootValue: _rootValue,
          globalSettings,
          visibleRootPath,
          zoomedInPath,
          setZoomedInPath,
          externalViewerActions,
          handle,
          findNode: (path) => findNode(_rootValue, path, itemStore),
        }}
      >
        {children}
      </ViewerContext.Provider>
    );
  }
);
InnerViewerProvider.displayName = "InnerViewerProvider";

const ProxyViewerProvider = forwardRef<SquiggleViewerHandle, Props>(
  (props, ref) => {
    const { handle } = useViewerContext();
    useImperativeHandle(ref, () => handle);
    return props.children; // TODO - props.settings will be ignored, what should we do?
  }
);
ProxyViewerProvider.displayName = "ProxyViewerProvider";

export const ViewerProvider = forwardRef<SquiggleViewerHandle, Props>(
  (props, ref) => {
    // `ViewerProvider` is a singleton, so if the context already exists, we don't initialize it again
    const { initialized } = useContext(ViewerContext);
    if (initialized) {
      return <ProxyViewerProvider ref={ref} {...props} />;
    } else {
      return <InnerViewerProvider ref={ref} {...props} />;
    }
  }
);
ViewerProvider.displayName = "ViewerProvider";

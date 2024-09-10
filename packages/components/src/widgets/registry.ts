import { FC, ReactNode } from "react";

import { SqValue } from "@quri/squiggle-lang";

import { PlaygroundSettings } from "../components/PlaygroundSettings.js";
import { SqValueWithContext } from "../lib/utility.js";

type SqValueTag = SqValue["tag"];

type ValueByTag<T extends SqValueTag> = Extract<SqValueWithContext, { tag: T }>;

type Widget<T extends SqValueTag = SqValueTag> = {
  Chart: FC<{
    value: Extract<SqValueWithContext, { tag: T }>;
    settings: PlaygroundSettings;
  }>;
  Preview?: FC<{ value: ValueByTag<T> }>;
  Menu?: FC<{
    value: ValueByTag<T>;
  }>;
  heading?: (value: ValueByTag<T>) => string;
  PreviewRightSide?: FC<{ value: ValueByTag<T> }>;
};

type WidgetConfig<T extends SqValueTag = SqValueTag> = {
  Chart(
    value: Extract<SqValueWithContext, { tag: T }>,
    settings: PlaygroundSettings
  ): ReactNode;
  Preview?: (value: ValueByTag<T>) => ReactNode;
  PreviewRightSide?: (value: ValueByTag<T>) => ReactNode;
  Menu?: (value: ValueByTag<T>) => ReactNode;
  heading?: (value: ValueByTag<T>) => string;
};

class WidgetRegistry {
  widgets: Map<SqValueTag, Widget> = new Map();

  register<T extends SqValueTag>(tag: T, config: WidgetConfig<T>) {
    // We erase widget subtype because it'd be hard to maintain dynamically, but rely on map key/value types being matched.
    // It's not perfect but type-unsafe parts are contained in a few helper components such as `SquiggleValueChart`.

    const widget: Widget = {
      Chart: ({ value, settings }) => {
        if (value.tag !== tag) {
          throw new Error(`${tag} widget used incorrectly`);
        }
        return config.Chart(value as ValueByTag<T>, settings);
      },
    };
    widget.Chart.displayName = `${tag}Chart`;

    const { Preview, PreviewRightSide, Menu, heading } = config;

    if (Preview) {
      widget.Preview = ({ value }) => {
        if (value.tag !== tag) {
          throw new Error(`${tag} widget used incorrectly`);
        }
        return Preview(value as ValueByTag<T>);
      };
      widget.Preview.displayName = `${tag}Preview`;
    }

    if (PreviewRightSide) {
      widget.PreviewRightSide = ({ value }) => {
        if (value.tag !== tag) {
          throw new Error(`${tag} widget used incorrectly`);
        }
        return PreviewRightSide(value as ValueByTag<T>);
      };
      widget.PreviewRightSide.displayName = `${tag}PreviewRightSide`;
    }

    if (Menu) {
      widget.Menu = ({ value }) => {
        if (value.tag !== tag) {
          throw new Error(`${tag} widget used incorrectly`);
        }
        return Menu(value as ValueByTag<T>);
      };
      widget.Menu.displayName = `${tag}Menu`;
    }

    if (heading) {
      widget.heading = (value) => {
        if (value.tag !== tag) {
          throw new Error(`${tag} widget used incorrectly`);
        }
        return heading(value as ValueByTag<T>);
      };
    }

    if (PreviewRightSide) {
      widget.PreviewRightSide = ({ value }) => {
        if (value.tag !== tag) {
          throw new Error(`${tag} widget used incorrectly`);
        }
        return PreviewRightSide(value as ValueByTag<T>);
      };
      widget.PreviewRightSide.displayName = `${tag}PreviewRightSide`;
    }

    this.widgets.set(tag, widget);
  }
}

export const widgetRegistry = new WidgetRegistry();

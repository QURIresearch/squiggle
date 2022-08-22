import { CogIcon } from "@heroicons/react/solid";
import React, { useContext, useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "../ui/Modal";
import { ViewSettings, viewSettingsSchema } from "../ViewSettings";
import { Path, pathAsString } from "./utils";
import { ViewerContext } from "./ViewerContext";
import { defaultTickFormat } from "../../lib/distributionSpecBuilder";
import { PlaygroundContext } from "../SquigglePlayground";

type Props = {
  path: Path;
  onChange: () => void;
  disableLogX?: boolean;
  withFunctionSettings: boolean;
};

const ItemSettingsModal: React.FC<
  Props & { close: () => void; resetScroll: () => void }
> = ({
  path,
  onChange,
  disableLogX,
  withFunctionSettings,
  close,
  resetScroll,
}) => {
  const { setSettings, getSettings, getMergedSettings } =
    useContext(ViewerContext);

  const mergedSettings = getMergedSettings(path);

  const { register, watch } = useForm({
    resolver: yupResolver(viewSettingsSchema),
    defaultValues: {
      // this is a mess and should be fixed
      showEditor: true, // doesn't matter
      chartHeight: mergedSettings.height,
      showSummary: mergedSettings.distributionPlotSettings.showSummary,
      logX: mergedSettings.distributionPlotSettings.logX,
      expY: mergedSettings.distributionPlotSettings.expY,
      tickFormat:
        mergedSettings.distributionPlotSettings.format || defaultTickFormat,
      title: mergedSettings.distributionPlotSettings.title,
      minX: mergedSettings.distributionPlotSettings.minX,
      maxX: mergedSettings.distributionPlotSettings.maxX,
      distributionChartActions: mergedSettings.distributionPlotSettings.actions,
      diagramStart: mergedSettings.chartSettings.start,
      diagramStop: mergedSettings.chartSettings.stop,
      diagramCount: mergedSettings.chartSettings.count,
    },
  });
  useEffect(() => {
    const subscription = watch((vars) => {
      const settings = getSettings(path); // get the latest version
      setSettings(path, {
        ...settings,
        distributionPlotSettings: {
          showSummary: vars.showSummary,
          logX: vars.logX,
          expY: vars.expY,
          format: vars.tickFormat,
          title: vars.title,
          minX: vars.minX,
          maxX: vars.maxX,
          actions: vars.distributionChartActions,
        },
        chartSettings: {
          start: vars.diagramStart,
          stop: vars.diagramStop,
          count: vars.diagramCount,
        },
      });
      onChange();
    });
    return () => subscription.unsubscribe();
  }, [getSettings, setSettings, onChange, path, watch]);

  const { getLeftPanelElement } = useContext(PlaygroundContext);

  return (
    <Modal container={getLeftPanelElement()} close={close}>
      <Modal.Header>
        Chart settings
        {path.length ? (
          <>
            {" for "}
            <span
              title="Scroll to item"
              className="cursor-pointer"
              onClick={resetScroll}
            >
              {pathAsString(path)}
            </span>{" "}
          </>
        ) : (
          ""
        )}
      </Modal.Header>
      <Modal.Body>
        <ViewSettings
          register={register}
          withShowEditorSetting={false}
          withFunctionSettings={withFunctionSettings}
          disableLogXSetting={disableLogX}
        />
      </Modal.Body>
    </Modal>
  );
};

export const ItemSettingsMenu: React.FC<Props> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const { enableLocalSettings, setSettings, getSettings } =
    useContext(ViewerContext);

  const ref = useRef<HTMLDivElement | null>(null);

  if (!enableLocalSettings) {
    return null;
  }
  const settings = getSettings(props.path);

  const resetScroll = () => {
    if (!ref.current) return;
    window.scroll({
      top: ref.current.getBoundingClientRect().y + window.scrollY,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex gap-2" ref={ref}>
      <CogIcon
        className="h-5 w-5 cursor-pointer text-slate-400 hover:text-slate-500"
        onClick={() => setIsOpen(!isOpen)}
      />
      {settings.distributionPlotSettings || settings.chartSettings ? (
        <button
          onClick={() => {
            setSettings(props.path, {
              ...settings,
              distributionPlotSettings: undefined,
              chartSettings: undefined,
            });
            props.onChange();
          }}
          className="text-xs px-1 py-0.5 rounded bg-slate-300"
        >
          Reset settings
        </button>
      ) : null}
      {isOpen ? (
        <ItemSettingsModal
          {...props}
          close={() => setIsOpen(false)}
          resetScroll={resetScroll}
        />
      ) : null}
    </div>
  );
};

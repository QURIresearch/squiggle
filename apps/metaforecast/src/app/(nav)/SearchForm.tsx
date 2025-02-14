"use client";
import debounce from "lodash/debounce";
import React, { FC, use, useState } from "react";

import { type PlatformConfig } from "@/backend/types";

import { MultiSelectPlatform } from "../../web/common/MultiSelectPlatform";
import { ButtonsForStars } from "../../web/display/ButtonsForStars";
import { SliderElement } from "../../web/display/SliderElement";
import { SearchQuery } from "./common";
import { useSearchQuery, useUpdateSearchQuery } from "./hooks";
import { QueryForm } from "./QueryForm";
import { SearchUIContext } from "./SearchUIProvider";

export type Props = {
  platformsConfig: PlatformConfig[];
};

export const SearchForm: FC<Props> = ({ platformsConfig }) => {
  // This is used _only_ to set the initial values of the form.
  // It shouldn't be used for `updateRoute` calls - the values could be stale because search params update asynchronously.
  // In other words, the form is uncontrolled.
  const searchQuery = useSearchQuery(
    platformsConfig.map((platform) => platform.name)
  );

  /* States */
  const [advancedOptions, showAdvancedOptions] = useState(false);

  const updateSearchQuery = useUpdateSearchQuery();

  const submit = debounce((patch: Partial<SearchQuery>) => {
    updateSearchQuery(patch);
  }, 300);

  const onChangeStars = (value: number) => {
    submit({ starsThreshold: value });
  };

  /* Change the forecast threshold */
  const displayFunctionNumForecasts = (value: number) => {
    return "# Forecasts > " + Math.round(value);
  };
  const onChangeSliderForNumForecasts = (value: number) => {
    submit({
      forecastsThreshold: Math.round(value),
    });
  };

  const onChangeSearchText = (value: string) => {
    submit({
      query: value,
    });
  };

  const onChangeSelectedPlatforms = (value: string[]) => {
    submit({
      forecastingPlatforms: value,
    });
  };

  const { showId, setShowId } = use(SearchUIContext);

  const onChangeShowId = () => setShowId(!showId);

  return (
    <div>
      <label className="mb-4 mt-4 flex flex-row items-center justify-center">
        <div className="mb-2 w-10/12">
          <QueryForm
            defaultValue={searchQuery.query}
            onChange={onChangeSearchText}
            placeholder="Find forecasts about..."
          />
        </div>

        <div className="ml-4 flex w-2/12 justify-center md:ml-2 lg:ml-0">
          <button
            className="mb-2 text-sm text-gray-500"
            onClick={() => showAdvancedOptions(!advancedOptions)}
          >
            Advanced options ▼
          </button>
        </div>
      </label>

      {advancedOptions && (
        <div className="mx-auto w-full flex-1 flex-col items-center justify-center">
          <div className="mb-4 grid grid-cols-1 content-center items-center rounded-md bg-gray-50 px-8 pb-1 pt-4 shadow-sm sm:grid-cols-1 sm:grid-rows-4 md:grid-cols-3 md:grid-rows-2 lg:grid-cols-3 lg:grid-rows-2">
            <div className="col-start-1 col-end-4 row-start-1 row-end-1 mb-4 flex items-center justify-center md:col-start-1 md:col-end-1 md:row-span-1 md:row-start-1 md:row-end-1 lg:col-start-1 lg:col-end-1 lg:row-span-1 lg:row-start-1 lg:row-end-1">
              <SliderElement
                onChange={onChangeSliderForNumForecasts}
                defaultValue={searchQuery.forecastsThreshold}
                displayFunction={displayFunctionNumForecasts}
              />
            </div>
            <div className="col-start-1 col-end-4 row-start-2 row-end-2 mb-4 flex items-center justify-center md:col-start-2 md:col-end-2 md:row-start-1 md:row-end-1 lg:col-start-2 lg:row-start-1 lg:row-end-1">
              <ButtonsForStars
                onChange={onChangeStars}
                value={searchQuery.starsThreshold}
              />
            </div>
            <div className="col-span-3 flex items-center justify-center">
              <MultiSelectPlatform
                platformsConfig={platformsConfig}
                value={searchQuery.forecastingPlatforms}
                onChange={onChangeSelectedPlatforms}
              />
            </div>
            <button
              className="col-start-1 col-end-4 mb-2 ml-10 mr-10 mt-5 block items-center justify-center rounded-sm border border-blue-500 bg-transparent p-10 px-4 py-2 text-center text-blue-400 hover:border-transparent hover:bg-blue-300 hover:text-white md:col-start-2 md:col-end-3 md:row-start-4 md:row-end-4 lg:col-start-2 lg:col-end-3 lg:row-start-4 lg:row-end-4"
              onClick={onChangeShowId}
            >
              Toggle show id
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

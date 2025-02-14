import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Env, run, SqCalculator, SqInput } from "@quri/squiggle-lang";

import { PlaygroundSettings } from "../../components/PlaygroundSettings.js";
import { ErrorAlert } from "../../components/ui/Alert.js";
import { SAMPLE_COUNT_MAX, SAMPLE_COUNT_MIN } from "../../lib/constants.js";
import { MarkdownViewer } from "../../lib/MarkdownViewer.js";
import { CalculatorInput } from "./CalculatorInput.js";
import { CalculatorResult } from "./CalculatorResult.js";
import {
  FormShape,
  InputResults,
  SqCalculatorValueWithContext,
  SqValueResult,
} from "./types.js";
import { useSavedCalculatorState } from "./useSavedCalculatorState.js";

const getEnvironment = (
  modelEnvironment: Env,
  calculator: SqCalculator
): Env => ({
  sampleCount: calculator.sampleCount || modelEnvironment.sampleCount,
  xyPointLength: modelEnvironment.xyPointLength,
  seed: modelEnvironment.seed,
});

async function runSimulation(
  code: string,
  environment: Env
): Promise<SqValueResult | undefined> {
  if (!code) {
    return undefined;
  }
  const output = await run(code, { environment });
  return output.getEndResult();
}

function fieldValueToCode(
  input: SqInput,
  fieldValue: string | boolean
): string {
  if (typeof fieldValue === "boolean") {
    return fieldValue.toString();
  }

  if (input.tag === "select") {
    return `"${fieldValue}"`;
  } else {
    return fieldValue;
  }
}

function getFormValues(calculator: SqCalculator): FormShape {
  return {
    inputs: calculator.inputs.map((input) => input.default ?? ""),
  };
}

/**
 * This function implements all state flow logic for calculator inputs.
 */
function useCalculator(
  valueWithContext: SqCalculatorValueWithContext,
  environment: Env
) {
  // useMemo here is important; valueWithContext.value is a getter that creates a new calculator value every time.
  const calculator = useMemo(() => valueWithContext.value, [valueWithContext]);

  const [savedState, updateSavedState] =
    useSavedCalculatorState(valueWithContext);

  // Calculator input codes (Squiggle strings, selected options in <select>, etc.) are tracked by react-hook-form.
  // Everything else is tracked in local state and backed up to ViewerContext.
  const form = useForm<FormShape>({
    defaultValues: savedState?.formValues ?? getFormValues(calculator),
  });

  const [inputResults, setInputResults] = useState<InputResults>(
    () => savedState?.inputResults ?? []
  );

  const hashString = useMemo(() => calculator.hashString, [calculator]);
  const [prevHashString, setPrevHashString] = useState<string | undefined>(
    savedState?.hashString
  );

  const processAllFieldCodes = useCallback(async () => {
    const formValues = form.getValues();
    const newInputResults: typeof inputResults = [];
    for (const [i, input] of calculator.inputs.entries()) {
      const fieldValue = formValues.inputs?.at(i);
      if (fieldValue === undefined) continue; // shouldn't happen if we set the form correctly
      const inputResult = await runSimulation(
        fieldValueToCode(input, fieldValue),
        environment
      );
      newInputResults[i] = inputResult;
    }
    setInputResults(newInputResults);
  }, [calculator, environment, form, setInputResults]);

  // This effect does two things:
  // - when the calculator is updated, it resets the form
  // - also, on initial render and on calculator updates, it calculates all input results (which will trigger calculator result calculation)
  // In both cases, it updates `prevHashString`, which tracks the calculator identity.
  useEffect(() => {
    if (prevHashString === hashString) {
      return;
    }

    if (prevHashString) {
      // Calculator identity has changed. Let's reset the form because there might be new inputs or new defaults.
      // (In the future, we could do something more complicated here, for example check if any form fields were touched.)
      form.reset(getFormValues(calculator));
    }
    setPrevHashString(hashString);

    // Calculator has updated (or this component just mounted). Let's take all input codes and run them.
    processAllFieldCodes();
  }, [calculator, hashString, prevHashString, form, processAllFieldCodes]);

  // Update input result if input code has changed.
  useEffect(() => {
    const subscription = form.watch(async (formValues, { name: fieldName }) => {
      if (fieldName === undefined) return;
      // fieldName is "inputs.N"
      const id = parseInt(fieldName.split(".")[1]);
      if (Number.isNaN(id)) {
        return; // wrong field name
      }
      const fieldValue = formValues.inputs?.at(id);
      if (fieldValue === undefined) return;

      const input = calculator.inputs[id];

      const inputResult = await runSimulation(
        fieldValueToCode(input, fieldValue),
        environment
      );
      setInputResults((inputResults) =>
        inputResults.map((item, i) => (i === id ? inputResult : item))
      );
    });

    return () => subscription.unsubscribe();
  }, [calculator, environment, form]);

  // Back up calculator state outside of this component, since calculator can disappear on code changes
  // (for example, on short syntax errors when autorun is enabled), and we don't want to lose user input
  // or calculator output when calculator component is rendered again.
  const _updateSavedState = useCallback(() => {
    updateSavedState({
      hashString,
      formValues: form.getValues(),
      inputResults,
    });
  }, [inputResults, form, hashString, updateSavedState]);

  // Back up whenever any calculated input result changes.
  useEffect(() => _updateSavedState(), [_updateSavedState]);

  // Also back up whenever form state changes (backups are cheap, so there's no reason not to do this).
  useEffect(() => {
    const subscription = form.watch(() => _updateSavedState());
    return () => subscription.unsubscribe();
  }, [_updateSavedState, form]);

  return { calculator, form, inputResults, processAllFieldCodes };
}

type Props = {
  settings: PlaygroundSettings;
  valueWithContext: SqCalculatorValueWithContext;
};

export const CalculatorSampleCountValidation: FC<{
  calculator: SqCalculatorValueWithContext;
  children: ReactNode;
}> = ({ calculator, children }) => {
  const { sampleCount } = calculator.value;

  const sampleCountIsInvalid =
    sampleCount &&
    (sampleCount < SAMPLE_COUNT_MIN || sampleCount > SAMPLE_COUNT_MAX);

  return sampleCountIsInvalid ? (
    <ErrorAlert
      heading={`Calculator sampleCount must be between ${SAMPLE_COUNT_MIN} and ${SAMPLE_COUNT_MAX}. It is set to ${sampleCount}.`}
    />
  ) : (
    children
  );
};

export const Calculator: FC<Props> = ({ settings, valueWithContext }) => {
  const _environment = useMemo(
    () =>
      getEnvironment(
        valueWithContext.context.runContext.environment,
        valueWithContext.value
      ),
    [valueWithContext]
  );

  const { calculator, form, inputResults, processAllFieldCodes } =
    useCalculator(valueWithContext, _environment);

  const inputResultSettings: PlaygroundSettings = useMemo(
    () => ({
      ...settings,
      distributionChartSettings: {
        ...settings.distributionChartSettings,
        showSummary: false,
      },
      chartHeight: 30,
    }),
    [settings]
  );

  //This memoization is useful to make sure that CalculatorResult ResultViewer doesn't get updated too frequently.
  const calculatorResultSettings: PlaygroundSettings = useMemo(
    () => ({
      ...settings,
      chartHeight: 200,
    }),
    [settings]
  );

  const hasTitleOrDescription = !!calculator.title || !!calculator.description;

  return (
    <FormProvider {...form}>
      <div className="rounded-xs mx-auto max-w-4xl border border-slate-200">
        {hasTitleOrDescription && (
          <div className="max-w-4xl border-b border-slate-200 bg-slate-100 px-5 py-3">
            {calculator.title && (
              <div className="mb-1 text-lg font-semibold text-slate-900">
                {calculator.title}
              </div>
            )}
            {calculator.description && (
              <MarkdownViewer
                md={calculator.description}
                textSize="sm"
                textColor="prose-slate"
              />
            )}
          </div>
        )}

        {Boolean(calculator.inputs.length) && (
          <div className="space-y-3 border-b border-slate-200 bg-gray-50 px-5 py-3">
            {calculator.inputs.map((row, i) => (
              <CalculatorInput
                key={i}
                id={i}
                input={row}
                result={inputResults[i]}
                settings={inputResultSettings}
              />
            ))}
          </div>
        )}

        <CalculatorResult
          valueWithContext={valueWithContext}
          inputResults={inputResults}
          environment={_environment}
          processAllFieldCodes={processAllFieldCodes}
          autorun={calculator.autorun}
          settings={calculatorResultSettings}
        />
      </div>
    </FormProvider>
  );
};

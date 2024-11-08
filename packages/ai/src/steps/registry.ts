import { adjustToFeedbackStep } from "./adjustToFeedbackStep.js";
import { fixCodeUntilItRunsStep } from "./fixCodeUntilItRunsStep.js";
import { generateCodeStep } from "./generateCodeStep.js";
import { matchStyleGuideStep } from "./matchStyleGuideStep.js";
import { runAndFormatCodeStep } from "./runAndFormatCodeStep.js";

export function getStepTemplateByName(name: string) {
  const templates = Object.fromEntries(
    [
      adjustToFeedbackStep,
      generateCodeStep,
      fixCodeUntilItRunsStep,
      runAndFormatCodeStep,
      matchStyleGuideStep,
    ].map((step) => [step.name, step])
  );

  if (!(name in templates)) {
    throw new Error(`Step ${name} not found`);
  }
  return templates[name];
}

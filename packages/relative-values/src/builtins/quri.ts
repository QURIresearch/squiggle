import { buildGraphModel, Model } from "@/model/utils";
import { Catalog, Choice } from "@/types";

function getCatalog(): Catalog {
  const items: Choice[] = [
    {
      id: "quri_papers_1",
      name: "External Evaluation of the EA Wiki",
    },
    {
      id: "quri_papers_2",
      name: "Flimsy Pet Theories, Enormous Initiatives",
    },
    {
      id: "quri_papers_3",
      name: "Simple comparison polling to create utility functions",
    },
    {
      id: "quri_papers_4",
      name: "Prioritization Research for Advancing Wisdom and Intelligence",
    },
    {
      id: "quri_papers_5",
      name: "Shallow evaluations of longtermist organizations",
    },
    {
      id: "quri_papers_6",
      name: "2018-2019 Long Term Future Fund Grantees: How did they do?",
    },
    {
      id: "quri_papers_7",
      name: "Introducing Metaforecasting: A Forecast Aggregator and Search Tool",
    },
    {
      id: "quri_papers_8",
      name: "Big List of Cause Candidates",
    },
    {
      id: "quri_papers_9",
      name: "Multivariate estimation & the Squiggly language",
    },
    {
      id: "quri_papers_10",
      name: "Amplifying generalist research via forecasting – results from a preliminary exploration Part 2",
    },
    {
      id: "quri_papers_11",
      name: "Introducing http://foretold.io/: A New Open-Source Prediction Registry",
    },
    {
      id: "quri_papers_12",
      name: "Conversation on forecasting with Vaniver and Ozzie Gooen",
    },
    {
      id: "quri_papers_13",
      name: "Prediction-Augmented Evaluation Systems",
    },
    {
      id: "quri_papers_14",
      name: "Five steps for quantifying speculative interventions",
    },
    {
      id: "quri_papers_15",
      name: "Valuing research works by eliciting comparisons from EA researchers",
    },
    { name: "Metaforecast", id: "quri_metaforecast" },
    { name: "Metaforecast Twitter Bot", id: "quri_metaforecast_twitter" },
    { name: "Squiggle", id: "quri_squiggle" },
    { name: "Foretold.io", id: "quri_foretold" },
    { name: "QuantifiedUncertainty.org", id: "quri_homepage" },
    { name: "Utility Function Extractor", id: "quri_utility_extractor" },
    { name: "AI Safety Papers", id: "quri_ai_safety_papers" },
    { name: "Ken", id: "quri_ken" },
    { name: "Guesstimate", id: "quri_guesstimate" },
  ].map((item) => ({
    ...item,
    clusterId: item.id.startsWith("quri_papers_") ? "papers" : "software",
  }));

  return {
    title: "QURI projects [TEST]",
    items,
    clusters: {
      papers: {
        name: "Papers",
        color: "#DB828C",
      },
      software: {
        name: "Software",
        color: "#5D8CD3",
      },
    },
  };
}

function getTextModel(): Model {
  return {
    mode: "text",
    code: `blog_post_to_software = SampleSet.fromDist(0.1 to 100)
items = {
  quri_papers_1: pointMass(1),
  quri_papers_2: 0.1 to 2,
  quri_papers_3: 0.5 to 10,
  quri_papers_4: 0.2 to 20,
  quri_papers_5: 0.2 to 3,
  quri_papers_6: 0.3 to 2,
  quri_papers_7: 1 to 20,
  quri_papers_8: 0.5 to 8,
  quri_papers_9: 0.2 to 8,
  quri_papers_10: 2 to 15,
  quri_papers_11: 1 to 5,
  quri_papers_12: 0.05 to 0.2,
  quri_papers_13: 0.1 to 3,
  quri_papers_14: 0.2 to 3,
  quri_papers_15: 0.2 to 3,
  quri_metaforecast: (1)*blog_post_to_software,
  quri_metaforecast_twitter: (0.01 to 0.1)*blog_post_to_software,
  quri_squiggle: (3 to 10)*blog_post_to_software,
  quri_foretold: (0.5 to 100)*blog_post_to_software,
  quri_homepage: (0.05 to 5)*blog_post_to_software,
  quri_utility_extractor: (0.005 to 0.2)*blog_post_to_software,
  quri_ai_safety_papers: (0.01 to 0.5)*blog_post_to_software,
  quri_ken: (0.1 to 0.5)*blog_post_to_software,
  quri_guesstimate: (50 to 10000)*blog_post_to_software
}
withSampleSetValue(item) = SampleSet.fromDist(item)
items = Dict.map(items, withSampleSetValue)

fn(intervention1, intervention2) = items[intervention1] / items[intervention2]
fn
`,
  };
}

function getGraphModel(): Model {
  return buildGraphModel({
    commonCode: "blog_post_to_software = SampleSet.fromDist(0.1 to 100)",
    items: [
      ["quri_papers_1", "pointMass(1)"],
      ["quri_papers_2", "0.1 to 2"],
      ["quri_papers_3", "0.5 to 10"],
      ["quri_papers_4", "0.2 to 20"],
      ["quri_papers_5", "0.2 to 3"],
      ["quri_papers_6", "0.3 to 2"],
      ["quri_papers_7", "1 to 20"],
      ["quri_papers_8", "0.5 to 8"],
      ["quri_papers_9", "0.2 to 8"],
      ["quri_papers_10", "2 to 15"],
      ["quri_papers_11", "1 to 5"],
      ["quri_papers_12", "0.05 to 0.2"],
      ["quri_papers_13", "0.1 to 3"],
      ["quri_papers_14", "0.2 to 3"],
      ["quri_papers_15", "0.2 to 3"],
      ["quri_metaforecast", "(1)*blog_post_to_software"],
      ["quri_metaforecast_twitter", "(0.01 to 0.1)*blog_post_to_software"],
      ["quri_squiggle", "(3 to 10)*blog_post_to_software"],
      ["quri_foretold", "(0.5 to 100)*blog_post_to_software"],
      ["quri_homepage", "(0.05 to 5)*blog_post_to_software"],
      ["quri_utility_extractor", "(0.005 to 0.2)*blog_post_to_software"],
      ["quri_ai_safety_papers", "(0.01 to 0.5)*blog_post_to_software"],
      ["quri_ken", "(0.1 to 0.5)*blog_post_to_software"],
      ["quri_guesstimate", "(50 to 10000)*blog_post_to_software"],
    ],
    catalog: getCatalog(),
  });
}

export function getQuriCatalogAndModel() {
  return {
    catalog: getCatalog(),
    model: getGraphModel(),
  };
}

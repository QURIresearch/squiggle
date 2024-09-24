// This file is auto-generated. Do not edit manually.
export const LIBRARY_CONTENTS = new Map([  ['hub:ozziegooen/sTest', "@startOpen\n@name(\"Documentation\")\ndocumentation = \"\n# SquiggleJest Testing Library\n\nSquiggleJest is a simple testing library for Squiggle, inspired by Jest for JavaScript. It provides a way to write and run tests for your Squiggle models and functions.\n\n## How to Use\n\n1. Import the library (assuming it's in a file named 'squiggleJest.squiggle'):\n   ```squiggle\n   import 'squiggleJest.squiggle' as SJ\n   ```\n\n2. Create your tests using the `test` function:\n   ```squiggle\n   test = SJ.test\n   expect = SJ.expect\n\n   myTest = test(\\\"My test description\\\", {|| \n     expect(2 + 2).toBe(4)\n   })\n   ```\n\n3. Group related tests using the `describe` function:\n   ```squiggle\n   describe = SJ.describe\n\n   myTestSuite = describe(\\\"My Test Suite\\\", [\n     test(\\\"First test\\\", {|| expect(true).toBeTrue()}),\n     test(\\\"Second test\\\", {|| expect(5).toBeGreaterThan(3)})\n   ])\n   ```\n\n4. Run your test suite and view the results.\n\n## Available Matchers\n\n- `toBe(expected)`: Checks for exact equality\n- `toBeGreaterThan(expected)`: Checks if the actual value is greater than the expected\n- `toBeGreaterThanOrEqual(expected)`: Checks if the actual value is greater or equal than the expected\n- `toBeLessThan(expected)`: Checks if the actual value is less than the expected\n- `toBeLessThanOrEqual(expected)`: Checks if the actual value is less than or equal than the expected\n- `toBeTrue()`: Checks if the value is true\n- `toBeFalse()`: Checks if the value is false\n- `toBeCloseTo(expected, epsilon)`: Checks if the actual value is close to the expected value within a given epsilon.\n- `toBeBetween(low, high)`: Checks if the actual value is between the given low and high values (inclusive).\n\n## Examples\n\n### Testing a Simple Function\n\n```squiggle\nadd(a, b) = a + b\n\ndescribe(\\\"Add function\\\", [\n  test(\\\"adds two positive numbers\\\", {|| \n    expect(add(2, 3)).toBe(5)\n  }),\n  test(\\\"adds a positive and a negative number\\\", {|| \n    expect(add(5, -3)).toBe(2)\n  })\n])\n```\n\n### Testing a Distribution\n\n```squiggle\nmyDist = normal(10, 2)\n\ndescribe(\\\"My Distribution\\\", [\n  test(\\\"has correct mean\\\", {|| \n    expect(mean(myDist)).toBe(10)\n  }),\n  test(\\\"has correct standard deviation\\\", {|| \n    expect(stdev(myDist)).toBe(2)\n  }),\n  test(\\\"90% of values are within 2 standard deviations\\\", {||\n    lower = 10 - 2 * 2\n    upper = 10 + 2 * 2\n    expect(cdf(myDist, upper) - cdf(myDist, lower)).toBeGreaterThan(0.9)\n  })\n])\n```\n\nThese examples demonstrate how to use SquiggleJest to test various aspects of your Squiggle models, from simple functions to complex models with distributions.\n\"\n\n@startClosed\ncreateExpectation(actual) = {\n  toBe: {\n    |expected|\n    if actual != expected then \"Expected \" + expected + \" but got \" +\n      actual else true\n  },\n  toBeGreaterThan: {\n    |expected|\n    if actual > expected then true else \"Expected \" + actual +\n      \" to be greater than \" +\n      expected\n  },\n  toBeGreaterThanOrEqual: {\n    |expected|\n    if actual >= expected then true else \"Expected \" + actual +\n      \" to be less than or equal\" +\n      expected\n  },\n  toBeLessThan: {\n    |expected|\n    if actual < expected then true else \"Expected \" + actual +\n      \" to be less than \" +\n      expected\n  },\n  toBeLessThanOrEqual: {\n    |expected|\n    if actual <= expected then true else \"Expected \" + actual +\n      \" to be less than or equal\" +\n      expected\n  },\n  toBeBetween: {\n    |low, high|\n    if actual < low || actual > high then \"Expected \" + actual +\n      \" to be between \" +\n      low +\n      \" and \" +\n      high else true\n  },\n  toBeCloseTo: {\n    |expected, epsilon|\n    if abs(actual - expected) > epsilon then \"Expected \" + actual +\n      \" to be close to \" +\n      expected +\n      \" (within \" +\n      epsilon +\n      \")\" else true\n  },\n  toBeTrue: {|| if !actual then \"Expected true but got \" + actual else true},\n  toBeFalse: {|| if actual then \"Expected false but got \" + actual else true},\n}\n\nrunTest(test) = {\n  fnResult = test.fn()\n  {\n    name: test.name,\n    passed: fnResult == true,\n    error: if fnResult != true then fnResult else \"\",\n  }\n}\n\n@startClosed\ngenerateTestReport(name, testResults) = {\n  passedTests = List.filter(testResults, {|t| t.passed})\n  failedTests = List.filter(testResults, {|t| !t.passed})\n\n  [\n    \"## Test Suite: \" + name + \"  \",\n    \"**Total tests**: \" + List.length(testResults) + \"  \",\n    \"**Passed**: \" + List.length(passedTests) + \"  \",\n    \"**Failed**: \" + List.length(failedTests),\n    \"\",\n    \"**Results:**  \",\n  ]\n}\n\n@startClosed\nformatTestResult(testResult) = (if testResult.passed then \"✅\" else \"❌\") +\n  \"  \" +\n  testResult.name +\n  (if testResult.error != \"\" then \"\n    --- Error: *\" + testResult.error +\n    \"*\" else \"\") +\n  \"  \"\n\n// Main squiggleJest framework\n@startClosed\nsquiggleJest = {\n  expect: createExpectation,\n  test: {|name, fn| { name: name, fn: fn }},\n  describe: {\n    |name, tests|\n    testResults = List.map(tests, runTest)\n    report = generateTestReport(name, testResults)\n    testDetails = List.map(testResults, formatTestResult)\n    List.concat(report, testDetails) -> List.join(\"\n\")\n  },\n}\n\nexport test = squiggleJest.test\nexport describe = squiggleJest.describe\nexport expect = squiggleJest.expect\n\n/// Testing ---\n@name(\"Example Model\")\nmodel = { items: [1, 2, 3] }\n\ntestResults = describe(\n  \"Model Tests\",\n  [\n    test(\n      \"has items with length 3\",\n      {|| expect(List.length(model.items)).toBe(3)}\n    ),\n    test(\"first item is 1\", {|| expect(model.items[0]).toBe(1)}),\n    test(\n      \"last item is greater than 2\",\n      {|| expect(model.items[2]).toBeGreaterThan(1)}\n    ),\n    test(\n      \"second item is less than 3\",\n      {|| expect(model.items[1]).toBeLessThan(8)}\n    ),\n    test(\n      \"second item is between 1 and 5\",\n      {|| expect(model.items[1]).toBeBetween(1, 3)}\n    ),\n    test(\n      \"contains truthy value\",\n      {|| expect(List.some(model.items, {|i| i > 0})).toBeTrue()}\n    ),\n    test(\n      \"doesn't contain 4\",\n      {|| expect(List.some(model.items, {|i| i == 4})).toBeFalse()}\n    ),\n    test(\"this test should fail\", {|| expect(1).toBe(2)}),\n  ]\n)\n\ncomparisonTests = describe(\n  \"Number Comparisons\",\n  [\n    test(\"5 is greater than 3\", {|| expect(5).toBeGreaterThan(3)}),\n    test(\n      \"5 is greater than or equal to 5\",\n      {|| expect(5).toBeGreaterThanOrEqual(5)}\n    ),\n    test(\"3 is less than 5\", {|| expect(3).toBeLessThan(5)}),\n    test(\"5 is less than or equal to 5\", {|| expect(5).toBeLessThanOrEqual(5)}),\n    test(\"7 is between 5 and 10\", {|| expect(7).toBeBetween(5, 10)}),\n    test(\n      \"5 is close to 5.0001 within 0.001\",\n      {|| expect(5).toBeCloseTo(5.0001, 0.001)}\n    ),\n    test(\"0 is not greater than 0\", {|| expect(0).toBeLessThanOrEqual(0)}),\n    test(\"-1 is less than 0\", {|| expect(-1).toBeLessThan(0)}),\n    test(\n      \"1000000 is greater than 999999\",\n      {|| expect(1000000).toBeGreaterThan(999999)}\n    ),\n    test(\n      \"0.1 + 0.2 is close to 0.3\",\n      {|| expect(0.1 + 0.2).toBeCloseTo(0.3, 0.0000001)}\n    ),\n    test(\n      \"PI is approximately 3.14159\",\n      {|| expect(3.14159).toBeCloseTo(Math.pi, 0.00001)}\n    ),\n    test(\n      \"e is approximately 2.71828\",\n      {|| expect(2.71828).toBeCloseTo(Math.e, 0.00001)}\n    ),\n    test(\n      \"10 is between 9.99999 and 10.00001\",\n      {|| expect(10).toBeBetween(9.99999, 10.00001)}\n    ),\n    test(\n      \"5 is not between 5.00001 and 10\",\n      {|| expect(5).toBeLessThan(5.00001)}\n    ),\n    test(\"1e-10 is greater than 0\", {|| expect(1e-10).toBeGreaterThan(0)}),\n    test(\n      \"The absolute difference between 1/3 and 0.333333 is less than 1e-5\",\n      {|| expect(abs(1 / 3 - 0.333333)).toBeLessThan(1e-5)}\n    ),\n    test(\n      \"2^53 - 1 is the largest integer precisely representable in IEEE 754\",\n      {|| expect(2 ^ 53 - 1).toBe(9007199254740991)}\n    ),\n  ]\n)\n"],
  ['hub:ozziegooen/helpers', "import \"hub:ozziegooen/sTest\" as sTest\n@hide\ntest = sTest.test\n@hide\nexpect = sTest.expect\n@hide\ndescribe = sTest.describe\n\n@doc(\n  \"\n  round(num, n)\n  \n  Rounds the number `num` to `n` decimal places.\n  \n  Example:\n  round(3.14159, 2) -> \\\"3.14\\\"\n\"\n)\nexport round(num, n) = {\n  asString = String.make(num)\n  splitString = String.split(asString, \"\")\n  if List.findIndex(splitString, {|r| r == \"e\"}) != -1 then {\n    // Handle scientific notation\n    parts = String.split(asString, \"e\")\n    decimalPart = parts[0]\n    exponentPart = parts[1]\n    roundedDecimalPart = if List.findIndex(\n      String.split(decimalPart, \"\"),\n      {|r| r == \".\"}\n    ) !=\n      -1 then {\n      decimalIndex = List.findIndex(\n        String.split(decimalPart, \"\"),\n        {|r| r == \".\"}\n      )\n      endIndex = min(\n        [decimalIndex + n + 1, List.length(String.split(decimalPart, \"\"))]\n      )\n      String.split(decimalPart, \"\") -> List.slice(0, endIndex) -> List.join(\"\")\n    } else decimalPart\n    roundedDecimalPart + \"e\" + exponentPart\n  } else {\n    // Handle non-scientific notation numbers\n    decimalIndex = List.findIndex(splitString, {|r| r == \".\"})\n    if decimalIndex == -1 then asString else {\n      endIndex = min([decimalIndex + n + 1, List.length(splitString)])\n      splitString -> List.slice(0, endIndex) -> List.join(\"\")\n    }\n  }\n}\n\n@name(\"round tests\")\nroundTests = describe(\n  \"Round Function Tests\",\n  [\n    test(\"rounds a simple number\", {|| expect(round(3.14159, 2)).toBe(\"3.14\")}),\n    test(\"rounds a whole number\", {|| expect(round(10, 2)).toBe(\"10\")}),\n    test(\n      \"rounds a number in scientific notation\",\n      {|| expect(round(1.23e4, 2)).toBe(\"12300\")}\n    ),\n    test(\n      \"rounds a negative number\",\n      {|| expect(round(-2.7182, 2)).toBe(\"-2.71\")}\n    ),\n  ]\n)\n\n@doc(\n  \"\n  formatTime(hours)\n  \n  Converts a number of hours to a formatted string indicating time in \n  seconds, minutes, hours, days, months, or years.\n  \n  Example:\n  formatTime(1) -> \\\"**1** hours\\\"\n  \"\n)\nexport formatTime(hours) = {\n  secondsInMinute = 60\n  minutesInHour = 60\n  hoursInDay = 24\n  daysInMonth = 30\n  monthsInYear = 12\n\n  totalSeconds = hours * minutesInHour * secondsInMinute\n  totalMinutes = hours * minutesInHour\n  totalHours = hours\n  totalDays = hours / hoursInDay\n  totalMonths = totalDays / daysInMonth\n  totalYears = totalMonths / monthsInYear\n  round(n) = round(n, 2) -> {|r| \"**\" + r + \"**\"}\n\n  if totalYears >= 1 then round(totalYears) + \" years\" else if totalMonths >=\n    1 then round(totalMonths) + \" months\" else if totalDays >= 1 then round(\n    totalDays\n  ) +\n    \" days\" else if totalHours >= 1 then round(totalHours) +\n    \" hours\" else if totalMinutes >= 1 then round(totalMinutes) +\n    \" minutes\" else round(totalSeconds) + \" seconds\"\n}\n\n@name(\"formatTime tests\")\nformatTimeTests = describe(\n  \"FormatTime Function Tests\",\n  [\n    test(\n      \"formats time less than a minute\",\n      {|| expect(formatTime(0.01)).toBe(\"**36** seconds\")}\n    ),\n    test(\n      \"formats time in hours\",\n      {|| expect(formatTime(1)).toBe(\"**1** hours\")}\n    ),\n    test(\n      \"formats time in days\",\n      {|| expect(formatTime(24)).toBe(\"**1** days\")}\n    ),\n    test(\n      \"formats time in months\",\n      {|| expect(formatTime(720)).toBe(\"**1** months\")}\n    ),\n    test(\n      \"formats time in years\",\n      {|| expect(formatTime(8760)).toBe(\"**1.01** years\")}\n    ),\n  ]\n)\n\n@doc(\n  \"## Linear or Quadratic Interpolation\n```squiggle\n@import('hub:ozziegooen/helpers' as h)\n\nh.interpolate([{x: 0, y:10}, {x:10, y:20}], 'linear')(4) -> 15\nh.interpolate([{x: 0, y:10}, {x:10, y:20}], 'quadratic')(4) -> 11.6\n\n//makes a graph\nfoo(t:[0,30]) = h.interpolate([{x: 0, y:10}, {x:10, y:20}, {x:20, y:10}], 'quadratic')(t) \n\"\n)\nexport interpolate(points, type) = {\n  sortedPoints = List.sortBy(points, {|f| f.x}) //TODO: Sort, somehow\n  {\n    |x|\n    result = List.reduce(\n      sortedPoints,\n      sortedPoints[0].y,\n      {\n        |acc, point, i|\n        if i == 0 then acc else if sortedPoints[i - 1].x <= x &&\n          x <= point.x then {\n          leftPoint = sortedPoints[i - 1]\n          rightPoint = point\n\n          if type == \"linear\" then {\n            slope = (rightPoint.y - leftPoint.y) / (rightPoint.x - leftPoint.x)\n            leftPoint.y + slope * (x - leftPoint.x)\n          } else if type == \"quadratic\" then {\n            a = (rightPoint.y - leftPoint.y) / (rightPoint.x - leftPoint.x) ^ 2\n            b = -2 * a * leftPoint.x\n            c = leftPoint.y + a * leftPoint.x ^ 2\n            a * x ^ 2 + b * x + c\n          } else { foo: \"Invalid interpolate type\" }\n\n        } else if x > sortedPoints[i - 1].x then sortedPoints[List.length(\n          sortedPoints\n        ) -\n          1].y else acc\n      }\n    )\n    result\n  }\n}\n\ninterpolationTests = describe(\n  \"Interpolation Function Tests\",\n  [\n    test(\n      \"linear interpolation within range\",\n      {\n        ||\n        expect(\n          interpolate([{ x: 0, y: 10 }, { x: 10, y: 20 }], \"linear\")(4)\n        ).toBe(\n          14\n        )\n      }\n    ),\n    test(\n      \"quadratic interpolation within range\",\n      {\n        ||\n        expect(\n          interpolate([{ x: 0, y: 10 }, { x: 10, y: 20 }], \"quadratic\")(4)\n        ).toBe(\n          11.6\n        )\n      }\n    ),\n    test(\n      \"linear interpolation at boundary\",\n      {\n        ||\n        expect(\n          interpolate([{ x: 0, y: 10 }, { x: 10, y: 20 }], \"linear\")(0)\n        ).toBe(\n          10\n        )\n      }\n    ),\n    test(\n      \"quadratic interpolation, additional points\",\n      {\n        ||\n        expect(\n          interpolate(\n            [{ x: 0, y: 10 }, { x: 10, y: 20 }, { x: 20, y: 10 }],\n            \"quadratic\"\n          )(\n            15\n          )\n        ).toBe(\n          17.5\n        )\n      }\n    ),\n  ]\n)\n\n//myShape = [{ x: 4, y: 10 }, { x: 20, y: 40 }, { x: 30, y: 20 }]\n\nplot(fn, xPoints) = Plot.numericFn(\n  fn,\n  {\n    xScale: Scale.linear({ min: 0, max: 50 }),\n    xPoints: xPoints -> List.concat(List.upTo(0, 50)),\n  }\n)\n\n@hide\ncalculator_fn(shape, select) = {\n  xPoints = shape -> map({|r| r.x})\n  if select == \"linear\" then plot(\n    interpolate(shape, \"linear\"),\n    xPoints\n  ) else if select == \"quadratic\" then plot(\n    interpolate(shape, \"quadratic\"),\n    xPoints\n  ) else {\n    linear: plot(interpolate(shape, \"linear\"), xPoints),\n    quadratic: plot(interpolate(shape, \"quadratic\"), xPoints),\n  }\n}\n\n@name(\"Interpolation Calculator (for debugging)\")\ninterpolationCalculator = Calculator(\n  calculator_fn,\n  {\n    title: \"Interpolate: function demonstration\",\n    description: \"``interpolate(data, type='linear'|'quadratic')``.  \n    \nYou have to enter data in the format of x and y values, as shown below, then get a function that can be called with any X to get any Y value.\n\n*Note: One important restriction is that these don't yet do a good job outside the data bounds. It's unclear what's best. I assume we should later give users options.*\",\n    inputs: [\n      Input.textArea(\n        {\n          name: \"Example input\",\n          default: \"[\n  { x: 4, y: 10 },\n  { x: 20, y: 30 },\n  { x: 30, y: 50 },\n  { x: 40, y: 30 },,\n]\",\n        }\n      ),\n      Input.select(\n        {\n          name: \"interpolate Type\",\n          options: [\"linear\", \"quadratic\", \"show both (for demonstration)\"],\n          default: \"show both (for demonstration)\",\n        }\n      ),\n    ],\n  }\n)\n\n@startOpen\n@notebook\nreadme = [\n  \"# Helpers Library\n\nA small library of various helper functions for numerical operations and formatting. Import this library into your Squiggle projects to utilize these utilities.\n\n## Import Usage\n\nTo use the functions from this library in your projects, import it as follows:\n\n```squiggle\n@import('hub:ozziegooen/helpers') as h\n```\n## Functions Overview\n\n### round\nRounds a given number to a specified number of decimal places.\n\nExample:\n\n```squiggle\nh.round(3.423, 2) // Returns: \\\"3.42\\\"\n```\",\n  Tag.getDoc(round),\n  \"---\",\n  \"### formatTime\nConverts a given number of hours into a human-readable time format, such as seconds, minutes, hours, days, months, or years.\n\nExample:\n\n```squiggle\nh.formatTime(4.23) // Enter the number of hours and format the result\n```\",\n  Tag.getDoc(formatTime),\n  \"---\",\n  \"### interpolate\nProvides linear or quadratic interpolation for a set of points. Returns a function that can interpolate the y-value for any x-value.\n\nExample for Linear Interpolation:\n\n```squiggle\nh.interpolate([{x: 0, y: 10}, {x: 10, y: 20}], 'linear')(4) // Returns: 15\n```\n\nExample for Quadratic Interpolation:\n\n```squiggle\nh.interpolate([{x: 0, y: 10}, {x: 10, y: 20}], 'quadratic')(4) // Returns: 11.6\n```\n\n### Interpolation Calculator\nThis tool helps visualize and compare the results of linear and quadratic interpolations for a given set of data points. Below is an example use case integrated with the library.\",\n  interpolationCalculator,\n]\n"]]);;

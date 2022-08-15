let normalDist5: DistributionTypes.genericDist = Symbolic(#Normal({mean: 5.0, stdev: 2.0}))
let normalDist10: DistributionTypes.genericDist = Symbolic(#Normal({mean: 10.0, stdev: 2.0}))
let normalDist20: DistributionTypes.genericDist = Symbolic(#Normal({mean: 20.0, stdev: 2.0}))
let normalDist: DistributionTypes.genericDist = normalDist5

let betaDist: DistributionTypes.genericDist = Symbolic(#Beta({alpha: 2.0, beta: 5.0}))
let lognormalDist: DistributionTypes.genericDist = Symbolic(#Lognormal({mu: 0.0, sigma: 1.0}))
let cauchyDist: DistributionTypes.genericDist = Symbolic(#Cauchy({local: 1.0, scale: 1.0}))
let triangularDist: DistributionTypes.genericDist = Symbolic(
  #Triangular({low: 1.0, medium: 2.0, high: 3.0}),
)
let exponentialDist: DistributionTypes.genericDist = Symbolic(#Exponential({rate: 2.0}))
let uniformDist: DistributionTypes.genericDist = Symbolic(#Uniform({low: 9.0, high: 10.0}))
let uniformDist2: DistributionTypes.genericDist = Symbolic(#Uniform({low: 8.0, high: 11.0}))
let floatDist: DistributionTypes.genericDist = Symbolic(#Float(1e1))

exception KlFailed
exception MixtureFailed
let float1 = 1.0
let float2 = 2.0
let float3 = 3.0
let point1 = TestHelpers.mkDelta(float1)
let point2 = TestHelpers.mkDelta(float2)
let point3 = TestHelpers.mkDelta(float3)

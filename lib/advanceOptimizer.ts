import { Id } from "@/convex/_generated/dataModel";

interface Property {
  _id: Id<"properties">;
  propertyName?: string;
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
  };
  ownerId: Id<"owners">;
  monthlyRent: number;
  leaseEndDate?: number;
  status: string;
  hasActiveAdvance?: boolean;
}

interface OptimizationResult {
  selectedPropertyIds: Set<string>;
  propertyTermMonths: Record<string, number>;
  totalAmount: number;
  targetAmount: number;
  isExactMatch: boolean;
  message: string;
}

interface PropertyOption {
  property: Property;
  availableMonths: number;
  minAdvance: number;
  maxAdvance: number;
}

const ADVANCE_RATE = 0.9; // 90% of rent value
const MIN_MONTHS = 2;
const MAX_MONTHS = 11;

function calculateMaxMonths(property: Property): number {
  if (!property.leaseEndDate) return MAX_MONTHS;
  const now = Date.now();
  const monthsRemaining = Math.floor((property.leaseEndDate - now) / (30 * 24 * 60 * 60 * 1000));
  return Math.min(MAX_MONTHS, Math.max(MIN_MONTHS, monthsRemaining));
}

function calculateAdvanceAmount(monthlyRent: number, months: number): number {
  // Use consistent rounding to avoid discrepancies
  const amount = monthlyRent * months * ADVANCE_RATE;
  return Math.floor(amount);
}

export function optimizePropertySelection(
  properties: Property[],
  targetAmount: number
): OptimizationResult {
  // Filter eligible properties
  const eligibleProperties = properties.filter((property) => {
    if (property.hasActiveAdvance) return false;
    if (!property.leaseEndDate) return false;
    const monthsRemaining = calculateMaxMonths(property);
    return monthsRemaining >= MIN_MONTHS;
  });

  if (eligibleProperties.length === 0) {
    return {
      selectedPropertyIds: new Set(),
      propertyTermMonths: {},
      totalAmount: 0,
      targetAmount,
      isExactMatch: false,
      message: "No eligible properties available for advance",
    };
  }

  // Create property options with min/max advance amounts
  const propertyOptions: PropertyOption[] = eligibleProperties.map((property) => {
    const availableMonths = calculateMaxMonths(property);
    return {
      property,
      availableMonths,
      minAdvance: calculateAdvanceAmount(property.monthlyRent, MIN_MONTHS),
      maxAdvance: calculateAdvanceAmount(property.monthlyRent, availableMonths),
    };
  });

  // Sort by monthly rent (descending) for greedy approach
  propertyOptions.sort((a, b) => b.property.monthlyRent - a.property.monthlyRent);

  // Calculate total maximum possible
  const maxPossible = propertyOptions.reduce((sum, opt) => sum + opt.maxAdvance, 0);

  if (targetAmount > maxPossible) {
    // Return all properties at maximum if target exceeds max possible
    const selectedPropertyIds = new Set(propertyOptions.map((opt) => opt.property._id));
    const propertyTermMonths: Record<string, number> = {};

    propertyOptions.forEach((opt) => {
      propertyTermMonths[opt.property._id] = opt.availableMonths;
    });

    return {
      selectedPropertyIds,
      propertyTermMonths,
      totalAmount: maxPossible,
      targetAmount,
      isExactMatch: false,
      message: `Maximum available is $${maxPossible.toLocaleString()}. Selected all properties at maximum terms.`,
    };
  }

  // Find the minimum combination that exceeds the target
  const result = findOptimalCombination(propertyOptions, targetAmount);

  return result;
}

function findOptimalCombination(
  propertyOptions: PropertyOption[],
  targetAmount: number
): OptimizationResult {
  let bestSolution: OptimizationResult | null = null;
  let minOverage = Infinity;

  // Try different combinations using dynamic programming approach
  // Start with greedy solution then optimize
  const greedySolution = greedySelection(propertyOptions, targetAmount);

  if (greedySolution.totalAmount >= targetAmount) {
    bestSolution = greedySolution;
    minOverage = greedySolution.totalAmount - targetAmount;
  }

  // Try to optimize by adjusting months for selected properties
  if (bestSolution) {
    const optimized = optimizeMonthsDistribution(
      propertyOptions.filter(opt => bestSolution!.selectedPropertyIds.has(opt.property._id)),
      targetAmount
    );

    if (optimized.totalAmount >= targetAmount &&
        optimized.totalAmount - targetAmount < minOverage) {
      bestSolution = optimized;
    }
  }

  // If no solution found that meets target, select minimum properties needed
  if (!bestSolution) {
    bestSolution = selectMinimumProperties(propertyOptions, targetAmount);
  }

  return bestSolution;
}

function greedySelection(
  propertyOptions: PropertyOption[],
  targetAmount: number
): OptimizationResult {
  const selectedPropertyIds = new Set<string>();
  const propertyTermMonths: Record<string, number> = {};
  let totalAmount = 0;

  // First pass: Add properties with minimum months until we exceed target
  for (const option of propertyOptions) {
    if (totalAmount >= targetAmount) break;

    selectedPropertyIds.add(option.property._id);
    propertyTermMonths[option.property._id] = MIN_MONTHS;
    totalAmount += option.minAdvance;
  }

  // If minimum months don't meet target, incrementally increase months
  if (totalAmount < targetAmount) {
    const selectedOptions = propertyOptions.filter(opt =>
      selectedPropertyIds.has(opt.property._id)
    );

    for (const option of selectedOptions) {
      const currentMonths = propertyTermMonths[option.property._id];
      const maxMonths = option.availableMonths;

      if (currentMonths < maxMonths) {
        const additionalMonths = maxMonths - currentMonths;
        const additionalAmount = calculateAdvanceAmount(
          option.property.monthlyRent,
          maxMonths
        ) - calculateAdvanceAmount(option.property.monthlyRent, currentMonths);

        if (totalAmount + additionalAmount >= targetAmount) {
          // Calculate exact months needed
          const needed = targetAmount - totalAmount;
          const monthsToAdd = Math.ceil(needed / (option.property.monthlyRent * ADVANCE_RATE));
          const finalMonths = Math.min(maxMonths, currentMonths + monthsToAdd);

          const oldAmount = calculateAdvanceAmount(option.property.monthlyRent, currentMonths);
          const newAmount = calculateAdvanceAmount(option.property.monthlyRent, finalMonths);

          propertyTermMonths[option.property._id] = finalMonths;
          totalAmount = totalAmount - oldAmount + newAmount;
          break;
        } else {
          // Max out this property and continue
          propertyTermMonths[option.property._id] = maxMonths;
          totalAmount += additionalAmount;
        }
      }
    }
  }

  const message = totalAmount >= targetAmount
    ? `Suggested: $${totalAmount.toLocaleString()} (closest amount above your $${targetAmount.toLocaleString()} target)`
    : `Unable to reach target. Maximum with selected properties: $${totalAmount.toLocaleString()}`;

  return {
    selectedPropertyIds,
    propertyTermMonths,
    totalAmount,
    targetAmount,
    isExactMatch: totalAmount === targetAmount,
    message,
  };
}

function optimizeMonthsDistribution(
  selectedOptions: PropertyOption[],
  targetAmount: number
): OptimizationResult {
  const selectedPropertyIds = new Set(selectedOptions.map(opt => opt.property._id));
  const propertyTermMonths: Record<string, number> = {};

  // Start with minimum months for all
  selectedOptions.forEach(opt => {
    propertyTermMonths[opt.property._id] = MIN_MONTHS;
  });

  let totalAmount = selectedOptions.reduce(
    (sum, opt) => sum + calculateAdvanceAmount(opt.property.monthlyRent, MIN_MONTHS),
    0
  );

  // Binary search for optimal month distribution
  while (totalAmount < targetAmount) {
    let bestProperty: PropertyOption | null = null;
    let bestIncrement = Infinity;

    for (const option of selectedOptions) {
      const currentMonths = propertyTermMonths[option.property._id];
      if (currentMonths < option.availableMonths) {
        const increment = calculateAdvanceAmount(option.property.monthlyRent, currentMonths + 1) -
                         calculateAdvanceAmount(option.property.monthlyRent, currentMonths);

        if (totalAmount + increment >= targetAmount && increment < bestIncrement) {
          bestProperty = option;
          bestIncrement = increment;
        }
      }
    }

    if (bestProperty) {
      propertyTermMonths[bestProperty.property._id]++;
      totalAmount += bestIncrement;
      break;
    }

    // If no single increment reaches target, add to property with highest rent
    const availableProperty = selectedOptions
      .filter(opt => propertyTermMonths[opt.property._id] < opt.availableMonths)
      .sort((a, b) => b.property.monthlyRent - a.property.monthlyRent)[0];

    if (!availableProperty) break;

    const currentMonths = propertyTermMonths[availableProperty.property._id];
    const newAmount = calculateAdvanceAmount(availableProperty.property.monthlyRent, currentMonths + 1);
    const oldAmount = calculateAdvanceAmount(availableProperty.property.monthlyRent, currentMonths);

    propertyTermMonths[availableProperty.property._id]++;
    totalAmount = totalAmount - oldAmount + newAmount;
  }

  return {
    selectedPropertyIds,
    propertyTermMonths,
    totalAmount,
    targetAmount,
    isExactMatch: totalAmount === targetAmount,
    message: `Optimized: $${totalAmount.toLocaleString()} (closest amount above your $${targetAmount.toLocaleString()} target)`,
  };
}

function selectMinimumProperties(
  propertyOptions: PropertyOption[],
  targetAmount: number
): OptimizationResult {
  const selectedPropertyIds = new Set<string>();
  const propertyTermMonths: Record<string, number> = {};
  let totalAmount = 0;

  // Select properties one by one at maximum months until target is met
  for (const option of propertyOptions) {
    selectedPropertyIds.add(option.property._id);
    propertyTermMonths[option.property._id] = option.availableMonths;
    totalAmount += option.maxAdvance;

    if (totalAmount >= targetAmount) {
      // Try to reduce months on the last property to get closer to target
      const excess = totalAmount - targetAmount;
      const monthlyValue = option.property.monthlyRent * ADVANCE_RATE;
      const monthsToReduce = Math.floor(excess / monthlyValue);

      if (monthsToReduce > 0 && option.availableMonths - monthsToReduce >= MIN_MONTHS) {
        const newMonths = option.availableMonths - monthsToReduce;
        propertyTermMonths[option.property._id] = newMonths;
        totalAmount = totalAmount - option.maxAdvance +
                     calculateAdvanceAmount(option.property.monthlyRent, newMonths);
      }
      break;
    }
  }

  const message = totalAmount >= targetAmount
    ? `Selected minimum properties needed: $${totalAmount.toLocaleString()}`
    : `Maximum available: $${totalAmount.toLocaleString()} (below target of $${targetAmount.toLocaleString()})`;

  return {
    selectedPropertyIds,
    propertyTermMonths,
    totalAmount,
    targetAmount,
    isExactMatch: totalAmount === targetAmount,
    message,
  };
}
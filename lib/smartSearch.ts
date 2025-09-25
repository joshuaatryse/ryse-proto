// Smart search parser for properties
interface SearchFilter {
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "gte" | "lte" | "before" | "after" | "in";
  value: any;
}

export function parseSmartSearch(query: string): SearchFilter[] {
  const filters: SearchFilter[] = [];
  const lowercaseQuery = query.toLowerCase().trim();

  // Handle empty query
  if (!lowercaseQuery) return filters;

  // Patterns for different search types
  const patterns = {
    // Rent comparisons: >4000, <2500, >=3000, rent > 4000, monthly rent > 4000
    rentComparison: /(?:rent|monthly\s*rent)?\s*([><]=?)\s*(\$?[\d,]+)/gi,

    // Security deposit comparisons: security > 5000, deposit < 3000
    depositComparison: /(?:security|deposit|security\s*deposit)\s*([><]=?)\s*(\$?[\d,]+)/gi,

    // Lease end date: ends by january, lease ends before 2025, ends in 3 months
    leaseEndDate: /(?:lease\s*)?(?:ends?|ending|expires?|expiring)\s*(?:by|before|after|in)\s*([^,]+)/gi,

    // Lease start date: starts january, lease starts after 2025
    leaseStartDate: /(?:lease\s*)?(?:starts?|starting|begins?|beginning)\s*(?:by|before|after|in)\s*([^,]+)/gi,

    // Status filters: status:accepted, status = rejected, under review
    statusFilter: /(?:status\s*[:=]\s*)?(\b(?:accepted|under[\s_]?review|rejected|active)\b)/gi,

    // Property type: type:condo, apartment, single family
    propertyType: /(?:type\s*[:=]\s*)?(\b(?:single[\s_]?family|multi[\s_]?family|condo|townhouse|apartment|commercial|other)\b)/gi,

    // Occupancy status: occupied, vacant, maintenance
    occupancyStatus: /\b(occupied|vacant|maintenance)\b/gi,

    // Has advance: has advance, with advance, no advance
    hasAdvance: /\b(has|with|no)\s+advance\b/gi,

    // Owner signature: signed, unsigned, no signature
    signature: /\b(signed|unsigned|no\s+signature)\b/gi,

    // Business entity: business owner, company owner, llc
    businessEntity: /\b(business|company|llc|inc|corporation)\s*(?:owner)?\b/gi,
  };

  // Process rent comparisons
  let match;
  patterns.rentComparison.lastIndex = 0;
  while ((match = patterns.rentComparison.exec(query)) !== null) {
    const operator = match[1];
    const value = parseFloat(match[2].replace(/[$,]/g, ''));

    filters.push({
      field: "monthlyRent",
      operator: operator === ">" ? "gt" :
                operator === "<" ? "lt" :
                operator === ">=" ? "gte" : "lte",
      value: value
    });
  }

  // Process deposit comparisons
  patterns.depositComparison.lastIndex = 0;
  while ((match = patterns.depositComparison.exec(query)) !== null) {
    const operator = match[1];
    const value = parseFloat(match[2].replace(/[$,]/g, ''));

    filters.push({
      field: "securityDeposit",
      operator: operator === ">" ? "gt" :
                operator === "<" ? "lt" :
                operator === ">=" ? "gte" : "lte",
      value: value
    });
  }

  // Process lease end date filters
  patterns.leaseEndDate.lastIndex = 0;
  while ((match = patterns.leaseEndDate.exec(query)) !== null) {
    const dateStr = match[1].trim();
    const parsedDate = parseDateExpression(dateStr);

    if (parsedDate) {
      filters.push({
        field: "leaseEndDate",
        operator: query.includes("before") || query.includes("by") ? "before" : "after",
        value: parsedDate
      });
    }
  }

  // Process lease start date filters
  patterns.leaseStartDate.lastIndex = 0;
  while ((match = patterns.leaseStartDate.exec(query)) !== null) {
    const dateStr = match[1].trim();
    const parsedDate = parseDateExpression(dateStr);

    if (parsedDate) {
      filters.push({
        field: "leaseStartDate",
        operator: query.includes("before") || query.includes("by") ? "before" : "after",
        value: parsedDate
      });
    }
  }

  // Process status filters
  patterns.statusFilter.lastIndex = 0;
  while ((match = patterns.statusFilter.exec(query)) !== null) {
    const status = match[1].toLowerCase().replace(/[\s_]+/g, '_');
    filters.push({
      field: "status",
      operator: "equals",
      value: status
    });
  }

  // Process property type filters
  patterns.propertyType.lastIndex = 0;
  while ((match = patterns.propertyType.exec(query)) !== null) {
    const type = match[1].toLowerCase().replace(/[\s_]+/g, '_');
    filters.push({
      field: "propertyType",
      operator: "equals",
      value: type
    });
  }

  // Process occupancy status
  patterns.occupancyStatus.lastIndex = 0;
  while ((match = patterns.occupancyStatus.exec(query)) !== null) {
    filters.push({
      field: "occupancyStatus",
      operator: "equals",
      value: match[1].toLowerCase()
    });
  }

  // Process has advance filters
  patterns.hasAdvance.lastIndex = 0;
  while ((match = patterns.hasAdvance.exec(query)) !== null) {
    const hasAdvance = match[1].toLowerCase() !== "no";
    filters.push({
      field: "hasActiveAdvance",
      operator: "equals",
      value: hasAdvance
    });
  }

  // Process signature filters
  if (patterns.signature.test(query)) {
    const hasSignature = !query.includes("unsigned") && !query.includes("no signature");
    filters.push({
      field: "ownerSignature",
      operator: "equals",
      value: hasSignature
    });
  }

  // Process business entity filters
  if (patterns.businessEntity.test(query)) {
    filters.push({
      field: "ownerIsBusinessEntity",
      operator: "equals",
      value: true
    });
  }

  // If no specific patterns matched, treat it as a general text search
  if (filters.length === 0 && lowercaseQuery) {
    // Remove any attempted operators that didn't match
    const cleanQuery = lowercaseQuery.replace(/[><]=?|[:=]/g, '').trim();
    if (cleanQuery) {
      filters.push({
        field: "general",
        operator: "contains",
        value: cleanQuery
      });
    }
  }

  return filters;
}

// Helper function to parse date expressions
function parseDateExpression(dateStr: string): Date | null {
  const str = dateStr.toLowerCase().trim();
  const now = new Date();

  // Handle "in X months/days"
  const inPattern = /^(?:in\s+)?(\d+)\s+(months?|days?|weeks?|years?)$/;
  const inMatch = str.match(inPattern);
  if (inMatch) {
    const amount = parseInt(inMatch[1]);
    const unit = inMatch[2];
    const date = new Date();

    if (unit.startsWith("month")) {
      date.setMonth(date.getMonth() + amount);
    } else if (unit.startsWith("day")) {
      date.setDate(date.getDate() + amount);
    } else if (unit.startsWith("week")) {
      date.setDate(date.getDate() + (amount * 7));
    } else if (unit.startsWith("year")) {
      date.setFullYear(date.getFullYear() + amount);
    }

    return date;
  }

  // Handle month names (january, feb, march, etc.)
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const monthAbbr = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];

  // Check for month with optional year
  const monthPattern = /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{4})?$/i;
  const monthMatch = str.match(monthPattern);
  if (monthMatch) {
    const monthStr = monthMatch[1].toLowerCase();
    const year = monthMatch[2] ? parseInt(monthMatch[2]) : now.getFullYear();

    let monthIndex = months.indexOf(monthStr);
    if (monthIndex === -1) {
      monthIndex = monthAbbr.indexOf(monthStr);
    }

    if (monthIndex !== -1) {
      const date = new Date(year, monthIndex, 1);
      // If month is in the past this year, assume next year
      if (date < now && !monthMatch[2]) {
        date.setFullYear(date.getFullYear() + 1);
      }
      return date;
    }
  }

  // Handle year only (2025, 2024, etc.)
  const yearPattern = /^(\d{4})$/;
  const yearMatch = str.match(yearPattern);
  if (yearMatch) {
    return new Date(parseInt(yearMatch[1]), 0, 1);
  }

  // Handle relative dates (today, tomorrow, next month, next year)
  if (str === "today") {
    return now;
  } else if (str === "tomorrow") {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  } else if (str === "next month") {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  } else if (str === "next year") {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  } else if (str === "this month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (str === "this year") {
    return new Date(now.getFullYear(), 0, 1);
  }

  // Try to parse as a date string (YYYY-MM-DD, MM/DD/YYYY, etc.)
  const parsedDate = new Date(dateStr);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  return null;
}

// Apply filters to properties
export function applySmartFilters(properties: any[], filters: SearchFilter[]): any[] {
  if (filters.length === 0) return properties;

  return properties.filter(property => {
    // Check if all filters match
    return filters.every(filter => {
      const { field, operator, value } = filter;

      // General text search across multiple fields
      if (field === "general") {
        const searchValue = value.toLowerCase();
        return (
          property.propertyName?.toLowerCase().includes(searchValue) ||
          property.address?.fullAddress?.toLowerCase().includes(searchValue) ||
          property.address?.street?.toLowerCase().includes(searchValue) ||
          property.address?.city?.toLowerCase().includes(searchValue) ||
          property.address?.state?.toLowerCase().includes(searchValue) ||
          property.address?.zipCode?.toLowerCase().includes(searchValue) ||
          property.owner?.name?.toLowerCase().includes(searchValue) ||
          property.owner?.email?.toLowerCase().includes(searchValue) ||
          property.propertyType?.toLowerCase().includes(searchValue) ||
          property.status?.toLowerCase().includes(searchValue) ||
          property.occupancyStatus?.toLowerCase().includes(searchValue)
        );
      }

      // Get the actual value from the property
      let propertyValue = property[field];

      // Handle nested fields
      if (field === "ownerSignature" || field === "ownerIsBusinessEntity") {
        // These might be nested in owner object or at root level
        propertyValue = property[field] ?? property.owner?.[field];
      }

      // Apply operator
      switch (operator) {
        case "equals":
          return propertyValue === value;

        case "contains":
          return propertyValue?.toString().toLowerCase().includes(value.toLowerCase());

        case "gt":
          return propertyValue > value;

        case "lt":
          return propertyValue < value;

        case "gte":
          return propertyValue >= value;

        case "lte":
          return propertyValue <= value;

        case "before":
          return propertyValue && new Date(propertyValue) <= value;

        case "after":
          return propertyValue && new Date(propertyValue) >= value;

        case "in":
          return Array.isArray(value) && value.includes(propertyValue);

        default:
          return true;
      }
    });
  });
}

// Export helper to get search suggestions
export function getSearchSuggestions(): string[] {
  return [
    ">4000",
    "rent > 3000",
    "deposit < 5000",
    "ends by january",
    "lease ends in 3 months",
    "status:accepted",
    "under review",
    "occupied",
    "vacant",
    "has advance",
    "no advance",
    "apartment",
    "single family",
    "business owner",
    "unsigned"
  ];
}
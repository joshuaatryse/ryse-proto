import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractWithRetry(model: any, prompt: string, base64: string, retryCount = 0): Promise<any> {
  try {
    console.log(`Attempt ${retryCount + 1}: Calling Gemini API...`);

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64
        }
      }
    ]);

    console.log(`Success on attempt ${retryCount + 1}`);
    return result;
  } catch (error: any) {
    console.error(`Error on attempt ${retryCount + 1}:`, error?.message || error);

    // Check if it's an overload error and we have retries left
    if (retryCount < MAX_RETRIES &&
        (error?.message?.includes("overloaded") ||
         error?.message?.includes("503") ||
         error?.status === 503)) {
      const delay = INITIAL_DELAY * Math.pow(2, retryCount); // Exponential backoff
      console.log(`Gemini API overloaded, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(delay);
      return extractWithRetry(model, prompt, base64, retryCount + 1);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const propertyManagerId = formData.get("propertyManagerId") as string;

    if (!file || !propertyManagerId) {
      return NextResponse.json(
        { error: "Missing file or propertyManagerId" },
        { status: 400 }
      );
    }

    // Convert PDF to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    // Prepare the prompt for Gemini
    const prompt = `
    You are a lease agreement data extraction specialist. Analyze the attached PDF lease agreement and extract the following information. Return the data in a JSON format with these exact field names:

    {
      "propertyType": "single_family, multi_family, condo, townhouse, apartment, commercial, or other",
      "street": "Street address",
      "unit": "Unit or apartment number (if applicable)",
      "city": "City",
      "state": "State (2-letter code)",
      "zipCode": "ZIP code",
      "country": "Country (default to USA if not specified)",
      "bedrooms": "Number of bedrooms (integer)",
      "bathrooms": "Number of bathrooms (can be decimal like 1.5)",
      "monthlyRent": "Monthly rent amount in dollars and cents (e.g., 2500.00 for $2,500.00)",
      "securityDeposit": "Security deposit amount in dollars and cents (e.g., 2500.00 for $2,500.00)",
      "leaseStartDate": "Lease start date (YYYY-MM-DD format)",
      "leaseEndDate": "Lease end date (YYYY-MM-DD format)",
      "occupancyStatus": "occupied, vacant, or maintenance (default to occupied if tenant names present)",
      "ownerIsBusinessEntity": "true if owner is a business/company/LLC/corporation, false if individual person",
      "ownerName": "If business entity: company/business name. If individual: person's full name",
      "ownerSignatory": "If owner is a business entity: name of the person signing on behalf of the company (e.g., 'John Doe, Property Manager'). If individual: null",
      "ownerEmail": "Landlord/owner email address",
      "ownerPhone": "Landlord/owner phone number",
      "ownerSignature": "true if owner/landlord signature is present, false otherwise",
      "tenantName": "Tenant full name(s)",
      "tenantEmail": "Tenant email address",
      "tenantPhone": "Tenant phone number",
      "tenantSignature": "true if tenant signature is present, false otherwise",
      "petPolicy": "Pet policy details if mentioned",
      "utilities": "Utilities included or tenant responsibilities",
      "parkingSpaces": "Number of parking spaces if mentioned",
      "additionalTerms": "Any important additional terms or conditions"
    }

    Important instructions:
    1. Extract only information that is explicitly stated in the document
    2. For missing fields, use null
    3. Convert all dates to YYYY-MM-DD format
    4. For monetary amounts (rent, security deposit): extract the exact dollar amount including cents (e.g., if lease says $2,500.00, return 2500.00)
    5. For bedrooms: extract as integer (e.g., 2)
    6. For bathrooms: can be decimal (e.g., 1.5 for one and a half bathrooms)
    7. For property type, choose the closest match from the allowed values
    8. State should be a 2-letter code (e.g., CA, NY, TX)
    9. Default country to "USA" if not mentioned
    10. Default occupancyStatus to "occupied" if tenant information is present
    11. Look for signature lines or actual signatures - set ownerSignature to true if landlord/owner signature is present
    12. Set tenantSignature to true if tenant signature is present
    13. DO NOT extract squareFeet, yearBuilt, estimatedValue, purchasePrice, or purchaseDate as these are typically not in lease documents
    14. CRITICAL for street address: ALWAYS spell out ALL abbreviations completely. Examples:
        - "123 Main St." → "123 Main Street"
        - "456 Oak Ave." → "456 Oak Avenue"
        - "789 First Rd." → "789 First Road"
        - "321 Elm Blvd." → "321 Elm Boulevard"
        - "N.E. 5th St" → "Northeast 5th Street"
        - "100 S. Main" → "100 South Main"
        - "W. Broadway" → "West Broadway"
        - "Apt" → "Apartment"
        - "Ste" → "Suite"
        - Common abbreviations to expand: St → Street, Ave → Avenue, Rd → Road, Blvd → Boulevard, Dr → Drive, Ln → Lane, Ct → Court, Pl → Place, Pkwy → Parkway, Cir → Circle, Trl → Trail, N → North, S → South, E → East, W → West
        - The street field should have NO abbreviations and NO periods
    15. IMPORTANT: Determine if the landlord/owner is a business entity:
        - Look for terms like LLC, Inc, Corporation, Company, Management, Properties, Realty, Group, Partners, LP, LLP
        - If owner is a business: set ownerIsBusinessEntity to true, ownerName to the business name, and ownerSignatory to the person's name and title who signed
        - If owner is an individual: set ownerIsBusinessEntity to false, ownerName to the person's name, and ownerSignatory to null
        - Example 1: "ABC Properties LLC, by John Smith, Manager" → ownerIsBusinessEntity: true, ownerName: "ABC Properties LLC", ownerSignatory: "John Smith, Manager"
        - Example 2: "Jane Doe" → ownerIsBusinessEntity: false, ownerName: "Jane Doe", ownerSignatory: null

    Please analyze the document and return only the JSON object with the extracted data.
    `;

    // Initialize the model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.95,
        maxOutputTokens: 8192, // Increased to handle full JSON response
      }
    });

    // Call Gemini API with retry logic
    console.log("Calling Gemini API with prompt length:", prompt.length);
    console.log("PDF base64 length:", base64.length);

    const result = await extractWithRetry(model, prompt, base64);
    const response = await result.response;
    const extractedText = response.text();

    console.log("Gemini Response:", extractedText);
    console.log("Response length:", extractedText.length);

    // Check if response was truncated
    if (extractedText.length < 100) {
      console.error("Response appears to be truncated. Length:", extractedText.length);
      return NextResponse.json(
        { error: "AI response was incomplete. Please try again." },
        { status: 500 }
      );
    }

    // Parse the JSON from the response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = extractedText.match(/```json\n?([\s\S]*?)\n?```/) ||
                       extractedText.match(/```\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1] : extractedText;

      console.log("Attempting to parse JSON:", jsonString.substring(0, 200) + "...");

      extractedData = JSON.parse(jsonString);
      console.log("Successfully parsed JSON data");
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error("Raw response that failed to parse (first 500 chars):", extractedText.substring(0, 500));

      // Try to extract JSON object directly
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          console.log("Attempting to parse extracted JSON object (first 200 chars):", jsonMatch[0].substring(0, 200));
          extractedData = JSON.parse(jsonMatch[0]);
          console.log("Successfully parsed JSON on second attempt");
        } catch (secondError) {
          console.error("Second parse attempt failed:", secondError);

          // Check if it's a truncation issue
          if (!jsonMatch[0].includes("}") || jsonMatch[0].lastIndexOf("{") > jsonMatch[0].lastIndexOf("}")) {
            return NextResponse.json(
              { error: "AI response was incomplete. Please try again." },
              { status: 500 }
            );
          }

          return NextResponse.json(
            { error: "Failed to parse extracted data" },
            { status: 500 }
          );
        }
      } else {
        console.error("No JSON object found in response");
        return NextResponse.json(
          { error: "AI did not return valid JSON. Please try again." },
          { status: 500 }
        );
      }
    }

    // Function to expand street abbreviations
    const expandStreetAbbreviations = (address: string): string => {
      if (!address) return "";

      let expanded = address
        // Remove periods first
        .replace(/\./g, '')
        // Expand directional abbreviations (case insensitive, word boundaries)
        .replace(/\bN\b/gi, 'North')
        .replace(/\bS\b/gi, 'South')
        .replace(/\bE\b/gi, 'East')
        .replace(/\bW\b/gi, 'West')
        .replace(/\bNE\b/gi, 'Northeast')
        .replace(/\bNW\b/gi, 'Northwest')
        .replace(/\bSE\b/gi, 'Southeast')
        .replace(/\bSW\b/gi, 'Southwest')
        // Expand street type abbreviations (at word boundaries)
        .replace(/\bSt\b/gi, 'Street')
        .replace(/\bAve\b/gi, 'Avenue')
        .replace(/\bRd\b/gi, 'Road')
        .replace(/\bBlvd\b/gi, 'Boulevard')
        .replace(/\bDr\b/gi, 'Drive')
        .replace(/\bLn\b/gi, 'Lane')
        .replace(/\bCt\b/gi, 'Court')
        .replace(/\bPl\b/gi, 'Place')
        .replace(/\bPkwy\b/gi, 'Parkway')
        .replace(/\bCir\b/gi, 'Circle')
        .replace(/\bTrl\b/gi, 'Trail')
        .replace(/\bHwy\b/gi, 'Highway')
        .replace(/\bApt\b/gi, 'Apartment')
        .replace(/\bSte\b/gi, 'Suite')
        .trim();

      return expanded;
    };

    // Clean and validate the extracted data
    const cleanedData = {
      propertyType: extractedData.propertyType || "single_family",
      street: expandStreetAbbreviations(extractedData.street || ""),
      unit: extractedData.unit || "",
      city: extractedData.city || "",
      state: extractedData.state || "",
      zipCode: extractedData.zipCode || "",
      country: extractedData.country || "USA",
      bedrooms: extractedData.bedrooms ? String(Math.floor(Number(extractedData.bedrooms))) : "0",
      bathrooms: extractedData.bathrooms ? String(extractedData.bathrooms) : "0",
      monthlyRent: extractedData.monthlyRent ? String(extractedData.monthlyRent) : "",
      securityDeposit: extractedData.securityDeposit ? String(extractedData.securityDeposit) : "",
      leaseStartDate: extractedData.leaseStartDate || "",
      leaseEndDate: extractedData.leaseEndDate || "",
      occupancyStatus: extractedData.occupancyStatus || "occupied",
      ownerIsBusinessEntity: extractedData.ownerIsBusinessEntity || false,
      ownerName: extractedData.ownerName || "",
      ownerSignatory: extractedData.ownerSignatory || "",
      ownerEmail: extractedData.ownerEmail || "",
      ownerPhone: extractedData.ownerPhone || "",
      ownerSignature: extractedData.ownerSignature || false,
      tenantName: extractedData.tenantName || "",
      tenantEmail: extractedData.tenantEmail || "",
      tenantPhone: extractedData.tenantPhone || "",
      tenantSignature: extractedData.tenantSignature || false,
    };

    return NextResponse.json({
      success: true,
      extracted: cleanedData,
      raw: extractedData, // Include raw data for debugging
    });

  } catch (error) {
    console.error("Error in extract-lease API:", error);

    let errorMessage = "Failed to process lease document";
    if (error instanceof Error) {
      if (error.message.includes("overloaded") || error.message.includes("503")) {
        errorMessage = "AI service is currently busy. Please try again in a few moments.";
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage = "Network error occurred. Please check your connection and try again.";
      } else if (error.message.includes("API key")) {
        errorMessage = "API configuration error. Please contact support.";
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
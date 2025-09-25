# Google Maps API Setup for Street View

## Required APIs
To use the Street View component in this application, you need to enable the following Google Maps APIs:

1. **Maps JavaScript API** - Core maps functionality
2. **Geocoding API** - Convert addresses to coordinates
3. **Street View Static API** - Display street view imagery
4. **Places API** - Location services

## Setup Instructions

### 1. Get a Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "API Key"
5. Copy your API key

### 2. Enable Required APIs
1. Go to "APIs & Services" > "Library"
2. Search for and enable each of these APIs:
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Street View Static API**
   - **Places API**

### 3. Configure API Key (Recommended)
1. Go back to "APIs & Services" > "Credentials"
2. Click on your API key
3. Under "Application restrictions", select "HTTP referrers"
4. Add your allowed referrers:
   - `http://localhost:3000/*`
   - `http://localhost:3001/*`
   - Your production domain (e.g., `https://yourdomain.com/*`)
5. Under "API restrictions", select "Restrict key"
6. Select the APIs you enabled in step 2
7. Click "Save"

### 4. Add to Environment Variables
1. Create or edit `.env.local` in your project root
2. Add your API key:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```
3. Restart your development server

## Troubleshooting

### "This API project is not authorized to use this API"
- Make sure you've enabled all required APIs in the Google Cloud Console
- Wait a few minutes after enabling APIs for changes to propagate

### "API key not valid"
- Check that your API key is correctly copied
- Verify domain restrictions match your current URL
- Ensure the key has access to the required APIs

### Street View Not Available
- Some addresses may not have Street View coverage
- The component will show a fallback UI when Street View is unavailable

## Costs
- Google Maps APIs have a free tier with $200 monthly credit
- Monitor usage in Google Cloud Console to avoid unexpected charges
- Consider implementing usage limits in production

## Security Notes
- Always restrict your API key to specific domains
- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- Consider implementing backend proxy for production use to hide API key
# Mapbox Setup Guide

## Quick Fix for Map Loading Error

If you're seeing a Mapbox error, follow these steps:

### 1. Get a Free Mapbox Token

1. Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Sign up for a free account (50,000 free map loads per month)
3. Create a new access token
4. Copy the token (starts with `pk.`)

### 2. Add Token to Your Project

Create a file called `.env.local` in your project root (same level as `package.json`):

```bash
# .env.local
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_actual_token_here
```

### 3. Restart Your Development Server

```bash
npm run dev
```

### 4. Test the Batch Design Feature

1. Go to `/batch-design` in your app
2. The 3D map should now load properly
3. You can start drawing catchments!

## Troubleshooting

### Still Getting Errors?

1. **Check your token**: Make sure it starts with `pk.` and is valid
2. **Check file location**: `.env.local` should be in the project root
3. **Restart server**: Always restart after adding environment variables
4. **Check console**: Look for specific error messages in browser console

### Common Issues

- **"Mapbox access token not found"**: Token not set in environment variables
- **"Invalid token"**: Token is incorrect or expired
- **"Network error"**: Check internet connection
- **"CORS error"**: Usually resolves with a valid token

### Alternative: Use Demo Mode

If you want to test without a Mapbox token, you can temporarily modify the component to show a placeholder instead of the map.

## Need Help?

- Check the browser console for detailed error messages
- Verify your token at [https://account.mapbox.com/](https://account.mapbox.com/)
- Make sure your `.env.local` file is in the correct location
- Restart your development server after making changes

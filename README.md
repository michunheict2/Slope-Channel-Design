# Slope Channel Design Tool

A Next.js + TypeScript application for designing slope drainage channels using the Rational Method and Manning's equation, with support for Hong Kong IDF curves.

## Features

- **Hong Kong IDF Curves**: Implementation of GEO Technical Guidance Note No. 30 (2023) IDF curves
- **Climate Change Adjustment**: Automatic +28.1% uplift for permanent designs (excluded for temporary designs)
- **Rational Method**: Peak flow calculations using catchment area, runoff coefficient, and rainfall intensity
- **Manning's Equation**: Channel capacity calculations for trapezoidal and U-shaped channels
- **SI Units**: All calculations performed in SI units with proper conversions
- **Interactive UI**: Real-time calculations with detailed results display

## Hong Kong IDF Curve Implementation

The application implements the official Hong Kong IDF curve formula from GEO TGN 30 (2023):

**Formula**: `i = a / (t + b)^c`

Where:
- `i` = rainfall intensity (mm/hr)
- `t` = duration in minutes (time of concentration)
- `a`, `b`, `c` = constants for specific return period

**Climate Change**: +28.1% adjustment automatically applied unless flagged as "temporary design"

**Return Periods**: 2, 5, 10, 20, 50, 100, 200, 500, 1000 years

**Reference**: [GEO Technical Guidance Note No. 30 (2023)](https://www.cedd.gov.hk/eng/publications/geo/geo-publications/geo-technical-guidance-notes.html)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. **Catchment Properties**: Enter catchment area and runoff coefficient
2. **Rainfall Properties**: 
   - Choose between manual intensity input or Hong Kong IDF curves
   - Select return period and duration for IDF calculations
   - Toggle temporary design to exclude climate change adjustment
3. **Channel Properties**: Define channel geometry (trapezoidal or U-shaped)
4. **Calculate**: View peak flow, channel capacity, and design status

## Testing

Run the test suite:

```bash
npm test
```

The IDF curve calculations are thoroughly tested with various return periods and durations to ensure accuracy.

## Project Structure

```
src/
├── app/design/
│   ├── components/          # UI components
│   ├── hooks/              # Custom hooks (Rational, Manning, IDF)
│   └── utils/              # Utility functions
├── components/ui/          # Reusable UI components
└── lib/                    # Shared utilities

public/data/
└── idf_constants_hk.json   # Hong Kong IDF curve constants
```

## Technical Details

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI**: Tailwind CSS with custom components
- **Testing**: Vitest
- **Units**: SI units throughout with proper conversions
- **Climate Change**: Based on latest Hong Kong guidance (2023)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

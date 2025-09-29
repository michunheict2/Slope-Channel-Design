"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, MapPin, Calculator, Download } from "lucide-react";

/**
 * Example Usage Component
 * 
 * This component demonstrates how to use the batch design feature
 * and provides step-by-step instructions for beginners.
 */
export default function ExampleUsage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          How to Use Batch Design
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Draw Catchments and Channels
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Use the drawing toolbar to create catchment areas (polygons) and channel alignments (lines) on the 3D map. 
                Click to create vertices, double-click to finish. Each feature automatically calculates area, length, slope, and flow path length from highest to lowest elevation points.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Configure Catchment Properties
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Click the edit button on each catchment to set properties like:
                average slope, flow path length, surface type, rainfall parameters, 
                and channel specifications. The system will show if a catchment is ready for calculation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Run Batch Calculations
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Click &quot;Run Batch Design&quot; to process all catchments using the Rational Method 
                and Manning&apos;s equation. The system will calculate peak flows, required channel 
                sizes, and design status for each catchment.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-semibold text-sm">4</span>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Download className="h-4 w-4" />
                View Results & Export
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                View detailed results in the table and click &quot;Show Detailed Calculations&quot; to see 
                step-by-step calculations for each catchment. Export to CSV or Excel format with 
                all calculation details, design status, and warnings.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Key Features:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• <strong>3D Terrain Visualization:</strong> See your catchments and channels in realistic 3D terrain</li>
            <li>• <strong>Drawing Toolbar:</strong> Select, draw catchments, and draw channel alignments</li>
            <li>• <strong>Automatic Calculations:</strong> Areas, lengths, slopes, and flow paths calculated using actual terrain distances</li>
            <li>• <strong>Batch Processing:</strong> Process multiple catchments simultaneously</li>
            <li>• <strong>Step-by-Step Calculations:</strong> Detailed breakdown of all calculation steps</li>
            <li>• <strong>Comprehensive Results:</strong> Design validation with clear status indicators</li>
            <li>• <strong>Export Options:</strong> CSV and Excel export with all calculation details</li>
            <li>• <strong>Error Handling:</strong> Clear error messages and design status indicators</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

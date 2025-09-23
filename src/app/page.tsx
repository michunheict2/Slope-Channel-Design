import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Slope Drainage Design</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Professional hydrology calculations for trapezoidal channel design using the Rational Method and Manning&apos;s equation.
          </p>
          <Link href="/design">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Designing
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rational Method</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Calculate peak flow using the Rational Method with proper unit conversions and runoff coefficients.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manning&apos;s Equation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Solve for normal depth and channel capacity using Manning&apos;s equation with numerical methods.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trapezoidal Geometry</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Calculate cross-sectional area, wetted perimeter, and hydraulic radius for trapezoidal channels.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Week 1 Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Week 1 Implementation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">✓ Completed Features</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Next.js 15 with TypeScript and App Router</li>
                    <li>• Tailwind CSS and shadcn/ui components</li>
                    <li>• Trapezoidal channel geometry calculations</li>
                    <li>• Rational Method implementation</li>
                    <li>• Manning&apos;s equation with bisection solver</li>
                    <li>• Unit conversion utilities</li>
                    <li>• Form validation and error handling</li>
                    <li>• Responsive design</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">🔄 Week 2 Planned</h4>
                  <ul className="text-sm space-y-1">
                    <li>• IDF curve calculations</li>
                    <li>• Multiple surface type support</li>
                    <li>• Additional channel shapes</li>
                    <li>• Advanced design validation</li>
                    <li>• Export and reporting features</li>
                    <li>• Design optimization</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Hydrology Methods</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Rational Method: Qp = C × i × A</li>
                  <li>• Manning&apos;s Equation: Q = (1/n) × A × R^(2/3) × S^(1/2)</li>
                  <li>• Bisection numerical solver</li>
                  <li>• SI unit system throughout</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Technology Stack</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Next.js 15 with App Router</li>
                  <li>• TypeScript for type safety</li>
                  <li>• Tailwind CSS for styling</li>
                  <li>• shadcn/ui component library</li>
                  <li>• Vitest for testing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
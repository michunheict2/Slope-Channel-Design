"use client";

export default function TestEnvPage() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variable Test</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Mapbox Token Status:</h2>
        <p><strong>Has Token:</strong> {token ? 'Yes' : 'No'}</p>
        <p><strong>Token Length:</strong> {token?.length || 0}</p>
        <p><strong>Token Preview:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}</p>
        <p><strong>Full Token:</strong> {token || 'Not found'}</p>
      </div>
      
      <div className="mt-4">
        <a href="/batch-design" className="text-blue-600 underline">
          Go to Batch Design
        </a>
      </div>
    </div>
  );
}

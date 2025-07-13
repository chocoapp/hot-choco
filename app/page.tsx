import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Hot Choco</h1>
          <p className="text-lg text-gray-600 mb-8">
            User Flow Visualization System
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Available Visualizations</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">Buyer Order Flow</h3>
              <p className="text-sm text-blue-700 mb-3">
                Complete order placement flow for buyers on web.spezi.app
              </p>
              <Link
                href="/graph"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View Graph →
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center sm:text-left">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Features</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Interactive flow diagrams with React Flow</li>
            <li>• Screenshot integration for each screen</li>
            <li>• Prerequisites and actions documentation</li>
            <li>• Role-based color coding</li>
            <li>• Responsive design with Tailwind CSS</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

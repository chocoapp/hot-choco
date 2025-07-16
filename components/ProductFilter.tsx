import { useState, useEffect } from 'react';
import { FlowNodeData } from '../types/flow';

interface ProductFilterProps {
  nodes: FlowNodeData[];
  onFilterChange: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  products: string[];
  sections: string[];
  riskLevels: string[];
}

export default function ProductFilter({ nodes, onFilterChange }: ProductFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    products: [],
    sections: [],
    riskLevels: []
  });

  // Extract unique values from nodes
  const uniqueProducts = [...new Set(nodes.map(node => node.product).filter(Boolean))] as string[];
  const uniqueSections = [...new Set(nodes.map(node => node.section).filter(Boolean))] as string[];
  const riskLevels = ['low', 'medium', 'high'];

  // Apply filters whenever they change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleProductChange = (product: string) => {
    setFilters(prev => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter(p => p !== product)
        : [...prev.products, product]
    }));
  };

  const handleSectionChange = (section: string) => {
    setFilters(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
    }));
  };

  const handleRiskLevelChange = (riskLevel: string) => {
    setFilters(prev => ({
      ...prev,
      riskLevels: prev.riskLevels.includes(riskLevel)
        ? prev.riskLevels.filter(r => r !== riskLevel)
        : [...prev.riskLevels, riskLevel]
    }));
  };

  const clearFilters = () => {
    setFilters({
      products: [],
      sections: [],
      riskLevels: []
    });
  };

  const hasActiveFilters = filters.products.length > 0 || filters.sections.length > 0 || filters.riskLevels.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter Screens</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Products Filter */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Products</h4>
          <div className="space-y-2">
            {uniqueProducts.map(product => (
              <label key={product} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.products.includes(product)}
                  onChange={() => handleProductChange(product)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {product?.replace('-', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sections Filter */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Sections</h4>
          <div className="space-y-2">
            {uniqueSections.map(section => (
              <label key={section} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.sections.includes(section)}
                  onChange={() => handleSectionChange(section)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {section?.replace('-', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Risk Levels Filter */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Risk Levels</h4>
          <div className="space-y-2">
            {riskLevels.map(riskLevel => (
              <label key={riskLevel} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.riskLevels.includes(riskLevel)}
                  onChange={() => handleRiskLevelChange(riskLevel)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    riskLevel === 'low' ? 'bg-green-500' :
                    riskLevel === 'medium' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  {riskLevel} Risk
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.products.map(product => (
              <span
                key={product}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {product.replace('-', ' ')}
                <button
                  onClick={() => handleProductChange(product)}
                  className="ml-1 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.sections.map(section => (
              <span
                key={section}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {section.replace('-', ' ')}
                <button
                  onClick={() => handleSectionChange(section)}
                  className="ml-1 hover:text-green-900"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.riskLevels.map(riskLevel => (
              <span
                key={riskLevel}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                  riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}
              >
                {riskLevel} risk
                <button
                  onClick={() => handleRiskLevelChange(riskLevel)}
                  className="ml-1 hover:opacity-75"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
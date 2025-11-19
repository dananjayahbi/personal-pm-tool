import React from 'react';

const TableSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 px-6 py-4">
          <div className="col-span-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="col-span-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="col-span-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="col-span-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="col-span-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4">
            <div className="col-span-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="col-span-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
            <div className="col-span-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </div>
            <div className="col-span-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
            <div className="col-span-1 flex gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;

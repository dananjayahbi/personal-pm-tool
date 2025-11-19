import React from 'react';

const KanbanSkeleton: React.FC = () => {
  const columns = ['To Do', 'In Progress', 'Done'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column, colIndex) => (
        <div key={colIndex} className="bg-gray-50 rounded-2xl p-4">
          {/* Column Header */}
          <div className="mb-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
          </div>

          {/* Task Cards */}
          <div className="space-y-3">
            {[...Array(3)].map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="bg-white rounded-xl p-4 border border-gray-200"
              >
                {/* Task Title */}
                <div className="h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
                
                {/* Task Description */}
                <div className="space-y-2 mb-3">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Task Button Skeleton */}
          <div className="mt-3">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanSkeleton;

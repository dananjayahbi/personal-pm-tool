import React from 'react';

const FullPageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="spinner">
          <div className="spinner-circle"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
      <style jsx>{`
        .spinner {
          position: relative;
          width: 60px;
          height: 60px;
        }
        
        .spinner-circle {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 4px solid #e5e7eb;
          border-top-color: #67B97E;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default FullPageLoader;

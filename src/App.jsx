import React, { useState } from 'react';

const App = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-600 mb-4">
            GetBestAI
          </h1>
          <p className="text-lg text-gray-700">
            Умный подбор AI моделей под ваши задачи
          </p>
        </div>
        
        <div className="text-center">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg">
            Начать подбор
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
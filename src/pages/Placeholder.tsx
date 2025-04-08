import React from 'react';
import { Wrench } from 'lucide-react';

function Placeholder() {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-8 text-center">
        <Wrench className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">More Tools Coming Soon</h2>
        <p className="text-gray-600">
          We're working on adding more useful utilities to make your work easier.
          Stay tuned for updates!
        </p>
      </div>
    </div>
  );
}

export default Placeholder;
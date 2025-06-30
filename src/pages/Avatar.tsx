
import React from 'react';
import AvatarAssistant from '../components/AvatarAssistant';

const Avatar = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Digital Avatar Assistant</h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Interact with our advanced AI assistant that speaks multiple languages and can help you with all aspects of student accommodation. Use voice commands, text input, or quick actions to get personalized assistance.
          </p>
        </div>
        
        <AvatarAssistant />
      </div>
    </div>
  );
};

export default Avatar;

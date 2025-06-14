import { useState, useEffect } from 'react';

interface StreamingAnswerProps {
  text: string;
  speed?: number;
}

export const StreamingAnswer: React.FC<StreamingAnswerProps> = ({ 
  text = '', 
  speed = 30 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Reset states
    setDisplayedText('');
    setIsComplete(false);

    // Validate input
    if (!text) return;

    const characters = Array.from(text.trim());
    let currentIndex = 0;

    // Add inside useEffect, after text validation
    console.log('Input text:', text);
    console.log('Characters array:', characters);

    const timer = setInterval(() => {
      if (currentIndex < characters.length) {
        setDisplayedText(prev => prev + characters[currentIndex]);
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    // Cleanup
    return () => {
      clearInterval(timer);
    };
  }, [text, speed]);

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-4">Answer:</h2>
      <div className="prose max-w-none whitespace-pre-wrap">
        {displayedText || ' '}  {/* Ensure there's always at least a space */}
        {!isComplete && (
          <span className="inline-block w-2 h-4 ml-1 bg-foreground animate-pulse" />
        )}
      </div>
    </div>
  );
};
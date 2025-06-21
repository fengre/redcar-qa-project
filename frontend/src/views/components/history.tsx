import { HistoryItem } from '../../models/types';

interface HistoryProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

export const History: React.FC<HistoryProps> = ({ items, onSelect }) => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">History</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="font-medium">{item.question.question}</p>
              <span className="text-sm text-gray-500">
                {new Date(item.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate">{item.answer.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
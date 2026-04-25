import { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Pencil, Check, X } from 'lucide-react';

interface EditableTextProps {
  fieldKey: string;
  defaultValue: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  multiline?: boolean;
}

const EditableText = ({
  fieldKey,
  defaultValue,
  className = '',
  tag: Tag = 'p',
  multiline = true,
}: EditableTextProps) => {
  const { isAdminMode, pageContent, updateField } = useAdmin();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<'saved' | 'error' | null>(null);

  const currentValue = pageContent[fieldKey] ?? defaultValue;

  const handleEdit = () => {
    setDraft(currentValue);
    setSaveMsg(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setSaveMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await updateField(fieldKey, draft);
    setSaving(false);
    if (ok) {
      setSaveMsg('saved');
      setEditing(false);
      setTimeout(() => setSaveMsg(null), 2000);
    } else {
      setSaveMsg('error');
    }
  };

  if (!isAdminMode) {
    return <Tag className={className}>{currentValue}</Tag>;
  }

  if (editing) {
    return (
      <div className="relative w-full group">
        {multiline ? (
          <textarea
            className="w-full min-h-[80px] p-2 border-2 border-blue-500 rounded text-sm bg-white text-gray-900 resize-y focus:outline-none"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
          />
        ) : (
          <input
            className="w-full p-2 border-2 border-blue-500 rounded text-sm bg-white text-gray-900 focus:outline-none"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
          />
        )}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-full transition-colors"
          >
            <Check size={12} />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-full transition-colors"
          >
            <X size={12} />
            Cancel
          </button>
          {saveMsg === 'error' && (
            <span className="text-red-500 text-xs">Failed to save!</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-start gap-2 w-full group">
      <Tag className={className}>{currentValue}</Tag>
      <button
        onClick={handleEdit}
        title="Edit this text"
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 transition-all duration-200 shadow-lg mt-0.5"
      >
        <Pencil size={12} />
      </button>
      {saveMsg === 'saved' && (
        <span className="text-green-500 text-xs self-center">✓ Saved!</span>
      )}
    </div>
  );
};

export default EditableText;

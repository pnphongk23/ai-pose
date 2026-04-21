'use client';

import { useCallback, useState } from 'react';
import { Upload, Plus, X } from 'lucide-react';
import NavButton from '@/components/NavButton';
import ActionButton from '@/components/ActionButton';

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'];

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error || payload.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

export default function AdminCommunityPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({
    name: '',
    tags: '',
    difficulty: 'beginner',
    bodyParts: '',
    description: '',
    status: 'draft',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Auto-fill name from filename (strip extension)
    const nameFromFile = file.name.replace(/\.[^/.]+$/, '');
    setForm((prev) => ({ ...prev, name: nameFromFile }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result || '');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleClearImage = useCallback(() => {
    setSelectedFile(null);
    setImagePreview('');
  }, []);

  const submitForm = useCallback(async () => {
    // Validation
    if (!selectedFile) {
      setError('Vui lòng chọn hình ảnh.');
      return;
    }
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên pose.');
      return;
    }
    if (!form.bodyParts.trim()) {
      setError('Vui lòng nhập các bộ phận cơ thể.');
      return;
    }

    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('name', form.name);
      formData.append('tags', form.tags);
      formData.append('difficulty', form.difficulty);
      formData.append('bodyParts', form.bodyParts);
      formData.append('description', form.description);
      formData.append('status', form.status);

      const baseUrl = process.env.NEXT_PUBLIC_POSE_SERVER_URL ?? 'http://localhost:3000';
      const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '';

      const response = await fetch(`${baseUrl}/api/admin/community/poses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
        },
        body: formData,
      });

      await parseResponse(response);
      setNotice('Đã tải pose lên thành công.');

      // Reset form
      setForm({
        name: '',
        tags: '',
        difficulty: 'beginner',
        bodyParts: '',
        description: '',
        status: 'draft',
      });
      setSelectedFile(null);
      setImagePreview('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [form, selectedFile]);

  return (
    <div className="h-full flex flex-col px-4 py-4 safe-top">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <NavButton />
          <h1 className="text-[18px] font-extrabold tracking-neo uppercase">
            ADMIN COMMUNITY
          </h1>
        </div>
      </div>

      <div className="rounded-2xl neo-border bg-white p-4 neo-shadow-md mb-4">
        <div className="text-[12px] font-bold tracking-neo-wide uppercase pb-3">
          Upload Pose
        </div>

        <div className="flex flex-col gap-3">
          {/* Image Input with Preview */}
          <div className="rounded-xl neo-border bg-gray-50 p-3">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-auto rounded-lg max-h-64 object-contain"
                />
                <button
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 rounded-lg neo-border bg-accent-pink p-1.5 neo-press"
                  title="Clear image"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                <Upload size={20} className="mb-2 opacity-50" />
                <span className="text-[11px] font-bold opacity-70">
                  Chọn hình ảnh
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Name Input */}
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Pose name"
            className="w-full px-3 py-2 rounded-xl neo-border text-[12px] font-medium focus:outline-none"
          />

          {/* Tags Input */}
          <input
            value={form.tags}
            onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
            placeholder="Tags (comma-separated)"
            className="w-full px-3 py-2 rounded-xl neo-border text-[12px] font-medium focus:outline-none"
          />

          {/* Difficulty Select */}
          <select
            value={form.difficulty}
            onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl neo-border text-[12px] font-medium"
          >
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Body Parts Input */}
          <input
            value={form.bodyParts}
            onChange={(e) => setForm((prev) => ({ ...prev, bodyParts: e.target.value }))}
            placeholder="Body parts (comma-separated)"
            className="w-full px-3 py-2 rounded-xl neo-border text-[12px] font-medium focus:outline-none"
          />

          {/* Description Textarea */}
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            rows={3}
            className="w-full px-3 py-2 rounded-xl neo-border text-[12px] font-medium focus:outline-none resize-none"
          />

          {/* Status Select */}
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl neo-border text-[12px] font-medium"
          >
            <option value="active">ACTIVE</option>
            <option value="inactive">INACTIVE</option>
          </select>

          {/* Submit Button */}
          <ActionButton
            onClick={submitForm}
            icon={Plus}
            bg="bg-accent-yellow"
            disabled={submitting}
          >
            {submitting ? 'UPLOADING...' : 'UPLOAD POSE'}
          </ActionButton>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl neo-border bg-accent-pink px-3 py-2 text-[11px] font-bold mb-3">
          {error}
        </div>
      )}

      {/* Success Message */}
      {notice && (
        <div className="rounded-xl neo-border bg-accent-green px-3 py-2 text-[11px] font-bold mb-3">
          {notice}
        </div>
      )}
    </div>
  );
}

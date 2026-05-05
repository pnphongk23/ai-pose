'use client';

import { useCallback, useEffect, useState } from 'react';
import { Upload, Plus, X, RefreshCw } from 'lucide-react';
import NavButton from '@/components/NavButton';
import ActionButton from '@/components/ActionButton';

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'];
const STATUS_BADGE = {
  draft: 'bg-accent-yellow',
  published: 'bg-accent-green',
};

const COMMUNITY_ADMIN_API = '/api/admin/community/poses';

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
  const [poses, setPoses] = useState([]);
  const [loadingPoses, setLoadingPoses] = useState(false);

  const fetchPoses = useCallback(async () => {
    setLoadingPoses(true);
    try {
      const res = await fetch(`${COMMUNITY_ADMIN_API}?limit=100`, {
        cache: 'no-store',
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) setPoses(payload.data ?? []);
    } finally {
      setLoadingPoses(false);
    }
  }, []);

  useEffect(() => { fetchPoses(); }, [fetchPoses]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setForm((prev) => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, '') }));
    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target?.result || '');
    reader.readAsDataURL(file);
  }, []);

  const handleClearImage = useCallback(() => {
    setSelectedFile(null);
    setImagePreview('');
  }, []);

  const submitForm = useCallback(async () => {
    if (!selectedFile) { setError('Vui lòng chọn hình ảnh.'); return; }
    if (!form.name.trim()) { setError('Vui lòng nhập tên pose.'); return; }
    if (!form.bodyParts.trim()) { setError('Vui lòng nhập các bộ phận cơ thể.'); return; }

    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      const normalizeList = (raw) =>
        raw
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('name', form.name.trim());
      formData.append('tags', JSON.stringify(normalizeList(form.tags)));
      formData.append('difficulty', form.difficulty);
      formData.append('bodyParts', JSON.stringify(normalizeList(form.bodyParts)));
      formData.append('description', form.description || '');
      formData.append('status', form.status);

      const response = await fetch(COMMUNITY_ADMIN_API, {
        method: 'POST',
        body: formData,
      });

      await parseResponse(response);
      setNotice('Đã tải pose lên thành công.');
      setForm({ name: '', tags: '', difficulty: 'beginner', bodyParts: '', description: '', status: 'draft' });
      setSelectedFile(null);
      setImagePreview('');
      fetchPoses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [form, selectedFile, fetchPoses]);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b-2 border-black">
        <NavButton />
        <h1 className="text-xl font-extrabold tracking-neo uppercase">Admin — Community Poses</h1>
      </div>

      {/* Main: 2-column layout */}
      <div className="flex flex-1 gap-6 p-6 items-start">

        {/* LEFT: Upload Form — fixed width */}
        <div className="w-80 flex-shrink-0">
          <div className="rounded-2xl neo-border bg-white p-5 neo-shadow-md">
            <div className="text-[13px] font-extrabold tracking-neo-wide uppercase mb-4">
              Upload Pose
            </div>

            <div className="flex flex-col gap-3">
              {/* Image */}
              <div className="rounded-xl neo-border bg-gray-50">
                {imagePreview ? (
                  <div className="relative p-2">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-contain rounded-lg" />
                    <button
                      onClick={handleClearImage}
                      className="absolute top-3 right-3 rounded-lg neo-border bg-accent-pink p-1.5 neo-press"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 cursor-pointer">
                    <Upload size={20} className="mb-2 opacity-40" />
                    <span className="text-[11px] font-bold opacity-60">Chọn hình ảnh</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>

              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Pose name *"
                className="w-full px-3 py-2 rounded-xl neo-border text-[12px] font-medium focus:outline-none"
              />
              <input
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="Tags (comma-separated)"
                className="w-full px-3 py-2 rounded-xl neo-border text-[12px] font-medium focus:outline-none"
              />
              <select
                value={form.difficulty}
                onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl neo-border text-[12px] font-medium"
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                ))}
              </select>
              <input
                value={form.bodyParts}
                onChange={(e) => setForm((p) => ({ ...p, bodyParts: e.target.value }))}
                placeholder="Body parts * (comma-separated)"
                className="w-full px-3 py-2 rounded-xl neo-border text-[12px] font-medium focus:outline-none"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                rows={3}
                className="w-full px-3 py-2 rounded-xl neo-border text-[12px] font-medium focus:outline-none resize-none"
              />
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl neo-border text-[12px] font-medium"
              >
                <option value="draft">DRAFT</option>
                <option value="published">PUBLISHED</option>
              </select>

              {error && (
                <div className="rounded-xl neo-border bg-accent-pink px-3 py-2 text-[11px] font-bold">
                  {error}
                </div>
              )}
              {notice && (
                <div className="rounded-xl neo-border bg-accent-green px-3 py-2 text-[11px] font-bold">
                  {notice}
                </div>
              )}

              <ActionButton onClick={submitForm} icon={Plus} bg="bg-accent-yellow" disabled={submitting}>
                {submitting ? 'UPLOADING...' : 'UPLOAD POSE'}
              </ActionButton>
            </div>
          </div>
        </div>

        {/* RIGHT: Pose List — fills remaining space */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl neo-border bg-white p-5 neo-shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[13px] font-extrabold tracking-neo-wide uppercase">
                All Poses
                <span className="ml-2 text-[11px] font-bold opacity-50">({poses.length})</span>
              </div>
              <button
                onClick={fetchPoses}
                disabled={loadingPoses}
                className="rounded-xl neo-border bg-gray-100 px-3 py-1.5 neo-press disabled:opacity-50 flex items-center gap-1.5 text-[11px] font-bold"
              >
                <RefreshCw size={11} className={loadingPoses ? 'animate-spin' : ''} />
                REFRESH
              </button>
            </div>

            {loadingPoses && poses.length === 0 ? (
              <div className="text-[12px] font-bold opacity-40 text-center py-16">Loading...</div>
            ) : poses.length === 0 ? (
              <div className="text-[12px] font-bold opacity-40 text-center py-16">Chưa có pose nào</div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {poses.map((pose) => (
                  <div key={pose.id} className="rounded-xl neo-border bg-gray-50 overflow-hidden">
                    {/* Image */}
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      {pose.imagePath ? (
                        <img
                          src={pose.imagePath}
                          alt={pose.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                          <Upload size={24} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <div className="text-[12px] font-extrabold truncate mb-1">{pose.name}</div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md neo-border ${STATUS_BADGE[pose.status] ?? 'bg-gray-100'}`}>
                          {pose.status?.toUpperCase()}
                        </span>
                        {pose.difficulty && (
                          <span className="text-[9px] font-bold opacity-50">{pose.difficulty}</span>
                        )}
                        <span className="text-[9px] font-bold opacity-40 ml-auto">↓{pose.downloadCount ?? 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

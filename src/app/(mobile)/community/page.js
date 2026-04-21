'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import NavButton from '@/components/NavButton';
import Badge from '@/components/Badge';

const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced'];

export default function CommunityPage() {
  const [poses, setPoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [difficulty, setDifficulty] = useState('all');
  const [searchTag, setSearchTag] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const serverUrl =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_POSE_SERVER_URL ?? 'http://localhost:3000'
      : 'http://localhost:3000';

  useEffect(() => {
    loadPoses();
  }, [difficulty, searchTag, currentPage]);

  async function loadPoses() {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (difficulty !== 'all') {
        params.append('difficulty', difficulty);
      }
      if (searchTag.trim()) {
        params.append('tags', searchTag);
      }
      params.append('page', currentPage);
      params.append('limit', 12);

      const response = await fetch(
        `${serverUrl}/api/community/poses?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setPoses(data.poses || []);
      setTotalPages(data.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Failed to load community poses:', err);
      setError(err.message);
      setPoses([]);
    } finally {
      setLoading(false);
    }
  }

  const handleDownload = (pose) => {
    if (!pose.imagePath) return;

    const downloadUrl = `${serverUrl}/${pose.imagePath}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${pose.name}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSearchChange = (e) => {
    setSearchTag(e.target.value);
    setCurrentPage(1);
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-accent-green';
      case 'intermediate':
        return 'bg-accent-yellow';
      case 'advanced':
        return 'bg-accent-red';
      default:
        return 'bg-accent-blue';
    }
  };

  return (
    <div className="h-full flex flex-col page-enter safe-top">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <NavButton />
          <h1 className="text-[22px] font-extrabold tracking-neo uppercase">
            COMMUNITY
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 pb-4 flex flex-col gap-3">
        {/* Difficulty Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold tracking-neo-widest uppercase opacity-60">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={handleDifficultyChange}
            className="px-3 py-2.5 rounded-xl neo-border bg-white neo-shadow-sm text-[11px] font-bold tracking-neo uppercase"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Search */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold tracking-neo-widest uppercase opacity-60">
            Search Tags
          </label>
          <input
            type="text"
            placeholder="e.g. yoga, dance, stretch"
            value={searchTag}
            onChange={handleSearchChange}
            className="px-3 py-2.5 rounded-xl neo-border bg-white neo-shadow-sm text-[11px] font-medium placeholder-opacity-40"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-hide px-4 pb-6">
        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full neo-border border-t-accent-blue animate-spin" />
              <span className="text-[11px] font-bold tracking-neo-wide opacity-50">
                LOADING POSES...
              </span>
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-20 h-20 rounded-2xl neo-border bg-accent-red bg-opacity-10 flex items-center justify-center">
              <span className="text-[28px]">!</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[14px] font-extrabold tracking-neo">
                ERROR LOADING POSES
              </span>
              <span className="text-[11px] font-medium opacity-50 text-center">
                {error}
              </span>
            </div>
            <button
              onClick={() => {
                setError(null);
                loadPoses();
              }}
              className="rounded-xl neo-border bg-accent-yellow px-4 py-2 neo-shadow-md neo-press text-[11px] font-bold tracking-neo"
            >
              TRY AGAIN
            </button>
          </div>
        ) : poses.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-20 h-20 rounded-2xl neo-border bg-white neo-shadow-md flex items-center justify-center">
              <div className="flex flex-col items-center opacity-30">
                <div className="w-6 h-6 rounded-full neo-border" />
                <div className="w-0.5 h-8 bg-text-primary" />
                <div className="flex gap-2">
                  <div className="w-6 h-0.5 bg-text-primary -rotate-[30deg]" />
                  <div className="w-6 h-0.5 bg-text-primary rotate-[30deg]" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[14px] font-extrabold tracking-neo">
                NO POSES FOUND
              </span>
              <span className="text-[11px] font-medium opacity-50">
                Try adjusting your filters
              </span>
            </div>
          </div>
        ) : (
          /* Grid */
          <div className="grid grid-cols-2 gap-3">
            {poses.map((pose) => (
              <div
                key={pose.id}
                className="flex flex-col items-center gap-2 w-full text-left"
              >
                {/* Card */}
                <div className="flex w-full items-center justify-center overflow-hidden rounded-xl neo-border bg-white neo-shadow-md aspect-square relative group">
                  {pose.imagePath ? (
                    <img
                      src={`${serverUrl}/${pose.imagePath}`}
                      alt={pose.name}
                      className="w-full h-full object-contain p-3"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center opacity-30">
                      <div className="flex h-5 w-5 rounded-full neo-border" />
                      <div className="flex h-10 w-0.5 bg-text-primary" />
                    </div>
                  )}

                  {/* Difficulty Badge */}
                  <div className="absolute bottom-1.5 left-1.5">
                    <div
                      className={`${getDifficultyColor(
                        pose.difficulty
                      )} rounded-[6px] px-1.5 py-0.5 neo-border neo-shadow-sm`}
                    >
                      <span className="text-[8px] font-bold tracking-neo uppercase">
                        {pose.difficulty || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Download Button (appears on hover) */}
                  <button
                    onClick={() => handleDownload(pose)}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[6px] neo-border bg-accent-yellow neo-shadow-sm p-1.5 neo-press"
                    title="Download pose image"
                  >
                    <Download size={12} strokeWidth={2} />
                  </button>
                </div>

                {/* Name and Tags */}
                <div className="w-full flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-neo-wide uppercase truncate">
                    {pose.name}
                  </span>
                  {pose.tags && pose.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {pose.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[8px] font-medium opacity-50 bg-bg-secondary rounded px-1.5 py-0.5"
                        >
                          #{tag}
                        </span>
                      ))}
                      {pose.tags.length > 2 && (
                        <span className="text-[8px] font-medium opacity-40">
                          +{pose.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && poses.length > 0 && (
        <div className="flex items-center justify-between px-5 pb-4 border-t neo-border pt-3">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] neo-border bg-bg-primary neo-shadow-sm neo-press disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} strokeWidth={2} />
          </button>

          <span className="text-[11px] font-bold tracking-neo-wide">
            PAGE {currentPage} OF {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] neo-border bg-bg-primary neo-shadow-sm neo-press disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}

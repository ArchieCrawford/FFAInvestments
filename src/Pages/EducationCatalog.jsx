import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

export default function EducationCatalog() {
  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['education-lessons'],
    queryFn: () => base44.entities.EducationLesson.list('order_index'),
  });

  const publishedLessons = lessons.filter(lesson => lesson.is_published);

  const trackColors = {
    'beginner': 'bg-green-100 text-green-800 border-green-200',
    'intermediate': 'bg-blue-100 text-blue-800 border-blue-200',
    'advanced': 'bg-purple-100 text-purple-800 border-purple-200'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted">Loading education materials...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-default mb-2">📚 Education Center</h1>
              <p className="text-muted">Learn about investment concepts, unit values, and club management</p>
            </div>
            <Link 
              to="/member/dashboard" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary hover:bg-primary/90 rounded-md transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Featured Lesson */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg text-white p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-3">
                ⭐ Featured Lesson
              </div>
              <h2 className="text-2xl font-bold mb-2">Unit Value System — Complete Guide</h2>
              <p className="text-blue-100 mb-4 max-w-2xl">
                Understanding how the FFA Investment Club's unit system works is crucial for all members. 
                Learn how units are calculated, how deposits and withdrawals affect pricing, and try our 
                interactive calculator to see the math in action.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-1 bg-white/20 rounded text-xs">
                  📊 Interactive Examples
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-white/20 rounded text-xs">
                  🧮 Calculator Tool
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-white/20 rounded text-xs">
                  📈 Real FFA Data
                </span>
              </div>
            </div>
              <div className="flex gap-3">
                <Link 
                  to="/education/unit-value-system"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 hover:bg-bg font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Quick Start →
                </Link>
                <Link 
                  to="/education/unit-value-guide"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  📚 Complete Guide
                </Link>
              </div>
          </div>
        </div>

        {/* Lesson Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar - Categories & Filter */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-border p-6 sticky top-8">
              <h3 className="text-lg font-bold text-default mb-4">Learning Tracks</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-default">Beginner</span>
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {publishedLessons.filter(l => l.track === 'beginner').length} lessons
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-default">Intermediate</span>
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {publishedLessons.filter(l => l.track === 'intermediate').length} lessons
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-default">Advanced</span>
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    {publishedLessons.filter(l => l.track === 'advanced').length} lessons
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="text-sm font-bold text-default mb-3">Quick Links</h4>
                <div className="space-y-2">
                  <Link 
                    to="/member/dashboard"
                    className="block text-sm text-muted hover:text-blue-600 transition-colors"
                  >
                    📊 Your Portfolio
                  </Link>
                  <Link 
                    to="/member/contribute"
                    className="block text-sm text-muted hover:text-blue-600 transition-colors"
                  >
                    💰 Make Contribution
                  </Link>
                  <Link 
                    to="/education/unit-value-system"
                    className="block text-sm text-muted hover:text-blue-600 transition-colors"
                  >
                    📚 Unit Value Guide
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Lesson Grid */}
          <div className="lg:col-span-3">
            
            {publishedLessons.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-border p-8 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-default mb-2">No Lessons Available Yet</h3>
                <p className="text-muted mb-6">
                  Our education content is being prepared. Check back soon for comprehensive lessons 
                  about investment concepts and club management.
                </p>
                <div className="bg-primary-soft border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    💡 In the meantime, you can explore our featured Unit Value System guide above, 
                    which provides a complete explanation of how the club's unit pricing works.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Lessons by Track */}
                {['beginner', 'intermediate', 'advanced'].map(track => {
                  const trackLessons = publishedLessons.filter(lesson => lesson.track === track);
                  
                  if (trackLessons.length === 0) return null;
                  
                  return (
                    <div key={track} className="bg-white rounded-lg shadow-sm border border-border">
                      <div className="border-b border-border bg-bg px-6 py-4">
                        <h2 className="text-xl font-bold text-default capitalize">
                          {track} Level Lessons
                        </h2>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {trackLessons.map((lesson) => (
                            <div key={lesson.id} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-3">
                                <h3 className="font-bold text-default text-lg leading-tight">
                                  {lesson.title}
                                </h3>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${trackColors[lesson.track]}`}>
                                  {lesson.track}
                                </span>
                              </div>
                              
                              {lesson.description && (
                                <p className="text-muted text-sm mb-4 leading-relaxed">
                                  {lesson.description}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-xs text-muted">
                                  {lesson.duration_minutes && (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {lesson.duration_minutes} min
                                    </span>
                                  )}
                                  {lesson.video_url && (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5H9m6 0a1.5 1.5 0 001.5-1.5v-1a1.5 1.5 0 00-1.5-1.5H15M12 9l3 3-3 3" />
                                      </svg>
                                      Video
                                    </span>
                                  )}
                                </div>
                                
                                <Link 
                                  to={`/education/lesson/${lesson.slug}`}
                                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-primary-soft rounded-md transition-colors"
                                >
                                  Start Lesson →
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Additional Educational Resources */}
            <div className="bg-white rounded-lg shadow-sm border border-border mt-8">
              <div className="border-b border-border bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4">
                <h2 className="text-xl font-bold text-default flex items-center gap-2">
                  🎓 Interactive Learning Resources
                </h2>
                <p className="text-muted text-sm mt-1">Hands-on tools to master investment concepts</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Comprehensive Unit Guide */}
                  <div className="border-2 border-green-200 rounded-lg p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-default text-lg leading-tight">
                        📚 Complete Unit Value System Guide
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Interactive
                      </span>
                    </div>
                    
                    <p className="text-muted text-sm mb-4 leading-relaxed">
                      Deep dive into the FFA Investment Club's unit system with real data, interactive calculations, 
                      and step-by-step examples. Features a live calculator to experiment with deposits, withdrawals, 
                      and unit pricing scenarios.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center px-2 py-1 bg-white/50 rounded text-xs">
                        🧮 Interactive Calculator
                      </span>
                      <span className="inline-flex items-center px-2 py-1 bg-white/50 rounded text-xs">
                        📊 Real FFA Data
                      </span>
                      <span className="inline-flex items-center px-2 py-1 bg-white/50 rounded text-xs">
                        🎮 Live Simulations
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          15-30 min
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Self-Paced
                        </span>
                      </div>
                      
                      <Link 
                        to="/education/unit-value-guide"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                      >
                        📚 Open Guide →
                      </Link>
                    </div>
                  </div>

                  {/* Quick Unit Calculator */}
                  <div className="border-2 border-blue-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-sky-50">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-default text-lg leading-tight">
                        🧮 Quick Unit Calculator
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        Tool
                      </span>
                    </div>
                    
                    <p className="text-muted text-sm mb-4 leading-relaxed">
                      Simple, focused calculator for understanding unit values and member contributions. 
                      Perfect for quick calculations and getting familiar with the basic concepts.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center px-2 py-1 bg-white/50 rounded text-xs">
                        💰 Unit Pricing
                      </span>
                      <span className="inline-flex items-center px-2 py-1 bg-white/50 rounded text-xs">
                        📈 Member Examples
                      </span>
                      <span className="inline-flex items-center px-2 py-1 bg-white/50 rounded text-xs">
                        ⚡ Quick Results
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          5-10 min
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Beginner
                        </span>
                      </div>
                      
                      <Link 
                        to="/education/unit-value-system"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary hover:bg-primary/90 rounded-md transition-colors"
                      >
                        🧮 Calculate →
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
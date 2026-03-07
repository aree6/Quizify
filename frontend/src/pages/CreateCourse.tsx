import { useState } from 'react';
import { BookOpen, Check, ChevronRight, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';

export function CreateCoursePage() {
  const [step, setStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const courses = [
    { id: '1', name: 'SE101 - Software Engineering' },
    { id: '2', name: 'SE201 - Requirements Engineering' },
    { id: '3', name: 'SE301 - Software Testing' },
  ];

  const topics = [
    { id: 't1', name: 'Introduction to Software Engineering', courseId: '1' },
    { id: 't2', name: 'Software Development Life Cycle', courseId: '1' },
    { id: 't3', name: 'Requirements Gathering', courseId: '1' },
    { id: 't4', name: 'System Design', courseId: '1' },
    { id: 't5', name: 'Coding Standards', courseId: '1' },
  ];

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const steps = [
    { num: 1, label: 'Select Course' },
    { num: 2, label: 'Select Topics' },
    { num: 3, label: 'Configure & Generate' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Create Mini-Course</h2>
        <p className="text-slate-500 mt-1">Generate interactive quizzes from course materials</p>
      </div>

      {/* Steps Indicator */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                step >= s.num 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
              </div>
              <span className={`ml-3 text-sm font-medium ${
                step >= s.num ? 'text-slate-900' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-slate-300 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Select a Course</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(course => (
                <button 
                  key={course.id} 
                  onClick={() => setStep(2)}
                  className="flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl text-left"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="font-medium text-slate-900">{course.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Select Topics to Include</h3>
            <p className="text-slate-500 mb-4">Choose the subtopics covered in today's class</p>
            <div className="space-y-2 mb-6">
              {topics.map(topic => (
                <label 
                  key={topic.id} 
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer ${
                    selectedTopics.includes(topic.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedTopics.includes(topic.id)}
                    onChange={() => handleTopicToggle(topic.id)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-900">{topic.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between">
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 text-slate-500"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={selectedTopics.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Configure Your Quiz</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quiz Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., Week 5 - SDLC Quiz"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Custom Instructions (Optional)</label>
                <textarea 
                  placeholder="e.g., Focus on practical examples, include theory questions..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Number of Questions</label>
                  <select className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                    <option>5 Questions</option>
                    <option>10 Questions</option>
                    <option>15 Questions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quiz Type</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600" />
                      <span className="text-slate-600">Multiple Choice</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 rounded text-blue-600" />
                      <span className="text-slate-600">True/False</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
              <button 
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-2 text-slate-500"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium">
                <Sparkles className="w-5 h-5" />
                Generate Mini-Course
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}